import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/useBookingStore';
import { Booking, BookingStatus } from '../types/booking';
import { TIME_SLOTS } from '../data/roomsData';
import { CameraQRScannerModal } from '../components/CameraQRScannerModal';
import { openFieldSurveyEvaluation } from '../services/fieldSurveyLinkService';

type FilterType = 'ALL' | BookingStatus;

export const MyBookingsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    bookings,
    waitlist,
    cancelBooking,
    checkInBooking,
    currentUser,
    setAuthModalVisible,
  } = useBookingStore();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('ALL');
  const [scannerBooking, setScannerBooking] = useState<Booking | null>(null);

  // Lọc danh sách đặt phòng của sinh viên hiện tại
  const myBookings = useMemo(() => {
    if (!currentUser) return [];
    return bookings.filter((b) => b.studentId === currentUser.studentId);
  }, [bookings, currentUser]);

  // Bộ lọc theo Ngày & Giờ (ca học)
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [slotFilter, setSlotFilter] = useState<string | null>(null);

  const bookingDates = useMemo(() => {
    const set = new Set(myBookings.map((b) => b.date));
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [myBookings]);

  const formatDate = (iso: string) => {
    if (!iso || !iso.includes('-')) return iso;
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const filteredBookings = useMemo(() => {
    return myBookings.filter((b) => {
      if (selectedFilter !== 'ALL' && b.status !== selectedFilter) return false;
      if (dateFilter && b.date !== dateFilter) return false;
      if (slotFilter && b.slotId !== slotFilter) return false;
      return true;
    });
  }, [myBookings, selectedFilter, dateFilter, slotFilter]);

  const myWaitlist = useMemo(() => {
    if (!currentUser) return [];
    return waitlist.filter((w) => w.studentId === currentUser.studentId);
  }, [waitlist, currentUser]);

  const confirmedCount = myBookings.filter((b) => b.status === 'CONFIRMED').length;
  const checkedInCount = myBookings.filter((b) => b.status === 'CHECKED_IN').length;
  const cancelledCount = myBookings.filter((b) => b.status === 'CANCELLED').length;

  const handleCancel = (booking: Booking) => {
    cancelBooking(booking.id);
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.guestContainer}>
          <View style={styles.guestCard}>
            <Text style={styles.guestIcon}>📅</Text>
            <Text style={styles.guestTitle}>Lịch Đặt Phòng Của Tôi</Text>
            <Text style={styles.guestDesc}>
              Đăng nhập tài khoản sinh viên VKU để theo dõi các phòng đã đặt, quản lý thời gian nhận phòng và mở mã QR Check-in tại cửa phòng.
            </Text>
            <Pressable
              style={styles.guestLoginBtn}
              onPress={() => setAuthModalVisible(true)}
            >
              <Text style={styles.guestLoginBtnText}>Đăng Nhập Tài Khoản</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const isCheckedIn = item.status === 'CHECKED_IN';
    const isCancelled = item.status === 'CANCELLED';
    const isConfirmed = item.status === 'CONFIRMED';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
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
              {isCheckedIn ? 'Đã nhận phòng' : isCancelled ? 'Đã huỷ' : 'Sắp tới'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍 Vị trí:</Text>
            <Text style={styles.infoValue}>
              {item.building} • {item.floor}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📅 Ngày:</Text>
            <Text style={styles.infoValue}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>⏰ Ca học:</Text>
            <Text style={styles.infoValueHighlight}>{item.slotLabel}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📝 Nội dung:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {item.purpose}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          <Pressable
            style={styles.viewPassBtn}
            onPress={() =>
              navigation.navigate('BookingConfirmationPass', { bookingId: item.id })
            }
          >
            <Text style={styles.viewPassBtnText}>🎟️ Mở Thẻ QR</Text>
          </Pressable>

          <Pressable
            style={{
              backgroundColor: '#f0fdf4',
              borderWidth: 1,
              borderColor: '#86efac',
              borderRadius: 10,
              paddingVertical: 10,
              paddingHorizontal: 11,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() =>
              openFieldSurveyEvaluation({
                roomCode: item.roomCode,
                roomName: item.roomName,
                building: item.building,
                floor: item.floor,
                studentName: item.studentName,
                studentId: item.studentId,
              })
            }
          >
            <Text style={{ color: '#15803d', fontSize: 12.5, fontWeight: '800' }}>
              📊 Đánh Giá CSVC
            </Text>
          </Pressable>

          {isConfirmed && (
            <View style={styles.confirmedActions}>
              <Pressable
                style={styles.checkInQuickBtn}
                onPress={() => setScannerBooking(item)}
              >
                <Text style={styles.checkInQuickBtnText}>📷 Quét QR</Text>
              </Pressable>
              <Pressable
                style={styles.cancelQuickBtn}
                onPress={() => handleCancel(item)}
              >
                <Text style={styles.cancelQuickBtnText}>Huỷ lịch</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Lịch Đặt Phòng Của Tôi</Text>
          <Text style={styles.headerSub}>
            {currentUser?.name} • MSSV: {currentUser?.studentId}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {confirmedCount > 0 && (
            <Pressable
              style={[styles.newBookingHeaderBtn, { backgroundColor: '#16a34a' }]}
              onPress={() => {
                const firstConfirmed = myBookings.find((b) => b.status === 'CONFIRMED');
                if (firstConfirmed) setScannerBooking(firstConfirmed);
              }}
            >
              <Text style={styles.newBookingHeaderBtnText}>📷 Quét QR</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.newBookingHeaderBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'BrowseRooms' })}
          >
            <Text style={styles.newBookingHeaderBtnText}>+ Đặt phòng</Text>
          </Pressable>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(
          [
            { key: 'ALL', label: `Tất cả (${myBookings.length})` },
            { key: 'CONFIRMED', label: `Sắp tới (${confirmedCount})` },
            { key: 'CHECKED_IN', label: `Đã nhận (${checkedInCount})` },
            { key: 'CANCELLED', label: `Đã huỷ (${cancelledCount})` },
          ] as { key: FilterType; label: string }[]
        ).map((tab) => {
          const isActive = selectedFilter === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSelectedFilter(tab.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Date & Time Filter */}
      {myBookings.length > 0 && (
        <View style={styles.dateTimeFilterWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateTimeChips}
          >
            <Pressable
              style={[styles.filterChip, dateFilter === null && styles.filterChipActive]}
              onPress={() => setDateFilter(null)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  dateFilter === null && styles.filterChipTextActive,
                ]}
              >
                Tất cả ngày
              </Text>
            </Pressable>
            {bookingDates.map((d) => {
              const active = dateFilter === d;
              return (
                <Pressable
                  key={d}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setDateFilter(active ? null : d)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    📅 {formatDate(d)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.dateTimeChips, { marginTop: 6 }]}
          >
            <Pressable
              style={[styles.filterChip, slotFilter === null && styles.filterChipActive]}
              onPress={() => setSlotFilter(null)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  slotFilter === null && styles.filterChipTextActive,
                ]}
              >
                Tất cả ca học
              </Text>
            </Pressable>
            {TIME_SLOTS.map((slot) => {
              const active = slotFilter === slot.id;
              return (
                <Pressable
                  key={slot.id}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSlotFilter(active ? null : slot.id)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    ⏰ {slot.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {(dateFilter || slotFilter) && (
            <Pressable
              onPress={() => {
                setDateFilter(null);
                setSlotFilter(null);
              }}
            >
              <Text style={styles.clearDateTimeText}>
                ✕ Xóa bộ lọc thời gian ({filteredBookings.length} kết quả)
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Waitlist Notice Card */}
      {myWaitlist.length > 0 && (
        <View style={styles.waitlistBanner}>
          <Text style={styles.waitlistBannerTitle}>
            🔔 Danh sách chờ phòng trống ({myWaitlist.length}):
          </Text>
          {myWaitlist.map((w) => (
            <Text key={w.id} style={styles.waitlistItemText}>
              • Ngày {formatDate(w.date)} - Ca học: {w.slotId} (Hệ thống sẽ thông báo ngay khi có phòng trống)
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
              Bạn chưa có lịch mượn phòng học hoặc phòng Lab nào trong mục này. Hãy chọn phòng phù hợp để đặt lịch học nhóm hoặc nghiên cứu.
            </Text>
            <Pressable
              style={styles.emptyButton}
              onPress={() => navigation.navigate('MainTabs', { screen: 'BrowseRooms' })}
            >
              <Text style={styles.emptyButtonText}>Tìm và đặt phòng ngay</Text>
            </Pressable>
          </View>
        }
      />

      {scannerBooking && (
        <CameraQRScannerModal
          visible={Boolean(scannerBooking)}
          expectedRoomCode={scannerBooking.roomCode}
          expectedBookingId={scannerBooking.id}
          onClose={() => setScannerBooking(null)}
          onScanSuccess={(_decoded) => {
            const targetId = scannerBooking.id;
            setScannerBooking(null);
            checkInBooking(targetId);
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  guestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    maxWidth: 400,
  },
  guestIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  guestDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 19,
  },
  guestLoginBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  guestLoginBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  newBookingHeaderBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newBookingHeaderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#ffffff',
    flexWrap: 'wrap',
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
    fontWeight: '600',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dateTimeFilterWrap: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dateTimeChips: {
    gap: 8,
    paddingBottom: 2,
  },
  clearDateTimeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#ef4444',
    marginTop: 8,
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
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
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
    fontWeight: '700',
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
    fontSize: 12.5,
    color: '#0f172a',
    flex: 1,
    fontWeight: '600',
  },
  infoValueHighlight: {
    fontSize: 12.5,
    color: '#0284c7',
    flex: 1,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  viewPassBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewPassBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  confirmedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  checkInQuickBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  checkInQuickBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelQuickBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelQuickBtnText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    maxWidth: 420,
  },
  emptyButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});