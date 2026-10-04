import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, Pressable, Image } from 'react-native';
import { Booking } from '../types/booking';
import { CameraQRScannerModal } from './CameraQRScannerModal';

interface QRCodeModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onCheckIn: (bookingId: string) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ visible, booking, onClose, onCheckIn }) => {
  const [isCameraScannerVisible, setIsCameraScannerVisible] = useState(false);

  if (!booking) return null;

  const isCheckedIn = booking.status === 'CHECKED_IN';

  const qrData = booking.qrCodeData || JSON.stringify({
    vkuBookingPass: true,
    bookingId: booking.id,
    roomCode: booking.roomCode,
    studentId: booking.studentId,
    date: booking.date,
    slot: booking.slotLabel,
  });

  const realQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(qrData)}`;

  const handleCameraScanSuccess = (_decodedData: string) => {
    setIsCameraScannerVisible(false);
    onCheckIn(booking.id);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Thẻ Thông Hành Check-in Phòng</Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            {/* Ticket Visual */}
            <View style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <Text style={styles.schoolName}>ĐẠI HỌC CÔNG NGHỆ THÔNG TIN & TRUYỀN THÔNG VIỆT - HÀN</Text>
                <Text style={styles.passTitle}>VKU STUDY ROOM ACCESS PASS</Text>
              </View>

              {/* Real Scannable 2D QR Code */}
              <View style={styles.qrDisplayBox}>
                <View style={styles.qrImageFrame}>
                  <Image
                    source={{ uri: realQrImageUrl }}
                    style={styles.realQrImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.qrCodeLabel}>Mã Vé: {booking.id}</Text>
                <Text style={styles.qrScanHint}>
                  📱 Mã QR Thật: Có thể dùng Camera điện thoại bất kỳ (Zalo, iPhone, Google Lens) để quét mã này trực tiếp!
                </Text>
              </View>

              {/* Details */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>PHÒNG HỌC</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>{booking.roomName}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>ĐỊA ĐIỂM</Text>
                  <Text style={styles.detailValue}>{booking.building} • {booking.floor}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>THỜI GIAN</Text>
                  <Text style={styles.detailValue}>{booking.slotLabel}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>NGÀY SỬ DỤNG</Text>
                  <Text style={styles.detailValue}>{booking.date}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>SINH VIÊN ĐẶT</Text>
                  <Text style={styles.detailValue}>{booking.studentName} ({booking.studentId})</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>TRẠNG THÁI</Text>
                  <Text style={[styles.detailValue, isCheckedIn ? styles.statusChecked : styles.statusConfirmed]}>
                    {isCheckedIn ? '✓ ĐÃ CHECK-IN VÀO PHÒNG' : '🟢 SẴN SÀNG VÀO PHÒNG'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionColumn}>
              {!isCheckedIn && (
                <Pressable
                  style={styles.openCameraBtn}
                  onPress={() => setIsCameraScannerVisible(true)}
                >
                  <Text style={styles.openCameraBtnText}>📷 Bật Camera Thật Quét Mã Cửa Phòng</Text>
                </Pressable>
              )}

              <View style={styles.secondaryActionRow}>
                {!isCheckedIn && (
                  <Pressable
                    style={styles.manualCheckInBtn}
                    onPress={() => onCheckIn(booking.id)}
                  >
                    <Text style={styles.manualCheckInBtnText}>⚡ Xác Nhận Nhanh</Text>
                  </Pressable>
                )}
                <Pressable style={styles.dismissBtn} onPress={onClose}>
                  <Text style={styles.dismissBtnText}>Đóng</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Real Camera Scanner Modal */}
      <CameraQRScannerModal
        visible={isCameraScannerVisible}
        expectedRoomCode={booking.roomCode}
        expectedBookingId={booking.id}
        onClose={() => setIsCameraScannerVisible(false)}
        onScanSuccess={handleCameraScanSuccess}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 420,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '700',
  },
  ticketCard: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  ticketHeader: {
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
  },
  schoolName: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284c7',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  passTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  qrDisplayBox: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  qrImageFrame: {
    width: 170,
    height: 170,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0284c7',
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  realQrImage: {
    width: 154,
    height: 154,
  },
  qrCodeLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  qrScanHint: {
    fontSize: 11,
    color: '#0284c7',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
    lineHeight: 15,
  },
  detailsGrid: {
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    maxWidth: '65%',
    textAlign: 'right',
  },
  statusChecked: {
    color: '#16a34a',
  },
  statusConfirmed: {
    color: '#0284c7',
  },
  actionColumn: {
    marginTop: 14,
    gap: 8,
  },
  openCameraBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  openCameraBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
  secondaryActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  manualCheckInBtn: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  manualCheckInBtnText: {
    color: '#1d4ed8',
    fontSize: 12.5,
    fontWeight: '700',
  },
  dismissBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: {
    color: '#475569',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
