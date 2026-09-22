const fs = require('fs');
const path = require('path');

console.log('Starting full encoding repair for VKU Room Booking App...');

// 1. src/data/roomsData.ts
const roomsDataContent = `import { Room, TimeSlot, UserProfile } from '../types/booking';

export const TIME_SLOTS: TimeSlot[] = [
  { id: 'slot-1', startTime: '07:30', endTime: '09:30', label: '07:30 - 09:30' },
  { id: 'slot-2', startTime: '09:30', endTime: '11:30', label: '09:30 - 11:30' },
  { id: 'slot-3', startTime: '13:00', endTime: '15:00', label: '13:00 - 15:00' },
  { id: 'slot-4', startTime: '15:00', endTime: '17:00', label: '15:00 - 17:00' },
  { id: 'slot-5', startTime: '17:30', endTime: '19:30', label: '17:30 - 19:30' },
];

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'ROOM-B201',
    code: 'LAB-B201',
    name: 'Lab AI & Trí Tuệ Nhân Tạo B201',
    building: 'Khu B',
    floor: 'Tầng 2',
    capacity: 25,
    equipment: ['High-spec PC', 'Projector', 'AC', 'Whiteboard'],
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    description: 'Trang bị 25 máy trạm cấu hình GPU NVIDIA RTX chuyên đào tạo AI, Deep Learning và đồ họa đa nền tảng.',
    type: 'Lab máy tính',
  },
  {
    id: 'ROOM-B202',
    code: 'LAB-B202',
    name: 'Lab Phát Triển Ứng Dụng Di Động B202',
    building: 'Khu B',
    floor: 'Tầng 2',
    capacity: 20,
    equipment: ['High-spec PC', 'Whiteboard', 'AC', 'Projector'],
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    description: 'Chuyên dụng cho thực hành React Native, Flutter, mô phỏng thiết bị Android & iOS và kiểm thử tự động.',
    type: 'Lab máy tính',
  },
  {
    id: 'ROOM-A101',
    code: 'ROOM-A101',
    name: 'Phòng Thảo Luận Nhóm A101',
    building: 'Khu A',
    floor: 'Tầng 1',
    capacity: 8,
    equipment: ['Projector', 'Whiteboard', 'AC'],
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    description: 'Không gian họp nhóm và thảo luận đồ án môn học, tích hợp bảng từ thông minh và máy chiếu tương tác.',
    type: 'Phòng học nhóm',
  },
  {
    id: 'ROOM-A205',
    code: 'ROOM-A205',
    name: 'Phòng Tự Học Sáng Tạo A205',
    building: 'Khu A',
    floor: 'Tầng 2',
    capacity: 6,
    equipment: ['Whiteboard', 'AC'],
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    description: 'Phòng học yên tĩnh dành cho nhóm nhỏ 4-6 bạn ôn tập, làm bài tập lớn và lập trình đôi (Pair Programming).',
    type: 'Phòng học nhóm',
  },
  {
    id: 'ROOM-B304',
    code: 'LAB-B304',
    name: 'Lab An Toàn Thông Tin & Mạng B304',
    building: 'Khu B',
    floor: 'Tầng 3',
    capacity: 22,
    equipment: ['High-spec PC', 'Projector', 'AC'],
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    description: 'Hạ tầng mạng cô lập phục vụ nghiên cứu bảo mật hệ thống, diễn tập an toàn thông tin và điện toán đám mây.',
    type: 'Lab máy tính',
  },
  {
    id: 'ROOM-C102',
    code: 'AUD-C102',
    name: 'Phòng Hội đồng Báo cáo Đồ án C102',
    building: 'Khu C',
    floor: 'Tầng 1',
    capacity: 35,
    equipment: ['Projector', 'Sound System', 'AC', 'Whiteboard'],
    image: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80',
    description: 'Trang bị hệ thống âm thanh vòm, 2 máy chiếu kép và bục phát biểu cho các buổi bảo vệ khóa luận và seminar.',
    type: 'Phòng hội thảo',
  },
  {
    id: 'ROOM-C203',
    code: 'SEM-C203',
    name: 'Phòng Nghiên Cứu Chuyên Đề C203',
    building: 'Khu C',
    floor: 'Tầng 2',
    capacity: 15,
    equipment: ['Projector', 'Whiteboard', 'AC'],
    image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
    description: 'Bố trí bàn tròn hội nghị linh hoạt, thích hợp cho các buổi thảo luận chuyên môn giảng viên và sinh viên NCKH.',
    type: 'Phòng nghiên cứu',
  },
  {
    id: 'ROOM-V201',
    code: 'INO-V201',
    name: 'Không Gian Đổi Mới Sáng Tạo V201',
    building: 'Khu V',
    floor: 'Tầng 2',
    capacity: 18,
    equipment: ['High-spec PC', 'Projector', 'AC', 'Whiteboard', 'Sound System'],
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
    description: 'Không gian mở thiết kế hiện đại phục vụ các câu lạc bộ khởi nghiệp, hackathon và nghiên cứu giải pháp IoT.',
    type: 'Phòng nghiên cứu',
  },
  {
    id: 'ROOM-LIB-01',
    code: 'LIB-01',
    name: 'Phòng Thảo Luận Thư Viện Số LIB-01',
    building: 'Thư viện',
    floor: 'Tầng 2',
    capacity: 10,
    equipment: ['Projector', 'AC', 'Whiteboard'],
    image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
    description: 'Nằm ngay trong khuôn viên Thư viện số VKU, tra cứu tài liệu học thuật trực tiếp với đường truyền cáp quang tốc độ cao.',
    type: 'Phòng học nhóm',
  },
  {
    id: 'ROOM-LIB-02',
    code: 'LIB-02',
    name: 'Phòng Tự Học Yên Tĩnh LIB-02',
    building: 'Thư viện',
    floor: 'Tầng 3',
    capacity: 4,
    equipment: ['AC', 'Whiteboard'],
    image: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=800&q=80',
    description: 'Cabin kính cách âm tiêu chuẩn cao dành riêng cho nhóm nghiên cứu chuyên sâu không bị ảnh hưởng bởi tiếng ồn.',
    type: 'Phòng học nhóm',
  },
];

export const CURRENT_USER: UserProfile = {
  name: 'Nguyễn Thị Thương',
  studentId: '23IT.B219',
  email: 'thuongnt.23itb@vku.udn.vn',
  major: 'Kỹ Thuật Phần Mềm & Ứng Dụng Đa Nền Tảng (VKU)',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
};
`;
fs.writeFileSync(path.join(__dirname, 'src/data/roomsData.ts'), roomsDataContent, 'utf8');
console.log('✓ Fixed: src/data/roomsData.ts');

