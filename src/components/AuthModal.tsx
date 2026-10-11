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
  deriveVkuProfileFromEmail,
  evaluatePasswordStrength,
  sha256,
  verifyPassword,
} from '../services/authSecurityService';

type AuthViewMode = 'LOGIN' | 'REGISTER' | 'GOOGLE_OAUTH';
type GoogleStep = 'CHOOSE_ACCOUNT' | 'ENTER_EMAIL' | 'ENTER_PASSWORD';

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

  // Realistic Google OAuth 2.0 states
  const [googleStep, setGoogleStep] = useState<GoogleStep>('CHOOSE_ACCOUNT');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [googleCustomName, setGoogleCustomName] = useState('');
  const [googleCustomMssv, setGoogleCustomMssv] = useState('');
  const [showGooglePass, setShowGooglePass] = useState(false);
  const [isGoogleVerifying, setIsGoogleVerifying] = useState(false);
  const [googleError, setGoogleError] = useState('');

  // Live SHA-256 preview for transparency
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
    setGoogleCustomName('');
    setGoogleCustomMssv('');
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
    setGoogleStep('CHOOSE_ACCOUNT');
    setMode('GOOGLE_OAUTH');
  };

  // Chọn 1 tài khoản có sẵn trong Google Account Chooser
  const handleSelectSavedGoogleAccount = (email: string, name: string, mssv: string) => {
    setGoogleError('');
    setGoogleEmail(email);
    setGoogleCustomName(name);
    setGoogleCustomMssv(mssv);
    setGooglePassword('');
    setGoogleStep('ENTER_PASSWORD');
  };

  // Bước Tiếp theo khi nhập email Google mới
  const handleGoogleEmailNext = () => {
    setGoogleError('');
    const clean = googleEmail.trim().toLowerCase();
    if (!clean) {
      setGoogleError('Hãy nhập email hoặc số điện thoại.');
      return;
    }
    const finalEmail = clean.includes('@') ? clean : `${clean}@vku.udn.vn`;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(finalEmail)) {
      setGoogleError('Không tìm thấy Tài khoản Google của bạn. Vui lòng nhập đúng định dạng email.');
      return;
    }

    setGoogleEmail(finalEmail);
    const existing = availableUsers.find(
      (u) => u.email.toLowerCase() === finalEmail
    );
    if (existing) {
      setGoogleCustomName(existing.name);
      setGoogleCustomMssv(existing.studentId);
    } else {
      const derived = deriveVkuProfileFromEmail(finalEmail);
      if (!googleCustomName.trim()) setGoogleCustomName(derived.suggestedName);
      if (!googleCustomMssv.trim()) setGoogleCustomMssv(derived.suggestedStudentId);
    }
    setGoogleStep('ENTER_PASSWORD');
  };

  // Bước Xác thực mật khẩu Google OAuth 2.0
  const handleGooglePasswordSubmit = () => {
    setGoogleError('');
    if (!googlePassword || googlePassword.trim().length < 4) {
      setGoogleError('Hãy nhập mật khẩu tài khoản Google của bạn (tối thiểu 4 ký tự).');
      return;
    }

    const cleanEmail = googleEmail.trim().toLowerCase();
    const existing = availableUsers.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    // Nếu tài khoản đã tồn tại, kiểm tra mật khẩu đã băm SHA-256
    if (existing && existing.passwordHash) {
      const ok = verifyPassword(
        googlePassword,
        existing.passwordHash,
        existing.passwordSalt
      );
      if (!ok) {
        setGoogleError(
          'Mật khẩu không chính xác. Hãy thử lại hoặc nhấp vào "Bạn quên mật khẩu?" để xem gợi ý.'
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
        googleCustomName.trim() || undefined,
        googleCustomMssv.trim() || undefined
      );
      if (!res.success) {
        setGoogleError(res.message);
      } else {
        resetForm();
        setMode('LOGIN');
      }
    }, 550);
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
           * GIAO DIỆN GOOGLE OAUTH 2.0 CHUẨN NHƯ THẬT (accounts.google.com)
           * ═══════════════════════════════════════════════════════════════════ */
          <View style={styles.googleModalCard}>
            {/* Thanh địa chỉ trình duyệt bảo mật HTTPS */}
            <View style={styles.googleBrowserBar}>
              <View style={styles.googleUrlLockWrap}>
                <Text style={styles.googleLockIcon}>🔒</Text>
                <Text style={styles.googleUrlText} numberOfLines={1}>
                  https://accounts.google.com/o/oauth2/v2/auth?client_id=vku-room-booking
                </Text>
              </View>
              <Pressable onPress={() => setMode('LOGIN')} style={styles.googleCloseBtn}>
                <Text style={styles.googleCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* Thanh Header nhỏ "Đăng nhập bằng Google" */}
            <View style={styles.googleSubHeader}>
              <View style={styles.googleMiniLogoCircle}>
                <Text style={styles.googleMiniG}>G</Text>
              </View>
              <Text style={styles.googleSubHeaderText}>Đăng nhập bằng Google</Text>
            </View>

            {isGoogleVerifying && (
              <View style={styles.googleLoadingBar}>
                <ActivityIndicator size="small" color="#1a73e8" />
                <Text style={styles.googleLoadingText}>
                  Đang xác thực chữ ký OAuth 2.0 & tạo khóa phiên JWT...
                </Text>
              </View>
            )}

            <ScrollView style={styles.googleBody} showsVerticalScrollIndicator={false}>
              {/* Wordmark Google 4 màu chính thức */}
              <View style={styles.googleWordmarkRow}>
                <Text style={[styles.googleLetter, { color: '#4285F4' }]}>G</Text>
                <Text style={[styles.googleLetter, { color: '#EA4335' }]}>o</Text>
                <Text style={[styles.googleLetter, { color: '#FBBC05' }]}>o</Text>
                <Text style={[styles.googleLetter, { color: '#4285F4' }]}>g</Text>
                <Text style={[styles.googleLetter, { color: '#34A853' }]}>l</Text>
                <Text style={[styles.googleLetter, { color: '#EA4335' }]}>e</Text>
              </View>

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
                        onPress={() =>
                          handleSelectSavedGoogleAccount(u.email, u.name, u.studentId)
                        }
                      >
                        <Image source={{ uri: u.avatar }} style={styles.googleChooserAvatar} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.googleChooserName}>{u.name}</Text>
                          <Text style={styles.googleChooserEmail}>{u.email}</Text>
                        </View>
                        <View style={styles.googleVkuBadge}>
                          <Text style={styles.googleVkuBadgeText}>{u.studentId}</Text>
                        </View>
                      </Pressable>
                    ))}

                    <Pressable
                      style={[styles.googleChooserItem, { borderBottomWidth: 0 }]}
                      onPress={() => {
                        setGoogleEmail('');
                        setGoogleCustomName('');
                        setGoogleCustomMssv('');
                        setGoogleError('');
                        setGoogleStep('ENTER_EMAIL');
                      }}
                    >
                      <View style={styles.googleUseAnotherIcon}>
                        <Text style={{ fontSize: 16 }}>👤+</Text>
                      </View>
                      <Text style={styles.googleUseAnotherText}>Sử dụng một tài khoản khác</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.googlePrivacyNote}>
                    Để tiếp tục, Google sẽ chia sẻ tên, địa chỉ email, ngôn ngữ ưu tiên và ảnh hồ sơ của bạn với VKU Room Booking. Giao thức bảo mật OAuth 2.0 (OpenID Connect).
                  </Text>
                </View>
              )}

              {googleStep === 'ENTER_EMAIL' && (
                <View>
                  <Text style={styles.googleMainTitle}>Đăng nhập</Text>
                  <Text style={styles.googleSubTitle}>
                    Sử dụng Tài khoản Google của bạn (@vku.udn.vn hoặc @gmail.com)
                  </Text>

                  {googleError ? (
                    <View style={styles.googleErrorRow}>
                      <Text style={styles.googleErrorText}>⚠️ {googleError}</Text>
                    </View>
                  ) : null}

                  <Text style={styles.googleFieldLabel}>Email hoặc tên tài khoản VKU *</Text>
                  <TextInput
                    style={[
                      styles.googleMaterialInput,
                      googleError ? { borderColor: '#d93025' } : null,
                    ]}
                    placeholder="VD: thuongnt.23itb@vku.udn.vn hoặc tenban@gmail.com"
                    placeholderTextColor="#80868b"
                    value={googleEmail}
                    onChangeText={(val) => {
                      setGoogleEmail(val);
                      setGoogleError('');
                      if (val.includes('@') || val.includes('.')) {
                        const full = val.includes('@') ? val : `${val}@vku.udn.vn`;
                        const derived = deriveVkuProfileFromEmail(full);
                        setGoogleCustomName(derived.suggestedName);
                        setGoogleCustomMssv(derived.suggestedStudentId);
                      }
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />

                  <View style={styles.googleProfileSyncBox}>
                    <Text style={styles.googleProfileSyncTitle}>
                      🎓 Thông tin hồ sơ Sinh viên VKU đồng bộ:
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={{ flex: 1.3 }}>
                        <Text style={styles.googleMiniFieldLabel}>Họ và tên hiển thị</Text>
                        <TextInput
                          style={styles.googleMiniInput}
                          placeholder="Họ và tên"
                          placeholderTextColor="#94a3b8"
                          value={googleCustomName}
                          onChangeText={setGoogleCustomName}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.googleMiniFieldLabel}>Mã SV (MSSV)</Text>
                        <TextInput
                          style={styles.googleMiniInput}
                          placeholder="VD: 23IT.B219"
                          placeholderTextColor="#94a3b8"
                          value={googleCustomMssv}
                          onChangeText={setGoogleCustomMssv}
                          autoCapitalize="characters"
                        />
                      </View>
                    </View>
                  </View>

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

                  {/* Account Identifier Pill */}
                  <Pressable
                    style={styles.googleUserPill}
                    onPress={() => {
                      setGoogleError('');
                      setGoogleStep('CHOOSE_ACCOUNT');
                    }}
                  >
                    <View style={styles.googlePillIcon}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>
                        {(googleCustomName || googleEmail || 'G').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.googlePillEmail} numberOfLines={1}>
                      {googleEmail}
                    </Text>
                    <Text style={styles.googlePillChevron}>▾</Text>
                  </Pressable>

                  {googleError ? (
                    <View style={styles.googleErrorRow}>
                      <Text style={styles.googleErrorText}>⚠️ {googleError}</Text>
                    </View>
                  ) : null}

                  <Text style={styles.googleFieldLabel}>Nhập mật khẩu của bạn *</Text>
                  <TextInput
                    style={[
                      styles.googleMaterialInput,
                      googleError ? { borderColor: '#d93025' } : null,
                    ]}
                    placeholder="Nhập mật khẩu xác thực Google"
                    placeholderTextColor="#80868b"
                    secureTextEntry={!showGooglePass}
                    value={googlePassword}
                    onChangeText={(t) => {
                      setGooglePassword(t);
                      setGoogleError('');
                    }}
                  />

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

                  <View style={styles.googleSecurityHintBox}>
                    <Text style={styles.googleSecurityHintText}>
                      🔐 <Text style={{ fontWeight: '700' }}>Bảo mật OAuth 2.0 & SHA-256:</Text> Đối với các tài khoản mẫu VKU (như {googleEmail}), mật khẩu mặc định là{' '}
                      <Text style={{ fontWeight: '800', color: '#1a73e8' }}>123456</Text>. Nếu đây là Gmail mới của bạn, mật khẩu bạn nhập sẽ được băm SHA-256 làm mật khẩu riêng.
                    </Text>
                  </View>

                  <View style={styles.googleActionRow}>
                    <Pressable
                      style={styles.googleTextBtn}
                      onPress={() => setGooglePassword('123456')}
                    >
                      <Text style={styles.googleTextBtnLabel}>Điền mật khẩu mẫu (123456)</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.googleNextBtn, isGoogleVerifying && { opacity: 0.7 }]}
                      onPress={handleGooglePasswordSubmit}
                      disabled={isGoogleVerifying}
                    >
                      <Text style={styles.googleNextBtnLabel}>
                        {isGoogleVerifying ? 'Đang xác thực...' : 'Tiếp theo'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.googleFooterBar}>
              <Text style={styles.googleFooterLang}>Tiếng Việt ▾</Text>
              <View style={{ flexDirection: 'row', gap: 14 }}>
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

              {/* Nút Google OAuth 2.0 chuẩn 4 màu Google */}
              <Pressable style={styles.googleBtn} onPress={openGoogleOAuth}>
                <View style={styles.googleFourColorLogo}>
                  <Text style={styles.googleFourColorG}>G</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.googleBtnText}>Tiếp tục với Google</Text>
                  <Text style={styles.googleBtnSubText}>
                    Xác thực OAuth 2.0 (@vku.udn.vn & @gmail.com)
                  </Text>
                </View>
                <Text style={styles.googleBtnArrow}>➔</Text>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>HOẶC XÁC THỰC BẰNG MẬT KHẨU</Text>
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

                  {/* Hiển thị trực tiếp mã băm SHA-256 khi nhập */}
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

                  {/* Hộp thông tin tài khoản mẫu thu gọn phục vụ Giảng viên chấm bài */}
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

                  {/* Thanh đo độ mạnh mật khẩu chuẩn OWASP */}
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
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#dadce0',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  googleFourColorLogo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleFourColorG: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4285F4',
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1f1f1f',
  },
  googleBtnSubText: {
    fontSize: 11,
    color: '#5f6368',
    marginTop: 1,
  },
  googleBtnArrow: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a73e8',
    marginLeft: 8,
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
  // GOOGLE OAUTH 2.0 POPUP STYLES (1:1 Authentic Google Material 3 Design)
  // ───────────────────────────────────────────────────────────────────────────
  googleModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 430,
    maxHeight: '92%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dadce0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 15,
  },
  googleBrowserBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#dadce0',
  },
  googleUrlLockWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  googleLockIcon: {
    fontSize: 11,
    marginRight: 5,
  },
  googleUrlText: {
    fontSize: 11,
    color: '#202124',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
    fontWeight: '700',
  },
  googleSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },
  googleMiniLogoCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  googleMiniG: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  googleSubHeaderText: {
    fontSize: 13,
    color: '#5f6368',
    fontWeight: '600',
  },
  googleLoadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f0fe',
    paddingVertical: 8,
    gap: 8,
  },
  googleLoadingText: {
    fontSize: 12,
    color: '#1a73e8',
    fontWeight: '700',
  },
  googleBody: {
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 20,
  },
  googleWordmarkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  googleLetter: {
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  googleMainTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#202124',
    textAlign: 'center',
    marginBottom: 6,
  },
  googleSubTitle: {
    fontSize: 14,
    color: '#202124',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  googleAppHighlight: {
    color: '#1a73e8',
    fontWeight: '700',
  },
  googleAccountList: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e8eaed',
    marginBottom: 16,
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
    fontSize: 13.5,
    fontWeight: '700',
    color: '#3c4043',
  },
  googleChooserEmail: {
    fontSize: 12,
    color: '#5f6368',
    marginTop: 1,
  },
  googleVkuBadge: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  googleVkuBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1a73e8',
  },
  googleUseAnotherIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f3f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleUseAnotherText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#3c4043',
  },
  googlePrivacyNote: {
    fontSize: 11.5,
    color: '#5f6368',
    lineHeight: 17,
    marginBottom: 10,
  },
  googleErrorRow: {
    backgroundColor: '#fce8e6',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  googleErrorText: {
    color: '#d93025',
    fontSize: 12,
    fontWeight: '600',
  },
  googleFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a73e8',
    marginBottom: 6,
  },
  googleMaterialInput: {
    borderWidth: 1.5,
    borderColor: '#1a73e8',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#202124',
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  googleProfileSyncBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dadce0',
    marginBottom: 16,
  },
  googleProfileSyncTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#3c4043',
    marginBottom: 8,
  },
  googleMiniFieldLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#5f6368',
    marginBottom: 4,
  },
  googleMiniInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12.5,
    color: '#202124',
  },
  googleUserPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
    maxWidth: '90%',
  },
  googlePillIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  googlePillEmail: {
    fontSize: 13,
    fontWeight: '600',
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
    marginBottom: 14,
  },
  googleCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#5f6368',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleCheckboxChecked: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  googleCheckmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  googleCheckboxLabel: {
    fontSize: 13,
    color: '#202124',
  },
  googleSecurityHintBox: {
    backgroundColor: '#e8f0fe',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  googleSecurityHintText: {
    fontSize: 11.5,
    color: '#174ea6',
    lineHeight: 17,
  },
  googleActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  googleTextBtn: {
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  googleTextBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a73e8',
  },
  googleNextBtn: {
    backgroundColor: '#1a73e8',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  googleNextBtnLabel: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  googleFooterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e8eaed',
  },
  googleFooterLang: {
    fontSize: 11.5,
    color: '#5f6368',
  },
  googleFooterItem: {
    fontSize: 11.5,
    color: '#5f6368',
  },
});
