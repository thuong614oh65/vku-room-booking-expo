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
  const { isSlotBooked, checkSlotConflict } = useBookingStore();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerLabel}>? Khung Gi? Ca H?c (Chu?n VKU 2 Ti?ng):</Text>
        <Text style={styles.subInfo}>Tr?ng thái th?i gian th?c</Text>
      </View>

      <View style={styles.grid}>
        {TIME_SLOTS.map((slot) => {
          const booked = isSlotBooked(roomId, selectedDate, slot.id);
          const isSelected = selectedSlot?.id === slot.id;

          const handlePress = () => {
            if (booked) {
              // Kích ho?t gi?i quy?t xung d?t thông minh cho ngu?i d?n sau
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

          return (
            <Pressable
              key={slot.id}
              style={[
                styles.slotCard,
                booked && styles.slotCardBooked,
                isSelected && styles.slotCardSelected,
              ]}
              onPress={handlePress}
            >
              <View style={styles.slotHeader}>
                <Text style={[styles.slotTimeText, isSelected && styles.textWhite, booked && styles.textBooked]}>
                  {slot.label}
                </Text>
                <View style={[styles.badgePill, booked ? styles.badgePillBooked : styles.badgePillAvailable]}>
                  <Text style={[styles.badgePillText, booked ? styles.badgePillTextBooked : styles.badgePillTextAvailable]}>
                    {booked ? '?? Ðã Kín' : '?? Tr?ng'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.slotHint, isSelected && styles.textWhite70, booked && styles.textBookedLight]}>
                {booked ? 'Nh?n d? xem phòng thay th?' : isSelected ? 'Ðã ch?n ca này' : 'Ch?m d? ch?n ca h?c'}
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
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  slotCardBooked: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
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
  badgePillBooked: {
    backgroundColor: '#fee2e2',
  },
  badgePillTextBooked: {
    color: '#b91c1c',
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
  textBooked: {
    color: '#991b1b',
  },
  textBookedLight: {
    color: '#b91c1c',
  },
});