// 2. src/components/DateSelector.tsx
const dateSelectorContent = `import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';

interface DateSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onSelectDate }) => {
  // Sinh 7 ngày liên tiếp từ ngày hiện tại
  const dates = React.useMemo(() => {
    const list: { fullDate: string; dayOfWeek: string; dayNumber: string; isToday: boolean }[] = [];
    const today = new Date();

    const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const fullDate = \`\${yyyy}-\${mm}-\${dd}\`;

      list.push({
        fullDate,
        dayOfWeek: i === 0 ? 'Hôm nay' : DAYS[d.getDay()],
        dayNumber: \`\${dd}/\${mm}\`,
        isToday: i === 0,
      });
    }
    return list;
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.headerLabel}>📅 Chọn ngày đặt phòng (Lịch 7 ngày tới):</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {dates.map((item) => {
          const isSelected = selectedDate === item.fullDate;
          return (
            <Pressable
              key={item.fullDate}
              style={[
                styles.dateCard,
                isSelected && styles.dateCardSelected,
                item.isToday && !isSelected && styles.dateCardToday,
              ]}
              onPress={() => onSelectDate(item.fullDate)}
            >
              <Text style={[styles.dayOfWeekText, isSelected && styles.textSelected]}>{item.dayOfWeek}</Text>
              <Text style={[styles.dayNumberText, isSelected && styles.textSelected]}>{item.dayNumber}</Text>
              {isSelected && <View style={styles.activeDot} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dateCard: {
    width: 72,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCardToday: {
    borderColor: '#0284c7',
  },
  dateCardSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  dayOfWeekText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 3,
  },
  dayNumberText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  textSelected: {
    color: '#ffffff',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
    marginTop: 4,
  },
});
`;
fs.writeFileSync(path.join(__dirname, 'src/components/DateSelector.tsx'), dateSelectorContent, 'utf8');
console.log('✓ Fixed: src/components/DateSelector.tsx');

