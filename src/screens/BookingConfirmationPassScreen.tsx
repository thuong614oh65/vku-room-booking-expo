import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  SafeAreaView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/useBookingStore';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingConfirmationPass'>;

export const BookingConfirmationPassScreen: React.FC<Props> = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const { bookings, cancelBooking, checkInBooking } = useBookingStore();

  const booking = bookings.find((b) => b.id === bookingId);

  if (!booking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFoundWrap}>
          <Text style={styles.notFoundText}>Không tìm thấy vé đặt phòng.</Text>
          <Pressable
            style={styles.backHomeBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'BrowseRooms' })}
          >
            <Text style={styles.backHomeBtnText}>Quay lại trang chủ</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isCheckedIn = booking.status === 'CHECKED_IN';
  const isCancelled = booking.status === 'CANCELLED';

  const handleCheckIn = () => {
    checkInBooking(booking.id);
  };

  const handleCancel = () => {
    cancelBooking(booking.id);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentWrap}>
        {/* Header Success Alert */}
        <View style={styles.successBanner}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
          <Text style={styles.bannerTitle}>
            {isCheckedIn
              ? 'ĐÃ CHECK-IN THÀNH CÔNG'
              : isCancelled
              ? 'LỊCH ĐẶT ĐÃ BỊ HUỶ'
              : 'ĐẶT PHÒNG THÀNH CÔNG!'}
          </Text>
          <Text style={styles.bannerSub}>
            {isCheckedIn
              ? 'Chúc bạn có buổi thảo luận học tập hiệu quả tại phòng!'
              : isCancelled
              ? 'Phòng học đã được hoàn trả về hệ thống.'
              : 'Hệ thống đã khoá lịch theo thời gian thực và tạo thẻ mượn phòng'}
          </Text>
        </View>

        {/* The Digital Pass Card */}
        <View style={styles.passCard}>
          {/* Top VKU Header */}
          <View style={styles.passTop}>
            <View style={styles.vkuHeaderRow}>
              <View>
                <Text style={styles.vkuTitle}>VKU SMART CAMPUS</Text>
                <Text style={styles.vkuSub}>HỆ THỐNG MƯỢN PHÒNG HỌC THỜI GIAN THỰC</Text>
              </View>
              <View style={[styles.statusBadge, isCheckedIn ? styles.statusChecked : isCancelled ? styles.statusCancelled : styles.statusConfirmed]}>
                <Text style={[styles.statusText, isCheckedIn ? styles.statusTextChecked : isCancelled ? styles.statusTextCancelled : styles.statusTextConfirmed]}>
                  {isCheckedIn ? 'ĐÃ VÀO PHÒNG' : isCancelled ? 'ĐÃ HUỶ' : 'ĐÃ XÁC NHẬN'}
                </Text>
              </View>
            </View>

            <View style={styles.roomHighlight}>
              <Text style={styles.roomCodeLarge}>{booking.roomCode}</Text>
              <Text style={styles.roomNameLarge}>{booking.roomName}</Text>
              <Text style={styles.locationText}>
                📍 {booking.building} • {booking.floor}
              </Text>
            </View>
          </View>

          {/* Perforated Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.notchLeft} />
            <View style={styles.dashedLine} />
            <View style={styles.notchRight} />
          </View>

          {/* Bottom Details Section */}
          <View style={styles.passBottom}>
            <View style={styles.metaGrid}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>NGÀY SỬ DỤNG</Text>
                <Text style={styles.metaValue}>{booking.date}</Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>KHUNG GIỜ CA HỌC</Text>
                <Text style={styles.metaValueHighlight}>{booking.slotLabel}</Text>
              </View>
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>SINH VIÊN ĐẶT</Text>
                <Text style={styles.metaValue}>{booking.studentName}</Text>
                <Text style={styles.metaSubValue}>MSSV: {booking.studentId}</Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>QUY MÔ NHÓM</Text>
                <Text style={styles.metaValue}>{booking.groupSize} sinh viên</Text>
                <Text style={styles.metaSubValue}>Tự quản lý thiết bị</Text>
              </View>
            </View>

            <View style={styles.purposeBox}>
              <Text style={styles.purposeLabel}>MỤC ĐÍCH:</Text>
              <Text style={styles.purposeText}>{booking.purpose}</Text>
            </View>

            {/* Simulated Digital QR Matrix */}
            <View style={styles.qrContainer}>
              <View style={styles.qrMatrixBox}>
                <View style={styles.qrCornerTL} />
                <View style={styles.qrCornerTR} />
                <View style={styles.qrCornerBL} />
                <View style={styles.qrCenterPattern}>
                  <Text style={styles.qrText}>VKU</Text>
                  <Text style={styles.qrSubText}>PASS</Text>
                </View>
              </View>
              <Text style={styles.qrIdText}>MÃ THẺ: {booking.id}</Text>
              <Text style={styles.qrHint}>
                {isCheckedIn
                  ? '✅ Đã xác thực thành công'
                  : 'Xuất trình mã này tại cửa phòng học hoặc máy quét bảo vệ VKU'}
              </Text>
            </View>

            {/* Check-In Button */}
            {!isCancelled && (
              <Pressable
                style={[styles.checkInBtn, isCheckedIn && styles.checkInBtnDone]}
                onPress={handleCheckIn}
                disabled={isCheckedIn}
              >
                <Text style={styles.checkInBtnText}>
                  {isCheckedIn ? '✓ Bạn đã Check-in vào phòng' : '📲 Mô phỏng Quét QR Check-In'}
                </Text>
              </Pressable>
            )}

            {/* Cancel Button */}
            {!isCheckedIn && !isCancelled && (
              <Pressable style={styles.cancelPassBtn} onPress={handleCancel}>
                <Text style={styles.cancelPassBtnText}>Huỷ lịch mượn phòng này</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.actionRow}>
          <Pressable
            style={styles.browseRoomsBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'BrowseRooms' })}
          >
            <Text style={styles.browseRoomsBtnText}>← Tìm thêm phòng</Text>
          </Pressable>
          <Pressable
            style={styles.myBookingsBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'MyBookings' })}
          >
            <Text style={styles.myBookingsBtnText}>Lịch của tôi →</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
  },
  contentWrap: {
    padding: 16,
    paddingBottom: 40,
  },
  notFoundWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 16,
  },
  backHomeBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backHomeBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  successBanner: {
    alignItems: 'center',
    marginVertical: 16,
  },
  checkCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  checkIcon: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  bannerSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  passCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    marginVertical: 10,
  },
  passTop: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  vkuHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  vkuTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0284c7',
    letterSpacing: 0.5,
  },
  vkuSub: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusConfirmed: {
    backgroundColor: '#e0f2fe',
  },
  statusChecked: {
    backgroundColor: '#dcfce7',
  },
  statusCancelled: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  statusTextConfirmed: {
    color: '#0284c7',
  },
  statusTextChecked: {
    color: '#16a34a',
  },
  statusTextCancelled: {
    color: '#dc2626',
  },
  roomHighlight: {
    marginTop: 4,
  },
  roomCodeLarge: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
  },
  roomNameLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  locationText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    backgroundColor: '#ffffff',
  },
  notchLeft: {
    width: 12,
    height: 24,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: '#0f172a',
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
  },
  notchRight: {
    width: 12,
    height: 24,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    backgroundColor: '#0f172a',
  },
  passBottom: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  metaGrid: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  metaValueHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0284c7',
    marginTop: 2,
  },
  metaSubValue: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  purposeBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  purposeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  purposeText: {
    fontSize: 12.5,
    color: '#1e293b',
    fontWeight: '600',
    marginTop: 2,
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  qrMatrixBox: {
    width: 130,
    height: 130,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 10,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCornerTL: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    borderWidth: 5,
    borderColor: '#ffffff',
    borderRadius: 4,
  },
  qrCornerTR: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderWidth: 5,
    borderColor: '#ffffff',
    borderRadius: 4,
  },
  qrCornerBL: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 30,
    height: 30,
    borderWidth: 5,
    borderColor: '#ffffff',
    borderRadius: 4,
  },
  qrCenterPattern: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  qrText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  qrSubText: {
    color: '#e0f2fe',
    fontSize: 9,
    fontWeight: '800',
  },
  qrIdText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  qrHint: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  checkInBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  checkInBtnDone: {
    backgroundColor: '#94a3b8',
  },
  checkInBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
  cancelPassBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelPassBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  browseRoomsBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  browseRoomsBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  myBookingsBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  myBookingsBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
