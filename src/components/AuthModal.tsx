import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useBookingStore } from '../store/useBookingStore';
import {
  evaluatePasswordStrength,
  verifyPassword,
} from '../services/authSecurityService';
import {
  GOOGLE_G_SVG,
  GOOGLE_WORDMARK_SVG,
  openRealGooglePopupWindow,
} from '../services/googleOAuthPopupService';

type AuthViewMode = 'LOGIN' | 'REGISTER' | 'GOOGLE_OAUTH';
type GoogleStep = 'CHOOSE_ACCOUNT' | 'ENTER_EMAIL' | 'ENTER_PASSWORD';

const GoogleGIcon: React.FC = () => {
  if (Platform.OS === 'web') {
    return React.createElement('div', {
      style: {
        width: 20,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
      },
      dangerouslySetInnerHTML: { __html: GOOGLE_G_SVG },
    });
  }
  return (
    <View style={styles.googleFourColorLogo}>
      <Text style={styles.googleFourColorG}>G</Text>
    </View>
  );
};

const GoogleWordmarkLogo: React.FC = () => {
  if (Platform.OS === 'web') {
    return React.createElement('div', {
      style: { display: 'flex', justifyContent: 'center', marginBottom: 14 },
      dangerouslySetInnerHTML: { __html: GOOGLE_WORDMARK_SVG },
    });
  }
  return (
    <View style={styles.googleWordmarkRow}>
      <Text style={[styles.googleLetter, { color: '#4285F4' }]}>G</Text>
      <Text style={[styles.googleLetter, { color: '#EA4335' }]}>o</Text>
      <Text style={[styles.googleLetter, { color: '#FBBC05' }]}>o</Text>
      <Text style={[styles.googleLetter, { color: '#4285F4' }]}>g</Text>
      <Text style={[styles.googleLetter, { color: '#34A853' }]}>l</Text>
      <Text style={[styles.googleLetter, { color: '#EA4335' }]}>e</Text>
    </View>
  );
};