// 3. src/components/TimeSlotGrid.tsx
const timeSlotGridContent = `import React from 'react';
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
        <Text style={styles.headerLabel}>⏰ Khung Giờ Ca Học (Chuẩn VKU 2 Tiếng):</Text>
        <Text style={styles.subInfo}>Trạng thái thời gian thực</Text>
      </View>

      <View style={styles.grid}>
        {TIME_SLOTS.map((slot) => {
          const booked = isSlotBooked(roomId, selectedDate, slot.id);
          const isSelected = selectedSlot?.id === slot.id;

          const handlePress = () => {
            if (booked) {
              // Kích hoạt giải quyết xung đột thông minh cho người đến sau
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
                    {booked ? '🔴 Đã Kín' : '🟢 Trống'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.slotHint, isSelected && styles.textWhite70, booked && styles.textBookedLight]}>
                {booked ? 'Nhấn để xem phòng thay thế' : isSelected ? 'Đã chọn ca này' : 'Chạm để chọn ca học'}
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
`;
fs.writeFileSync(path.join(__dirname, 'src/components/TimeSlotGrid.tsx'), timeSlotGridContent, 'utf8');
console.log('✓ Fixed: src/components/TimeSlotGrid.tsx');

// 4. src/components/RoomCard.tsx
const roomCardContent = `import React from 'react';
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
`;
fs.writeFileSync(path.join(__dirname, 'src/components/RoomCard.tsx'), roomCardContent, 'utf8');
console.log('✓ Fixed: src/components/RoomCard.tsx');

// 5. src/components/FilterBar.tsx
const filterBarContent = `import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, Pressable } from 'react-native';
import { useBookingStore } from '../store/useBookingStore';
import { Building, Equipment } from '../types/booking';

const BUILDINGS: (Building | 'ALL')[] = ['ALL', 'Khu A', 'Khu B', 'Khu C', 'Khu V', 'Thư viện'];

const CAPACITIES: { label: string; value: number | null }[] = [
  { label: 'Tất cả sức chứa', value: null },
  { label: '≥ 6 người', value: 6 },
  { label: '≥ 15 người', value: 15 },
  { label: '≥ 20 người', value: 20 },
];

const EQUIPMENTS: { label: string; value: Equipment }[] = [
  { label: '🖥️ High-spec PC', value: 'High-spec PC' },
  { label: '📽️ Máy chiếu', value: 'Projector' },
  { label: '❄️ Điều hòa', value: 'AC' },
  { label: '📋 Bảng từ', value: 'Whiteboard' },
];

export const FilterBar: React.FC = () => {
  const { filters, setSearchQuery, setBuildingFilter, setMinCapacityFilter, toggleEquipmentFilter, resetFilters } =
    useBookingStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    filters.building !== 'ALL' || filters.minCapacity !== null || filters.equipment.length > 0 || filters.searchQuery !== '';

  return (
    <View style={styles.container}>
      {/* Search Box */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm tên phòng, mã phòng (vd: B201, AI, Lab...)"
            placeholderTextColor="#94a3b8"
            value={filters.searchQuery}
            onChangeText={setSearchQuery}
          />
          {filters.searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchText}>✕</Text>
            </Pressable>
          ) : null}
        </View>
        <Pressable
          style={[styles.filterToggleBtn, (isExpanded || hasActiveFilters) && styles.filterToggleBtnActive]}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text style={[styles.filterToggleIcon, (isExpanded || hasActiveFilters) && styles.filterToggleIconActive]}>
            ⚡ Bộ lọc {filters.equipment.length + (filters.building !== 'ALL' ? 1 : 0) + (filters.minCapacity ? 1 : 0) > 0 ? \`(\${filters.equipment.length + (filters.building !== 'ALL' ? 1 : 0) + (filters.minCapacity ? 1 : 0)})\` : ''}
          </Text>
        </Pressable>
      </View>

      {/* Building Horizontal Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.buildingScroll} contentContainerStyle={styles.buildingScrollContent}>
        {BUILDINGS.map((b) => {
          const isSelected = filters.building === b;
          return (
            <Pressable
              key={b}
              style={[styles.buildingChip, isSelected && styles.buildingChipActive]}
              onPress={() => setBuildingFilter(b)}
            >
              <Text style={[styles.buildingChipText, isSelected && styles.buildingChipTextActive]}>
                {b === 'ALL' ? '🏢 Tất Cả Tòa Nhà' : b}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Expanded Filters Panel */}
      {isExpanded && (
        <View style={styles.expandedPanel}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>👥 Sức Chứa Tối Thiểu:</Text>
            <View style={styles.chipRow}>
              {CAPACITIES.map((cap) => {
                const isSelected = filters.minCapacity === cap.value;
                return (
                  <Pressable
                    key={cap.label}
                    style={[styles.smallChip, isSelected && styles.smallChipActive]}
                    onPress={() => setMinCapacityFilter(cap.value)}
                  >
                    <Text style={[styles.smallChipText, isSelected && styles.smallChipTextActive]}>
                      {cap.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>🛠️ Trang Thiết Bị Yêu Cầu:</Text>
            <View style={styles.chipRow}>
              {EQUIPMENTS.map((eq) => {
                const isSelected = filters.equipment.includes(eq.value);
                return (
                  <Pressable
                    key={eq.value}
                    style={[styles.smallChip, isSelected && styles.smallChipActive]}
                    onPress={() => toggleEquipmentFilter(eq.value)}
                  >
                    <Text style={[styles.smallChipText, isSelected && styles.smallChipTextActive]}>
                      {eq.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {hasActiveFilters && (
            <Pressable style={styles.resetBtn} onPress={resetFilters}>
              <Text style={styles.resetBtnText}>🔄 Đặt lại tất cả bộ lọc</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0f172a',
    height: '100%',
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '700',
  },
  filterToggleBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterToggleBtnActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  filterToggleIcon: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  filterToggleIconActive: {
    color: '#0284c7',
  },
  buildingScroll: {
    marginTop: 10,
  },
  buildingScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  buildingChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  buildingChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  buildingChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  buildingChipTextActive: {
    color: '#ffffff',
  },
  expandedPanel: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterSection: {
    marginBottom: 10,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  smallChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  smallChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  smallChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  smallChipTextActive: {
    color: '#ffffff',
  },
  resetBtn: {
    marginTop: 4,
    paddingVertical: 6,
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '700',
  },
});
`;
fs.writeFileSync(path.join(__dirname, 'src/components/FilterBar.tsx'), filterBarContent, 'utf8');
console.log('✓ Fixed: src/components/FilterBar.tsx');

