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

type InstallTab = 'ANDROID' | 'IOS';

const APK_DIRECT_URL =
  'https://expo.dev/artifacts/eas/RCy0mWfjmQN0ym6lH8qmL1PpNYsoY2rfRO5r2lxEYu0.apk';
const EAS_BUILD_URL =
  'https://expo.dev/accounts/thuong221332/projects/vku-room-booking/builds/56663180-6a06-4ae6-91e6-f991c7d8d73c';

export const InstallAppModal: React.FC = () => {
  const {
    installModalVisible,
    setInstallModalVisible,
    isAppInstalled,
    isStandaloneApp,
    markAppAsInstalled,
    resetAppInstallStatus,
  } = useBookingStore();

  const [activeTab, setActiveTab] = useState<InstallTab>('ANDROID');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [downloadingApk, setDownloadingApk] = useState<boolean>(false);
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
      };

      window.addEventListener('vku-install-prompt-ready', handlePromptReady);
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('vku-install-prompt-ready', handlePromptReady);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, [markAppAsInstalled]);

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

    // Automatically mark as installed just like in vku-field-survey
    markAppAsInstalled();
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
          markAppAsInstalled();
          setDeferredPrompt(null);
          if (typeof window !== 'undefined') {
            (window as any).__vkuDeferredPrompt = null;
          }
          setInstallModalVisible(false);
          return;
        }
      } catch (err) {
        console.warn('PWA prompt invocation error:', err);
      }
    }

    // If deferredPrompt is not available or rejected, show the inline guide and allow 1-click confirmation
    setShowChromeGuide(true);
  };

  const isInstalledView = isAppInstalled || isStandaloneApp;

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
                    : 'Cài Đặt & Vào Ứng Dụng'}
                </Text>
                <Text style={styles.modalSub}>
                  VKU Room Booking • Trải nghiệm ứng dụng di động độc lập
                </Text>
              </View>
            </View>
            <Pressable style={styles.modalCloseBtn} onPress={() => setInstallModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* ========================================================= */}
            {/* VIEW 1: KHI ĐÃ CÀI ĐẶT (TRẠNG THÁI "VÀO APP")            */}
            {/* ========================================================= */}
            {isInstalledView ? (
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

                <View style={styles.appInstructionBox}>
                  <Text style={styles.instructionHeading}>
                    📱 Cách mở ứng dụng toàn màn hình:
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
                        Ứng dụng sẽ mở lên chạy <Text style={styles.boldText}>toàn màn hình 100%</Text> (không có thanh địa chỉ trình duyệt, quét mã QR camera thật và lưu offline mượt mà).
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
                    }}
                  >
                    <Text style={styles.btnResetInstallText}>
                      🔄 Tôi chưa cài đặt / Chuyển lại trạng thái "Tải về"
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* ========================================================= */
              /* VIEW 2: KHI CHƯA CÀI ĐẶT (TRẠNG THÁI "TẢI VỀ / CÀI ĐẶT")  */
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
                    {/* Method 1: APK Download */}
                    <View style={[styles.installOptionCard, styles.installOptionCardHighlight]}>
                      <View style={styles.optionHeader}>
                        <View style={styles.optionBadge}>
                          <Text style={styles.optionBadgeText}>Khuyên dùng</Text>
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
                    </View>

                    {/* Method 2: PWA */}
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
                            onPress={() => {
                              markAppAsInstalled();
                              setInstallModalVisible(false);
                            }}
                          >
                            <Text style={styles.btnConfirmInstalledText}>
                              ✓ Tôi đã cài đặt xong!
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
                        onPress={() => {
                          markAppAsInstalled();
                          setInstallModalVisible(false);
                        }}
                      >
                        <Text style={styles.btnPrimaryActionText}>
                          ✓ Tôi đã thêm vào MH chính xong!
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '700',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  appViewBox: {
    gap: 16,
  },

  // INSTALLED VIEW STYLES
  appStatusBannerSuccess: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 12,
  },
  bannerIcon: {
    fontSize: 24,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065f46',
  },
  bannerText: {
    fontSize: 12.5,
    color: '#047857',
    marginTop: 2,
    lineHeight: 18,
  },
  appInstructionBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
  },
  instructionHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  appStepsList: {
    gap: 8,
  },
  stepItemRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  stepDot: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0284c7',
  },
  stepDesc: {
    flex: 1,
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '800',
    color: '#0f172a',
  },
  appActionButtons: {
    gap: 10,
  },
  btnApkDownload: {
    backgroundColor: '#0284c7',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnApkDownloadText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
  btnResetInstall: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnResetInstallText: {
    color: '#475569',
    fontSize: 12.5,
    fontWeight: '700',
  },

  // NOT INSTALLED VIEW STYLES
  appTabsHeader: {
    flexDirection: 'row',
    gap: 8,
  },
  appTabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  appTabBtnActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  appTabBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748b',
  },
  appTabBtnTextActive: {
    color: '#0284c7',
    fontWeight: '800',
  },
  installTabContent: {
    gap: 12,
  },
  installOptionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
  },
  installOptionCardHighlight: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
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
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  optionTitleSecondary: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  optionDesc: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  btnPrimaryAction: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryActionText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
  btnSecondaryAction: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#0284c7',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryActionText: {
    color: '#0284c7',
    fontSize: 13,
    fontWeight: '800',
  },
  chromeGuideWrap: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chromeGuideTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  chromeGuideText: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 8,
  },
  btnConfirmInstalled: {
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnConfirmInstalledText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  iosStepList: {
    gap: 8,
    marginVertical: 10,
  },
  iosStepItem: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  iosStepNum: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0284c7',
  },
  iosStepText: {
    flex: 1,
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
  },
  modalFooterBtn: {
    paddingVertical: 7,
    paddingHorizontal: 22,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  modalFooterBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748b',
  },
});
