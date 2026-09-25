import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { useBookingStore } from '../store/useBookingStore';

type InstallTab = 'ANDROID' | 'IOS' | 'EXPO_GO';

export const InstallAppModal: React.FC = () => {
  const { installModalVisible, setInstallModalVisible } = useBookingStore();
  const [activeTab, setActiveTab] = useState<InstallTab>('ANDROID');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [pwaInstalled, setPwaInstalled] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      const handleAppInstalled = () => {
        setPwaInstalled(true);
        setDeferredPrompt(null);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  if (!installModalVisible) return null;

  const handleDownloadApk = () => {
    // Link trực tiếp tải APK build từ EAS Expo / GitHub Release
    const apkUrl = 'https://github.com/thuong614oh65/vku-room-booking-expo/releases/download/v1.0.0/vku-room-booking.apk';
    const easBuildUrl = 'https://expo.dev/accounts/thuong221332/projects/vku-room-booking/builds/56663180-6a06-4ae6-91e6-f991c7d8d73c';

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(apkUrl, '_blank');
    } else {
      Linking.openURL(apkUrl).catch(() => Linking.openURL(easBuildUrl));
    }
  };

  const handleTriggerPwa = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setPwaInstalled(true);
        }
        setDeferredPrompt(null);
      });
    } else {
      alert(
        '💡 Hướng dẫn cài đặt PWA:\n\n' +
        '1. Bấm biểu tượng 3 chấm (⋮) ở góc trên bên phải trình duyệt Chrome.\n' +
        '2. Chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".\n' +
        '3. Nhấn "Cài đặt" để đưa biểu tượng VKU Booking ra màn hình điện thoại!'
      );
    }
  };

  const handleOpenExpoGo = () => {
    const expoGoUrl = 'exp://u.expo.dev/4d0aa5e3-181e-4e0f-ae53-a6ec7f303edb';
    const webDashboardUrl = 'https://expo.dev/accounts/thuong221332/projects/vku-room-booking';

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(webDashboardUrl, '_blank');
    } else {
      Linking.openURL(expoGoUrl).catch(() => Linking.openURL(webDashboardUrl));
    }
  };

  return (
    <Modal
      visible={installModalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setInstallModalVisible(false)}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBadge}>
                <Text style={styles.iconBadgeText}>📲</Text>
              </View>
              <View>
                <Text style={styles.title}>Cài Đặt & Tải Ứng Dụng</Text>
                <Text style={styles.subtitle}>VKU Room Booking • Trải nghiệm ứng dụng di động độc lập</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={() => setInstallModalVisible(false)}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Platform Tab Switcher */}
          <View style={styles.tabBar}>
            <Pressable
              style={[styles.tabItem, activeTab === 'ANDROID' && styles.tabItemActive]}
              onPress={() => setActiveTab('ANDROID')}
            >
              <Text style={[styles.tabText, activeTab === 'ANDROID' && styles.tabTextActive]}>
                🤖 Dành Cho Android
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabItem, activeTab === 'IOS' && styles.tabItemActive]}
              onPress={() => setActiveTab('IOS')}
            >
              <Text style={[styles.tabText, activeTab === 'IOS' && styles.tabTextActive]}>
                🍏 Dành Cho iPhone (iOS)
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabItem, activeTab === 'EXPO_GO' && styles.tabItemActive]}
              onPress={() => setActiveTab('EXPO_GO')}
            >
              <Text style={[styles.tabText, activeTab === 'EXPO_GO' && styles.tabTextActive]}>
                ⚡ Expo Go
              </Text>
            </Pressable>
          </View>

          {/* Tab Content */}
          <ScrollView style={styles.contentBody} showsVerticalScrollIndicator={false}>
            {activeTab === 'ANDROID' && (
              <View style={styles.tabPane}>
                {/* Method 1: APK */}
                <View style={styles.optionCardPrimary}>
                  <View style={styles.optionHeaderRow}>
                    <View style={styles.recommendBadge}>
                      <Text style={styles.recommendBadgeText}>KHUYÊN DÙNG</Text>
                    </View>
                    <Text style={styles.optionTitle}>Cách 1: Tải File APK Gốc Về Cài Đặt</Text>
                  </View>
                  <Text style={styles.optionDesc}>
                    Tải trực tiếp tệp tin cài đặt Native Android APK về máy điện thoại của bạn:
                  </Text>
                  <Pressable style={styles.btnPrimary} onPress={handleDownloadApk}>
                    <Text style={styles.btnPrimaryText}>⬇️ Tải File VKU-RoomBooking.apk (~38 MB)</Text>
                  </Pressable>
                  <Text style={styles.optionHint}>
                    💡 Lưu ý: Khi cài đặt, chọn "Vẫn cài đặt" (Install anyway) nếu xuất hiện cảnh báo ứng dụng nội bộ trường VKU.
                  </Text>
                </View>

                {/* Method 2: PWA */}
                <View style={styles.optionCardSecondary}>
                  <Text style={styles.optionTitleSecondary}>
                    Cách 2: Cài Đặt Trực Tiếp Qua Trình Duyệt Chrome
                  </Text>
                  <Text style={styles.optionDesc}>
                    Thêm ứng dụng vào màn hình chính thông qua công nghệ PWA Standalone:
                  </Text>
                  <Pressable style={styles.btnSecondary} onPress={handleTriggerPwa}>
                    <Text style={styles.btnSecondaryText}>
                      {pwaInstalled ? '✅ Đã Cài Đặt Trên Thiết Bị' : '📲 Bấm Vào Đây Để Cài Đặt Ngay'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {activeTab === 'IOS' && (
              <View style={styles.tabPane}>
                <View style={styles.optionCardSecondary}>
                  <Text style={styles.optionTitleSecondary}>
                    🍏 Cài Đặt Trên iPhone (Safari PWA Standalone)
                  </Text>
                  <Text style={styles.optionDesc}>
                    Do chính sách của Apple, iOS không hỗ trợ tải file APK trực tiếp. Bạn hãy cài đặt ứng dụng độc lập qua Safari theo 4 bước đơn giản:
                  </Text>

                  <View style={styles.stepList}>
                    <View style={styles.stepItem}>
                      <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                      <Text style={styles.stepText}>
                        Mở trình duyệt <Text style={styles.boldText}>Safari</Text> trên iPhone và truy cập: <Text style={styles.codeText}>https://vku-room-booking-17t.pages.dev</Text>
                      </Text>
                    </View>

                    <View style={styles.stepItem}>
                      <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                      <Text style={styles.stepText}>
                        Bấm vào nút <Text style={styles.boldText}>Chia sẻ</Text> (biểu tượng hình vuông có mũi tên trỏ lên 📤 ở đáy màn hình Safari).
                      </Text>
                    </View>

                    <View style={styles.stepItem}>
                      <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                      <Text style={styles.stepText}>
                        Cuộn xuống danh sách tác vụ và chọn <Text style={styles.boldText}>"Thêm vào MH chính"</Text> (Add to Home Screen).
                      </Text>
                    </View>

                    <View style={styles.stepItem}>
                      <View style={styles.stepNumber}><Text style={styles.stepNumberText}>4</Text></View>
                      <Text style={styles.stepText}>
                        Nhấn nút <Text style={styles.boldText}>"Thêm"</Text> ở góc trên bên phải. Biểu tượng ứng dụng VKU Booking sẽ xuất hiện trên màn hình iPhone, khởi động toàn màn hình như ứng dụng gốc!
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'EXPO_GO' && (
              <View style={styles.tabPane}>
                <View style={styles.optionCardPrimary}>
                  <View style={styles.optionHeaderRow}>
                    <View style={styles.recommendBadge}>
                      <Text style={styles.recommendBadgeText}>CHẤM BÀI</Text>
                    </View>
                    <Text style={styles.optionTitle}>Trải Nghiệm Trực Tiếp Trên Expo Go</Text>
                  </View>
                  <Text style={styles.optionDesc}>
                    Dành cho Giảng viên & Sinh viên muốn xem mã nguồn thực thi tức thì trên thiết bị vật lý không cần cài APK:
                  </Text>

                  <View style={styles.stepList}>
                    <View style={styles.stepItem}>
                      <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                      <Text style={styles.stepText}>
                        Cài đặt ứng dụng <Text style={styles.boldText}>Expo Go</Text> miễn phí từ Google Play Store (Android) hoặc Apple App Store (iOS).
                      </Text>
                    </View>

                    <View style={styles.stepItem}>
                      <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                      <Text style={styles.stepText}>
                        Mở Expo Go, đăng nhập tài khoản Expo hoặc bấm nút bên dưới để mở dự án:
                      </Text>
                    </View>
                  </View>

                  <Pressable style={styles.btnPrimary} onPress={handleOpenExpoGo}>
                    <Text style={styles.btnPrimaryText}>⚡ Mở Dự Án Trên Expo Dashboard</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Close */}
          <View style={styles.footer}>
            <Pressable style={styles.footerCloseBtn} onPress={() => setInstallModalVisible(false)}>
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBadgeText: {
    fontSize: 22,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
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
    fontSize: 15,
    color: '#64748b',
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabItemActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#0284c7',
    fontWeight: '800',
  },
  contentBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tabPane: {
    gap: 16,
  },
  optionCardPrimary: {
    borderWidth: 1.5,
    borderColor: '#0284c7',
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#f0f9ff',
  },
  optionCardSecondary: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  optionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  recommendBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recommendBadgeText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  optionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  optionTitleSecondary: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  optionDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 14,
  },
  btnPrimary: {
    backgroundColor: '#0284c7',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
  btnSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#0284c7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    color: '#0284c7',
    fontSize: 13.5,
    fontWeight: '800',
  },
  optionHint: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 10,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  stepList: {
    gap: 12,
    marginVertical: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '800',
    color: '#0f172a',
  },
  codeText: {
    color: '#0284c7',
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
  },
  footerCloseBtn: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  footerCloseText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
});
