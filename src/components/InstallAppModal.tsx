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
import { notificationService } from '../services/notificationService';

type InstallTab = 'ANDROID' | 'IOS';

const APK_DIRECT_URL =
  'https://github.com/thuong614oh65/vku-room-booking-expo/releases/download/v1.0.0/app-release.apk';
const EAS_BUILD_URL =
  'https://expo.dev/accounts/thuong221332/projects/vku-room-booking/builds/56663180-6a06-4ae6-91e6-f991c7d8d73c';

export const InstallAppModal: React.FC = () => {
  const {
    installModalVisible,
    setInstallModalVisible,
    setSysInfoModalVisible,
    isAppInstalled,
    isStandaloneApp,
    markAppAsInstalled,
    resetAppInstallStatus,
  } = useBookingStore();

  const [activeTab, setActiveTab] = useState<InstallTab>('ANDROID');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [downloadingApk, setDownloadingApk] = useState<boolean>(false);
  const [apkDownloaded, setApkDownloaded] = useState<boolean>(false);
  const [showChromeGuide, setShowChromeGuide] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Auto-detect device OS for default tab
      const ua = navigator.userAgent || '';
      if (/iphone|ipad|ipod/i.test(ua)) {
        setActiveTab('IOS');
      } else {
        setActiveTab('ANDROID');
      }

      // Check if global prompt is already captured
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
        markAppAsInstalled();
        setDeferredPrompt(null);
        if (typeof window !== 'undefined') {
          (window as any).__vkuDeferredPrompt = null;
        }
        setInstallModalVisible(false);
      };

      window.addEventListener('vku-install-prompt-ready', handlePromptReady);
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
      window.addEventListener('vku-app-installed', handleAppInstalled);

      return () => {
        window.removeEventListener('vku-install-prompt-ready', handlePromptReady);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
        window.removeEventListener('vku-app-installed', handleAppInstalled);
      };
    }
  }, [markAppAsInstalled, setInstallModalVisible]);

  if (!installModalVisible) return null;

  // Safe background file download
  const handleDownloadApk = () => {
    setDownloadingApk(true);
    setApkDownloaded(true);
    setTimeout(() => setDownloadingApk(false), 3000);

    notificationService.notify(
      '📥 Bắt đầu tải file APK',
      'Đang tải file VKU-RoomBooking.apk (78 MB) về máy của bạn...',
      'REMINDER'
    );

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const link = document.createElement('a');
      link.href = APK_DIRECT_URL;
      link.setAttribute('download', 'VKU-RoomBooking.apk');
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Linking.openURL(APK_DIRECT_URL).catch(() => Linking.openURL(EAS_BUILD_URL));
    }
  };

  // Launch standalone application window
  const handleLaunchApp = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const w = Math.min(window.screen.availWidth, 480);
      const h = Math.min(window.screen.availHeight, 920);
      const left = Math.max(0, Math.floor((window.screen.availWidth - w) / 2));
      const top = Math.max(0, Math.floor((window.screen.availHeight - h) / 2));
      window.open(
        window.location.href,
        'VKU_Room_Booking_App',
        `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
      );
    }
    notificationService.notify(
      '🚀 Đang khởi chạy ứng dụng',
      'Cửa sổ ứng dụng độc lập VKU Room Booking đang được mở...',
      'SUCCESS'
    );
    setInstallModalVisible(false);
  };

  // Trigger Chrome PWA Install
  const handleTriggerPwa = async () => {
    const prompt =
      deferredPrompt ||
      (typeof window !== 'undefined' ? (window as any).__vkuDeferredPrompt : null);

    if (prompt) {
      try {
        prompt.prompt();
        const choiceResult = await prompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          markAppAsInstalled();
          setDeferredPrompt(null);
          if (typeof window !== 'undefined') {
            (window as any).__vkuDeferredPrompt = null;
          }
          setInstallModalVisible(false);
          return;
        } else {
          setShowChromeGuide(true);
        }
      } catch (err) {
        console.warn('PWA prompt invocation error:', err);
        setShowChromeGuide(true);
      }
    } else {
      setShowChromeGuide(true);
    }
  };

  const handleConfirmInstalled = () => {
    markAppAsInstalled();
    setInstallModalVisible(false);
  };

  const handleReloadInApp = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
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
          {/* HEADER */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleGroup}>
              <Text style={styles.modalIcon}>
                {isStandaloneApp ? '📱' : isAppInstalled ? '🚀' : '📲'}
              </Text>
              <View>
                <Text style={styles.modalTitle}>
                  {isStandaloneApp
                    ? 'Ứng Dụng Độc Lập'
                    : isAppInstalled
                    ? 'Vào Ứng Dụng Đã Cài Đặt'
                    : 'Cài Đặt & Tải Ứng Dụng'}
                </Text>
                <Text style={styles.modalSub}>
                  {isStandaloneApp
                    ? 'VKU Room Booking • Standalone PWA Mode'
                    : isAppInstalled
                    ? 'Biểu tượng ứng dụng đã sẵn sàng trên thiết bị của bạn'
                    : 'Chọn phương thức cài đặt tối ưu cho thiết bị của bạn'}
                </Text>
              </View>
            </View>
            <Pressable style={styles.modalCloseBtn} onPress={() => setInstallModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* ========================================================= */}
            {/* TRƯỜNG HỢP 1: ĐANG CHẠY TRONG APP ĐỘC LẬP (STANDALONE)     */}
            {/* ========================================================= */}
            {isStandaloneApp ? (
              <View style={styles.appViewBox}>
                <View style={styles.appStatusBannerStandalone}>
                  <Text style={styles.bannerIcon}>🟢</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bannerTitle}>Bạn đang trong ứng dụng độc lập!</Text>
                    <Text style={styles.bannerText}>
                      Phiên bản Standalone PWA chạy toàn màn hình, hỗ trợ Offline-First và quét mã QR phòng học bằng camera thực tế.
                    </Text>
                  </View>
                </View>

                <View style={styles.standaloneFeaturesCard}>
                  <Text style={styles.featuresHeading}>⚡ Tính Năng Hoạt Động Trong Ứng Dụng:</Text>
                  <View style={styles.featureItemRow}>
                    <Text style={styles.featureDot}>✓</Text>
                    <Text style={styles.featureText}>Giao diện toàn màn hình, không thanh URL trình duyệt.</Text>
                  </View>
                  <View style={styles.featureItemRow}>
                    <Text style={styles.featureDot}>✓</Text>
                    <Text style={styles.featureText}>Quét mã QR camera thực tế sub-second không độ trễ.</Text>
                  </View>
                  <View style={styles.featureItemRow}>
                    <Text style={styles.featureDot}>✓</Text>
                    <Text style={styles.featureText}>Lưu trữ offline IndexedDB và đồng bộ tự động Firestore.</Text>
                  </View>
                </View>

                <View style={styles.appActionButtons}>
                  <Pressable style={styles.btnLaunchApp} onPress={handleReloadInApp}>
                    <Text style={styles.btnLaunchAppText}>🔄 Đồng Bộ / Làm Mới Dữ Liệu</Text>
                  </Pressable>

                  <Pressable
                    style={styles.btnSecondaryOutline}
                    onPress={() => {
                      setInstallModalVisible(false);
                      setSysInfoModalVisible(true);
                    }}
                  >
                    <Text style={styles.btnSecondaryOutlineText}>ℹ️ Xem Thông Số Three-Layer Architecture</Text>
                  </Pressable>

                  <Pressable style={styles.btnResetInstall} onPress={resetAppInstallStatus}>
                    <Text style={styles.btnResetInstallText}>
                      🔄 Đặt lại trạng thái ban đầu ("Cài Đặt App")
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : isAppInstalled ? (
              /* ========================================================= */
              /* TRƯỜNG HỢP 2: ĐÃ CÀI ĐẶT NHƯNG ĐANG MỞ TRÊN TRÌNH DUYỆT   */
              /* ========================================================= */
              <View style={styles.appViewBox}>
                <View style={styles.appStatusBannerSuccess}>
                  <Text style={styles.bannerIcon}>🎉</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bannerTitle}>
                      Bạn đã cài đặt ứng dụng VKU Room Booking!
                    </Text>
                    <Text style={styles.bannerText}>
                      Biểu tượng ứng dụng đã sẵn sàng trên màn hình chính thiết bị của bạn.
                    </Text>
                  </View>
                </View>

                {/* NÚT HÀNH ĐỘNG CHÍNH ĐỂ VÀO APP NGAY */}
                <View style={styles.launchHeroCard}>
                  <Text style={styles.launchHeroTitle}>🚀 KHỞI ĐỘNG ỨNG DỤNG NGAY</Text>
                  <Pressable style={styles.btnLaunchApp} onPress={handleLaunchApp}>
                    <Text style={styles.btnLaunchAppText}>
                      🚀 MỞ CỬA SỔ APP ĐỘC LẬP (STANDALONE)
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.btnContinueInBrowser}
                    onPress={() => setInstallModalVisible(false)}
                  >
                    <Text style={styles.btnContinueInBrowserText}>
                      ✨ Tiếp tục tra cứu ngay trên trình duyệt này
                    </Text>
                  </Pressable>
                </View>

                {/* Hướng dẫn mở trên điện thoại */}
                <View style={styles.appInstructionBox}>
                  <Text style={styles.instructionHeading}>
                    📱 Cách mở ứng dụng toàn màn hình trên điện thoại:
                  </Text>
                  <View style={styles.appStepsList}>
                    <View style={styles.stepItemRow}>
                      <Text style={styles.stepDot}>1.</Text>
                      <Text style={styles.stepDesc}>
                        Thoát ra <Text style={styles.boldText}>Màn hình chính (Home Screen)</Text> của điện thoại.
                      </Text>
                    </View>
                    <View style={styles.stepItemRow}>
                      <Text style={styles.stepDot}>2.</Text>
                      <Text style={styles.stepDesc}>
                        Tìm và bấm vào biểu tượng ứng dụng <Text style={styles.boldText}>VKU Room Booking</Text>.
                      </Text>
                    </View>
                    <View style={styles.stepItemRow}>
                      <Text style={styles.stepDot}>3.</Text>
                      <Text style={styles.stepDesc}>
                        Ứng dụng sẽ mở lên chạy <Text style={styles.boldText}>toàn màn hình 100%</Text> (không có thanh địa chỉ, quét mã QR camera thật và lưu offline mượt mà).
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.appActionButtons}>
                  <Pressable style={styles.btnApkDownload} onPress={handleDownloadApk}>
                    <Text style={styles.btnApkDownloadText}>
                      {downloadingApk ? '⏳ Đang Tải APK...' : '🤖 Tải lại File APK mới nhất (Android)'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.btnResetInstall}
                    onPress={() => {
                      resetAppInstallStatus();
                      setShowChromeGuide(false);
                      setApkDownloaded(false);
                    }}
                  >
                    <Text style={styles.btnResetInstallText}>
                      🔄 Tôi chưa cài đặt / Chuyển lại trạng thái "Cài Đặt App"
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* ========================================================= */
              /* TRƯỜNG HỢP 3: CHƯA CÀI ĐẶT (TRẠNG THÁI "CÀI ĐẶT & TẢI VỀ") */
              /* ========================================================= */
              <View style={styles.appViewBox}>
                {/* Platform Tabs Header */}
                <View style={styles.appTabsHeader}>
                  <Pressable
                    style={[
                      styles.appTabBtn,
                      activeTab === 'ANDROID' && styles.appTabBtnActive,
                    ]}
                    onPress={() => {
                      setActiveTab('ANDROID');
                      setShowChromeGuide(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.appTabBtnText,
                        activeTab === 'ANDROID' && styles.appTabBtnTextActive,
                      ]}
                    >
                      🤖 Dành Cho Android
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.appTabBtn,
                      activeTab === 'IOS' && styles.appTabBtnActive,
                    ]}
                    onPress={() => {
                      setActiveTab('IOS');
                      setShowChromeGuide(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.appTabBtnText,
                        activeTab === 'IOS' && styles.appTabBtnTextActive,
                      ]}
                    >
                      🍏 Dành Cho iPhone (iOS)
                    </Text>
                  </Pressable>
                </View>

                {/* TAB ANDROID */}
                {activeTab === 'ANDROID' && (
                  <View style={styles.installTabContent}>
                    {/* Cách 1: Tải File APK Gốc */}
                    <View style={[styles.installOptionCard, styles.installOptionCardHighlight]}>
                      <View style={styles.optionHeader}>
                        <View style={styles.optionBadge}>
                          <Text style={styles.optionBadgeText}>Khuyên dùng cho Android</Text>
                        </View>
                        <Text style={styles.optionTitle}>Cách 1: Tải File APK Gốc Về Cài Đặt</Text>
                      </View>
                      <Text style={styles.optionDesc}>
                        Tải trực tiếp tệp tin cài đặt Native Android APK về máy điện thoại của bạn:
                      </Text>
                      <Pressable
                        style={[styles.btnPrimaryAction, downloadingApk && { opacity: 0.8 }]}
                        onPress={handleDownloadApk}
                      >
                        <Text style={styles.btnPrimaryActionText}>
                          {downloadingApk ? '⏳ Đang Tải Về...' : '⬇️ Tải File VKU-RoomBooking.apk (~78 MB)'}
                        </Text>
                      </Pressable>

                      {apkDownloaded && (
                        <View style={styles.apkInstallStepsCard}>
                          <Text style={styles.apkInstallStepsTitle}>
                            📋 Các bước tiếp theo trên điện thoại:
                          </Text>
                          <Text style={styles.apkStepText}>
                            1. Bấm mở file <Text style={styles.boldText}>app-release.apk</Text> vừa tải về trong mục Tải về / Thông báo.
                          </Text>
                          <Text style={styles.apkStepText}>
                            2. Cho phép cài đặt ứng dụng từ nguồn này nếu được hỏi.
                          </Text>
                          <Text style={styles.apkStepText}>
                            3. Bấm <Text style={styles.boldText}>Cài đặt (Install)</Text> để hoàn tất.
                          </Text>
                          <Pressable
                            style={styles.btnConfirmInstalled}
                            onPress={handleConfirmInstalled}
                          >
                            <Text style={styles.btnConfirmInstalledText}>
                              ✓ Tôi đã cài xong file APK ➔ Chuyển sang "🚀 Vào App"
                            </Text>
                          </Pressable>
                        </View>
                      )}
                    </View>

                    {/* Cách 2: PWA qua Chrome */}
                    <View style={styles.installOptionCard}>
                      <Text style={styles.optionTitleSecondary}>
                        Cách 2: Cài Đặt Trực Tiếp Qua Trình Duyệt Chrome
                      </Text>
                      <Text style={styles.optionDesc}>
                        Thêm ứng dụng vào màn hình chính thông qua công nghệ PWA Standalone:
                      </Text>
                      <Pressable style={styles.btnSecondaryAction} onPress={handleTriggerPwa}>
                        <Text style={styles.btnSecondaryActionText}>
                          📲 Bấm Vào Đây Để Cài Đặt Ngay
                        </Text>
                      </Pressable>

                      {showChromeGuide && (
                        <View style={styles.chromeGuideWrap}>
                          <Text style={styles.chromeGuideTitle}>
                            📱 HƯỚNG DẪN CÀI ĐẶT TRÊN CHROME:
                          </Text>
                          <Text style={styles.chromeGuideText}>
                            Nhấn vào biểu tượng 3 chấm (<Text style={styles.boldText}>⋮</Text>) ở góc trên bên phải trình duyệt ➔ Chọn <Text style={styles.boldText}>"Cài đặt ứng dụng"</Text> (hoặc <Text style={styles.boldText}>"Thêm vào màn hình chính"</Text>).
                          </Text>
                          <Pressable
                            style={styles.btnConfirmInstalled}
                            onPress={handleConfirmInstalled}
                          >
                            <Text style={styles.btnConfirmInstalledText}>
                              ✓ Tôi đã cài đặt xong ➔ Chuyển sang "🚀 Vào App"
                            </Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* TAB IPHONE */}
                {activeTab === 'IOS' && (
                  <View style={styles.installTabContent}>
                    <View style={[styles.installOptionCard, styles.installOptionCardHighlight]}>
                      <Text style={styles.optionTitle}>
                        Cài Đặt Lên iPhone Miễn Phí 100% (3 Bước):
                      </Text>
                      <View style={styles.iosStepList}>
                        <View style={styles.iosStepItem}>
                          <Text style={styles.iosStepNum}>1.</Text>
                          <Text style={styles.iosStepText}>
                            Mở liên kết này bằng trình duyệt <Text style={styles.boldText}>Safari</Text> trên iPhone.
                          </Text>
                        </View>
                        <View style={styles.iosStepItem}>
                          <Text style={styles.iosStepNum}>2.</Text>
                          <Text style={styles.iosStepText}>
                            Bấm nút <Text style={styles.boldText}>Chia sẻ</Text> (biểu tượng ô vuông có mũi tên trỏ lên <Text style={styles.boldText}>⬆️</Text>) ở thanh dưới cùng Safari.
                          </Text>
                        </View>
                        <View style={styles.iosStepItem}>
                          <Text style={styles.iosStepNum}>3.</Text>
                          <Text style={styles.iosStepText}>
                            Cuộn xuống chọn <Text style={styles.boldText}>"Thêm vào MH chính"</Text> (Add to Home Screen ➕) rồi bấm <Text style={styles.boldText}>Thêm</Text>.
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        style={styles.btnPrimaryAction}
                        onPress={handleConfirmInstalled}
                      >
                        <Text style={styles.btnPrimaryActionText}>
                          ✓ Tôi đã thêm vào MH chính ➔ Chuyển sang "🚀 Vào App"
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* FOOTER */}
          <View style={styles.modalFooter}>
            <Pressable
              style={styles.modalFooterBtn}
              onPress={() => setInstallModalVisible(false)}
            >
              <Text style={styles.modalFooterBtnText}>Đóng Cửa Sổ</Text>
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
    maxWidth: 520,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    gap: 12,
  },
  modalIcon: {
    fontSize: 26,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  appViewBox: {
    gap: 16,
  },
  appStatusBannerSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  appStatusBannerStandalone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#6ee7b7',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  bannerIcon: {
    fontSize: 26,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
  },
  bannerText: {
    fontSize: 12,
    color: '#15803d',
    marginTop: 2,
    lineHeight: 18,
  },
  launchHeroCard: {
    backgroundColor: '#fdf4ff',
    borderWidth: 2,
    borderColor: '#c084fc',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    alignItems: 'center',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  launchHeroTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7e22ce',
    letterSpacing: 0.5,
  },
  btnLaunchApp: {
    width: '100%',
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  btnLaunchAppText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  btnContinueInBrowser: {
    paddingVertical: 6,
  },
  btnContinueInBrowserText: {
    color: '#6b21a8',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  standaloneFeaturesCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  featuresHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  featureItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureDot: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16a34a',
  },
  featureText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    flex: 1,
  },
  appInstructionBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
  },
  instructionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  appStepsList: {
    gap: 8,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepDot: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284c7',
  },
  stepDesc: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  appActionButtons: {
    gap: 10,
    marginTop: 4,
  },
  btnApkDownload: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnApkDownloadText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  btnSecondaryOutline: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnSecondaryOutlineText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  btnResetInstall: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnResetInstallText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  appTabsHeader: {
    flexDirection: 'row',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10,
  },
  appTabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  appTabBtnActive: {
    backgroundColor: '#0284c7',
  },
  appTabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  appTabBtnTextActive: {
    color: '#ffffff',
  },
  installTabContent: {
    gap: 14,
    marginTop: 4,
  },
  installOptionCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  installOptionCardHighlight: {
    borderColor: '#38bdf8',
    backgroundColor: '#f0f9ff',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  optionBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0369a1',
  },
  optionTitleSecondary: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  optionDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  btnPrimaryAction: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  btnPrimaryActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  btnSecondaryAction: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  btnSecondaryActionText: {
    color: '#0284c7',
    fontSize: 13,
    fontWeight: '800',
  },
  apkInstallStepsCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    padding: 12,
    gap: 6,
    marginTop: 8,
  },
  apkInstallStepsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369a1',
    marginBottom: 2,
  },
  apkStepText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  chromeGuideWrap: {
    backgroundColor: '#fefce8',
    borderWidth: 1,
    borderColor: '#fde047',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  chromeGuideTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#854d0e',
  },
  chromeGuideText: {
    fontSize: 12,
    color: '#713f12',
    lineHeight: 18,
  },
  btnConfirmInstalled: {
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  btnConfirmInstalledText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  iosStepList: {
    gap: 8,
    marginTop: 4,
  },
  iosStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  iosStepNum: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284c7',
  },
  iosStepText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    flex: 1,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'flex-end',
  },
  modalFooterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  modalFooterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
});
