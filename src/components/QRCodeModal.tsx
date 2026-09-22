import React from 'react';
import { StyleSheet, Text, View, Modal, Pressable } from 'react-native';
import { Booking } from '../types/booking';

interface QRCodeModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onCheckIn: (bookingId: string) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ visible, booking, onClose, onCheckIn }) => {
  if (!booking) return null;

  const isCheckedIn = booking.status === 'CHECKED_IN';

  return (
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

            {/* QR Pattern Display */}
            <View style={styles.qrDisplayBox}>
              <View style={styles.qrMatrixFrame}>
                {/* Visual QR Corners */}
                <View style={[styles.qrCorner, styles.qrCornerTL]} />
                <View style={[styles.qrCorner, styles.qrCornerTR]} />
                <View style={[styles.qrCorner, styles.qrCornerBL]} />
                
                {/* Simulated QR Modules */}
                <View style={styles.qrPatternCenter}>
                  <Text style={styles.qrCenterCode}>{booking.roomCode}</Text>
                  <Text style={styles.qrCenterId}>{booking.id}</Text>
                </View>
              </View>
              <Text style={styles.qrCodeLabel}>Mã Vé: {booking.id}</Text>
              <Text style={styles.qrScanHint}>Đưa mã này vào máy quét tại cửa phòng để mở khóa</Text>
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
                  {isCheckedIn ? '✓ ĐÃ CHECK-IN' : '🟢 SẴN SÀNG VÀO PHÒNG'}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {!isCheckedIn && (
              <Pressable
                style={styles.checkInBtn}
                onPress={() => {
                  onCheckIn(booking.id);
                }}
              >
                <Text style={styles.checkInBtnText}>📱 Quét Check-In Mở Cửa</Text>
              </Pressable>
            )}
            <Pressable style={styles.dismissBtn} onPress={onClose}>
              <Text style={styles.dismissBtnText}>Đóng</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '700',
  },
  ticketCard: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  ticketHeader: {
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
  },
  schoolName: {
    fontSize: 9.5,
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
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  qrMatrixFrame: {
    width: 130,
    height: 130,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0f172a',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  qrCorner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderWidth: 4,
    borderColor: '#0284c7',
  },
  qrCornerTL: {
    top: 6,
    left: 6,
  },
  qrCornerTR: {
    top: 6,
    right: 6,
  },
  qrCornerBL: {
    bottom: 6,
    left: 6,
  },
  qrPatternCenter: {
    alignItems: 'center',
  },
  qrCenterCode: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  qrCenterId: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  qrCodeLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  qrScanHint: {
    fontSize: 10.5,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2,
  },
  detailsGrid: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  detailLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    maxWidth: '65%',
    textAlign: 'right',
  },
  statusConfirmed: {
    color: '#0284c7',
  },
  statusChecked: {
    color: '#15803d',
  },
  actionRow: {
    flexDirection: 'row',
    padding: 14,
    gap: 10,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  checkInBtn: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkInBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  dismissBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
  },
  dismissBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
});
