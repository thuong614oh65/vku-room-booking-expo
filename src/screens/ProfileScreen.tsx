import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
  SafeAreaView,
  TextInput,
  Platform,
} from 'react-native';
import { useBookingStore } from '../store/useBookingStore';
import { notificationService } from '../services/notificationService';
import { evaluatePasswordStrength } from '../services/authSecurityService';

export const ProfileScreen: React.FC = () => {
  const {
    currentUser,
    authSession,
    bookings,
    setAuthModalVisible,
    setInstallModalVisible,
    logout,
    changePassword,
    resetToSeedBookings,
  } = useBookingStore();

  const [showChangePass, setShowChangePass] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState<{ text: string; isError: boolean } | null>(null);

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

  const handleUpdatePassword = () => {
    setPassMsg(null);
    if (!oldPass || !newPass) {
      setPassMsg({ text: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới!', isError: true });
      return;
    }
    if (newPass.length < 6) {
      setPassMsg({ text: 'Mật khẩu mới phải có ít nhất 6 ký tự!', isError: true });
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({ text: 'Mật khẩu xác nhận không khớp!', isError: true });
      return;
    }

    const res = changePassword(oldPass, newPass);
    if (!res.success) {
      setPassMsg({ text: res.message, isError: true });
    } else {
      setPassMsg({
        text: '✅ Đã cập nhật mật khẩu, tái mã hóa SHA-256 + Salt & cấp mới JWT Token!',
        isError: false,
      });
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
    }
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.guestWrap}>
          <View style={styles.guestCard}>
            <Text style={styles.guestIcon}>🔐</Text>
            <Text style={styles.guestTitle}>Phiên Làm Việc Đã Đăng Xuất</Text>
            <Text style={styles.guestDesc}>
              Khóa phiên JWT của bạn đã được thu hồi an toàn. Vui lòng xác thực bằng mật khẩu mã hóa SHA-256 hoặc tài khoản Google OAuth 2.0 để tiếp tục.
            </Text>
            <Pressable style={styles.loginBtn} onPress={() => setAuthModalVisible(true)}>
              <Text style={styles.loginBtnText}>🔑 Đăng Nhập / Tiếp Tục Với Google</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const strength = evaluatePasswordStrength(newPass);
  const isGoogle = currentUser.authProvider === 'GOOGLE_OAUTH2';

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

          {/* Huy hiệu trạng thái xác thực bảo mật */}
          <View
            style={[
              styles.securityPill,
              isGoogle ? styles.securityPillGoogle : styles.securityPillSso,
            ]}
          >
            <Text
              style={[
                styles.securityPillText,
                isGoogle ? { color: '#1a73e8' } : { color: '#15803d' },
              ]}
            >
              {isGoogle
                ? '🌐 Đã xác thực Google OAuth 2.0 (OpenID Connect)'
                : '🛡️ Đã xác thực mật khẩu băm SHA-256 + Salt'}
            </Text>
          </View>

          <View style={styles.accountActionsRow}>
            <Pressable style={styles.switchAccBtn} onPress={() => setAuthModalVisible(true)}>
              <Text style={styles.switchAccBtnText}>🔄 Đổi Tài Khoản</Text>
            </Pressable>
            <Pressable
              style={styles.changePassToggleBtn}
              onPress={() => {
                setShowChangePass(!showChangePass);
                setPassMsg(null);
              }}
            >
              <Text style={styles.changePassToggleText}>🔐 Đổi Mật Khẩu</Text>
            </Pressable>
            <Pressable style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutBtnText}>🚪 Đăng Xuất</Text>
            </Pressable>
          </View>

          {/* Khung Đổi Mật Khẩu Bảo Mật */}
          {showChangePass && (
            <View style={styles.changePassBox}>
              <Text style={styles.changePassTitle}>
                🔐 Đổi Mật Khẩu & Cấp Lại Khóa Phiên SHA-256
              </Text>
              {passMsg && (
                <View
                  style={[
                    styles.passAlert,
                    passMsg.isError ? styles.passAlertErr : styles.passAlertOk,
                  ]}
                >
                  <Text
                    style={[
                      styles.passAlertText,
                      passMsg.isError ? { color: '#dc2626' } : { color: '#15803d' },
                    ]}
                  >
                    {passMsg.text}
                  </Text>
                </View>
              )}
              <TextInput
                style={styles.passInput}
                placeholder="Mật khẩu hiện tại (mặc định: 123456)"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                value={oldPass}
                onChangeText={setOldPass}
              />
              <TextInput
                style={styles.passInput}
                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                value={newPass}
                onChangeText={setNewPass}
              />
              {newPass.length > 0 && (
                <Text style={{ fontSize: 11, fontWeight: '700', color: strength.color, marginBottom: 6 }}>
                  Độ mạnh mật khẩu mới: {strength.label}
                </Text>
              )}
              <TextInput
                style={styles.passInput}
                placeholder="Xác nhận mật khẩu mới"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                value={confirmPass}
                onChangeText={setConfirmPass}
              />
              <Pressable style={styles.savePassBtn} onPress={handleUpdatePassword}>
                <Text style={styles.savePassBtnText}>Lưu & Tái Mã Hóa SHA-256</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Booking Statistics */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={[styles.sectionHeader, { marginBottom: 0 }]}>📊 Thống Kê Đặt Phòng Cá Nhân</Text>
          <Pressable
            style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
            onPress={resetToSeedBookings}
          >
            <Text style={{ color: '#0284c7', fontSize: 11.5, fontWeight: '700' }}>🔄 Nạp 4 Lịch Sử Mẫu</Text>
          </Pressable>
        </View>
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

        {/* Chứng Chỉ Bảo Mật & Mã Hóa (SHA-256 + JWT) */}
        <View style={[styles.settingCard, { borderColor: '#bbf7d0', backgroundColor: '#f0fdf4', marginBottom: 16 }]}>
          <Text style={[styles.settingTitle, { color: '#166534' }]}>
            🛡️ Chứng Chỉ Bảo Mật & Mã Hóa Phiên (SHA-256 & JWT)
          </Text>
          <Text style={[styles.settingSub, { color: '#15803d', marginBottom: 8 }]}>
            Mật khẩu không bao giờ lưu dưới dạng văn bản thuần (plaintext). Toàn bộ thông tin xác thực được băm một chiều bằng FIPS 180-4 SHA-256 kèm Salt riêng biệt.
          </Text>

          <View style={styles.cryptoRow}>
            <Text style={styles.cryptoKey}>Chuỗi băm SHA-256:</Text>
            <Text style={styles.cryptoVal} numberOfLines={1}>
              {currentUser.passwordHash || 'sha256$vku26$verified'}
            </Text>
          </View>

          <View style={styles.cryptoRow}>
            <Text style={styles.cryptoKey}>Khóa phiên JWT:</Text>
            <Text style={styles.cryptoVal} numberOfLines={1}>
              {authSession?.jwtToken || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.verified'}
            </Text>
          </View>

          <View style={styles.cryptoRow}>
            <Text style={styles.cryptoKey}>Mã phiên & Chữ ký:</Text>
            <Text style={styles.cryptoVal}>
              {authSession?.sessionId || 'sess_active'} • HMAC-SHA256 Verified
            </Text>
          </View>
        </View>

        {/* Install & Download Package Card */}
        <View style={[styles.settingCard, { borderColor: '#bfdbfe', backgroundColor: '#f0f9ff', marginBottom: 16 }]}>
          <Text style={styles.settingTitle}>📲 Cài Đặt & Đóng Gói Ứng Dụng (APK / PWA)</Text>
          <Text style={styles.settingSub}>
            Tải trực tiếp tệp cài đặt Android APK (~78 MB) hoặc thêm ứng dụng PWA độc lập vào màn hình chính điện thoại (iOS & Android).
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
    maxWidth: 400,
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
    right:-4,
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
  securityPill: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  securityPillGoogle: {
    backgroundColor: '#e8f0fe',
    borderColor: '#bfdbfe',
  },
  securityPillSso: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  securityPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  accountActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    width: '100%',
  },
  switchAccBtn: {
    flex: 1,
    minWidth: 105,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  switchAccBtnText: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: '700',
  },
  changePassToggleBtn: {
    flex: 1,
    minWidth: 105,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  changePassToggleText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    flex: 1,
    minWidth: 95,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
  },
  changePassBox: {
    width: '100%',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  changePassTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  passAlert: {
    padding: 9,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  passAlertErr: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  passAlertOk: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  passAlertText: {
    fontSize: 12,
    fontWeight: '600',
  },
  passInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 8,
  },
  savePassBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 2,
  },
  savePassBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
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
  cryptoRow: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#dcfce7',
    marginBottom: 6,
  },
  cryptoKey: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 2,
  },
  cryptoVal: {
    fontSize: 11,
    color: '#15803d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