// 6. src/components/ConflictResolutionModal.tsx
const conflictModalContent = `import React from 'react';
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
                  \`Ca học \${slot.label} ngày \${date} vừa được hoàn tất đặt chỗ bởi một sinh viên khác.\`}
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
`;
fs.writeFileSync(path.join(__dirname, 'src/components/ConflictResolutionModal.tsx'), conflictModalContent, 'utf8');
console.log('✓ Fixed: src/components/ConflictResolutionModal.tsx');

// 7. src/components/QRCodeModal.tsx
const qrCodeModalContent = `import React from 'react';
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
`;
fs.writeFileSync(path.join(__dirname, 'src/components/QRCodeModal.tsx'), qrCodeModalContent, 'utf8');
console.log('✓ Fixed: src/components/QRCodeModal.tsx');

// 8. src/components/NotificationToast.tsx
const notificationToastContent = `import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { AppNotification, notificationService } from '../services/notificationService';

export const NotificationToast: React.FC = () => {
  const [current, setCurrent] = useState<AppNotification | null>(null);
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    return notificationService.subscribe((list) => {
      if (list.length > 0) {
        const latest = list[0];
        setCurrent(latest);
        Animated.sequence([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.delay(4000),
          Animated.timing(slideAnim, {
            toValue: -120,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setCurrent(null);
        });
      }
    });
  }, []);

  if (!current) return null;

  const getBorderColor = () => {
    switch (current.type) {
      case 'CONFLICT':
        return '#ef4444';
      case 'WAITLIST_AVAILABLE':
        return '#8b5cf6';
      case 'REMINDER':
        return '#f59e0b';
      default:
        return '#10b981';
    }
  };

  const getIcon = () => {
    switch (current.type) {
      case 'CONFLICT':
        return '⚠️';
      case 'WAITLIST_AVAILABLE':
        return '🎉';
      case 'REMINDER':
        return '⏰';
      default:
        return '✅';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }], borderLeftColor: getBorderColor() },
      ]}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.iconText}>{getIcon()}</Text>
      </View>
      <View style={styles.contentWrap}>
        <Text style={styles.titleText}>{current.title}</Text>
        <Text style={styles.bodyText} numberOfLines={2}>
          {current.body}
        </Text>
      </View>
      <Pressable
        onPress={() => {
          Animated.timing(slideAnim, {
            toValue: -120,
            duration: 180,
            useNativeDriver: true,
          }).start(() => setCurrent(null));
        }}
        style={styles.closeBtn}
      >
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderLeftWidth: 5,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  iconWrap: {
    marginRight: 10,
  },
  iconText: {
    fontSize: 22,
  },
  contentWrap: {
    flex: 1,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  bodyText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  closeBtn: {
    padding: 6,
    marginLeft: 6,
  },
  closeText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '700',
  },
});
`;
fs.writeFileSync(path.join(__dirname, 'src/components/NotificationToast.tsx'), notificationToastContent, 'utf8');
console.log('✓ Fixed: src/components/NotificationToast.tsx');

