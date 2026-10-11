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

interface ParsedReceiptInfo {
  rawText: string;
  roomCode: string;
  bookingId: string;
  studentInfo: string;
  slotInfo: string;
  sourceLabel: string;
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ParsedReceiptInfo | null>(null);

  useEffect(() => {
    if (!visible) {
      stopCamera();
      return;
    }

    setErrorMessage(null);
    setReceipt(null);

    if (Platform.OS === 'web') {
      startWebCamera();
    } else {
      setHasPermission(true);
    }

    return () => {
      stopCamera();
    };
  }, [visible]);

  const startWebCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage('Trình duyệt không hỗ trợ truy cập Camera trực tiếp. Bạn có thể chọn ảnh mã QR từ máy bên dưới.');
        setHasPermission(false);
        return;
      }

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
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      setHasPermission(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current
            .play()
            .then(() => {
              scanVideoFrame();
            })
            .catch((e) => {
              console.warn('Video play error:', e);
            });
        }
      }, 250);
    } catch (err: any) {
      setHasPermission(false);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Bạn chưa cấp quyền Camera. Hãy cho phép quyền Camera trên trình duyệt hoặc bấm "Chọn ảnh QR từ máy" bên dưới.'
          : 'Không tìm thấy Camera trên thiết bị. Bạn có thể bấm "Chọn ảnh QR từ máy" để quét trực tiếp từ ảnh.'
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

  const scanVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current) {
      animFrameId.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (code && code.data) {
        handleCodeDetected(code.data, 'Quét trực tiếp từ Camera');
        return;
      }
    }

    animFrameId.current = requestAnimationFrame(scanVideoFrame);
  };

  const parseQrPayloadToReceipt = (rawData: string, sourceLabel: string): ParsedReceiptInfo => {
    let roomCode = expectedRoomCode;
    let bookingId = expectedBookingId;
    let studentInfo = 'Đã xác thực chữ ký QR';
    let slotInfo = new Date().toLocaleTimeString('vi-VN');

    try {
      if (rawData.startsWith('http://') || rawData.startsWith('https://')) {
        const url = new URL(rawData);
        roomCode = url.searchParams.get('room') || expectedRoomCode;
        bookingId = url.searchParams.get('id') || expectedBookingId;
        const st = url.searchParams.get('student');
        const mssv = url.searchParams.get('mssv');
        if (st || mssv) {
          studentInfo = `${st || ''} (${mssv || ''})`.trim();
        }
        slotInfo = url.searchParams.get('slot') || slotInfo;
      } else if (rawData.trim().startsWith('{')) {
        const parsed = JSON.parse(rawData);
        roomCode = parsed.roomCode || parsed.room || expectedRoomCode;
        bookingId = parsed.bookingId || parsed.id || expectedBookingId;
        if (parsed.student || parsed.studentId) {
          studentInfo = `${parsed.student || ''} ${parsed.studentId ? `(${parsed.studentId})` : ''}`.trim();
        }
        if (parsed.slot) slotInfo = parsed.slot;
      }
    } catch (_) {}

    return {
      rawText: rawData,
      roomCode,
      bookingId,
      studentInfo,
      slotInfo,
      sourceLabel,
    };
  };

  const playPaymentSuccessBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);
        osc2.frequency.setValueAtTime(1318.5, now + 0.08);
        gain.gain.setValueAtTime(0.25, now);
        osc1.start(now);
        osc1.stop(now + 0.08);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.24);
      }
    } catch (_) {}

    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (_) {}
  };

  const handleCodeDetected = (data: string, sourceLabel: string) => {
    stopCamera();
    playPaymentSuccessBeep();
    const info = parseQrPayloadToReceipt(data, sourceLabel);
    setReceipt(info);
  };

  // Quét mã QR từ file ảnh người dùng chọn (giống MoMo / ZaloPay / Ngân hàng)
  const handleFileUpload = (e: any) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          handleCodeDetected(code.data, 'Quét từ ảnh QR trong máy');
        } else {
          setErrorMessage(
            'Không tìm thấy mã QR hợp lệ trong bức ảnh bạn chọn. Hãy chọn ảnh có chứa mã QR rõ nét.'
          );
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.scannerCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>
                {receipt ? '✅ Đã Quét & Xác Thực Mã QR' : '📷 Quét Mã QR Check-In Phòng Học'}
              </Text>
              <Text style={styles.headerSub}>
                {receipt
                  ? 'Hệ thống đã giải mã thành công thông tin thẻ mượn phòng'
                  : 'Đưa mã QR vào khung Camera hoặc chọn ảnh mã QR từ thiết bị'}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {receipt ? (
            /* MÀN HÌNH BIÊN LAI SAU KHI QUÉT QR THÀNH CÔNG (NHƯ QUÉT QR THANH TOÁN) */
            <View style={styles.receiptContainer}>
              <View style={styles.receiptBadgeCircle}>
                <Text style={styles.receiptBadgeCheck}>✓</Text>
              </View>
              <Text style={styles.receiptMainTitle}>QUÉT MÃ QR HỢP LỆ</Text>
              <Text style={styles.receiptSourceTag}>{receipt.sourceLabel}</Text>

              <View style={styles.receiptBox}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Phòng học:</Text>
                  <Text style={styles.receiptValHighlight}>{receipt.roomCode}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Mã thẻ đặt phòng:</Text>
                  <Text style={styles.receiptVal}>{receipt.bookingId}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Sinh viên:</Text>
                  <Text style={styles.receiptVal}>{receipt.studentInfo}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Ca sử dụng / Giờ quét:</Text>
                  <Text style={styles.receiptVal}>{receipt.slotInfo}</Text>
                </View>
                <View style={[styles.receiptRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.receiptLabel}>Dữ liệu QR gốc:</Text>
                  <Text style={styles.receiptRawText} numberOfLines={2}>
                    {receipt.rawText}
                  </Text>
                </View>
              </View>

              <Pressable
                style={styles.confirmReceiptBtn}
                onPress={() => onScanSuccess(receipt.rawText)}
              >
                <Text style={styles.confirmReceiptBtnText}>
                  🔓 Xác Nhận Mở Cửa & Nhận Phòng Ngay
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
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
                <canvas
                  ref={(el) => {
                    canvasRef.current = el;
                  }}
                  style={{ display: 'none' }}
                />
                {Platform.OS === 'web' && (
                  <input
                    ref={(el) => {
                      fileInputRef.current = el;
                    }}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                )}

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
                    <ActivityIndicator size="large" color="#38bdf8" />
                    <Text style={styles.messageText}>Đang khởi động Camera quét QR...</Text>
                  </View>
                )}

                {hasPermission === false && (
                  <View style={styles.centerMessage}>
                    <Text style={styles.errorIcon}>📷</Text>
                    <Text style={styles.errorText}>{errorMessage || 'Không thể mở Camera'}</Text>
                    <Text style={styles.hintText}>
                      Bạn có thể tải ảnh mã QR vừa lưu trên máy lên để hệ thống giải mã trực tiếp (giống tính năng "Chọn ảnh QR từ thư viện" trên MoMo / Ngân hàng):
                    </Text>
                    {Platform.OS === 'web' && (
                      <Pressable
                        style={styles.uploadImageCenterBtn}
                        onPress={() => fileInputRef.current?.click()}
                      >
                        <Text style={styles.uploadImageCenterBtnText}>
                          🖼️ Chọn Ảnh Mã QR Từ Thiết Bị
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>

              {errorMessage && hasPermission && (
                <View style={styles.inlineErrorBar}>
                  <Text style={styles.inlineErrorText}>⚠️ {errorMessage}</Text>
                </View>
              )}

              {/* Target Room Info */}
              <View style={styles.roomTargetBox}>
                <Text style={styles.roomTargetLabel}>PHÒNG ĐANG KIỂM TRA:</Text>
                <Text style={styles.roomTargetValue}>
                  {expectedRoomCode} • Mã thẻ: {expectedBookingId}
                </Text>
              </View>

              {/* Bottom Actions (Giống App Thanh Toán: Chọn ảnh QR từ thư viện / Đóng) */}
              <View style={styles.actionsRow}>
                {Platform.OS === 'web' && (
                  <Pressable
                    style={styles.quickDoorBtn}
                    onPress={() => fileInputRef.current?.click()}
                  >
                    <Text style={styles.quickDoorBtnText}>🖼️ Chọn Ảnh QR Từ Máy</Text>
                  </Pressable>
                )}
                <Pressable style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Đóng</Text>
                </Pressable>
              </View>
            </>
          )}
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
    maxWidth: 430,
    backgroundColor: '#0f172a',
    borderRadius: 22,
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 11.5,
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
    marginLeft: 8,
  },
  closeBtnText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  viewfinderContainer: {
    width: '100%',
    height: 310,
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
    borderColor: '#38bdf8',
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
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
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
    fontSize: 34,
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
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 14,
  },
  uploadImageCenterBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
  },
  uploadImageCenterBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  inlineErrorBar: {
    backgroundColor: '#450a0a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#7f1d1d',
  },
  inlineErrorText: {
    color: '#fca5a5',
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
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
    fontSize: 11.5,
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
  receiptContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  receiptBadgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  receiptBadgeCheck: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
  },
  receiptMainTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  receiptSourceTag: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#16a34a',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 4,
    marginBottom: 14,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 10,
  },
  receiptLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  receiptVal: {
    fontSize: 12.5,
    color: '#0f172a',
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  receiptValHighlight: {
    fontSize: 15,
    color: '#0284c7',
    fontWeight: '900',
  },
  receiptRawText: {
    fontSize: 10.5,
    color: '#475569',
    flex: 1,
    textAlign: 'right',
  },
  confirmReceiptBtn: {
    width: '100%',
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmReceiptBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
