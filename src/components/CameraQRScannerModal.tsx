import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Modal, Pressable, Platform, ActivityIndicator } from 'react-native';
import jsQR from 'jsqr';

interface CameraQRScannerModalProps {
  visible: boolean;
  expectedRoomCode: string;
  expectedBookingId: string;
  onClose: () => void;
  onScanSuccess: (decodedData: string) => void;
}

export const CameraQRScannerModal: React.FC<CameraQRScannerModalProps> = ({
  visible,
  expectedRoomCode,
  expectedBookingId,
  onClose,
  onScanSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [lastScannedResult, setLastScannedResult] = useState<string | null>(null);

  // Khởi động Camera thật của thiết bị
  useEffect(() => {
    if (!visible) {
      stopCamera();
      return;
    }

    setErrorMessage(null);
    setLastScannedResult(null);
    setIsScanning(true);

    if (Platform.OS === 'web') {
      startWebCamera();
    } else {
      // Trên môi trường native có thể dùng camera fallback
      setHasPermission(true);
    }

    return () => {
      stopCamera();
    };
  }, [visible]);

  const startWebCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage('Trình duyệt không hỗ trợ truy cập Camera trực tiếp.');
        setHasPermission(false);
        return;
      }

      // Yêu cầu camera sau (rear / environment camera) của điện thoại
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Fallback sang camera mặc định nếu không có environment camera
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      setHasPermission(true);

      // Gắn stream vào video element sau khi render
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play().then(() => {
            scanVideoFrame();
          }).catch((e) => {
            console.warn('Video play error:', e);
          });
        }
      }, 300);
    } catch (err: any) {
      console.error('Lỗi mở Camera:', err);
      setHasPermission(false);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Bạn đã từ chối quyền truy cập Camera. Vui lòng cho phép quyền trong cài đặt trình duyệt để quét mã.'
          : 'Không thể kích hoạt Camera: ' + (err.message || 'Lỗi thiết bị')
      );
    }
  };

  const stopCamera = () => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Quét liên tục từng frame video bằng jsQR
  const scanVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current) {
      animFrameId.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleCodeDetected(code.data);
        return; // Dừng quét sau khi tìm thấy
      }
    }

    animFrameId.current = requestAnimationFrame(scanVideoFrame);
  };

  const handleCodeDetected = (data: string) => {
    setIsScanning(false);
    setLastScannedResult(data);
    stopCamera();

    // Phát âm thanh Beep báo thành công qua Web Audio API
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // Nốt A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (_) {}

    // Rung điện thoại nếu hỗ trợ
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (_) {}

    // Báo thành công ra ngoài
    setTimeout(() => {
      onScanSuccess(data);
    }, 400);
  };

  // Nút quét mẫu cửa phòng (tiện lợi khi test không có mã QR dán trên cửa)
  const handleSimulateDoorScan = () => {
    const doorPayload = JSON.stringify({
      type: 'VKU_DOOR_CHECKIN',
      roomCode: expectedRoomCode,
      bookingId: expectedBookingId,
      timestamp: Date.now(),
    });
    handleCodeDetected(doorPayload);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.scannerCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>📷 Quét Mã QR Cửa Phòng Thật</Text>
              <Text style={styles.headerSub}>Hướng camera điện thoại về phía mã QR tại cửa phòng</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Camera Viewfinder Area */}
          <View style={styles.viewfinderContainer}>
            {Platform.OS === 'web' && (
              <video
                ref={(el) => {
                  videoRef.current = el;
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: hasPermission ? 'block' : 'none',
                }}
              />
            )}
            <canvas ref={(el) => { canvasRef.current = el; }} style={{ display: 'none' }} />

            {/* Viewfinder Overlays: 4 Corners & Laser */}
            {hasPermission && (
              <View style={styles.overlayGuide} pointerEvents="none">
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
                <View style={styles.laserLine} />
              </View>
            )}

            {/* Loading / Error States */}
            {hasPermission === null && (
              <View style={styles.centerMessage}>
                <ActivityIndicator size="large" color="#0284c7" />
                <Text style={styles.messageText}>Đang khởi động Camera thiết bị...</Text>
              </View>
            )}

            {hasPermission === false && (
              <View style={styles.centerMessage}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{errorMessage || 'Không thể mở Camera'}</Text>
                <Text style={styles.hintText}>
                  Nếu bạn dùng trình duyệt máy tính không có webcam hoặc chưa cấp quyền, bạn có thể bấm nút quét thử bên dưới:
                </Text>
                <Pressable style={styles.testScanBtn} onPress={handleSimulateDoorScan}>
                  <Text style={styles.testScanBtnText}>⚡ Xác Nhận Check-In Bằng Mã Cửa {expectedRoomCode}</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Target Room Info */}
          <View style={styles.roomTargetBox}>
            <Text style={styles.roomTargetLabel}>PHÒNG CẦN MỞ KHÓA:</Text>
            <Text style={styles.roomTargetValue}>{expectedRoomCode} • Mã vé: {expectedBookingId}</Text>
          </View>

          {/* Bottom Actions */}
          <View style={styles.actionsRow}>
            <Pressable style={styles.quickDoorBtn} onPress={handleSimulateDoorScan}>
              <Text style={styles.quickDoorBtnText}>🔑 Quét Mã Cửa {expectedRoomCode}</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  scannerCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  viewfinderContainer: {
    width: '100%',
    height: 320,
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayGuide: {
    position: 'absolute',
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#0284c7',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  laserLine: {
    position: 'absolute',
    width: '90%',
    height: 2.5,
    backgroundColor: '#38bdf8',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  centerMessage: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    color: '#cbd5e1',
    fontSize: 13,
    marginTop: 12,
    fontWeight: '600',
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12.5,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 8,
  },
  hintText: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  testScanBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  testScanBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  roomTargetBox: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  roomTargetLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  roomTargetValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: '#0f172a',
  },
  quickDoorBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  quickDoorBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#334155',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
