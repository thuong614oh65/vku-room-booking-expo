import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
  TextInput,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/useBookingStore';
import { TimeSlot, ConflictResolution, Room } from '../types/booking';
import { DateSelector } from '../components/DateSelector';
import { TimeSlotGrid } from '../components/TimeSlotGrid';
import { ConflictResolutionModal } from '../components/ConflictResolutionModal';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomDetails'>;

export const RoomDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { roomId } = route.params;
  const { rooms, currentUser, setAuthModalVisible, addBooking, checkSlotConflict } = useBookingStore();

  const room = useMemo(() => rooms.find((r) => r.id === roomId), [rooms, roomId]);

  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [groupSize, setGroupSize] = useState<number>(4);
  const [purpose, setPurpose] = useState<string>('Họp nhóm đồ án Lập trình đa nền tảng');

  const [conflictModalVisible, setConflictModalVisible] = useState<boolean>(false);
  const [conflictedSlot, setConflictedSlot] = useState<TimeSlot | null>(null);
  const [conflictInfo, setConflictInfo] = useState<ConflictResolution | null>(null);

  if (!room) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Text style={styles.notFoundTitle}>Không tìm thấy thông tin phòng học</Text>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const handleConflictDetected = (slot: TimeSlot) => {
    const resolution = checkSlotConflict(room.id, selectedDate, slot.id);
    setConflictedSlot(slot);
    setConflictInfo(resolution);
    setConflictModalVisible(true);
  };

  const handleSelectAlternativeRoom = (altRoom: Room) => {
    setConflictModalVisible(false);
    navigation.replace('RoomDetails', { roomId: altRoom.id });
  };

  const handleSelectAlternativeSlot = (altSlot: TimeSlot) => {
    setConflictModalVisible(false);
    setSelectedSlot(altSlot);
  };

  const handleConfirmBooking = () => {
    if (!currentUser) {
      setAuthModalVisible(true);
      return;
    }

    if (!selectedSlot) {
      Alert.alert('Chưa chọn ca học', 'Vui lòng chọn một khung giờ ca học còn trống phía trên!');
      return;
    }

    const result = addBooking({
      roomId: room.id,
      roomName: room.name,
      roomCode: room.code,
      building: room.building,
      floor: room.floor,
      date: selectedDate,
      slotId: selectedSlot.id,
      slotLabel: selectedSlot.label,
      studentName: currentUser.name,
      studentId: currentUser.studentId,
      studentEmail: currentUser.email,
      groupSize: Math.min(groupSize, room.capacity),
      purpose: purpose.trim() || 'Học nhóm & Nghiên cứu tại VKU',
    });

    if (!result.success && result.conflict) {
      setConflictedSlot(selectedSlot);
      setConflictInfo(result.conflict);
      setConflictModalVisible(true);
      return;
    }

    if (result.success && result.booking) {
      setSelectedSlot(null);
      navigation.navigate('BookingConfirmationPass', { bookingId: result.booking.id });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Image Banner */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: room.image }} style={styles.roomImage} resizeMode="cover" />
          <View style={styles.imageOverlay} />
          <Pressable style={styles.floatingBackBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.floatingBackText}>← Quay lại</Text>
          </Pressable>
          <View style={styles.headerInfoBadge}>
            <Text style={styles.headerCode}>{room.code}</Text>
            <Text style={styles.headerBuilding}>📍 {room.building} • {room.floor}</Text>
          </View>
        </View>

        {/* Room Info Card */}
        <View style={styles.mainInfoCard}>
          <View style={styles.titleRow}>
            <Text style={styles.roomName}>{room.name}</Text>
            <View style={styles.capacityBadge}>
              <Text style={styles.capacityText}>👥 Sức chứa {room.capacity}</Text>
            </View>
          </View>

          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>🏷️ {room.type}</Text>
          </View>

          <Text style={styles.description}>{room.description}</Text>

          <Text style={styles.sectionHeader}>🛠️ Trang Thiết Bị Phòng Học:</Text>
          <View style={styles.equipmentsList}>
            {room.equipment.map((eq) => (
              <View key={eq} style={styles.equipItem}>
                <Text style={styles.equipDot}>✓</Text>
                <Text style={styles.equipLabel}>{eq}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 7-Day Date Selector */}
        <DateSelector
          selectedDate={selectedDate}
          onSelectDate={(d) => {
            setSelectedDate(d);
            setSelectedSlot(null);
          }}
        />

        {/* Time Slot Grid */}
        <TimeSlotGrid
          roomId={room.id}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
          onConflictDetected={handleConflictDetected}
        />

        {/* Form Đặt Chỗ */}
        <View style={styles.bookingFormCard}>
          <Text style={styles.sectionHeader}>📝 Thông Tin Người Đặt (VKU Student):</Text>

          {currentUser ? (
            <View style={styles.studentInfoRow}>
              <View style={styles.studentInfoItem}>
                <Text style={styles.inputLabel}>Họ và tên:</Text>
                <Text style={styles.inputValueStatic}>{currentUser.name}</Text>
              </View>
              <View style={styles.studentInfoItem}>
                <Text style={styles.inputLabel}>Mã sinh viên:</Text>
                <Text style={styles.inputValueStatic}>{currentUser.studentId}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.guestNoticeBox}>
              <Text style={styles.guestNoticeTitle}>🔒 Bạn chưa đăng nhập tài khoản sinh viên</Text>
              <Text style={styles.guestNoticeSub}>
                Vui lòng Đăng nhập hoặc Đăng ký tài khoản để hệ thống ghi nhận lịch đặt phòng và kiểm tra trùng lịch cho bạn.
              </Text>
              <Pressable style={styles.guestLoginBtn} onPress={() => setAuthModalVisible(true)}>
                <Text style={styles.guestLoginBtnText}>🔑 Đăng Nhập / Đăng Ký Ngay</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số lượng sinh viên tham gia (Tối đa {room.capacity}):</Text>
            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setGroupSize((prev) => Math.max(1, prev - 1))}
              >
                <Text style={styles.stepperBtnText}>-</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{groupSize} bạn</Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setGroupSize((prev) => Math.min(room.capacity, prev + 1))}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mục đích sử dụng phòng:</Text>
            <TextInput
              style={styles.textInput}
              value={purpose}
              onChangeText={setPurpose}
              placeholder="VD: Họp nhóm đồ án Mini-Project, Ôn thi..."
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Submit Booking Button */}
        <View style={styles.bottomBar}>
          <Pressable
            style={[
              styles.submitBtn,
              (!selectedSlot && currentUser) && styles.submitBtnDisabled,
            ]}
            onPress={handleConfirmBooking}
          >
            <Text style={styles.submitBtnText}>
              {!currentUser
                ? '🔑 Đăng Nhập / Đăng Ký Để Đặt Phòng'
                : selectedSlot
                ? `⚡ Xác Nhận Giữ Chỗ: ${selectedSlot.label}`
                : '👈 Vui lòng chọn ca học phía trên'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Modal Giải Quyết Xung Đột Thông Minh */}
      <ConflictResolutionModal
        visible={conflictModalVisible}
        roomId={room.id}
        date={selectedDate}
        slot={conflictedSlot}
        conflict={conflictInfo}
        onClose={() => setConflictModalVisible(false)}
        onSelectAlternativeRoom={handleSelectAlternativeRoom}
        onSelectAlternativeSlot={handleSelectAlternativeSlot}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  imageContainer: {
    height: 220,
    width: '100%',
    position: 'relative',
  },
  roomImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  floatingBackBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  floatingBackText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 12,
  },
  headerInfoBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerCode: {
    color: '#38bdf8',
    fontSize: 15,
    fontWeight: '900',
  },
  headerBuilding: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '500',
  },
  mainInfoCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  capacityBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  capacityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  typeBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 19,
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
  },
  equipmentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  equipDot: {
    color: '#16a34a',
    fontWeight: '900',
    fontSize: 12,
    marginRight: 4,
  },
  equipLabel: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '600',
  },
  bookingFormCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  studentInfoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
  },
  studentInfoItem: {
    flex: 1,
  },
  guestNoticeBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  guestNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e40af',
    marginBottom: 4,
  },
  guestNoticeSub: {
    fontSize: 11.5,
    color: '#3b82f6',
    lineHeight: 17,
    marginBottom: 10,
  },
  guestLoginBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  guestLoginBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
  },
  inputValueStatic: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  inputGroup: {
    marginBottom: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0284c7',
    minWidth: 60,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  bottomBar: {
    padding: 16,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
