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
  sha256,
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
      style: { width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
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
  const [showDemoHint, setShowDemoHint] = useState(false);

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

  // Live SHA-256 preview
  const loginPasswordHashPreview = useMemo(() => {
    if (!password) return null;
    const h = sha256(`vku_salt:${password}`);
    return `sha256$${h.slice(0, 16)}...${h.slice(-8)}`;
  }, [password]);

  const registerStrength = useMemo(
    () => evaluatePasswordStrength(regPassword),
    [regPassword]
  );

  const regPasswordHashPreview = useMemo(() => {
    if (!regPassword) return null;
    const h = sha256(`vku_reg_salt:${regPassword}`);
    return `sha256$${h.slice(0, 16)}...${h.slice(-8)}`;
  }, [regPassword]);

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
      const opened = openRealGooglePopupWindow(availableUsers, ({ email, password: gPass, name }) => {
        loginWithGoogle(email, gPass, name);
        resetForm();
        setMode('LOGIN');
      });
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
    if (!googlePassword || googlePassword.trim().length < 4) {
      setGoogleError('Hãy nhập mật khẩu của bạn.');
      return;
    }

    const cleanEmail = googleEmail.trim().toLowerCase();
    const existing = availableUsers.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    if (existing && existing.passwordHash) {
      const ok = verifyPassword(
        googlePassword,
        existing.passwordHash,
        existing.passwordSalt
      );
      if (!ok) {
        setGoogleError(
          'Mật khẩu không chính xác. Hãy thử lại hoặc bấm "Bạn quên mật khẩu?" để điền mật khẩu mặc định (123456).'
        );
        return;
      }
    }

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
      setErrorMsg('Vui lòng nhập Mã sinh viên (MSSV) hoặc Email VKU!');
      return;
    }
    if (!password) {
      setErrorMsg('Vui lòng nhập mật khẩu để xác thực mã băm SHA-256!');
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
      setErrorMsg('Vui lòng nhập đầy đủ Họ và tên và Mã số sinh viên (MSSV)!');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('Mật khẩu bảo mật phải có ít nhất 6 ký tự!');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.');
      return;
    }
    const res = register(
      regName,
      regStudentId,
      regEmail || `${regStudentId.trim().toLowerCase().replace('.', '')}@vku.udn.vn`,
      regMajor || 'Kỹ Thuật Phần Mềm (Lớp 23SE4)',
      regPassword
    );
    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      resetForm();
    }
  };

  const fillDemoAccount = (mssv: string) => {
    setIdentifier(mssv);
    setPassword('123456');
    setErrorMsg('');
  };

  return (
    <Modal visible={authModalVisible} transparent animationType="fade" onRequestClose={handleClose}>
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
                    để tiếp tục tới <Text style={styles.googleAppHighlight}>VKU Room Booking</Text>
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
                    Tiếp tục tới <Text style={styles.googleAppHighlight}>VKU Room Booking</Text>
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
           * GIAO DIỆN ĐĂNG NHẬP & ĐĂNG KÝ CHUẨN BẢO MẬT VKU (SHA-256 + JWT)
           * ═══════════════════════════════════════════════════════════════════ */
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <View style={styles.securityBadgeRow}>
                  <Text style={styles.schoolTag}>🛡️ VKU SSO • SHA-256 + JWT SECURITY</Text>
                </View>
                <Text style={styles.headerTitle}>
                  {mode === 'LOGIN' ? '🔐 Đăng Nhập Hệ Thống' : '✨ Đăng Ký Tài Khoản VKU'}
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
                  <Text style={styles.label}>Mã Sinh Viên (MSSV) hoặc Email VKU *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập MSSV (VD: 23IT.B219) hoặc Email VKU"
                    placeholderTextColor="#94a3b8"
                    value={identifier}
                    onChangeText={(t) => {
                      setIdentifier(t);
                      setErrorMsg('');
                    }}
                    autoCapitalize="none"
                  />

                  <Text style={styles.label}>Mật khẩu bảo mật *</Text>
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
                      <Text style={styles.eyeBtnText}>{showPassword ? '🙈 Ẩn' : '👁️ Hiện'}</Text>
                    </Pressable>
                  </View>

                  {loginPasswordHashPreview && (
                    <View style={styles.cryptoLiveBox}>
                      <Text style={styles.cryptoLiveText}>
                        🔒 Băm SHA-256: <Text style={styles.cryptoMono}>{loginPasswordHashPreview}</Text>
                      </Text>
                    </View>
                  )}

                  <Pressable style={styles.primaryBtn} onPress={handleLogin}>
                    <Text style={styles.primaryBtnText}>🔐 Xác Thực & Đăng Nhập</Text>
                  </Pressable>

                  <View style={styles.demoHintContainer}>
                    <Pressable
                      style={styles.demoHintHeader}
                      onPress={() => setShowDemoHint(!showDemoHint)}
                    >
                      <Text style={styles.demoHintTitle}>
                        🎓 Thông tin tài khoản mẫu phục vụ Giảng viên kiểm thử {showDemoHint ? '▴' : '▾'}
                      </Text>
                    </Pressable>

                    {showDemoHint && (
                      <View style={styles.demoHintBody}>
                        <Text style={styles.demoHintSub}>
                          Mật khẩu mặc định đã được mã hóa SHA-256 là <Text style={{ fontWeight: '800', color: '#0284c7' }}>123456</Text>. Nhấn để điền thử:
                        </Text>
                        <View style={styles.demoAccountRow}>
                          <Pressable
                            style={styles.demoAccountPill}
                            onPress={() => fillDemoAccount('23IT.B219')}
                          >
                            <Text style={styles.demoPillText}>Nguyễn Thị Thương (23IT.B219)</Text>
                          </Pressable>
                          <Pressable
                            style={styles.demoAccountPill}
                            onPress={() => fillDemoAccount('23IT.B105')}
                          >
                            <Text style={styles.demoPillText}>Trần Văn Nam (23IT.B105)</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
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

                  <Text style={styles.label}>Mật khẩu bảo mật (tối thiểu 6 ký tự) *</Text>
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
                      <Text style={styles.eyeBtnText}>{showRegPassword ? '🙈 Ẩn' : '👁️ Hiện'}</Text>
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
                      <View style={styles.strengthMetaRow}>
                        <Text style={[styles.strengthLabel, { color: registerStrength.color }]}>
                          Độ mạnh: {registerStrength.label}
                        </Text>
                        {regPasswordHashPreview && (
                          <Text style={styles.cryptoMonoSmall}>{regPasswordHashPreview}</Text>
                        )}
                      </View>
                      <Text style={styles.strengthHint}>{registerStrength.hint}</Text>
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
                    placeholder="Nhập lại chính xác mật khẩu bên trên"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showRegPassword}
                    value={regConfirmPassword}
                    onChangeText={setRegConfirmPassword}
                  />

                  <Pressable style={styles.primaryBtn} onPress={handleRegister}>
                    <Text style={styles.primaryBtnText}>✨ Mã Hóa SHA-256 & Tạo Tài Khoản</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
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
  securityBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  schoolTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
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
    fontWeight: '700',
    color: '#64748b',
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#0284c7',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#ffffff',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 22,
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
    borderRadius: 20,
    paddingVertical: 11,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  googleFourColorLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleFourColorG: {
    fontSize: 16,
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
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    marginHorizontal: 10,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 13.5,
    color: '#0f172a',
    marginBottom: 12,
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 11,
    marginBottom: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 13.5,
    color: '#0f172a',
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  eyeBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0284c7',
  },
  cryptoLiveBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  cryptoLiveText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  cryptoMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  cryptoMonoSmall: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
    color: '#64748b',
  },
  strengthBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  strengthBarsRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 6,
  },
  strengthBarSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  strengthMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strengthLabel: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  strengthHint: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
  },
  primaryBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  demoHintContainer: {
    marginTop: 4,
    marginBottom: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  demoHintHeader: {
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  demoHintTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  demoHintBody: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  demoHintSub: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 16,
  },
  demoAccountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  demoAccountPill: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // FALLBACK GOOGLE SIGN-IN CARD STYLES (Clean 1:1 Google Material 3)
  // ───────────────────────────────────────────────────────────────────────────
  googleModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dadce0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 15,
  },
  googleSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dadce0',
  },
  googleSubHeaderText: {
    fontSize: 14,
    color: '#5f6368',
    fontWeight: '500',
    flex: 1,
  },
  googleCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleCloseText: {
    fontSize: 15,
    color: '#5f6368',
  },
  googleLoadingBar: {
    backgroundColor: '#e8f0fe',
    paddingVertical: 6,
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
    alignItems: 'center',
    marginBottom: 14,
  },
  googleLetter: {
    fontSize: 24,
    fontWeight: '700',
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
    marginBottom: 28,
  },
  googleAppHighlight: {
    color: '#1a73e8',
    fontWeight: '500',
  },
  googleAccountList: {
    borderTopWidth: 1,
    borderColor: '#dadce0',
    marginBottom: 20,
  },
  googleChooserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#dadce0',
  },
  googleChooserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 14,
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
    marginRight: 14,
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
    marginTop: 8,
  },
  googleFloatingFieldWrap: {
    position: 'relative',
    marginTop: 4,
    marginBottom: 6,
  },
  googleFloatingLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1a73e8',
    marginBottom: 6,
  },
  googleMaterialInput: {
    borderWidth: 2,
    borderColor: '#1a73e8',
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: '#202124',
    backgroundColor: '#ffffff',
  },
  googleErrorInline: {
    color: '#d93025',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  googleForgotLink: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 26,
  },
  googleGuestNote: {
    fontSize: 14,
    color: '#5f6368',
    lineHeight: 20,
    marginBottom: 28,
  },
  googleUserPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 26,
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
    fontWeight: '500',
    color: '#3c4043',
    marginRight: 6,
  },
  googlePillChevron: {
    fontSize: 12,
    color: '#5f6368',
  },
  googleCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  googleCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#5f6368',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  googleActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  googleTextBtn: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  googleTextBtnLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a73e8',
  },
  googleNextBtn: {
    backgroundColor: '#1a73e8',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  googleNextBtnLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  googleFooterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
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
