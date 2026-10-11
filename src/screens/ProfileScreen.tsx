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
} from 'react-native';
import { useBookingStore } from '../store/useBookingStore';
import { evaluatePasswordStrength } from '../services/authSecurityService';

export const ProfileScreen: React.FC = () => {
  const {
    currentUser,
    bookings,
    setAuthModalVisible,
    setInstallModalVisible,
    logout,
    changePassword,
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

  const handleUpdatePassword = () => {
    setPassMsg(null);
    if (!oldPass || !newPass) {
      setPassMsg({
        text: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.',
        isError: true,
      });
      return;
    }
    if (newPass.length < 6) {
      setPassMsg({
        text: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
        isError: true,
      });
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({
        text: 'Mật khẩu xác nhận không khớp.',
        isError: true,
      });
      return;
    }

    const res = changePassword(oldPass, newPass);
    if (!res.success) {
      setPassMsg({ text: res.message, isError: true });
    } else {
      setPassMsg({
        text: '✓ Đã cập nhật mật khẩu mới thành công.',
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
            <Text style={styles.guestIcon}>👤</Text>
            <Text style={styles.guestTitle}>Tài Khoản Sinh Viên VKU</Text>
            <Text style={styles.guestDesc}>
              Đăng nhập bằng tài khoản sinh viên hoặc Google VKU (@vku.udn.vn) để quản lý lịch đặt phòng, nhận thông báo nhắc lịch và sử dụng mã QR Check-in.
            </Text>
            <Pressable style={styles.loginBtn} onPress={() => setAuthModalVisible(true)}>
              <Text style={styles.loginBtnText}>Đăng Nhập Tài Khoản</Text>
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
        {/* Thẻ Hồ Sơ Sinh Viên */}
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

          <View
            style={[
              styles.verifiedBadge,
              isGoogle ? styles.verifiedBadgeGoogle : styles.verifiedBadgeVku,
            ]}
          >
            <Text
              style={[
                styles.verifiedBadgeText,
                isGoogle ? { color: '#1a73e8' } : { color: '#15803d' },
              ]}
            >
              {isGoogle
                ? '✓ Đã liên kết tài khoản Google'
                : '✓ Tài khoản Sinh viên VKU đang hoạt động'}
            </Text>
          </View>

          <View style={styles.accountActionsRow}>
            <Pressable style={styles.switchAccBtn} onPress={() => setAuthModalVisible(true)}>
              <Text style={styles.switchAccBtnText}>🔄 Chuyển tài khoản</Text>
            </Pressable>
            <Pressable
              style={styles.changePassToggleBtn}
              onPress={() => {
                setShowChangePass(!showChangePass);
                setPassMsg(null);
              }}
            >
              <Text style={styles.changePassToggleText}>🔑 Đổi mật khẩu</Text>
            </Pressable>
            <Pressable style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutBtnText}>🚪 Đăng xuất</Text>
            </Pressable>
          </View>

          {/* Khung Đổi Mật Khẩu */}
          {showChangePass && (
            <View style={styles.changePassBox}>
              <Text style={styles.changePassTitle}>Đổi mật khẩu tài khoản</Text>
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
                placeholder="Nhập mật khẩu hiện tại"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                value={oldPass}
                onChangeText={setOldPass}
              />
              <TextInput
                style={styles.passInput}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                value={newPass}
                onChangeText={setNewPass}
              />
              {newPass.length > 0 && (
                <Text
                  style={{
                    fontSize: 11.5,
                    fontWeight: '700',
                    color: strength.color,
                    marginBottom: 8,
                  }}
                >
                  Độ mạnh mật khẩu: {strength.label}
                </Text>
              )}
              <TextInput
                style={styles.passInput}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                value={confirmPass}
                onChangeText={setConfirmPass}
              />
              <Pressable style={styles.savePassBtn} onPress={handleUpdatePassword}>
                <Text style={styles.savePassBtnText}>Lưu mật khẩu mới</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Thống Kê Đặt Phòng Cá Nhân */}
        <Text style={styles.sectionHeader}>📊 Thống Kê Đặt Phòng Cá Nhân</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalCount}</Text>
            <Text style={styles.statLabel}>Tổng lượt đặt</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }]}>
            <Text style={[styles.statNumber, { color: '#0284c7' }]}>{confirmedCount}</Text>
            <Text style={styles.statLabel}>Sắp tới</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }]}>
            <Text style={[styles.statNumber, { color: '#16a34a' }]}>{checkedInCount}</Text>
            <Text style={styles.statLabel}>Đã nhận phòng</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#fecaca', backgroundColor: '#fef2f2' }]}>
            <Text style={[styles.statNumber, { color: '#dc2626' }]}>{cancelledCount}</Text>
            <Text style={styles.statLabel}>Đã huỷ</Text>
          </View>
        </View>

        {/* Thông Tin Sinh Viên & Đơn Vị */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>🎓 Thông Tin Sinh Viên</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Trường</Text>
            <Text style={styles.infoVal}>ĐH CNTT & TT Việt - Hàn (VKU)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Mã số sinh viên</Text>
            <Text style={styles.infoVal}>{currentUser.studentId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Email học vụ</Text>
            <Text style={styles.infoVal}>{currentUser.email}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <Text style={styles.infoKey}>Quyền mượn phòng</Text>
            <Text style={[styles.infoVal, { color: '#16a34a', fontWeight: '700' }]}>
              Đủ điều kiện sử dụng
            </Text>
          </View>
        </View>

        {/* Nội Quy Sử Dụng Phòng Học */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>📋 Quy Định Mượn Phòng Học & Lab VKU</Text>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleDot}>1.</Text>
            <Text style={styles.ruleText}>
              Sinh viên xuất trình mã QR hoặc quét mã tại cửa phòng trong vòng 15 phút đầu ca học để xác nhận nhận phòng.
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleDot}>2.</Text>
            <Text style={styles.ruleText}>
              Giữ gìn vệ sinh chung, sắp xếp lại ghế ngồi và tắt toàn bộ điều hòa, máy chiếu, thiết bị điện trước khi rời phòng.
            </Text>
          </View>
          <View style={[styles.ruleItem, { marginBottom: 0 }]}>
            <Text style={styles.ruleDot}>3.</Text>
            <Text style={styles.ruleText}>
              Chủ động hủy lịch đặt trước ít nhất 30 phút nếu không còn nhu cầu sử dụng để nhường phòng cho nhóm học tập khác.
            </Text>
          </View>
        </View>

        {/* Cài Đặt Ứng Dụng Trên Điện Thoại */}
        <View style={[styles.infoCard, { borderColor: '#bfdbfe', backgroundColor: '#f0f9ff' }]}>
          <Text style={styles.infoCardTitle}>📲 Ứng Dụng VKU Room Booking Di Động</Text>
          <Text style={styles.settingSub}>
            Cài đặt ứng dụng lên màn hình chính điện thoại (Android / iOS) để tra cứu nhanh phòng trống và mở mã QR ngay cả khi mạng yếu.
          </Text>
          <Pressable
            style={styles.installBtn}
            onPress={() => setInstallModalVisible(true)}
          >
            <Text style={styles.installBtnText}>Tải & Cài Đặt Ứng Dụng</Text>
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
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    maxWidth: 400,
  },
  guestIcon: {
    fontSize: 44,
    marginBottom: 12,
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
    marginBottom: 22,
  },
  loginBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 3,
    borderColor: '#0284c7',
    backgroundColor: '#e2e8f0',
  },
  vkuSeal: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    backgroundColor: '#0284c7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  vkuSealText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '900',
  },
  userName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
  },
  userStudentId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
    marginTop: 3,
  },
  userEmail: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 2,
  },
  verifiedBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  verifiedBadgeVku: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  verifiedBadgeGoogle: {
    backgroundColor: '#e8f0fe',
    borderColor: '#d2e3fc',
  },
  verifiedBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  accountActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    width: '100%',
    flexWrap: 'wrap',
  },
  switchAccBtn: {
    flex: 1,
    minWidth: 115,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 10,
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
    minWidth: 115,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  changePassToggleText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    flex: 1,
    minWidth: 105,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 10,
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
    padding: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    marginBottom: 10,
    borderWidth: 1,
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
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 8,
  },
  savePassBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 9,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 4,
  },
  savePassBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoKey: {
    fontSize: 12.5,
    color: '#64748b',
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 12.5,
    color: '#0f172a',
    fontWeight: '600',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  ruleDot: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0284c7',
    width: 20,
    lineHeight: 19,
  },
  ruleText: {
    flex: 1,
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 19,
  },
  settingSub: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 14,
  },
  installBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  installBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