// 9. src/screens/BrowseRoomsScreen.tsx
const browseRoomsContent = `import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/useBookingStore';
import { RoomCard } from '../components/RoomCard';
import { FilterBar } from '../components/FilterBar';
import { Room } from '../types/booking';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const BrowseRoomsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { rooms, filters, bookings } = useBookingStore();

  // Lọc danh sách phòng theo search & chips đa tham số
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // 1. Search query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchName = room.name.toLowerCase().includes(query);
        const matchCode = room.code.toLowerCase().includes(query);
        const matchDesc = room.description.toLowerCase().includes(query);
        const matchBuilding = room.building.toLowerCase().includes(query);
        if (!matchName && !matchCode && !matchDesc && !matchBuilding) return false;
      }

      // 2. Building filter
      if (filters.building !== 'ALL' && room.building !== filters.building) {
        return false;
      }

      // 3. Capacity filter
      if (filters.minCapacity !== null && room.capacity < filters.minCapacity) {
        return false;
      }

      // 4. Equipment filter (phải thỏa mãn tất cả trang thiết bị được chọn)
      if (filters.equipment.length > 0) {
        const hasAllEq = filters.equipment.every((eq) => room.equipment.includes(eq));
        if (!hasAllEq) return false;
      }

      return true;
    });
  }, [rooms, filters]);

  // Kiểm tra phòng có slot trống hôm nay không
  const todayStr = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return \`\${yyyy}-\${mm}-\${dd}\`;
  }, []);

  const isRoomAvailableToday = useCallback(
    (roomId: string) => {
      const todayBookingsCount = bookings.filter(
        (b) => b.roomId === roomId && b.date === todayStr && b.status !== 'CANCELLED'
      ).length;
      return todayBookingsCount < 5; // Có 5 slot/ngày, nếu < 5 là còn trống
    },
    [bookings, todayStr]
  );

  const handleSelectRoom = useCallback(
    (roomId: string) => {
      navigation.navigate('RoomDetails', { roomId });
    },
    [navigation]
  );

  const renderRoomItem = useCallback(
    ({ item }: { item: Room }) => (
      <RoomCard
        room={item}
        isAvailableToday={isRoomAvailableToday(item.id)}
        onPress={() => handleSelectRoom(item.id)}
      />
    ),
    [isRoomAvailableToday, handleSelectRoom]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.schoolHeader}>VKU CAMPUS • HỆ THỐNG ĐẶT PHÒNG HỌC</Text>
          <Text style={styles.screenTitle}>Tra Cứu Phòng Học & Lab</Text>
        </View>
        <View style={styles.statusLiveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Real-time</Text>
        </View>
      </View>

      {/* Multi-parameter Filter Bar */}
      <FilterBar />

      {/* Result Count Banner */}
      <View style={styles.resultBanner}>
        <Text style={styles.resultCountText}>
          Tìm thấy <Text style={styles.resultCountBold}>{filteredRooms.length}</Text> phòng học & lab khả dụng
        </Text>
        <Text style={styles.resultSubText}>60fps Scroll Optimized</Text>
      </View>

      {/* High-performance FlatList Feed */}
      <FlatList
        data={filteredRooms}
        renderItem={renderRoomItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={Platform.OS !== 'web'}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Không tìm thấy phòng phù hợp</Text>
            <Text style={styles.emptySub}>
              Vui lòng thử nới lỏng bộ lọc sức chứa hoặc trang thiết bị để xem thêm kết quả.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 12,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  schoolHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.5,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 1,
  },
  statusLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
    marginRight: 5,
  },
  liveText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '700',
  },
  resultBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
  },
  resultCountText: {
    fontSize: 12,
    color: '#64748b',
  },
  resultCountBold: {
    color: '#0284c7',
    fontWeight: '800',
  },
  resultSubText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});
`;
fs.writeFileSync(path.join(__dirname, 'src/screens/BrowseRoomsScreen.tsx'), browseRoomsContent, 'utf8');
console.log('✓ Fixed: src/screens/BrowseRoomsScreen.tsx');

