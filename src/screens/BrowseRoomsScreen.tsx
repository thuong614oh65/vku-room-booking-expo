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
  const { rooms, filters, bookings, currentUser, setAuthModalVisible, logout } = useBookingStore();

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

      return true;
    });
  }, [rooms, filters]);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header Bar */}
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.schoolHeader}>VKU CAMPUS • HỆ THỐNG ĐẶT PHÒNG HỌC</Text>
          <Text style={styles.screenTitle}>Tra Cứu Phòng Học & Lab</Text>
        </View>

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
            <Text style={styles.loginHeaderBtnText}>🔑 Đăng nhập / Đăng ký</Text>
          </Pressable>
        )}
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
