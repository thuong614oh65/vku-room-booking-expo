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
  Image,
} from 'react-native';
import { useBookingStore } from '../store/useBookingStore';

type InstallTab = 'ANDROID' | 'IOS' | 'EXPO_GO';

const APK_DIRECT_URL = 'https://expo.dev/artifacts/eas/RCy0mWfjmQN0ym6lH8qmL1PpNYsoY2rfRO5r2lxEYu0.apk';
const EAS_BUILD_URL = 'https://expo.dev/accounts/thuong221332/projects/vku-room-booking/builds/56663180-6a06-4ae6-91e6-f991c7d8d73c';
const EXPO_GO_URL = 'exp://u.expo.dev/4d0aa5e3-181e-4e0f-ae53-a6ec7f303edb';
const EXPO_DASHBOARD_URL = 'https://expo.dev/accounts/thuong221332/projects/vku-room-booking';

export const InstallAppModal: React.FC = () => {
  const { installModalVisible, setInstallModalVisible } = useBookingStore();
  const [activeTab, setActiveTab] = useState<InstallTab>('ANDROID');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [pwaInstalled, setPwaInstalled] = useState<boolean>(false);
  const [downloadingApk, setDownloadingApk] = useState<boolean>(false);
  const [showBrowserGuide, setShowBrowserGuide] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Auto-detect device OS
      const ua = navigator.userAgent || '';
      if (/iphone|ipad|ipod/i.test(ua)) {
        setActiveTab('IOS');
      } else {
        setActiveTab('ANDROID');
      }

      // Check if already captured in global window
      if ((window as any).__vkuDeferredPrompt) {
        setDeferredPrompt((window as any).__vkuDeferredPrompt);
      }

      const handlePromptReady = () => {
        if ((window as any).__vkuDeferredPrompt) {
          setDeferredPrompt((window as any).__vkuDeferredPrompt);
        }
      };

      const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        (window as any).__vkuDeferredPrompt = e;
        setDeferredPrompt(e);
      };

      const handleAppInstalled = () => {
        setPwaInstalled(true);
        setDeferredPrompt(null);
        if (typeof window !== 'undefined') {
          (window as any).__vkuDeferredPrompt = null;
        }
      };

      window.addEventListener('vku-install-prompt-ready', handlePromptReady);
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      // Check if already in standalone display mode
      if (
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true
      ) {
        setPwaInstalled(true);
      }

      return () => {
        window.removeEventListener('vku-install-prompt-ready', handlePromptReady);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  if (!installModalVisible) return null;

  const handleDownloadApk = () => {
    setDownloadingApk(true);
    setTimeout(() => setDownloadingApk(false), 3000);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const a = document.createElement('a');
      a.href = APK_DIRECT_URL;
      a.download = 'VKU-RoomBooking.apk';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      Linking.openURL(APK_DIRECT_URL).catch(() => Linking.openURL(EAS_BUILD_URL));
    }
  };

  const handleTriggerPwa = async () => {
    const prompt =
      deferredPrompt ||
      (typeof window !== 'undefined' ? (window as any).__vkuDeferredPrompt : null);

    if (prompt) {
      try {
        prompt.prompt();
        const choiceResult = await prompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setPwaInstalled(true);
          setDeferredPrompt(null);
          if (typeof window !== 'undefined') {
            (window as any).__vkuDeferredPrompt = null;
          }
        }
      } catch (err) {
        console.warn('PWA prompt invocation error:', err);
        setShowBrowserGuide(true);
      }
    } else {
      // In modern UX, never show browser alert(); instead toggle the rich interactive guide card
      setShowBrowserGuide(true);
    }
  };

  const handleOpenExpoGo = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(EXPO_DASHBOARD_URL, '_blank');
    } else {
      Linking.openURL(EXPO_GO_URL).catch(() => Linking.openURL(EXPO_DASHBOARD_URL));
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
                <Text style={styles.title}>Cài Đặt Ứng Dụng</Text>
                <Text style={styles.subtitle}>VKU Room Booking • Bản Di Động Độc Lập</Text>
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
              onPress={() => {
                setActiveTab('ANDROID');
                setShowBrowserGuide(false);
              }}
            >
              <Text style={[styles.tabText, activeTab === 'ANDROID' && styles.tabTextActive]}>
                🤖 Android (APK & PWA)
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabItem, activeTab === 'IOS' && styles.tabItemActive]}
              onPress={() => {
                setActiveTab('IOS');
                setShowBrowserGuide(false);
              }}
            >
              <Text style={[styles.tabText, activeTab === 'IOS' && styles.tabTextActive]}>
                🍏 iPhone (iOS Safari)
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabItem, activeTab === 'EXPO_GO' && styles.tabItemActive]}
              onPress={() => {
                setActiveTab('EXPO_GO');
                setShowBrowserGuide(false);
              }}
            >
              <Text style={[styles.tabText, activeTab === 'EXPO_GO' && styles.tabTextActive]}>
                ⚡ Expo Go & QR
              </Text>
            </Pressable>
          </View>

          {/* Tab Content */}
          <ScrollView style={styles.contentBody} showsVerticalScrollIndicator={false}>
            {/* ANDROID TAB */}
            {activeTab === 'ANDROID' && (
              <View style={styles.tabPane}>
                {pwaInstalled && (
                  <View style={styles.installedBanner}>
                    <Text style={styles.installedBannerIcon}>✅</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.installedBannerTitle}>Đã Cài Đặt Thành Công!</Text>
                      <Text style={styles.installedBannerText}>
                        Ứng dụng VKU Booking đã có mặt trên màn hình chính của bạn.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Option 1: Direct Real APK */}
                <View style={styles.optionCardPrimary}>
                  <View style={styles.optionHeaderRow}>
                    <View style={styles.recommendBadge}>
                      <Text style={styles.recommendBadgeText}>CHÍNH THỨC • FILE GỐC</Text>
                    </View>
                    <Text style={styles.optionTitle}>Cách 1: Tải Trực Tiếp File Native APK</Text>
                  </View>

                  <Text style={styles.optionDesc}>
                    Cài đặt trực tiếp gói cài đặt ứng dụng Android gốc (EAS Production APK build). Chạy mượt mà, đầy đủ tính năng rung, quét mã camera và ngoại tuyến.
                  </Text>

                  <Pressable
                    style={[styles.btnPrimary, downloadingApk && styles.btnPrimaryLoading]}
                    onPress={handleDownloadApk}
                  >
                    <Text style={styles.btnPrimaryText}>
                      {downloadingApk ? '⏳ Đang Bắt Đầu Tải...' : '⬇️ Tải File VKU-RoomBooking.apk (~78 MB)'}
                    </Text>
                  </Pressable>

                  <View style={styles.buildInfoRow}>
                    <Text style={styles.buildInfoText}>📦 Phiên bản: v1.0.0 (Release Build)</Text>
                    <Pressable onPress={() => Linking.openURL(EAS_BUILD_URL)}>
                      <Text style={styles.buildInfoLink}>Chi tiết build Expo EAS ↗</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.optionHint}>
                    💡 Lưu ý: Khi mở tệp APK vừa tải về, chọn "Vẫn cài đặt" (Install anyway) nếu điện thoại hỏi xác nhận ứng dụng nội bộ trường VKU.
                  </Text>
                </View>

                {/* Option 2: 1-Tap PWA Standalone */}
                <View style={styles.optionCardSecondary}>
                  <View style={styles.optionHeaderRow}>
                    <View style={[styles.recommendBadge, { backgroundColor: '#10b981' }]}>
                      <Text style={styles.recommendBadgeText}>1 CHẠM • TIẾT KIỆM BỘ NHỚ</Text>
                    </View>
                    <Text style={styles.optionTitleSecondary}>
                      Cách 2: Cài Đặt Trực Tiếp Qua Trình Duyệt (PWA)
                    </Text>
                  </View>

                  <Text style={styles.optionDesc}>
                    Khởi chạy độc lập không có thanh địa chỉ duyệt web, tự động đồng bộ thời gian thực và cập nhật tức thì không cần tải lại:
                  </Text>

                  <Pressable
                    style={[
                      styles.btnSecondary,
                      Boolean(deferredPrompt || (typeof window !== 'undefined' && (window as any).__vkuDeferredPrompt)) &&
                        styles.btnSecondaryHighlighted,
                    ]}
                    onPress={handleTriggerPwa}
                  >
                    <Text style={styles.btnSecondaryText}>
                      {pwaInstalled
                        ? '✅ Đã Cài Đặt Trên Thiết Bị Này'
                        : Boolean(deferredPrompt || (typeof window !== 'undefined' && (window as any).__vkuDeferredPrompt))
                        ? '📲 Bấm Cài Đặt Ngay (1 Chạm)'
                        : '📲 Kích Hoạt Cài Đặt Màn Hình Chính'}
                    </Text>
                  </Pressable>

                  {/* Sleek in-modal browser guide when prompt not yet auto-shown */}
                  {showBrowserGuide && !pwaInstalled && (
                    <View style={styles.browserGuideBox}>
                      <Text style={styles.browserGuideTitle}>💡 Hướng dẫn nhanh cho trình duyệt:</Text>
                      <View style={styles.guideStepRow}>
                        <Text style={styles.guideStepNumber}>1.</Text>
                        <Text style={styles.guideStepText}>
                          <Text style={styles.boldText}>Trên Điện Thoại Android:</Text> Bấm vào menu 3 chấm (<Text style={styles.boldText}>⋮</Text>) ở góc trên trình duyệt Chrome ➔ Chọn <Text style={styles.boldText}>"Cài đặt ứng dụng"</Text> hoặc <Text style={styles.boldText}>"Thêm vào màn hình chính"</Text>.
                        </Text>
                      </View>
                      <View style={styles.guideStepRow}>
                        <Text style={styles.guideStepNumber}>2.</Text>
                        <Text style={styles.guideStepText}>
                          <Text style={styles.boldText}>Trên Máy Tính Chrome / Edge:</Text> Nhìn lên thanh nhập địa chỉ URL ở trên cùng, nhấp vào biểu tượng máy tính <Text style={styles.boldText}>[🖥️ ⬇️]</Text> ở phía bên phải để cài đặt vào máy tính.
                        </Text>
                      </View>
                      <View style={styles.guideStepRow}>
                        <Text style={styles.guideStepNumber}>3.</Text>
                        <Text style={styles.guideStepText}>
                          Hoặc sử dụng ngay <Text style={styles.boldText}>Cách 1 ở trên</Text> để tải tệp tin Native APK chính thức!
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* IOS TAB */}
            {activeTab === 'IOS' && (
              <View style={styles.tabPane}>
                <View style={styles.optionCardSecondary}>
                  <View style={styles.optionHeaderRow}>
                    <View style={[styles.recommendBadge, { backgroundColor: '#0284c7' }]}>
                      <Text style={styles.recommendBadgeText}>SAFARI PWA</Text>
                    </View>
                    <Text style={styles.optionTitleSecondary}>
                      Cài Đặt Trực Tiếp Trên iPhone & iPad
                    </Text>
                  </View>

                  <Text style={styles.optionDesc}>
                    Hệ điều hành iOS hỗ trợ cài đặt ứng dụng web nguyên bản thành ứng dụng độc lập trên màn hình chính (Home Screen) qua Safari theo 4 bước:
                  </Text>

                  <View style={styles.stepList}>
                    <View style={styles.stepItem}>
                      <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                      <Text style={styles.stepText}>
                        Mở bằng trình duyệt <Text style={styles.boldText}>Safari</Text> trên iPhone: <Text style={styles.codeText}>https://vku-room-booking-17t.pages.dev</Text>
                      </Text>
                    </View>

                    <View style={styles.stepItem}>
                      <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                      <Text style={styles.stepText}>
                        Bấm vào nút <Text style={styles.boldText}>Chia sẻ</Text> (biểu tượng hình vuông có mũi tên trỏ lên <Text style={styles.boldText}>📤</Text> ở thanh công cụ dưới đáy Safari).
                      </Text>
                    </View>

                    <View style={styles.stepItem}>
                      <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                      <Text style={styles.stepText}>
                        Cuộn xuống danh sách tác vụ và chọn dòng <Text style={styles.boldText}>"Thêm vào MH chính"</Text> (Add to Home Screen ➕).
                      </Text>
                    </View>

                    <View style={styles.stepItem}>
                      <View style={styles.stepNumber}><Text style={styles.stepNumberText}>4</Text></View>
                      <Text style={styles.stepText}>
                        Nhấn nút <Text style={styles.boldText}>"Thêm"</Text> (Add) ở góc trên bên phải. Biểu tượng <Text style={styles.boldText}>VKU Booking</Text> sẽ lập tức hiển thị trên màn hình iPhone và hoạt động toàn màn hình!
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* EXPO GO TAB */}
            {activeTab === 'EXPO_GO' && (
              <View style={styles.tabPane}>
                <View style={styles.optionCardPrimary}>
                  <View style={styles.optionHeaderRow}>
                    <View style={[styles.recommendBadge, { backgroundColor: '#8b5cf6' }]}>
                      <Text style={styles.recommendBadgeText}>GIẢNG VIÊN • TESTER</Text>
                    </View>
                    <Text style={styles.optionTitle}>Chạy Trực Tiếp Qua Expo Go</Text>
                  </View>

                  <Text style={styles.optionDesc}>
                    Quét mã QR dưới đây bằng camera điện thoại hoặc ứng dụng Expo Go để chạy trực tiếp ứng dụng với mã nguồn gốc:
                  </Text>

                  <View style={styles.qrContainer}>
                    <Image
                      source={{
                        uri: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=exp%3A%2F%2Fu.expo.dev%2F4d0aa5e3-181e-4e0f-ae53-a6ec7f303edb',
                      }}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.qrLabel}>Quét bằng ứng dụng Expo Go (Android & iOS)</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
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
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center',
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
  installedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  installedBannerIcon: {
    fontSize: 22,
  },
  installedBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065f46',
  },
  installedBannerText: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
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
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  optionTitleSecondary: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  optionDesc: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  btnPrimary: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
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
  btnPrimaryLoading: {
    backgroundColor: '#0369a1',
    opacity: 0.8,
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
  btnSecondaryHighlighted: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  btnSecondaryText: {
    color: '#0284c7',
    fontSize: 13,
    fontWeight: '800',
  },
  buildInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#bae6fd',
    flexWrap: 'wrap',
    gap: 6,
  },
  buildInfoText: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: '600',
  },
  buildInfoLink: {
    fontSize: 11,
    color: '#0284c7',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  optionHint: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 8,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  browserGuideBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  browserGuideTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1e293b',
  },
  guideStepRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  guideStepNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284c7',
  },
  guideStepText: {
    flex: 1,
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 16,
  },
  stepList: {
    gap: 12,
    marginVertical: 8,
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
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  boldText: {
    fontWeight: '800',
    color: '#0f172a',
  },
  codeText: {
    color: '#0284c7',
    fontWeight: '700',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qrImage: {
    width: 160,
    height: 160,
    borderRadius: 8,
  },
  qrLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 8,
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
