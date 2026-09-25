import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useBookingStore } from '../store/useBookingStore';
import { notificationService } from '../services/notificationService';

export const ProfileScreen: React.FC = () => {
  const { currentUser, bookings, setAuthModalVisible, setInstallModalVisible, logout } = useBookingStore();

  const myBookings = currentUser
    ? bookings.filter((b) => b.studentId === currentUser.studentId)
    : [];
  const totalCount = myBookings.length;
  const confirmedCount = myBookings.filter((b) => b.status === 'CONFIRMED').length;
  const checkedInCount = myBookings.filter((b) => b.status === 'CHECKED_IN').length;
  const cancelledCount = myBookings.filter((b) => b.status === 'CANCELLED').length;

  const handleTestNotification = () => {
    notificationService.notify(
      '🔔 Thử nghiệm thông báo VKU',
      'Hệ thống thông báo đẩy & nhắc nhở 15 phút đang hoạt động chính xác!',
      'REMINDER'
    );
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.guestWrap}>
          <View style={styles.guestCard}>
            <Text style={styles.guestIcon}>🎓</Text>
            <Text style={styles.guestTitle}>Tài Khoản Sinh Viên VKU</Text>
            <Text style={styles.guestDesc}>
              Bạn đang truy cập ứng dụng ở chế độ Khách (Tài khoản rỗng). Hãy đăng nhập hoặc đăng ký mới để quản lý lịch đặt phòng học & Lab cá nhân.
            </Text>
            <Pressable style={styles.loginBtn} onPress={() => setAuthModalVisible(true)}>
              <Text style={styles.loginBtnText}>🔑 Đăng Nhập / Đăng Ký Tài Khoản</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentWrap}>
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: currentUser.avatar }} style={styles.avatarImage} />
            <View style={styles.vkuSeal}>
              <Text style={styles.vkuSealText}>VKU</Text>
            </View>
          </View>

          <Text style={styles.userName}>{currentUser.name}</Text>
          <Text style={styles.userStudentId}>MSSV: {currentUser.studentId}</Text>
          <Text style={styles.userEmail}>{currentUser.email}</Text>
          <View style={styles.majorBadge}>
            <Text style={styles.majorText}>{currentUser.major}</Text>
          </View>

          <View style={styles.accountActionsRow}>
            <Pressable style={styles.switchAccBtn} onPress={() => setAuthModalVisible(true)}>
              <Text style={styles.switchAccBtnText}>🔄 Đổi Tài Khoản</Text>
            </Pressable>
            <Pressable style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutBtnText}>🚪 Đăng Xuất</Text>
            </Pressable>
          </View>
        </View>

        {/* Booking Statistics */}
        <Text style={styles.sectionHeader}>📊 Thống Kê Đặt Phòng Cá Nhân</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalCount}</Text>
            <Text style={styles.statLabel}>Tổng lượt đặt</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }]}>
            <Text style={[styles.statNumber, { color: '#0284c7' }]}>{confirmedCount}</Text>
            <Text style={styles.statLabel}>Đang giữ chỗ</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }]}>
            <Text style={[styles.statNumber, { color: '#16a34a' }]}>{checkedInCount}</Text>
            <Text style={styles.statLabel}>Đã Check-in</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#fecaca', backgroundColor: '#fef2f2' }]}>
            <Text style={[styles.statNumber, { color: '#dc2626' }]}>{cancelledCount}</Text>
            <Text style={styles.statLabel}>Đã huỷ</Text>
          </View>
        </View>

        {/* Install & Download Package Card */}
        <View style={[styles.settingCard, { borderColor: '#bfdbfe', backgroundColor: '#f0f9ff' }]}>
          <Text style={styles.settingTitle}>📲 Cài Đặt & Đóng Gói Ứng Dụng (APK / PWA)</Text>
          <Text style={styles.settingSub}>
            Tải trực tiếp tệp cài đặt Android APK (~38 MB) hoặc thêm ứng dụng PWA độc lập vào màn hình chính điện thoại (iOS & Android).
          </Text>
          <Pressable
            style={[styles.testNotifBtn, { backgroundColor: '#0284c7' }]}
            onPress={() => setInstallModalVisible(true)}
          >
            <Text style={styles.testNotifBtnText}>📦 Mở Menu Cài Đặt & Tải APK</Text>
          </Pressable>
        </View>

        {/* Notification Test */}
        <View style={styles.settingCard}>
          <Text style={styles.settingTitle}>🔔 Kiểm Tra Hệ Thống Thông Báo</Text>
          <Text style={styles.settingSub}>
            Ứng dụng tự động gửi thông báo nhắc nhở 15 phút trước giờ nhận phòng và thông báo khi có phòng trống từ hàng đợi.
          </Text>
          <Pressable style={styles.testNotifBtn} onPress={handleTestNotification}>
            <Text style={styles.testNotifBtnText}>Phát Thử Thông Báo Đẩy</Text>
          </Pressable>
        </View>
      </ScrollView>
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
  contentWrap: {
    padding: 16,
    paddingBottom: 32,
  },
  guestWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  guestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    maxWidth: 380,
  },
  guestIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  guestDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  loginBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: '#0284c7',
  },
  vkuSeal: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  vkuSealText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  userName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
  },
  userStudentId: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0284c7',
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 2,
  },
  majorBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
  },
  majorText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },
  accountActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    width: '100%',
  },
  switchAccBtn: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  switchAccBtnText: {
    color: '#0284c7',
    fontSize: 12.5,
    fontWeight: '700',
  },
  logoutBtn: {
    flex: 1,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#dc2626',
    fontSize: 12.5,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  settingCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  settingSub: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 12,
  },
  testNotifBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  testNotifBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