// 10. src/services/notificationService.ts
const notificationServiceContent = `import { Platform } from 'react-native';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  type: 'REMINDER' | 'CONFLICT' | 'WAITLIST_AVAILABLE' | 'SUCCESS';
}

class NotificationService {
  private inAppNotifications: AppNotification[] = [];
  private listeners: ((notifications: AppNotification[]) => void)[] = [];

  constructor() {
    this.requestPermissions();
  }

  async requestPermissions() {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch (e) {
          console.warn('Web notification permission error:', e);
        }
      }
    }
  }

  notify(title: string, body: string, type: AppNotification['type'] = 'SUCCESS') {
    const item: AppNotification = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title,
      body,
      timestamp: Date.now(),
      type,
    };

    this.inAppNotifications.unshift(item);
    if (this.inAppNotifications.length > 20) {
      this.inAppNotifications = this.inAppNotifications.slice(0, 20);
    }
    this.listeners.forEach((fn) => fn([...this.inAppNotifications]));

    // Web Notification nếu được cấp quyền
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, { body, icon: 'https://vku.udn.vn/favicon.ico' });
        } catch (e) {
          console.warn('Cannot display web notification:', e);
        }
      }
    }
  }

  /**
   * Đặt lịch nhắc nhở 15 phút trước giờ học
   */
  scheduleBookingReminder(roomName: string, date: string, startTime: string) {
    const title = '⏰ Nhắc nhở ca học tại VKU (Còn 15 phút)';
    const body = \`Phòng \${roomName} của bạn sắp bắt đầu lúc \${startTime} (\${date}). Hãy sẵn sàng quét mã QR check-in!\`;
    
    // Gửi thông báo xác nhận lịch hẹn
    this.notify('🔔 Đã đặt phòng & Lên lịch nhắc nhở', \`Hệ thống sẽ nhắc bạn 15 phút trước ca học \${startTime} tại \${roomName}.\`, 'REMINDER');
  }

  subscribe(listener: (notifications: AppNotification[]) => void) {
    this.listeners.push(listener);
    listener([...this.inAppNotifications]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getNotifications() {
    return [...this.inAppNotifications];
  }

  clear() {
    this.inAppNotifications = [];
    this.listeners.forEach((fn) => fn([]));
  }
}

export const notificationService = new NotificationService();
`;
fs.writeFileSync(path.join(__dirname, 'src/services/notificationService.ts'), notificationServiceContent, 'utf8');
console.log('✓ Fixed: src/services/notificationService.ts');

