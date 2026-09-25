import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { useBookingStore } from '../store/useBookingStore';

export const AccountSwitcherBar: React.FC = () => {
  const { currentUser, availableUsers, switchUser, loginCustomUser, bookings } = useBookingStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customId, setCustomId] = useState('');

  const myActiveCount = bookings.filter(
    (b) => b.studentId === currentUser.studentId && b.status !== 'CANCELLED'
  ).length;

  const handleAddUser = () => {
    if (!customName.trim() || !customId.trim()) return;
    loginCustomUser(customName, customId);
    setCustomName('');
    setCustomId('');
    setModalVisible(false);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        <View style={styles.currentBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.currentLabel} numberOfLines={1}>
            👤 Đang dùng: <Text style={styles.boldText}>{currentUser.name}</Text> ({currentUser.studentId})
          </Text>
        </View>
        <View style={styles.myCountPill}>
          <Text style={styles.myCountText}>📌 Đã đặt: {myActiveCount} ca</Text>
        </View>
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchHint}>Đổi nhanh SV để test trùng lịch:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.userChips}>
          {availableUsers.map((u) => {
            const active = u.studentId === currentUser.studentId;
            return (
              <Pressable
                key={u.studentId}
                style={[styles.userChip, active && styles.userChipActive]}
                onPress={() => switchUser(u.studentId)}
              >
                <Text style={[styles.userChipText, active && styles.userChipTextActive]}>
                  {active ? '✓ ' : ''}{u.name.split(' ').slice(-2).join(' ')} ({u.studentId})
                </Text>
              </Pressable>
            );
          })}
          <Pressable style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>+ Nhập MSSV khác</Text>
          </Pressable>
        </ScrollView>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🎓 Đăng Nhập Tài Khoản Sinh Viên VKU</Text>
            <Text style={styles.modalSub}>
              Nhập Họ tên và Mã sinh viên để hệ thống định danh lịch đặt phòng riêng của bạn:
            </Text>

            <Text style={styles.inputLabel}>Họ và tên sinh viên:</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Nguyễn Thị Thương"
              value={customName}
              onChangeText={setCustomName}
            />

            <Text style={styles.inputLabel}>Mã số sinh viên (MSSV):</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 23IT.B219"
              value={customId}
              onChangeText={setCustomId}
              autoCapitalize="characters"
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={handleAddUser}>
                <Text style={styles.confirmBtnText}>Đăng Nhập Ngay</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  currentLabel: {
    color: '#f8fafc',
    fontSize: 12,
  },
  boldText: {
    fontWeight: '800',
    color: '#38bdf8',
  },
  myCountPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  myCountText: {
    color: '#fde047',
    fontSize: 11,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchHint: {
    color: '#94a3b8',
    fontSize: 11,
    marginRight: 8,
    fontWeight: '600',
  },
  userChips: {
    gap: 6,
    alignItems: 'center',
  },
  userChip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  userChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  userChipText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  userChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  addBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
  },
  addBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14,
    lineHeight: 17,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#0f172a',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0284c7',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
});
