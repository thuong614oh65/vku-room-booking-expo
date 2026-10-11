import React, { useMemo, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
  Pressable,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/useBookingStore';
import { RoomCard } from '../components/RoomCard';
import { FilterBar } from '../components/FilterBar';
import { Room } from '../types/booking';
import { useRoomsQuery } from '../hooks/useRoomsQuery';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const BrowseRoomsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { data: serverRooms, isLoading, isFetching, refetch } = useRoomsQuery();
  const {
    rooms,
    filters,
    bookings,
    currentUser,
    setAuthModalVisible,
    setInstallModalVisible,
    isStandaloneApp,
    markAppAsInstalled,
    setIsStandaloneApp,
    refreshInstallState,
    logout,
  } = useBookingStore();

  const activeRooms = serverRooms || rooms;

  const todayStr = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const filteredRooms = useMemo(() => {
    return activeRooms.filter((room) => {
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

      if (filters.date || filters.slotId) {
        const targetDate = filters.date || todayStr;

        if (filters.slotId) {
          const isSlotBooked = bookings.some(
            (b) =>
              b.roomId === room.id &&
              b.date === targetDate &&
              b.slotId === filters.slotId &&
              b.status !== 'CANCELLED'
          );
          if (isSlotBooked) return false;
        } else {
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
  }, [activeRooms, filters, bookings, todayStr]);

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

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      refreshInstallState();

      const handleInstalled = () => {
        markAppAsInstalled();
      };

      window.addEventListener('appinstalled', handleInstalled);
      window.addEventListener('vku-app-installed', handleInstalled);

      const mq = window.matchMedia?.('(display-mode: standalone)');
      const handleModeChange = (e: MediaQueryListEvent) => {
        setIsStandaloneApp(e.matches);
      };
      mq?.addEventListener?.('change', handleModeChange);

      return () => {
        window.removeEventListener('appinstalled', handleInstalled);
        window.removeEventListener('vku-app-installed', handleInstalled);
        mq?.removeEventListener?.('change', handleModeChange);
      };
    }
  }, [markAppAsInstalled, setIsStandaloneApp, refreshInstallState]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* HEADER CHUẨN SẢN PHẨM THỰC TẾ */}
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>🏫</Text>
          </View>
          <View style={styles.brandTextWrap}>
            <Text style={styles.brandTitle}>VKU Room Booking</Text>
            <Text style={styles.brandSubtitle}>
              Đặt phòng học nhóm, phòng Lab & hội thảo trực tuyến
            </Text>
          </View>
        </View>

        <View style={styles.statusBar}>
          {!isStandaloneApp && (
            <Pressable
              style={styles.btnInstall}
              onPress={() => setInstallModalVisible(true)}
            >
              <Text style={styles.btnInstallText}>📲 Tải App</Text>
            </Pressable>
          )}

          {currentUser ? (
            <View style={styles.userAuthRow}>
              <Pressable
                style={styles.loggedInPill}
                onPress={() => (navigation as any).navigate('Profile')}
              >
                <Image
                  source={{ uri: currentUser.avatar }}
                  style={styles.headerAvatar}
                />
                <View style={{ maxWidth: 150 }}>
                  <Text style={styles.loggedInName} numberOfLines={1}>
                    {currentUser.name}
                  </Text>
                  <Text style={styles.loggedInSub} numberOfLines={1}>
                    {currentUser.studentId}
                  </Text>
                </View>
              </Pressable>
              <Pressable style={styles.logoutSmallBtn} onPress={logout}>
                <Text style={styles.logoutSmallText}>Đăng xuất</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.loginHeaderBtn}
              onPress={() => setAuthModalVisible(true)}
            >
              <Text style={styles.loginHeaderBtnText}>Đăng nhập</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Thanh tìm kiếm & bộ lọc */}
      <FilterBar />

      {/* Thanh kết quả */}
      <View style={styles.resultBanner}>
        <Text style={styles.resultCountText}>
          Hiện có <Text style={styles.resultCountBold}>{filteredRooms.length}</Text> phòng học & phòng Lab phù hợp
        </Text>
        <Pressable
          style={styles.quickBookingsBtn}
          onPress={() => (navigation as any).navigate('MyBookings')}
        >
          <Text style={styles.quickBookingsBtnText}>Lịch đã đặt →</Text>
        </Pressable>
      </View>

      {/* Danh sách phòng học */}
      <FlatList
        data={filteredRooms}
        renderItem={renderRoomItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={5}
        refreshing={isLoading || isFetching}
        onRefresh={refetch}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        removeClippedSubviews={Platform.OS !== 'web'}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Không tìm thấy phòng phù hợp</Text>
            <Text style={styles.emptySub}>
              Vui lòng thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc tòa nhà, sức chứa.
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
    paddingTop: Platform.OS === 'android' ? 36 : 12,
    paddingBottom: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexWrap: 'wrap',
    gap: 10,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 240,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconText: {
    fontSize: 20,
  },
  brandTextWrap: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginTop: 1,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  btnInstall: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  btnInstallText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  loginHeaderBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loginHeaderBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  userAuthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loggedInPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 24,
    gap: 8,
  },
  headerAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#334155',
  },
  loggedInName: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
  loggedInSub: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '600',
  },
  logoutSmallBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
  },
  logoutSmallText: {
    color: '#fca5a5',
    fontSize: 11.5,
    fontWeight: '700',
  },
  resultBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  resultCountText: {
    fontSize: 12.5,
    color: '#475569',
  },
  resultCountBold: {
    color: '#0284c7',
    fontWeight: '800',
  },
  quickBookingsBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#e0f2fe',
  },
  quickBookingsBtnText: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 28,
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});