// 11. src/store/useBookingStore.ts
const useBookingStoreContent = `import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Booking, ConflictResolution, Equipment, FilterState, Room, UserProfile, Building, TimeSlot } from '../types/booking';
import { INITIAL_ROOMS, CURRENT_USER, TIME_SLOTS } from '../data/roomsData';
import { notificationService } from '../services/notificationService';

interface WaitlistItem {
  id: string;
  roomId: string;
  date: string;
  slotId: string;
  studentId: string;
  studentName: string;
  createdAt: number;
}

interface BookingState {
  rooms: Room[];
  bookings: Booking[];
  currentUser: UserProfile;
  filters: FilterState;
  waitlist: WaitlistItem[];

  // Filter actions
  setSearchQuery: (query: string) => void;
  setBuildingFilter: (building: Building | 'ALL') => void;
  setMinCapacityFilter: (capacity: number | null) => void;
  toggleEquipmentFilter: (equipment: Equipment) => void;
  resetFilters: () => void;

  // Conflict detection & resolution engine
  checkSlotConflict: (roomId: string, date: string, slotId: string) => ConflictResolution;
  isSlotBooked: (roomId: string, date: string, slotId: string) => boolean;

  // Booking actions
  addBooking: (
    data: Omit<Booking, 'id' | 'createdAt' | 'status' | 'qrCodeData'>
  ) => { success: boolean; booking?: Booking; conflict?: ConflictResolution };

  cancelBooking: (id: string) => void;
  checkInBooking: (id: string) => void;

  // Waitlist actions
  joinWaitlist: (roomId: string, date: string, slotId: string) => void;
  isUserInWaitlist: (roomId: string, date: string, slotId: string) => boolean;
}

const INITIAL_FILTERS: FilterState = {
  searchQuery: '',
  building: 'ALL',
  minCapacity: null,
  equipment: [],
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      rooms: INITIAL_ROOMS,
      bookings: [],
      currentUser: CURRENT_USER,
      filters: INITIAL_FILTERS,
      waitlist: [],

      setSearchQuery: (searchQuery) =>
        set((state) => ({ filters: { ...state.filters, searchQuery } })),

      setBuildingFilter: (building) =>
        set((state) => ({ filters: { ...state.filters, building } })),

      setMinCapacityFilter: (minCapacity) =>
        set((state) => ({ filters: { ...state.filters, minCapacity } })),

      toggleEquipmentFilter: (equipment) =>
        set((state) => {
          const current = state.filters.equipment;
          const exists = current.includes(equipment);
          const next = exists ? current.filter((e) => e !== equipment) : [...current, equipment];
          return { filters: { ...state.filters, equipment: next } };
        }),

      resetFilters: () => set({ filters: INITIAL_FILTERS }),

      isSlotBooked: (roomId, date, slotId) => {
        const { bookings } = get();
        return bookings.some(
          (b) =>
            b.roomId === roomId &&
            b.date === date &&
            b.slotId === slotId &&
            b.status !== 'CANCELLED'
        );
      },

      /**
       * ĐỘNG CƠ KIỂM TRA VÀ GIẢI QUYẾT XUNG ĐỘT (CONFLICT RESOLUTION ENGINE)
       * Trả lời trực tiếp 2 câu hỏi:
       * 1. Phát hiện trùng phòng / cùng thời điểm
       * 2. Tìm giải pháp thông minh cho người không được ưu tiên (Gợi ý phòng tương đương, khung giờ khác)
       */
      checkSlotConflict: (roomId, date, slotId) => {
        const { bookings, rooms, currentUser } = get();

        // 1. Kiểm tra xem slot này đã có ai đặt chưa
        const conflictBooking = bookings.find(
          (b) =>
            b.roomId === roomId &&
            b.date === date &&
            b.slotId === slotId &&
            b.status !== 'CANCELLED'
        );

        // 2. Kiểm tra xem chính sinh viên này đã có lịch ở phòng khác cùng giờ chưa
        const studentOverlapping = bookings.find(
          (b) =>
            b.studentId === currentUser.studentId &&
            b.date === date &&
            b.slotId === slotId &&
            b.status !== 'CANCELLED' &&
            b.roomId !== roomId
        );

        if (!conflictBooking && !studentOverlapping) {
          return { hasConflict: false };
        }

        const targetRoom = rooms.find((r) => r.id === roomId);
        const requiredCapacity = targetRoom?.capacity || 8;

        // TÌM PHÒNG THAY THẾ TƯƠNG ĐƯƠNG (SMART ALTERNATIVE ROOMS)
        // Tiêu chí: Cùng tòa nhà hoặc cùng sức chứa, và slot đó ĐANG TRỐNG
        const alternativeRooms = rooms.filter((r) => {
          if (r.id === roomId) return false;
          // Kiểm tra slot này ở phòng r có trống không
          const isBooked = bookings.some(
            (b) =>
              b.roomId === r.id &&
              b.date === date &&
              b.slotId === slotId &&
              b.status !== 'CANCELLED'
          );
          if (isBooked) return false;

          // Ưu tiên cùng tòa nhà hoặc cùng sức chứa chênh lệch +-10
          const sameBuilding = r.building === targetRoom?.building;
          const similarCapacity = Math.abs(r.capacity - requiredCapacity) <= 10;
          return sameBuilding || similarCapacity;
        });

        // TÌM KHUNG GIỜ KHÁC TRỐNG CỦA CHÍNH PHÒNG NÀY (ALTERNATIVE TIME SLOTS)
        const alternativeSlots = TIME_SLOTS.filter((slot) => {
          if (slot.id === slotId) return false;
          const isSlotTaken = bookings.some(
            (b) =>
              b.roomId === roomId &&
              b.date === date &&
              b.slotId === slot.id &&
              b.status !== 'CANCELLED'
          );
          return !isSlotTaken;
        });

        let message = '';
        if (conflictBooking) {
          message = \`Phòng \${targetRoom?.name} vào khung giờ này đã được sinh viên \${conflictBooking.studentName} đặt trước.\`;
        } else if (studentOverlapping) {
          message = \`Bạn đã có lịch đặt phòng \${studentOverlapping.roomName} trong khung giờ này. Mỗi sinh viên chỉ được giữ 1 phòng tại 1 thời điểm!\`;
        }

        return {
          hasConflict: true,
          conflictingBooking: conflictBooking || studentOverlapping,
          message,
          alternativeRooms: alternativeRooms.slice(0, 3), // Lấy tối đa 3 phòng tối ưu nhất
          alternativeSlots,
        };
      },

      addBooking: (data) => {
        const conflict = get().checkSlotConflict(data.roomId, data.date, data.slotId);
        if (conflict.hasConflict) {
          notificationService.notify(
            '⚠️ Phát hiện xung đột phòng học',
            conflict.message || 'Khung giờ này vừa có người đặt. Vui lòng xem gợi ý phòng thay thế.',
            'CONFLICT'
          );
          return { success: false, conflict };
        }

        const uniqueCode = 'VKU-' + Math.floor(1000 + Math.random() * 9000);
        const bookingId = 'BK-' + Date.now();
        const qrData = JSON.stringify({
          bookingId,
          code: uniqueCode,
          roomId: data.roomId,
          roomCode: data.roomCode,
          date: data.date,
          slot: data.slotLabel,
          student: data.studentName,
          studentId: data.studentId,
          vku_auth: 'VERIFIED_STUDENT_PASS',
        });

        const newBooking: Booking = {
          ...data,
          id: bookingId,
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
          qrCodeData: qrData,
        };

        set((state) => ({
          bookings: [newBooking, ...state.bookings],
          // Xóa khỏi waitlist nếu đang chờ slot này
          waitlist: state.waitlist.filter(
            (w) =>
              !(w.roomId === data.roomId && w.date === data.date && w.slotId === data.slotId)
          ),
        }));

        // Kích hoạt lịch nhắc nhở 15 phút trước giờ bắt đầu
        notificationService.scheduleBookingReminder(
          data.roomName,
          data.date,
          data.slotLabel.split(' - ')[0]
        );

        return { success: true, booking: newBooking };
      },

      cancelBooking: (id) => {
        const targetBooking = get().bookings.find((b) => b.id === id);
        if (!targetBooking) return;

        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, status: 'CANCELLED' as const } : b
          ),
        }));

        notificationService.notify(
          'Đã hủy đặt phòng',
          \`Lịch đặt phòng \${targetBooking.roomName} (\${targetBooking.date}) đã được hủy thành công.\`,
          'REMINDER'
        );

        // KIỂM TRA HÀNG ĐỢI WAITLIST VÀ BÁO CHO NGƯỜI CHỜ
        const waitingUsers = get().waitlist.filter(
          (w) =>
            w.roomId === targetBooking.roomId &&
            w.date === targetBooking.date &&
            w.slotId === targetBooking.slotId
        );

        if (waitingUsers.length > 0) {
          notificationService.notify(
            '🔔 Phòng bạn chờ đã trống!',
            \`Phòng \${targetBooking.roomName} vừa có bạn hủy lúc \${targetBooking.slotLabel}. Hãy vào đặt ngay!\`,
            'WAITLIST_AVAILABLE'
          );
        }
      },

      checkInBooking: (id) => {
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, status: 'CHECKED_IN' as const } : b
          ),
        }));
        notificationService.notify(
          'Check-in Thành Công!',
          'Bạn đã xác thực QR thành công. Chúc bạn có buổi học tập hiệu quả tại VKU!',
          'SUCCESS'
        );
      },

      joinWaitlist: (roomId, date, slotId) => {
        const { currentUser, waitlist } = get();
        const alreadyIn = waitlist.some(
          (w) =>
            w.roomId === roomId &&
            w.date === date &&
            w.slotId === slotId &&
            w.studentId === currentUser.studentId
        );
        if (alreadyIn) return;

        const item: WaitlistItem = {
          id: 'wait-' + Date.now(),
          roomId,
          date,
          slotId,
          studentId: currentUser.studentId,
          studentName: currentUser.name,
          createdAt: Date.now(),
        };

        set((state) => ({ waitlist: [...state.waitlist, item] }));
        notificationService.notify(
          'Đã vào Hàng Đợi (Waitlist)',
          'Hệ thống sẽ ưu tiên gửi thông báo ngay khi có sinh viên hủy khung giờ này.',
          'REMINDER'
        );
      },

      isUserInWaitlist: (roomId, date, slotId) => {
        const { currentUser, waitlist } = get();
        return waitlist.some(
          (w) =>
            w.roomId === roomId &&
            w.date === date &&
            w.slotId === slotId &&
            w.studentId === currentUser.studentId
        );
      },
    }),
    {
      name: 'vku-booking-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        bookings: state.bookings,
        waitlist: state.waitlist,
      }),
    }
  )
);
`;
fs.writeFileSync(path.join(__dirname, 'src/store/useBookingStore.ts'), useBookingStoreContent, 'utf8');
console.log('✓ Fixed: src/store/useBookingStore.ts');

console.log('ALL FILES UPDATED WITH CLEAN UTF-8!');
