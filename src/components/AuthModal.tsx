import React, { useState } from 'react';
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

export const AuthModal: React.FC = () => {
  const { authModalVisible, setAuthModalVisible, login, register, availableUsers } = useBookingStore();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Register states
  const [regName, setRegName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMajor, setRegMajor] = useState('Kỹ Thuật Phần Mềm (Lớp 23ITB)');
  const [regPassword, setRegPassword] = useState('');

  const resetForm = () => {
    setErrorMsg('');
    setIdentifier('');
    setPassword('');
    setRegName('');
    setRegStudentId('');
    setRegEmail('');
    setRegPassword('');
  };

  const handleClose = () => {
    resetForm();
    setAuthModalVisible(false);
  };

  const handleLogin = () => {
    setErrorMsg('');
    if (!identifier.trim()) {
      setErrorMsg('Vui lòng nhập Mã sinh viên (MSSV) hoặc Email VKU!');
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
    const res = register(
      regName,
      regStudentId,
      regEmail || `${regStudentId.trim().toLowerCase().replace('.', '')}@vku.udn.vn`,
      regMajor || 'Sinh viên VKU',
      regPassword || '123456'
    );
    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      resetForm();
    }
  };

  const handleQuickLogin = (studentId: string) => {
    setErrorMsg('');
    login(studentId, '123456');
    resetForm();
  };

  return (
    <Modal visible={authModalVisible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.schoolTag}>VKU CAMPUS AUTHENTICATION</Text>
              <Text style={styles.headerTitle}>
                {mode === 'LOGIN' ? '🔑 Đăng Nhập Sinh Viên' : '✨ Đăng Ký Tài Khoản VKU'}
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
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              </View>
            ) : null}

            {mode === 'LOGIN' ? (
              <View>
                <Text style={styles.label}>Mã Sinh Viên (MSSV) hoặc Email VKU *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 23IT.B219 hoặc thuongnt.23itb@vku.udn.vn"
                  placeholderTextColor="#94a3b8"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Mật khẩu</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu (mặc định: 123456)"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />

                <Pressable style={styles.primaryBtn} onPress={handleLogin}>
                  <Text style={styles.primaryBtnText}>🔑 Đăng Nhập Ngay</Text>
                </Pressable>

                {/* Quick Demo Accounts */}
                <View style={styles.quickBox}>
                  <Text style={styles.quickTitle}>⚡ Chọn nhanh tài khoản sinh viên có sẵn:</Text>
                  <View style={styles.quickChips}>
                    {availableUsers.map((u) => (
                      <Pressable
                        key={u.studentId}
                        style={styles.quickChip}
                        onPress={() => handleQuickLogin(u.studentId)}
                      >
                        <Text style={styles.quickChipName}>{u.name}</Text>
                        <Text style={styles.quickChipId}>MSSV: {u.studentId}</Text>
                      </Pressable>
                    ))}
                  </View>
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

                <Text style={styles.label}>Mã số sinh viên (MSSV) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 23IT.B219"
                  placeholderTextColor="#94a3b8"
                  value={regStudentId}
                  onChangeText={setRegStudentId}
                  autoCapitalize="characters"
                />

                <Text style={styles.label}>Email sinh viên VKU</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: thuongnt.23itb@vku.udn.vn"
                  placeholderTextColor="#94a3b8"
                  value={regEmail}
                  onChangeText={setRegEmail}
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Lớp / Chuyên ngành</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: Kỹ Thuật Phần Mềm (Lớp 23ITB)"
                  placeholderTextColor="#94a3b8"
                  value={regMajor}
                  onChangeText={setRegMajor}
                />

                <Text style={styles.label}>Mật khẩu</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tạo mật khẩu đăng nhập"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={regPassword}
                  onChangeText={setRegPassword}
                />

                <Pressable style={styles.primaryBtn} onPress={handleRegister}>
                  <Text style={styles.primaryBtnText}>✨ Tạo Tài Khoản & Đăng Nhập</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  schoolTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
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
    fontWeight: '800',
    color: '#64748b',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 6,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
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
    padding: 20,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0f172a',
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  quickBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  quickTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  quickChips: {
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  quickChipName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  quickChipId: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0284c7',
  },
});
