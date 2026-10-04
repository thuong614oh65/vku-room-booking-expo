import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useBookingStore } from '../store/useBookingStore';

export const SystemInfoModal: React.FC = () => {
  const { sysInfoModalVisible, setSysInfoModalVisible } = useBookingStore();

  if (!sysInfoModalVisible) return null;

  return (
    <Modal
      visible={sysInfoModalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setSysInfoModalVisible(false)}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleGroup}>
              <Text style={styles.headerIcon}>🏛️</Text>
              <View>
                <Text style={styles.title}>Thông Số Kỹ Thuật Hệ Thống</Text>
                <Text style={styles.subtitle}>
                  VKU Room Booking Engine • Phiên bản 1.0.0 (Production Build)
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.closeBtn}
              onPress={() => setSysInfoModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.specGrid}>
              <View style={styles.specItem}>
                <View style={styles.specTag}>
                  <Text style={styles.specTagText}>Kiến trúc</Text>
                </View>
                <Text style={styles.specTitle}>Three-Layer Architecture</Text>
                <Text style={styles.specDesc}>
                  Presentation (React Native & Material Design 3) - Business Logic (Zustand State, Slot Collision Arbitration, Live Camera QR Reader) - Data Storage (Firebase Firestore Real-Time & AsyncStorage Cache-First).
                </Text>
              </View>

              <View style={styles.specItem}>
                <View style={[styles.specTag, { backgroundColor: '#ecfdf5', borderColor: '#86efac' }]}>
                  <Text style={[styles.specTagText, { color: '#16a34a' }]}>Ngoại tuyến</Text>
                </View>
                <Text style={styles.specTitle}>Offline-First 100%</Text>
                <Text style={styles.specDesc}>
                  AsyncStorage lưu trữ lịch đặt phòng cá nhân, thẻ ra vào mã QR 2 chiều, chống mất dữ liệu khi mất kết nối mạng. Service Worker cache app-shell nạp dưới 1 giây.
                </Text>
              </View>

              <View style={styles.specItem}>
                <View style={[styles.specTag, { backgroundColor: '#fef3c7', borderColor: '#fde047' }]}>
                  <Text style={[styles.specTagText, { color: '#ca8a04' }]}>Đồng bộ</Text>
                </View>
                <Text style={styles.specTitle}>Firestore Real-Time Sync</Text>
                <Text style={styles.specDesc}>
                  Lắng nghe sự kiện tức thời qua onSnapshot(), thuật toán Conflict Resolution tự động cảnh báo và hủy trùng giờ đặt phòng giữa các sinh viên trên toàn hệ thống.
                </Text>
              </View>

              <View style={styles.specItem}>
                <View style={[styles.specTag, { backgroundColor: '#f3e8ff', borderColor: '#d8b4fe' }]}>
                  <Text style={[styles.specTagText, { color: '#7c3aed' }]}>Đa nền tảng</Text>
                </View>
                <Text style={styles.specTitle}>Expo EAS Native APK & PWA Engine</Text>
                <Text style={styles.specDesc}>
                  Đóng gói chính thức file Native Android APK (~78 MB) qua Expo Application Services (EAS Build) cùng công nghệ PWA Standalone cài đặt 1-chạm vào màn hình chính.
                </Text>
              </View>
            </View>

            <View style={styles.footerNote}>
              <Text style={styles.footerNoteText}>
                Lớp HP: Phát triển ứng dụng di động đa nền tảng (4) • Khoa Khoa học Máy tính — VKU 2026
              </Text>
              <Text style={styles.studentCredit}>
                Sinh viên: Nguyễn Thị Thương • MSSV: 23IT.B219 • Lớp SH: 23SE4
              </Text>
            </View>
          </ScrollView>

          {/* Footer Button */}
          <View style={styles.footer}>
            <Pressable
              style={styles.footerCloseBtn}
              onPress={() => setSysInfoModalVisible(false)}
            >
              <Text style={styles.footerCloseText}>Đóng Cửa Sổ</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  headerIcon: {
    fontSize: 26,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  specGrid: {
    gap: 12,
  },
  specItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
  },
  specTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 6,
  },
  specTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0284c7',
    textTransform: 'uppercase',
  },
  specTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  specDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  footerNote: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
    gap: 3,
  },
  footerNoteText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },
  studentCredit: {
    fontSize: 11.5,
    color: '#0284c7',
    fontWeight: '700',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
  },
  footerCloseBtn: {
    paddingVertical: 7,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  footerCloseText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748b',
  },
});
