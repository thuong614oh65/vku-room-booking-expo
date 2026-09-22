import React from 'react';
import { StyleSheet, Text, View, Image, Pressable, Platform } from 'react-native';
import { Room } from '../types/booking';

interface RoomCardProps {
  room: Room;
  isAvailableToday: boolean;
  onPress: () => void;
}

const getEquipmentBadge = (eq: string) => {
  switch (eq) {
    case 'High-spec PC':
      return '🖥️ Máy trạm PC';
    case 'Projector':
      return '📽️ Máy chiếu';
    case 'AC':
      return '❄️ Điều hòa';
    case 'Whiteboard':
      return '📋 Bảng từ';
    case 'Sound System':
      return '🔊 Âm thanh';
    default:
      return eq;
  }
};

const getBuildingColor = (b: string) => {
  switch (b) {
    case 'Khu A':
      return { bg: '#e0f2fe', text: '#0369a1' };
    case 'Khu B':
      return { bg: '#fef3c7', text: '#b45309' };
    case 'Khu C':
      return { bg: '#dcfce7', text: '#15803d' };
    case 'Khu V':
      return { bg: '#f3e8ff', text: '#7e22ce' };
    default:
      return { bg: '#ede9fe', text: '#6d28d9' };
  }
};

export const RoomCard: React.FC<RoomCardProps> = React.memo(({ room, isAvailableToday, onPress }) => {
  const buildingStyle = getBuildingColor(room.building);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: room.image }} style={styles.image} resizeMode="cover" />
        <View style={styles.statusBadgeOverlay}>
          <View style={[styles.statusDot, { backgroundColor: isAvailableToday ? '#10b981' : '#f59e0b' }]} />
          <Text style={styles.statusText}>
            {isAvailableToday ? 'Còn slot trống hôm nay' : 'Đã kín ca học'}
          </Text>
        </View>
        <View style={[styles.buildingBadge, { backgroundColor: buildingStyle.bg }]}>
          <Text style={[styles.buildingText, { color: buildingStyle.text }]}>{room.building}</Text>
        </View>
      </View>

      <View style={styles.infoWrap}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.codeText}>{room.code}</Text>
            <Text style={styles.nameText} numberOfLines={1}>
              {room.name}
            </Text>
          </View>
          <View style={styles.capacityBadge}>
            <Text style={styles.capacityText}>👥 {room.capacity} chỗ</Text>
          </View>
        </View>

        <Text style={styles.locationText}>
          📍 {room.floor} • {room.type}
        </Text>

        <Text style={styles.descText} numberOfLines={2}>
          {room.description}
        </Text>

        <View style={styles.equipmentRow}>
          {room.equipment.map((eq) => (
            <View key={eq} style={styles.eqBadge}>
              <Text style={styles.eqText}>{getEquipmentBadge(eq)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerRow}>
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Thời lượng ca học</Text>
            <Text style={styles.timeValue}>2 tiếng / slot</Text>
          </View>
          <View style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Đặt Phòng →</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.07)',
      },
    }),
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  imageWrap: {
    height: 150,
    width: '100%',
    position: 'relative',
    backgroundColor: '#f1f5f9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusBadgeOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  buildingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  buildingText: {
    fontSize: 12,
    fontWeight: '800',
  },
  infoWrap: {
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  codeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 1,
  },
  capacityBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  capacityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  locationText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 6,
  },
  descText: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  equipmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  eqBadge: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  eqText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  timeInfo: {
    flexDirection: 'column',
  },
  timeLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  timeValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  actionBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
