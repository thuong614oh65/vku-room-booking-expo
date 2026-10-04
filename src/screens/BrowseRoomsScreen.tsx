import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, StatusBar, Platform, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/useBookingStore';
import { RoomCard } from '../components/RoomCard';
import { FilterBar } from '../components/FilterBar';
import { Room } from '../types/booking';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const BrowseRoomsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    rooms,
    filters,
    bookings,
    currentUser,
    setAuthModalVisible,
    setInstallModalVisible,
    setSysInfoModalVisible,
    isAppInstalled,
    isStandaloneApp,
    logout,
  } = useBookingStore();

  const todayStr = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchName = room.name.toLowerCase().includes(query);
        const matchCode = room.code.toLowerCase().includes(query);
        const matchDesc = room.description.toLowerCase().includes(query);
        const matchBuilding = room.building.toLowerCase().includes(query);
        if (!matchName && !matchCode && !matchDesc && !matchBuilding) return false;
      }

      if (filters.building !== 'ALL' && room.building !== filters.building) {
        return false;
      }

      if (filters.minCapacity !== null && room.capacity < filters.minCapacity) {
        return false;
      }

      if (filters.equipment.length > 0) {
        const hasAllEq = filters.equipment.every((eq) => room.equipment.includes(eq));
        if (!hasAllEq) return false;
      }

      // Lọc theo Ngày & Giờ (Ca học)
      if (filters.date || filters.slotId) {
        const targetDate = filters.date || todayStr;

        if (filters.slotId) {
          // Lọc chính xác ca học: phòng phải TRỐNG đúng ca đó vào ngày đó
          const isSlotBooked = bookings.some(
            (b) =>
              b.roomId === room.id &&
              b.date === targetDate &&
              b.slotId === filters.slotId &&
              b.status !== 'CANCELLED'
          );
          if (isSlotBooked) return false;
        } else {
          // Chỉ chọn ngày: phòng phải còn ít nhất 1 ca học trống trong ngày
          const bookedCount = bookings.filter(
            (b) =>
              b.roomId === room.id &&
              b.date === targetDate &&
              b.status !== 'CANCELLED'
          ).length;
          if (bookedCount >= 5) return false;
        }
      }

      return true;
    });
  }, [rooms, filters, bookings, todayStr]);

  const isRoomAvailableToday = useCallback(
    (roomId: string) => {
      const todayBookingsCount = bookings.filter(
        (b) => b.roomId === roomId && b.date === todayStr && b.status !== 'CANCELLED'
      ).length;
      return todayBookingsCount < 5;
    },
    [bookings, todayStr]
  );

  const handleSelectRoom = useCallback(
    (roomId: string) => {
      navigation.navigate('RoomDetails', { roomId });
    },
    [navigation]
  );

  const renderRoomItem = useCallback(
    ({ item }: { item: Room }) => (
      <RoomCard
        room={item}
        isAvailableToday={isRoomAvailableToday(item.id)}
        onPress={() => handleSelectRoom(item.id)}
      />
    ),
    [isRoomAvailableToday, handleSelectRoom]
  );

  const handleInstallPress = useCallback(async () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const prompt = (window as any).__vkuDeferredPrompt;
      if (prompt) {
        try {
          prompt.prompt();
          const choice = await prompt.userChoice;
          if (choice && choice.outcome === 'accepted') {
            (window as any).__vkuDeferredPrompt = null;
            return;
          }
        } catch (e) {
          console.log('Direct install prompt trigger fallback:', e);
        }
      }
    }
    setInstallModalVisible(true);
  }, [setInstallModalVisible]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* HEADER DOANH NGHIỆP CHUẨN HOÁ GIỐNG VKU FIELD SURVEY */}
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>🏫</Text>
          </View>
          <View style={styles.brandTextWrap}>
            <Text style={styles.brandTitle}>VKU Room Booking</Text>
            <Text style={styles.brandSubtitle}>
              Hệ thống đặt phòng học & kiểm soát mã QR thông minh
            </Text>
          </View>
        </View>

        <View style={styles.statusBar}>
          <Pressable
            style={[
              styles.btnInstall,
              isStandaloneApp
                ? styles.btnInstallStandalone
                : isAppInstalled
                ? styles.btnInstallInstalled
                : null,
            ]}
            onPress={handleInstallPress}
          >
            <Text style={styles.btnInstallText}>
              {isStandaloneApp ? '🟢 Đang Trong App' : isAppInstalled ? '🚀 Vào App' : '📲 Cài Đặt App'}
            </Text>
          </Pressable>

          <View style={styles.badgeOnline}>
            <Text style={styles.badgeOnlineText}>🟢 Online</Text>
          </View>

          <View style={styles.badgePending}>
            <Text style={styles.badgePendingText}>⚡ Real-time</Text>
          </View>

          <Pressable
            style={styles.btnInfoIcon}
            onPress={() => setSysInfoModalVisible(true)}
            accessibilityLabel="Thông số kỹ thuật"
          >
            <Text style={styles.btnInfoIconText}>ℹ️</Text>
          </Pressable>

          {currentUser ? (
            <View style={styles.userAuthRow}>
              <Pressable style={styles.loggedInPill} onPress={() => setAuthModalVisible(true)}>
                <View style={styles.liveDot} />
                <Text style={styles.loggedInText} numberOfLines={1}>
                  {currentUser.name} ({currentUser.studentId})
                </Text>
              </Pressable>
              <Pressable style={styles.logoutSmallBtn} onPress={logout}>
                <Text style={styles.logoutSmallText}>Thoát</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.loginHeaderBtn} onPress={() => setAuthModalVisible(true)}>
              <Text style={styles.loginHeaderBtnText}>🔑 Đăng nhập</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Multi-parameter Filter Bar */}
      <FilterBar />

      {/* Result Count Banner */}
      <View style={styles.resultBanner}>
        <Text style={styles.resultCountText}>
          Tìm thấy <Text style={styles.resultCountBold}>{filteredRooms.length}</Text> phòng học & lab khả dụng
        </Text>
        <Text style={styles.resultSubText}>
          {currentUser ? `Đang đăng nhập: ${currentUser.studentId}` : 'Chế độ Khách (Chưa đăng nhập)'}
        </Text>
      </View>

      {/* High-performance FlatList Feed */}
      <FlatList
        data={filteredRooms}
        renderItem={renderRoomItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={Platform.OS !== 'web'}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Không tìm thấy phòng phù hợp</Text>
            <Text style={styles.emptySub}>
              Vui lòng thử nới lỏng bộ lọc sức chứa hoặc trang thiết bị để xem thêm kết quả.
            </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 14,
    paddingBottom: 14,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexWrap: 'wrap',
    gap: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 260,
  },
  logoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(2, 132, 199, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(2, 132, 199, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconText: {
    fontSize: 22,
  },
  brandTextWrap: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  btnInstall: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  btnInstallInstalled: {
    backgroundColor: '#7c3aed',
    shadowColor: '#7c3aed',
  },
  btnInstallStandalone: {
    backgroundColor: '#16a34a',
    shadowColor: '#16a34a',
  },
  btnInstallText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  badgeOnline: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeOnlineText: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '700',
  },
  badgePending: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.35)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgePendingText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  btnInfoIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnInfoIconText: {
    fontSize: 13,
  },
  loginHeaderBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  loginHeaderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  userAuthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loggedInPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: 190,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16a34a',
    marginRight: 6,
  },
  loggedInText: {
    color: '#15803d',
    fontSize: 11.5,
    fontWeight: '800',
  },
  logoutSmallBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutSmallText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '700',
  },
  resultBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
  },
  resultCountText: {
    fontSize: 12,
    color: '#64748b',
  },
  resultCountBold: {
    color: '#0284c7',
    fontWeight: '800',
  },
  resultSubText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});
