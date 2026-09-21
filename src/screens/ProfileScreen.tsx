import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useBookingStore } from '../store/useBookingStore';
import { notificationService } from '../services/notificationService';

export const ProfileScreen: React.FC = () => {
  const { currentUser, bookings } = useBookingStore();

  const myBookings = bookings.filter((b) => b.studentId === currentUser.studentId);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentWrap}>
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: currentUser.avatar }}
              style={styles.avatarImage}
            />
            <View style={styles.vkuSeal}>
              <Text style={styles.vkuSealText}>VKU</Text>
            </View>
          </View>

          <Text style={styles.studentName}>{currentUser.name}</Text>
          <Text style={styles.studentId}>MSSV: {currentUser.studentId}</Text>
          <Text style={styles.studentMajor}>{currentUser.major}</Text>
          <Text style={styles.studentEmail}>✉️ {currentUser.email}</Text>

          <View style={styles.schoolBadge}>
            <Text style={styles.schoolBadgeText}>
              Trường ĐH Công nghệ Thông tin & Truyền thông Việt - Hàn
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📊 Thống Kê Hoạt Động Đặt Phòng</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalCount}</Text>
              <Text style={styles.statLabel}>Tổng lượt đặt</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#0284c7' }]}>{confirmedCount}</Text>
              <Text style={styles.statLabel}>Sắp tới</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#16a34a' }]}>{checkedInCount}</Text>
              <Text style={styles.statLabel}>Đã Check-in</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#dc2626' }]}>{cancelledCount}</Text>
              <Text style={styles.statLabel}>Đã huỷ</Text>
            </View>
          </View>
        </View>

        {/* Policy Section */}
        <View style={styles.policyCard}>
          <Text style={styles.sectionTitle}>📜 Nội Quy Mượn Phòng Học VKU</Text>
          <View style={styles.policyItem}>
            <Text style={styles.policyNum}>1</Text>
            <Text style={styles.policyText}>
              <Text style={styles.bold}>Nguyên tắc duy nhất:</Text> Mỗi sinh viên chỉ được giữ chỗ tối đa 1 phòng học tại 1 thời điểm để tránh độc chiếm tài nguyên.
            </Text>
          </View>
          <View style={styles.policyItem}>
            <Text style={styles.policyNum}>2</Text>
            <Text style={styles.policyText}>
              <Text style={styles.bold}>Giải quyết xung đột:</Text> Ưu tiên sinh viên bấm xác nhận trước. Sinh viên đến sau được hệ thống gợi ý phòng tương đương hoặc xếp vào hàng đợi nhận thông báo trống.
            </Text>
          </View>
          <View style={styles.policyItem}>
            <Text style={styles.policyNum}>3</Text>
            <Text style={styles.policyText}>
              <Text style={styles.bold}>Nhắc nhở tự động:</Text> Hệ thống tự động gửi thông báo nhắc nhở 15 phút trước khi ca học bắt đầu.
            </Text>
          </View>
          <View style={styles.policyItem}>
            <Text style={styles.policyNum}>4</Text>
            <Text style={styles.policyText}>
              <Text style={styles.bold}>Check-in tại phòng:</Text> Xuất trình mã QR tại cửa phòng học để xác nhận có mặt.
            </Text>
          </View>
        </View>

        {/* Settings & Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>⚙️ Tiện Ích & Cài Đặt</Text>

          <Pressable style={styles.actionBtn} onPress={handleTestNotification}>
            <Text style={styles.actionBtnIcon}>🔔</Text>
            <View style={styles.actionBtnContent}>
              <Text style={styles.actionBtnTitle}>Kiểm tra Thông báo Nhắc nhở</Text>
              <Text style={styles.actionBtnSub}>Mô phỏng thông báo nhắc 15 phút trước ca học</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </Pressable>

          <View style={styles.appInfoWrap}>
            <Text style={styles.appInfoText}>
              VKU Room Booking App • Phiên bản Mini-Project #2 (Tuần 5-6)
            </Text>
            <Text style={styles.appInfoSub}>
              Học phần: Lập trình đa nền tảng (React Native & Expo SDK 57)
            </Text>
            <Text style={styles.appCredit}>
              Thực hiện bởi: Nguyễn Thị Thương (23IT.B219)
            </Text>
          </View>
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
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
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
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  vkuSealText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  studentName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  studentId: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0284c7',
    marginTop: 2,
  },
  studentMajor: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  studentEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  schoolBadge: {
    marginTop: 12,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  schoolBadgeText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  policyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  policyItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  policyNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
    marginRight: 10,
    marginTop: 1,
  },
  policyText: {
    flex: 1,
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  bold: {
    fontWeight: '800',
    color: '#0f172a',
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  actionBtnIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionBtnContent: {
    flex: 1,
  },
  actionBtnTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  actionBtnSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  actionArrow: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: '800',
  },
  appInfoWrap: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    alignItems: 'center',
  },
  appInfoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  appInfoSub: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
  },
  appCredit: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
    marginTop: 4,
  },
});
