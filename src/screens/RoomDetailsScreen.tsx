import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/useBookingStore';
import { TimeSlot, ConflictResolution, Room } from '../types/booking';
import { DateSelector } from '../components/DateSelector';
import { TimeSlotGrid } from '../components/TimeSlotGrid';
import { ConflictResolutionModal } from '../components/ConflictResolutionModal';
import { notificationService } from '../services/notificationService';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomDetails'>;

export const RoomDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { roomId } = route.params;
  const {
    rooms,
    currentUser,
    setAuthModalVisible,
    register,
    login,
    addBooking,
    checkSlotConflict,
  } = useBookingStore();

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
  const [isBooking, setIsBooking] = useState<boolean>(false);

  const [formError, setFormError] = useState<string>('');

  const [conflictModalVisible, setConflictModalVisible] = useState<boolean>(false);
  const [conflictedSlot, setConflictedSlot] = useState<TimeSlot | null>(null);
  const [conflictInfo, setConflictInfo] = useState<ConflictResolution | null>(null);

  useEffect(() => {
    if (currentUser || selectedSlot) {
      setFormError('');
    }
  }, [currentUser, selectedSlot]);

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

  const handleConfirmBooking = async () => {
    setFormError('');

    // 1. Bắt buộc phải đăng nhập trước khi đặt phòng
    if (!currentUser) {
      setAuthModalVisible(true);
      notificationService.notify(
        '🔑 Yêu cầu đăng nhập',
        'Vui lòng đăng nhập tài khoản sinh viên VKU trước khi đặt phòng học!',
        'REMINDER'
      );
      return;
    }

    // 2. Bắt buộc chọn ca học
    if (!selectedSlot) {
      setFormError('Vui lòng chạm chọn 1 khung giờ ca học còn trống (màu xanh lá) ở mục trên trước khi xác nhận!');
      notificationService.notify(
        '⏰ Chưa chọn khung giờ ca học',
        'Hãy chạm vào một ca học còn trống (🟢 Trống) phía trên để đặt phòng.',
        'CONFLICT'
      );
      return;
    }

    setIsBooking(true);
    try {
      const result = await addBooking({
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
    } finally {
      setIsBooking(false);
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
          onSelectSlot={(slot) => {
            setSelectedSlot(slot);
            setFormError('');
          }}
          onConflictDetected={handleConflictDetected}
        />

        {/* Form Đặt Chỗ */}
        <View style={styles.bookingFormCard}>
          <View style={styles.formHeaderRow}>
            <Text style={styles.sectionHeader}>📝 Thông Tin Sinh Viên Đặt Phòng:</Text>
            <Pressable style={styles.openAuthLink} onPress={() => setAuthModalVisible(true)}>
              <Text style={styles.openAuthLinkText}>
                {currentUser ? '🔄 Đổi tài khoản' : '🔑 Đăng nhập / Đăng ký'}
              </Text>
            </Pressable>
          </View>

          {currentUser ? (
            <View style={styles.studentInfoRow}>
              <View style={styles.studentInfoItem}>
                <Text style={styles.inputLabel}>Họ và tên sinh viên:</Text>
                <Text style={styles.inputValueStatic}>{currentUser.name}</Text>
              </View>
              <View style={styles.studentInfoItem}>
                <Text style={styles.inputLabel}>Mã sinh viên (MSSV):</Text>
                <Text style={styles.inputValueStatic}>{currentUser.studentId}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.guestLockedCard}>
              <View style={styles.guestLockedHeader}>
                <Text style={styles.guestLockedIcon}>🔒</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guestLockedTitle}>Yêu Cầu Đăng Nhập Tài Khoản</Text>
                  <Text style={styles.guestLockedDesc}>
                    Họ tên và Mã sinh viên sẽ được hệ thống tự động lấy từ tài khoản đã đăng nhập để cấp Thẻ thông hành đặt phòng.
                  </Text>
                </View>
              </View>
              <Pressable style={styles.guestLoginActionBtn} onPress={() => setAuthModalVisible(true)}>
                <Text style={styles.guestLoginActionBtnText}>🔑 Đăng Nhập / Đăng Ký Để Đặt Phòng</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số lượng thành viên tham gia (Tối đa {room.capacity} chỗ):</Text>
            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setGroupSize((prev) => Math.max(1, prev - 1))}
              >
                <Text style={styles.stepperBtnText}>-</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{groupSize} sinh viên</Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setGroupSize((prev) => Math.min(room.capacity, prev + 1))}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mục đích sử dụng phòng học / Lab:</Text>
            <TextInput
              style={styles.textInput}
              value={purpose}
              onChangeText={setPurpose}
              placeholder="VD: Họp nhóm đồ án Mini-Project, Thực hành Lab..."
              placeholderTextColor="#94a3b8"
            />
          </View>

          {formError ? (
            <View style={styles.inlineErrorBox}>
              <Text style={styles.inlineErrorText}>⚠️ {formError}</Text>
            </View>
          ) : null}
        </View>

        {/* Submit Booking Button */}
        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.submitBtn, isBooking && { opacity: 0.65 }]}
            onPress={handleConfirmBooking}
            disabled={isBooking}
          >
            <Text style={styles.submitBtnText}>
              {isBooking
                ? '⏳ Đang kiểm tra xung đột & đồng bộ...'
                : selectedSlot
                ? `⚡ Xác Nhận Đặt Phòng (${room.code} • ${selectedSlot.label})`
                : '⏰ Chạm Chọn Ca Học Phía Trên Để Đặt Phòng'}
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
    height: 210,
    width: '100%',
    position: 'relative',
  },
  roomImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  floatingBackBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  floatingBackText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 12.5,
  },
  headerInfoBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
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
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  equipmentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
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
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  openAuthLink: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  openAuthLinkText: {
    color: '#0284c7',
    fontSize: 11.5,
    fontWeight: '800',
  },
  studentInfoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 12,
    borderRadius: 10,
  },
  studentInfoItem: {
    flex: 1,
  },
  guestLockedCard: {
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#fcd34d',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  guestLockedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  guestLockedIcon: {
    fontSize: 26,
  },
  guestLockedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 4,
  },
  guestLockedDesc: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 17,
  },
  guestLoginActionBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  guestLoginActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  inlineInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  inputValueStatic: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#15803d',
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
    minWidth: 85,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0f172a',
  },
  inlineErrorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  inlineErrorText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
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
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
