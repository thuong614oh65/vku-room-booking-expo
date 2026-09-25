import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { TIME_SLOTS } from '../data/roomsData';
import { useBookingStore } from '../store/useBookingStore';
import { TimeSlot } from '../types/booking';

interface TimeSlotGridProps {
  roomId: string;
  selectedDate: string;
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  onConflictDetected: (slot: TimeSlot) => void;
}

export const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
  roomId,
  selectedDate,
  selectedSlot,
  onSelectSlot,
  onConflictDetected,
}) => {
  const { getSlotBooking, bookings, currentUser, checkSlotConflict } = useBookingStore();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerLabel}>⏰ Khung Giờ Ca Học (Chuẩn VKU 2 Tiếng):</Text>
        <Text style={styles.subInfo}>
          {currentUser ? `Tài khoản: ${currentUser.studentId}` : 'Trạng thái thời gian thực'}
        </Text>
      </View>

      <View style={styles.grid}>
        {TIME_SLOTS.map((slot) => {
          const slotBooking = getSlotBooking(roomId, selectedDate, slot.id);
          const isBookedByMe = Boolean(
            currentUser && slotBooking && slotBooking.studentId === currentUser.studentId
          );
          const isBookedByOther = Boolean(
            slotBooking && (!currentUser || slotBooking.studentId !== currentUser.studentId)
          );

          const myOtherRoomBooking =
            currentUser && !slotBooking
              ? bookings.find(
                  (b) =>
                    b.studentId === currentUser.studentId &&
                    b.date === selectedDate &&
                    b.slotId === slot.id &&
                    b.status !== 'CANCELLED' &&
                    b.roomId !== roomId
                )
              : undefined;

          const isSelected = selectedSlot?.id === slot.id;

          const handlePress = () => {
            if (isBookedByOther || isBookedByMe || myOtherRoomBooking) {
              onConflictDetected(slot);
            } else {
              const conflict = checkSlotConflict(roomId, selectedDate, slot.id);
              if (conflict.hasConflict) {
                onConflictDetected(slot);
              } else {
                onSelectSlot(slot);
              }
            }
          };

          let badgeLabel = '🟢 Trống';
          let hintText = isSelected ? '✓ Đã chọn ca này' : 'Chạm để chọn ca học';

          if (isBookedByMe && slotBooking) {
            badgeLabel = '🔵 Lịch Của Bạn';
            hintText = `✓ Bạn (${slotBooking.studentName} - ${slotBooking.studentId}) đã đặt ca này`;
          } else if (isBookedByOther && slotBooking) {
            badgeLabel = `🔴 Đã Kín (${slotBooking.studentId})`;
            hintText = `Đã đặt bởi: ${slotBooking.studentName} (${slotBooking.studentId}) • Nhấn để xem phòng thay thế`;
          } else if (myOtherRoomBooking) {
            badgeLabel = '🟠 Trùng Giờ Của Bạn';
            hintText = `⚠️ Bạn đã đặt phòng ${myOtherRoomBooking.roomCode} ở khung giờ này rồi`;
          }

          return (
            <Pressable
              key={slot.id}
              style={[
                styles.slotCard,
                isBookedByOther && styles.slotCardBookedOther,
                isBookedByMe && styles.slotCardBookedMe,
                myOtherRoomBooking && styles.slotCardOverlap,
                isSelected && styles.slotCardSelected,
              ]}
              onPress={handlePress}
            >
              <View style={styles.slotHeader}>
                <Text
                  style={[
                    styles.slotTimeText,
                    isSelected && styles.textWhite,
                    isBookedByOther && styles.textBookedOther,
                    isBookedByMe && styles.textBookedMe,
                  ]}
                >
                  {slot.label}
                </Text>
                <View
                  style={[
                    styles.badgePill,
                    isBookedByOther
                      ? styles.badgePillBookedOther
                      : isBookedByMe
                      ? styles.badgePillBookedMe
                      : myOtherRoomBooking
                      ? styles.badgePillOverlap
                      : styles.badgePillAvailable,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgePillText,
                      isBookedByOther
                        ? styles.badgePillTextBookedOther
                        : isBookedByMe
                        ? styles.badgePillTextBookedMe
                        : myOtherRoomBooking
                        ? styles.badgePillTextOverlap
                        : styles.badgePillTextAvailable,
                    ]}
                  >
                    {badgeLabel}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.slotHint,
                  isSelected && styles.textWhite70,
                  isBookedByOther && styles.textBookedLight,
                  isBookedByMe && styles.textBookedMeLight,
                ]}
              >
                {hintText}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  subInfo: {
    fontSize: 11,
    color: '#64748b',
  },
  grid: {
    gap: 8,
  },
  slotCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'column',
  },
  slotCardSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  slotCardBookedOther: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  slotCardBookedMe: {
    backgroundColor: '#eff6ff',
    borderColor: '#60a5fa',
  },
  slotCardOverlap: {
    backgroundColor: '#fffbeb',
    borderColor: '#fcd34d',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotTimeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgePillAvailable: {
    backgroundColor: '#dcfce7',
  },
  badgePillTextAvailable: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '700',
  },
  badgePillBookedOther: {
    backgroundColor: '#fee2e2',
  },
  badgePillTextBookedOther: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '700',
  },
  badgePillBookedMe: {
    backgroundColor: '#dbeafe',
  },
  badgePillTextBookedMe: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '800',
  },
  badgePillOverlap: {
    backgroundColor: '#fef3c7',
  },
  badgePillTextOverlap: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '700',
  },
  slotHint: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  textWhite: {
    color: '#ffffff',
  },
  textWhite70: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  textBookedOther: {
    color: '#991b1b',
  },
  textBookedMe: {
    color: '#1e40af',
  },
  textBookedLight: {
    color: '#b91c1c',
  },
  textBookedMeLight: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
});
