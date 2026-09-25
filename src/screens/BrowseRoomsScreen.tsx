import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/useBookingStore';
import { RoomCard } from '../components/RoomCard';
import { FilterBar } from '../components/FilterBar';
import { AccountSwitcherBar } from '../components/AccountSwitcherBar';
import { Room } from '../types/booking';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const BrowseRoomsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { rooms, filters, bookings } = useBookingStore();

  // Lọc danh sách phòng theo search & chips đa tham số
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // 1. Search query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchName = room.name.toLowerCase().includes(query);
        const matchCode = room.code.toLowerCase().includes(query);
        const matchDesc = room.description.toLowerCase().includes(query);
        const matchBuilding = room.building.toLowerCase().includes(query);
        if (!matchName && !matchCode && !matchDesc && !matchBuilding) return false;
      }

      // 2. Building filter
      if (filters.building !== 'ALL' && room.building !== filters.building) {
        return false;
      }

      // 3. Capacity filter
      if (filters.minCapacity !== null && room.capacity < filters.minCapacity) {
        return false;
      }

      // 4. Equipment filter (phải thỏa mãn tất cả trang thiết bị được chọn)
      if (filters.equipment.length > 0) {
        const hasAllEq = filters.equipment.every((eq) => room.equipment.includes(eq));
        if (!hasAllEq) return false;
      }

      return true;
    });
  }, [rooms, filters]);

  // Kiểm tra phòng có slot trống hôm nay không
  const todayStr = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const isRoomAvailableToday = useCallback(
    (roomId: string) => {
      const todayBookingsCount = bookings.filter(
        (b) => b.roomId === roomId && b.date === todayStr && b.status !== 'CANCELLED'
      ).length;
      return todayBookingsCount < 5; // Có 5 slot/ngày, nếu < 5 là còn trống
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Account Switcher Bar */}
      <AccountSwitcherBar />

      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.schoolHeader}>VKU CAMPUS • HỆ THỐNG ĐẶT PHÒNG HỌC</Text>
          <Text style={styles.screenTitle}>Tra Cứu Phòng Học & Lab</Text>
        </View>
        <View style={styles.statusLiveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Real-time</Text>
        </View>
      </View>

      {/* Multi-parameter Filter Bar */}
      <FilterBar />

      {/* Result Count Banner */}
      <View style={styles.resultBanner}>
        <Text style={styles.resultCountText}>
          Tìm thấy <Text style={styles.resultCountBold}>{filteredRooms.length}</Text> phòng học & lab khả dụng
        </Text>
        <Text style={styles.resultSubText}>60fps Scroll Optimized</Text>
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
    paddingTop: Platform.OS === 'android' ? 36 : 12,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  schoolHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.5,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 1,
  },
  statusLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
    marginRight: 5,
  },
  liveText: {
    color: '#15803d',
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
    color: '#94a3b8',
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