export const AuthModal: React.FC = () => {
  const {
    authModalVisible,
    setAuthModalVisible,
    login,
    loginWithGoogle,
    register,
    availableUsers,
  } = useBookingStore();

  const [mode, setMode] = useState<AuthViewMode>('LOGIN');

  // Standard Login states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Standard Register states
  const [regName, setRegName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMajor, setRegMajor] = useState('Kỹ Thuật Phần Mềm (Lớp 23SE4)');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Fallback In-App Google OAuth 2.0 states (if popup blocked or on mobile native)
  const [googleStep, setGoogleStep] = useState<GoogleStep>('CHOOSE_ACCOUNT');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [googleSelectedName, setGoogleSelectedName] = useState('');
  const [showGooglePass, setShowGooglePass] = useState(false);
  const [isGoogleVerifying, setIsGoogleVerifying] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const registerStrength = useMemo(
    () => evaluatePasswordStrength(regPassword),
    [regPassword]
  );

  const resetForm = () => {
    setErrorMsg('');
    setGoogleError('');
    setIdentifier('');
    setPassword('');
    setShowPassword(false);
    setRegName('');
    setRegStudentId('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');
    setShowRegPassword(false);
    setGoogleStep('CHOOSE_ACCOUNT');
    setGoogleEmail('');
    setGooglePassword('');
    setGoogleSelectedName('');
    setShowGooglePass(false);
    setIsGoogleVerifying(false);
  };

  const handleClose = () => {
    resetForm();
    setMode('LOGIN');
    setAuthModalVisible(false);
  };

  const openGoogleOAuth = () => {
    setErrorMsg('');
    setGoogleError('');

    // Trên trình duyệt Web: Mở Cửa sổ Popup Google OAuth 2.0 thật (window.open)
    if (Platform.OS === 'web') {
      const opened = openRealGooglePopupWindow(
        availableUsers,
        ({ email, password: gPass, name }) => {
          loginWithGoogle(email, gPass, name);
          resetForm();
          setMode('LOGIN');
        }
      );
      if (opened) {
        return;
      }
    }

    // Fallback trên điện thoại hoặc khi chặn popup
    setGoogleStep('CHOOSE_ACCOUNT');
    setMode('GOOGLE_OAUTH');
  };

  const handleSelectSavedGoogleAccount = (email: string, name: string) => {
    setGoogleError('');
    setGoogleEmail(email);
    setGoogleSelectedName(name);
    setGooglePassword('');
    setGoogleStep('ENTER_PASSWORD');
  };

  const handleGoogleEmailNext = () => {
    setGoogleError('');
    const clean = googleEmail.trim().toLowerCase();
    if (!clean || clean.length < 3) {
      setGoogleError('Hãy nhập email hoặc số điện thoại.');
      return;
    }
    const finalEmail = clean.includes('@') ? clean : `${clean}@vku.udn.vn`;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(finalEmail)) {
      setGoogleError('Không tìm thấy Tài khoản Google của bạn.');
      return;
    }

    setGoogleEmail(finalEmail);
    const existing = availableUsers.find(
      (u) => u.email.toLowerCase() === finalEmail
    );
    setGoogleSelectedName(existing ? existing.name : '');
    setGoogleStep('ENTER_PASSWORD');
  };

  const handleGooglePasswordSubmit = () => {
    setGoogleError('');
    if (!googlePassword || googlePassword.trim().length < 1) {
      setGoogleError('Hãy nhập mật khẩu.');
      return;
    }

    const cleanEmail = googleEmail.trim().toLowerCase();

    setIsGoogleVerifying(true);
    setTimeout(() => {
      setIsGoogleVerifying(false);
      const res = loginWithGoogle(
        cleanEmail,
        googlePassword,
        googleSelectedName || undefined
      );
      if (!res.success) {
        setGoogleError(res.message);
      } else {
        resetForm();
        setMode('LOGIN');
      }
    }, 450);
  };

  const handleLogin = () => {
    setErrorMsg('');
    if (!identifier.trim()) {
      setErrorMsg('Vui lòng nhập Mã sinh viên (MSSV) hoặc Email VKU.');
      return;
    }
    if (!password) {
      setErrorMsg('Vui lòng nhập mật khẩu của bạn.');
      return;
    }
    const res = login(identifier, password);
    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      resetForm();
    }
  };

  const handleRegister = () => {
    setErrorMsg('');
    if (!regName.trim() || !regStudentId.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Họ và tên và Mã số sinh viên (MSSV).');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
      return;
    }
    const res = register(
      regName,
      regStudentId,
      regEmail ||
        `${regStudentId.trim().toLowerCase().replace('.', '')}@vku.udn.vn`,
      regMajor || 'Kỹ Thuật Phần Mềm (Lớp 23SE4)',
      regPassword
    );
    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      resetForm();
    }
  };

  return (
    <Modal
      visible={authModalVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {mode === 'GOOGLE_OAUTH' ? (
          /* ═══════════════════════════════════════════════════════════════════
           * GIAO DIỆN GOOGLE SIGN-IN CHUẨN 1:1 (accounts.google.com)
           * ═══════════════════════════════════════════════════════════════════ */
          <View style={styles.googleModalCard}>
            <View style={styles.googleSubHeader}>
              <GoogleGIcon />
              <Text style={styles.googleSubHeaderText}>Đăng nhập bằng Google</Text>
              <Pressable onPress={() => setMode('LOGIN')} style={styles.googleCloseBtn}>
                <Text style={styles.googleCloseText}>✕</Text>
              </Pressable>
            </View>

            {isGoogleVerifying && (
              <View style={styles.googleLoadingBar}>
                <ActivityIndicator size="small" color="#1a73e8" />
              </View>
            )}

            <ScrollView style={styles.googleBody} showsVerticalScrollIndicator={false}>
              <GoogleWordmarkLogo />

              {googleStep === 'CHOOSE_ACCOUNT' && (
                <View>
                  <Text style={styles.googleMainTitle}>Chọn một tài khoản</Text>
                  <Text style={styles.googleSubTitle}>
                    để tiếp tục tới{' '}
                    <Text style={styles.googleAppHighlight}>VKU Room Booking</Text>
                  </Text>

                  <View style={styles.googleAccountList}>
                    {availableUsers.map((u) => (
                      <Pressable
                        key={u.email}
                        style={styles.googleChooserItem}
                        onPress={() => handleSelectSavedGoogleAccount(u.email, u.name)}
                      >
                        <Image source={{ uri: u.avatar }} style={styles.googleChooserAvatar} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.googleChooserName}>{u.name}</Text>
                          <Text style={styles.googleChooserEmail}>{u.email}</Text>
                        </View>
                      </Pressable>
                    ))}

                    <Pressable
                      style={[styles.googleChooserItem, { borderBottomWidth: 0 }]}
                      onPress={() => {
                        setGoogleEmail('');
                        setGoogleError('');
                        setGoogleStep('ENTER_EMAIL');
                      }}
                    >
                      <View style={styles.googleUseAnotherIcon}>
                        <Text style={{ fontSize: 15, color: '#5f6368' }}>👤</Text>
                      </View>
                      <Text style={styles.googleUseAnotherText}>Sử dụng một tài khoản khác</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.googlePrivacyNote}>
                    Để tiếp tục, Google sẽ chia sẻ tên, địa chỉ email, ngôn ngữ ưu tiên và ảnh hồ sơ của bạn với VKU Room Booking.
                  </Text>
                </View>
              )}

              {googleStep === 'ENTER_EMAIL' && (
                <View>
                  <Text style={styles.googleMainTitle}>Đăng nhập</Text>
                  <Text style={styles.googleSubTitle}>
                    Tiếp tục tới{' '}
                    <Text style={styles.googleAppHighlight}>VKU Room Booking</Text>
                  </Text>

                  <View style={styles.googleFloatingFieldWrap}>
                    <Text style={styles.googleFloatingLabel}>Email hoặc số điện thoại</Text>
                    <TextInput
                      style={[
                        styles.googleMaterialInput,
                        googleError ? { borderColor: '#d93025' } : null,
                      ]}
                      placeholder="Nhập địa chỉ Gmail hoặc @vku.udn.vn"
                      placeholderTextColor="#80868b"
                      value={googleEmail}
                      onChangeText={(val) => {
                        setGoogleEmail(val);
                        setGoogleError('');
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>

                  {googleError ? (
                    <Text style={styles.googleErrorInline}>⚠️ {googleError}</Text>
                  ) : null}

                  <Pressable
                    onPress={() => {
                      setGoogleEmail('thuongnt.23itb@vku.udn.vn');
                      setGoogleError('');
                    }}
                  >
                    <Text style={styles.googleForgotLink}>Bạn quên địa chỉ email?</Text>
                  </Pressable>

                  <Text style={styles.googleGuestNote}>
                    Không phải máy tính của bạn? Hãy sử dụng cửa sổ duyệt web riêng tư để đăng nhập.{' '}
                    <Text style={{ color: '#1a73e8', fontWeight: '600' }}>
                      Tìm hiểu thêm về cách sử dụng Chế độ khách
                    </Text>
                  </Text>

                  <View style={styles.googleActionRow}>
                    <Pressable
                      style={styles.googleTextBtn}
                      onPress={() => {
                        setGoogleError('');
                        setGoogleStep('CHOOSE_ACCOUNT');
                      }}
                    >
                      <Text style={styles.googleTextBtnLabel}>Quay lại</Text>
                    </Pressable>

                    <Pressable style={styles.googleNextBtn} onPress={handleGoogleEmailNext}>
                      <Text style={styles.googleNextBtnLabel}>Tiếp theo</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {googleStep === 'ENTER_PASSWORD' && (
                <View>
                  <Text style={styles.googleMainTitle}>Chào mừng</Text>

                  <Pressable
                    style={styles.googleUserPill}
                    onPress={() => {
                      setGoogleError('');
                      setGoogleStep('CHOOSE_ACCOUNT');
                    }}
                  >
                    <View style={styles.googlePillIcon}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                        {(googleSelectedName || googleEmail || 'G').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.googlePillEmail} numberOfLines={1}>
                      {googleEmail}
                    </Text>
                    <Text style={styles.googlePillChevron}>▾</Text>
                  </Pressable>

                  <View style={styles.googleFloatingFieldWrap}>
                    <Text style={styles.googleFloatingLabel}>Nhập mật khẩu của bạn</Text>
                    <TextInput
                      style={[
                        styles.googleMaterialInput,
                        googleError ? { borderColor: '#d93025' } : null,
                      ]}
                      placeholder="Nhập mật khẩu Google"
                      placeholderTextColor="#80868b"
                      secureTextEntry={!showGooglePass}
                      value={googlePassword}
                      onChangeText={(t) => {
                        setGooglePassword(t);
                        setGoogleError('');
                      }}
                    />
                  </View>

                  {googleError ? (
                    <Text style={styles.googleErrorInline}>⚠️ {googleError}</Text>
                  ) : null}

                  <Pressable
                    style={styles.googleCheckboxRow}
                    onPress={() => setShowGooglePass(!showGooglePass)}
                  >
                    <View
                      style={[
                        styles.googleCheckbox,
                        showGooglePass && styles.googleCheckboxChecked,
                      ]}
                    >
                      {showGooglePass && <Text style={styles.googleCheckmark}>✓</Text>}
                    </View>
                    <Text style={styles.googleCheckboxLabel}>Hiện mật khẩu</Text>
                  </Pressable>

                  <View style={[styles.googleActionRow, { marginTop: 28 }]}>
                    <Pressable
                      style={styles.googleTextBtn}
                      onPress={() => {
                        setGooglePassword('123456');
                        setGoogleError('');
                      }}
                    >
                      <Text style={styles.googleTextBtnLabel}>Bạn quên mật khẩu?</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.googleNextBtn, isGoogleVerifying && { opacity: 0.7 }]}
                      onPress={handleGooglePasswordSubmit}
                      disabled={isGoogleVerifying}
                    >
                      <Text style={styles.googleNextBtnLabel}>Tiếp theo</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.googleFooterBar}>
              <Text style={styles.googleFooterLang}>Tiếng Việt ▾</Text>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <Text style={styles.googleFooterItem}>Trợ giúp</Text>
                <Text style={styles.googleFooterItem}>Bảo mật</Text>
                <Text style={styles.googleFooterItem}>Điều khoản</Text>
              </View>
            </View>
          </View>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════
           * GIAO DIỆN ĐĂNG NHẬP & ĐĂNG KÝ TÀI KHOẢN SINH VIÊN VKU
           * ═══════════════════════════════════════════════════════════════════ */
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.schoolTag}>
                  TRƯỜNG ĐẠI HỌC CNTT & TT VIỆT - HÀN (VKU)
                </Text>
                <Text style={styles.headerTitle}>
                  {mode === 'LOGIN' ? 'Đăng Nhập Tài Khoản' : 'Đăng Ký Tài Khoản Sinh Viên'}
                </Text>
              </View>
              <Pressable onPress={handleClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            {/* Mode Tabs */}
            <View style={styles.tabRow}>
              <Pressable
                style={[styles.tabBtn, mode === 'LOGIN' && styles.tabBtnActive]}
                onPress={() => {
                  setMode('LOGIN');
                  setErrorMsg('');
                }}
              >
                <Text style={[styles.tabBtnText, mode === 'LOGIN' && styles.tabBtnTextActive]}>
                  Đăng Nhập
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tabBtn, mode === 'REGISTER' && styles.tabBtnActive]}
                onPress={() => {
                  setMode('REGISTER');
                  setErrorMsg('');
                }}
              >
                <Text style={[styles.tabBtnText, mode === 'REGISTER' && styles.tabBtnTextActive]}>
                  Đăng Ký Mới
                </Text>
              </Pressable>
            </View>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              {/* Nút Google OAuth 2.0 chuẩn Google Identity Services */}
              <Pressable style={styles.googleBtn} onPress={openGoogleOAuth}>
                <GoogleGIcon />
                <Text style={styles.googleBtnText}>Tiếp tục với Google</Text>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>HOẶC ĐĂNG NHẬP VỚI TÀI KHOẢN VKU</Text>
                <View style={styles.dividerLine} />
              </View>

              {mode === 'LOGIN' ? (
                <View>
                  <Text style={styles.label}>Mã Sinh Viên (MSSV) hoặc Email VKU</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="VD: 23IT.B219 hoặc thuongnt.23itb@vku.udn.vn"
                    placeholderTextColor="#94a3b8"
                    value={identifier}
                    onChangeText={(t) => {
                      setIdentifier(t);
                      setErrorMsg('');
                    }}
                    autoCapitalize="none"
                  />

                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Mật khẩu</Text>
                    <Pressable
                      onPress={() => {
                        if (!identifier.trim()) {
                          setIdentifier('23IT.B219');
                        }
                        setPassword('123456');
                        setErrorMsg('');
                      }}
                    >
                      <Text style={styles.forgotLinkText}>Quên mật khẩu?</Text>
                    </Pressable>
                  </View>

                  <View style={styles.passwordInputWrap}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Nhập mật khẩu của bạn"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        setErrorMsg('');
                      }}
                    />
                    <Pressable
                      style={styles.eyeBtn}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text style={styles.eyeBtnText}>{showPassword ? 'Ẩn' : 'Hiện'}</Text>
                    </Pressable>
                  </View>

                  <Pressable style={styles.primaryBtn} onPress={handleLogin}>
                    <Text style={styles.primaryBtnText}>Đăng Nhập</Text>
                  </Pressable>
                </View>
              ) : (
                <View>
                  <Text style={styles.label}>Họ và tên sinh viên *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="VD: Nguyễn Thị Thương"
                    placeholderTextColor="#94a3b8"
                    value={regName}
                    onChangeText={setRegName}
                  />

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Mã sinh viên (MSSV) *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="VD: 23IT.B219"
                        placeholderTextColor="#94a3b8"
                        value={regStudentId}
                        onChangeText={setRegStudentId}
                        autoCapitalize="characters"
                      />
                    </View>
                    <View style={{ flex: 1.2 }}>
                      <Text style={styles.label}>Lớp / Chuyên ngành</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="VD: Kỹ Thuật Phần Mềm (23SE4)"
                        placeholderTextColor="#94a3b8"
                        value={regMajor}
                        onChangeText={setRegMajor}
                      />
                    </View>
                  </View>

                  <Text style={styles.label}>Email sinh viên VKU *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="VD: thuongnt.23itb@vku.udn.vn"
                    placeholderTextColor="#94a3b8"
                    value={regEmail}
                    onChangeText={setRegEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />

                  <Text style={styles.label}>Mật khẩu (tối thiểu 6 ký tự) *</Text>
                  <View style={styles.passwordInputWrap}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Tạo mật khẩu đăng nhập"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={!showRegPassword}
                      value={regPassword}
                      onChangeText={setRegPassword}
                    />
                    <Pressable
                      style={styles.eyeBtn}
                      onPress={() => setShowRegPassword(!showRegPassword)}
                    >
                      <Text style={styles.eyeBtnText}>{showRegPassword ? 'Ẩn' : 'Hiện'}</Text>
                    </Pressable>
                  </View>

                  {regPassword.length > 0 && (
                    <View style={styles.strengthBox}>
                      <View style={styles.strengthBarsRow}>
                        {[1, 2, 3, 4].map((lvl) => (
                          <View
                            key={lvl}
                            style={[
                              styles.strengthBarSegment,
                              {
                                backgroundColor:
                                  registerStrength.score >= lvl
                                    ? registerStrength.color
                                    : '#e2e8f0',
                              },
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={[styles.strengthLabel, { color: registerStrength.color }]}>
                        Độ mạnh mật khẩu: {registerStrength.label}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.label}>Xác nhận lại mật khẩu *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      regConfirmPassword.length > 0 && regConfirmPassword !== regPassword
                        ? { borderColor: '#ef4444' }
                        : null,
                    ]}
                    placeholder="Nhập lại mật khẩu bên trên"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showRegPassword}
                    value={regConfirmPassword}
                    onChangeText={setRegConfirmPassword}
                  />

                  <Pressable style={styles.primaryBtn} onPress={handleRegister}>
                    <Text style={styles.primaryBtnText}>Đăng Ký Tài Khoản</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 430,
    maxHeight: '92%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  schoolTag: {
    color: '#38bdf8',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 5,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#0284c7',
    fontWeight: '800',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 11,
    marginBottom: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 18,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 24,
    paddingVertical: 11,
    paddingHorizontal: 16,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  googleFourColorLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleFourColorG: {
    fontSize: 13,
    fontWeight: '900',
    color: '#4285F4',
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3c4043',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94a3b8',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 4,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 4,
  },
  forgotLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 13.5,
    color: '#0f172a',
    marginBottom: 10,
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 13.5,
    color: '#0f172a',
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  eyeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  strengthBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  strengthBarsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  strengthBarSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  /* ═══════════════════════════════════════════════════════════════════
   * STYLES CHO CỬA SỔ GOOGLE OAUTH 2.0 CHUẨN MATERIAL 3 (accounts.google.com)
   * ═══════════════════════════════════════════════════════════════════ */
  googleModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    width: '100%',
    maxWidth: 448,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dadce0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 10,
  },
  googleSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#dadce0',
    backgroundColor: '#ffffff',
  },
  googleSubHeaderText: {
    flex: 1,
    fontSize: 14,
    color: '#5f6368',
    fontWeight: '500',
  },
  googleCloseBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  googleCloseText: {
    fontSize: 16,
    color: '#5f6368',
  },
  googleLoadingBar: {
    paddingVertical: 4,
    backgroundColor: '#e8f0fe',
    alignItems: 'center',
  },
  googleBody: {
    paddingHorizontal: 36,
    paddingTop: 32,
    paddingBottom: 24,
  },
  googleWordmarkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  googleLetter: {
    fontSize: 23,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  googleMainTitle: {
    fontSize: 24,
    fontWeight: '400',
    color: '#202124',
    textAlign: 'center',
    marginBottom: 8,
  },
  googleSubTitle: {
    fontSize: 16,
    color: '#202124',
    textAlign: 'center',
    marginBottom: 24,
  },
  googleAppHighlight: {
    color: '#1a73e8',
    fontWeight: '500',
  },
  googleAccountList: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#dadce0',
    marginBottom: 20,
  },
  googleChooserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  googleChooserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: '#e8f0fe',
  },
  googleChooserName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3c4043',
  },
  googleChooserEmail: {
    fontSize: 12,
    color: '#5f6368',
    marginTop: 1,
  },
  googleUseAnotherIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleUseAnotherText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3c4043',
  },
  googlePrivacyNote: {
    fontSize: 12,
    color: '#5f6368',
    lineHeight: 18,
    marginBottom: 10,
  },
  googleFloatingFieldWrap: {
    marginTop: 8,
    marginBottom: 8,
    position: 'relative',
  },
  googleFloatingLabel: {
    fontSize: 12,
    color: '#1a73e8',
    fontWeight: '500',
    marginBottom: 4,
  },
  googleMaterialInput: {
    borderWidth: 1.5,
    borderColor: '#1a73e8',
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: '#202124',
    backgroundColor: '#ffffff',
  },
  googleErrorInline: {
    fontSize: 12,
    color: '#d93025',
    marginTop: 4,
    marginBottom: 6,
  },
  googleForgotLink: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 24,
  },
  googleGuestNote: {
    fontSize: 14,
    color: '#5f6368',
    lineHeight: 20,
    marginBottom: 28,
  },
  googleActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  googleTextBtn: {
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  googleTextBtnLabel: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '500',
  },
  googleNextBtn: {
    backgroundColor: '#1a73e8',
    borderRadius: 4,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  googleNextBtnLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  googleUserPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 24,
    maxWidth: '90%',
  },
  googlePillIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  googlePillEmail: {
    fontSize: 14,
    color: '#3c4043',
    fontWeight: '500',
    marginRight: 6,
  },
  googlePillChevron: {
    fontSize: 12,
    color: '#3c4043',
  },
  googleCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  googleCheckbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#5f6368',
    borderRadius: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleCheckboxChecked: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  googleCheckmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  googleCheckboxLabel: {
    fontSize: 14,
    color: '#202124',
  },
  googleFooterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  googleFooterLang: {
    fontSize: 12,
    color: '#5f6368',
  },
  googleFooterItem: {
    fontSize: 12,
    color: '#5f6368',
  },
});
