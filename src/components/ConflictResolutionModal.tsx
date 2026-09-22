import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { ConflictResolution, Room, TimeSlot } from '../types/booking';
import { useBookingStore } from '../store/useBookingStore';

interface ConflictResolutionModalProps {
  visible: boolean;
  roomId: string;
  date: string;
  slot: TimeSlot | null;
  conflict: ConflictResolution | null;
  onClose: () => void;
  onSelectAlternativeRoom: (room: Room) => void;
  onSelectAlternativeSlot: (slot: TimeSlot) => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  visible,
  roomId,
  date,
  slot,
  conflict,
  onClose,
  onSelectAlternativeRoom,
  onSelectAlternativeSlot,
}) => {
  const { joinWaitlist, isUserInWaitlist } = useBookingStore();

  if (!conflict || !slot) return null;

  const inWaitlist = isUserInWaitlist(roomId, date, slot.id);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>⚠️</Text>
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Xung Đột Lịch Đặt Phòng</Text>
              <Text style={styles.headerSub}>Ca học này đã có người giữ chỗ trước</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* Conflict Alert Message */}
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>
                {conflict.message ||
                  `Ca học ${slot.label} ngày ${date} vừa được hoàn tất đặt chỗ bởi một sinh viên khác.`}
              </Text>
              <Text style={styles.alertDetail}>
                Để tiết kiệm thời gian cho bạn, hệ thống VKU đề xuất các phương án tối ưu bên dưới:
              </Text>
            </View>

            {/* Smart Solution 1: Alternative Rooms */}
            {conflict.alternativeRooms && conflict.alternativeRooms.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>💡 Gợi Ý Phòng Tương Đương Còn Trống:</Text>
                  <Text style={styles.sectionBadge}>Cùng giờ {slot.label}</Text>
                </View>
                <Text style={styles.sectionDesc}>
                  Hệ thống tự động tìm thấy các phòng cùng tòa nhà hoặc cùng sức chứa đang trống:
                </Text>

                {conflict.alternativeRooms.map((altRoom) => (
                  <Pressable
                    key={altRoom.id}
                    style={styles.altRoomCard}
                    onPress={() => onSelectAlternativeRoom(altRoom)}
                  >
                    <View style={styles.altRoomInfo}>
                      <Text style={styles.altRoomCode}>{altRoom.code}</Text>
                      <Text style={styles.altRoomName}>{altRoom.name}</Text>
                      <Text style={styles.altRoomMeta}>
                        🏢 {altRoom.building} • {altRoom.floor} • 👥 {altRoom.capacity} chỗ
                      </Text>
                    </View>
                    <View style={styles.selectAltBtn}>
                      <Text style={styles.selectAltBtnText}>Đổi Sang Phòng Này →</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Smart Solution 2: Alternative Time Slots */}
            {conflict.alternativeSlots && conflict.alternativeSlots.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⏰ Khung Giờ Khác Còn Trống Trong Ngày:</Text>
                <Text style={styles.sectionDesc}>
                  Nếu bạn vẫn ưu tiên phòng này, hãy chọn các ca học lân cận:
                </Text>
                <View style={styles.slotRow}>
                  {conflict.alternativeSlots.map((altSlot) => (
                    <Pressable
                      key={altSlot.id}
                      style={styles.altSlotChip}
                      onPress={() => onSelectAlternativeSlot(altSlot)}
                    >
                      <Text style={styles.altSlotChipText}>🟢 {altSlot.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Smart Solution 3: Waitlist Subscription */}
            <View style={styles.waitlistCard}>
              <View style={styles.waitlistHeader}>
                <Text style={styles.waitlistIcon}>🔔</Text>
                <View style={styles.waitlistTextWrap}>
                  <Text style={styles.waitlistTitle}>Hàng Đợi Nhận Thông Báo (Waitlist)</Text>
                  <Text style={styles.waitlistSub}>
                    Ưu tiên thông báo đẩy ngay lập tức nếu bạn đặt trước hủy phòng
                  </Text>
                </View>
              </View>
              <Pressable
                style={[styles.waitlistBtn, inWaitlist && styles.waitlistBtnActive]}
                onPress={() => {
                  if (!inWaitlist) {
                    joinWaitlist(roomId, date, slot.id);
                  }
                }}
              >
                <Text style={[styles.waitlistBtnText, inWaitlist && styles.waitlistBtnTextActive]}>
                  {inWaitlist ? '✓ Đã trong danh sách chờ nhận tin' : 'Đăng ký vào Hàng Đợi Ưu Tiên'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable style={styles.dismissBtn} onPress={onClose}>
              <Text style={styles.dismissBtnText}>Đóng & Quay lại</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconText: {
    fontSize: 18,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '700',
  },
  bodyScroll: {
    padding: 16,
  },
  alertBox: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  alertText: {
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '600',
    lineHeight: 18,
  },
  alertDetail: {
    fontSize: 12,
    color: '#b91c1c',
    marginTop: 4,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionBadge: {
    backgroundColor: '#e0f2fe',
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sectionDesc: {
    fontSize: 11.5,
    color: '#64748b',
    marginBottom: 8,
  },
  altRoomCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  altRoomInfo: {
    flex: 1,
    marginRight: 8,
  },
  altRoomCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
  },
  altRoomName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 1,
  },
  altRoomMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  selectAltBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  selectAltBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  slotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  altSlotChip: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  altSlotChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#15803d',
  },
  waitlistCard: {
    backgroundColor: '#faf5ff',
    borderWidth: 1.5,
    borderColor: '#e9d5ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  waitlistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  waitlistIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  waitlistTextWrap: {
    flex: 1,
  },
  waitlistTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6b21a8',
  },
  waitlistSub: {
    fontSize: 11,
    color: '#7e22ce',
    marginTop: 2,
  },
  waitlistBtn: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  waitlistBtnActive: {
    backgroundColor: '#d8b4fe',
  },
  waitlistBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  waitlistBtnTextActive: {
    color: '#581c87',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  dismissBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  dismissBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
});
