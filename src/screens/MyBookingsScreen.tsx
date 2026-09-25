import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  SafeAreaView,
  Alert,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabParamList, RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/useBookingStore';
import { Booking, BookingStatus } from '../types/booking';

type Props = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'MyBookings'>,
  NativeStackScreenProps<RootStackParamList>
>;

type FilterType = 'ALL' | BookingStatus;

export const MyBookingsScreen: React.FC<Props> = ({ navigation }) => {
  const { bookings, waitlist, cancelBooking, checkInBooking, currentUser, setAuthModalVisible } = useBookingStore();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('ALL');

  // Lọc danh sách đặt phòng của sinh viên hiện tại
  const myBookings = useMemo(() => {
    if (!currentUser) return [];
    return bookings.filter((b) => b.studentId === currentUser.studentId);
  }, [bookings, currentUser]);

  const filteredBookings = useMemo(() => {
    if (selectedFilter === 'ALL') return myBookings;
    return myBookings.filter((b) => b.status === selectedFilter);
  }, [myBookings, selectedFilter]);

  const handleCancel = (booking: Booking) => {
    Alert.alert(
      'Xác nhận huỷ phòng',
      `Bạn có chắc chắn muốn huỷ lịch đặt phòng ${booking.roomName} (${booking.slotLabel}) không? Phòng sẽ được giải phóng ngay lập tức cho các bạn khác trong danh sách chờ.`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Huỷ đặt phòng',
          style: 'destructive',
          onPress: () => cancelBooking(booking.id),
        },
      ]
    );
  };

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const isCheckedIn = item.status === 'CHECKED_IN';
    const isCancelled = item.status === 'CANCELLED';
    const isConfirmed = item.status === 'CONFIRMED';

    if (!currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🔒</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 6, textAlign: 'center' }}>
            Bạn chưa đăng nhập tài khoản
          </Text>
          <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 20, lineHeight: 19 }}>
            Vui lòng Đăng nhập hoặc Đăng ký tài khoản sinh viên VKU để xem danh sách các phòng bạn đã đặt và lấy mã QR Check-in.
          </Text>
          <Pressable
            style={{ backgroundColor: '#0284c7', paddingHorizontal: 22, paddingVertical: 13, borderRadius: 12 }}
            onPress={() => setAuthModalVisible(true)}
          >
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>🔑 Đăng Nhập / Đăng Ký Ngay</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.roomCode}>{item.roomCode}</Text>
            <Text style={styles.roomName}>{item.roomName}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isCheckedIn
                ? styles.statusBadgeChecked
                : isCancelled
                ? styles.statusBadgeCancelled
                : styles.statusBadgeConfirmed,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isCheckedIn
                  ? styles.statusTextChecked
                  : isCancelled
                  ? styles.statusTextCancelled
                  : styles.statusTextConfirmed,
              ]}
            >
              {isCheckedIn ? 'Đã Check-in' : isCancelled ? 'Đã huỷ' : 'Đã xác nhận'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍 Vị trí:</Text>
            <Text style={styles.infoValue}>{item.building} • {item.floor}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📅 Ngày:</Text>
            <Text style={styles.infoValue}>{item.date}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>⏰ Khung giờ:</Text>
            <Text style={styles.infoValueHighlight}>{item.slotLabel}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🎯 Mục đích:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{item.purpose}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          <Pressable
            style={styles.viewPassBtn}
            onPress={() => navigation.navigate('BookingConfirmationPass', { bookingId: item.id })}
          >
            <Text style={styles.viewPassBtnText}>🎟️ Xem Thẻ Pass QR</Text>
          </Pressable>

          {isConfirmed && (
            <View style={styles.confirmedActions}>
              <Pressable
                style={styles.checkInQuickBtn}
                onPress={() => checkInBooking(item.id)}
              >
                <Text style={styles.checkInQuickBtnText}>Check-in</Text>
              </Pressable>
              <Pressable
                style={styles.cancelQuickBtn}
                onPress={() => handleCancel(item)}
              >
                <Text style={styles.cancelQuickBtnText}>Huỷ</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  };

  const myWaitlist = useMemo(() => {
    return waitlist.filter((w) => w.studentId === currentUser.studentId);
  }, [waitlist, currentUser.studentId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch Đặt Phòng Của Tôi</Text>
        <Text style={styles.headerSub}>
          {currentUser.name} • {currentUser.studentId}
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(
          [
            { key: 'ALL', label: `Tất cả (${myBookings.length})` },
            { key: 'CONFIRMED', label: 'Sắp tới' },
            { key: 'CHECKED_IN', label: 'Đã vào phòng' },
            { key: 'CANCELLED', label: 'Đã huỷ' },
          ] as { key: FilterType; label: string }[]
        ).map((tab) => {
          const isActive = selectedFilter === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSelectedFilter(tab.key)}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Waitlist Notice Card (If any active queue) */}
      {myWaitlist.length > 0 && (
        <View style={styles.waitlistBanner}>
          <Text style={styles.waitlistBannerTitle}>
            🔔 Bạn đang theo dõi {myWaitlist.length} khung giờ trong Hàng Đợi (Waitlist):
          </Text>
          {myWaitlist.map((w) => (
            <Text key={w.id} style={styles.waitlistItemText}>
              • Ngày {w.date} - Ca học: {w.slotId} (Sẽ báo ngay khi có phòng trống)
            </Text>
          ))}
        </View>
      )}

      {/* FlatList */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingItem}
        contentContainerStyle={styles.listContent}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Chưa có lịch đặt phòng nào</Text>
            <Text style={styles.emptySub}>
              Khám phá danh sách phòng học VKU và đặt lịch để cùng học nhóm ngay hôm nay!
            </Text>
            <Pressable
              style={styles.emptyButton}
              onPress={() => navigation.navigate('BrowseRooms')}
            >
              <Text style={styles.emptyButtonText}>🔍 Tìm phòng học ngay</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  filterChipActive: {
    backgroundColor: '#0284c7',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  waitlistBanner: {
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
  },
  waitlistBannerTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#7e22ce',
    marginBottom: 4,
  },
  waitlistItemText: {
    fontSize: 11.5,
    color: '#6b21a8',
    lineHeight: 18,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 10,
  },
  roomCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284c7',
  },
  roomName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeConfirmed: {
    backgroundColor: '#e0f2fe',
  },
  statusBadgeChecked: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeCancelled: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusTextConfirmed: {
    color: '#0284c7',
  },
  statusTextChecked: {
    color: '#16a34a',
  },
  statusTextCancelled: {
    color: '#dc2626',
  },
  cardBody: {
    gap: 6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    width: 90,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    color: '#0f172a',
    flex: 1,
    fontWeight: '600',
  },
  infoValueHighlight: {
    fontSize: 12,
    color: '#0284c7',
    flex: 1,
    fontWeight: '800',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  viewPassBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  viewPassBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  confirmedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  checkInQuickBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  checkInQuickBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  cancelQuickBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  cancelQuickBtnText: {
    color: '#dc2626',
    fontSize: 11.5,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
