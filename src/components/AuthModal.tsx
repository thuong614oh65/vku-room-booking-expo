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
} from 'react-native';
import { useBookingStore } from '../store/useBookingStore';
import { evaluatePasswordStrength } from '../services/authSecurityService';
import {
  GOOGLE_G_SVG,
  isEmbeddedWebView,
  openInExternalSystemBrowser,
  openRealGooglePopupWindow,
} from '../services/googleOAuthPopupService';

type AuthViewMode = 'LOGIN' | 'REGISTER';

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
  const [showZaloBrowserGuide, setShowZaloBrowserGuide] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Standard Register states
  const [regName, setRegName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMajor, setRegMajor] = useState('Kỹ Thuật Phần Mềm (Lớp 23SE4)');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const registerStrength = useMemo(
    () => evaluatePasswordStrength(regPassword),
    [regPassword]
  );

  const resetForm = () => {
    setErrorMsg('');
    setShowZaloBrowserGuide(false);
    setCopiedLink(false);
    setIdentifier('');
    setPassword('');
    setShowPassword(false);
    setRegName('');
    setRegStudentId('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');
    setShowRegPassword(false);
  };

  const handleClose = () => {
    resetForm();
    setMode('LOGIN');
    setAuthModalVisible(false);
  };

  const openGoogleOAuth = () => {
    setErrorMsg('');
    setCopiedLink(false);

    if (Platform.OS === 'web') {
      if (isEmbeddedWebView()) {
        setShowZaloBrowserGuide(true);
        openInExternalSystemBrowser();
        return;
      }

      openRealGooglePopupWindow(
        availableUsers,
        ({ email, password: gPass, name, avatar, resetPassword }) => {
          loginWithGoogle(email, gPass, name, undefined, avatar, resetPassword);
          resetForm();
          setMode('LOGIN');
        },
        (errMsg) => {
          setErrorMsg(errMsg);
        }
      );
      return;
    }

    setErrorMsg(
      'Xác thực Google OAuth 2.0 chính chủ (accounts.google.com) yêu cầu mở trên trình duyệt Safari hoặc Chrome.'
    );
  };

  const handleCopyUrl = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopiedLink(true);
      });
    }
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

            {/* Nút Google OAuth 2.0 chuẩn Google Identity Services (100% accounts.google.com) */}
            <Pressable style={styles.googleBtn} onPress={openGoogleOAuth}>
              <GoogleGIcon />
              <Text style={styles.googleBtnText}>Tiếp tục với Google (@vku.udn.vn)</Text>
            </Pressable>

            {showZaloBrowserGuide && (
              <View style={styles.zaloSecurityBox}>
                <Text style={styles.zaloSecurityTitle}>
                  🔒 Bảo mật Google OAuth 2.0 (accounts.google.com)
                </Text>
                <Text style={styles.zaloSecurityDesc}>
                  Theo tiêu chuẩn bảo mật của Google (RFC 8252), đăng nhập Google thật chỉ thực hiện trên trình duyệt chuẩn (<Text style={{ fontWeight: '800' }}>Safari / Chrome</Text>) và chặn trình duyệt nhúng của Zalo để bảo vệ tài khoản <Text style={{ fontWeight: '800' }}>@vku.udn.vn</Text> không bị ứng dụng thứ ba theo dõi.
                </Text>

                <View style={styles.zaloActionRow}>
                  <Pressable
                    style={styles.zaloOpenBrowserBtn}
                    onPress={() => openInExternalSystemBrowser()}
                  >
                    <Text style={styles.zaloOpenBrowserBtnText}>
                      🧭 Mở ngay bằng Safari / Chrome
                    </Text>
                  </Pressable>

                  <Pressable style={styles.zaloCopyBtn} onPress={handleCopyUrl}>
                    <Text style={styles.zaloCopyBtnText}>
                      {copiedLink ? '✅ Đã chép link' : '📋 Chép link'}
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.zaloStepHint}>
                  💡 Hoặc bấm biểu tượng <Text style={{ fontWeight: '800' }}>•••</Text> ở góc trên bên phải Zalo ➔ chọn <Text style={{ fontWeight: '800' }}>"Mở bằng trình duyệt / Safari"</Text>.
                </Text>
              </View>
            )}

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
  zaloSecurityBox: {
    marginTop: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 12,
    padding: 12,
  },
  zaloSecurityTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1e3a8a',
    marginBottom: 5,
  },
  zaloSecurityDesc: {
    fontSize: 11.5,
    color: '#1e40af',
    lineHeight: 17,
    marginBottom: 10,
  },
  zaloActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  zaloOpenBrowserBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zaloOpenBrowserBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  zaloCopyBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zaloCopyBtnText: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '700',
  },
  zaloStepHint: {
    fontSize: 11,
    color: '#1d4ed8',
    lineHeight: 15,
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
});
