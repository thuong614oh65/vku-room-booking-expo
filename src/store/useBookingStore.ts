import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Booking, ConflictResolution, Equipment, FilterState, Room, UserProfile, Building } from '../types/booking';
import { INITIAL_ROOMS, DEMO_USERS, TIME_SLOTS, getSeedBookings } from '../data/roomsData';
import { notificationService } from '../services/notificationService';
import {
  subscribeToBookings,
  atomicAddBooking,
  atomicCancelBooking,
  atomicCheckInBooking,
  seedFirestoreIfEmpty,
} from '../services/realtimeBookingService';

interface WaitlistItem {
  id: string;
  roomId: string;
  date: string;
  slotId: string;
  studentId: string;
  studentName: string;
  createdAt: number;
}

interface SyncStatus {
  isOnline: boolean;
  isConnecting: boolean;
  lastSyncedAt: string | null;
  error: string | null;
}

interface BookingState {
  rooms: Room[];
  bookings: Booking[];
  currentUser: UserProfile | null;
  availableUsers: UserProfile[];
  authModalVisible: boolean;
  filters: FilterState;
  waitlist: WaitlistItem[];
  syncStatus: SyncStatus;

  // Sync actions (internal)
  _setBookingsFromFirestore: (bookings: Booking[]) => void;
  _setSyncStatus: (status: Partial<SyncStatus>) => void;

  // Auth actions
  setAuthModalVisible: (visible: boolean) => void;
  login: (identifier: string, password?: string) => { success: boolean; message: string };
  register: (
    name: string,
    studentId: string,
    email: string,
    major: string,
    password?: string
  ) => { success: boolean; message: string };
  logout: () => void;

  // Filter actions
  setSearchQuery: (query: string) => void;
  setBuildingFilter: (building: Building | 'ALL') => void;
  setMinCapacityFilter: (capacity: number | null) => void;
  toggleEquipmentFilter: (equipment: Equipment) => void;
  resetFilters: () => void;

  // Conflict detection & resolution engine
  checkSlotConflict: (roomId: string, date: string, slotId: string) => ConflictResolution;
  isSlotBooked: (roomId: string, date: string, slotId: string) => boolean;
  getSlotBooking: (roomId: string, date: string, slotId: string) => Booking | undefined;

  // Booking actions (now async with Firestore)
  addBooking: (
    data: Omit<Booking, 'id' | 'createdAt' | 'status' | 'qrCodeData'>
  ) => Promise<{ success: boolean; booking?: Booking; conflict?: ConflictResolution }>;

  cancelBooking: (id: string) => Promise<void>;
  checkInBooking: (id: string) => Promise<void>;

  // Waitlist actions
  joinWaitlist: (roomId: string, date: string, slotId: string) => void;
  isUserInWaitlist: (roomId: string, date: string, slotId: string) => boolean;
}

const INITIAL_FILTERS: FilterState = {
  searchQuery: '',
  building: 'ALL',
  minCapacity: null,
  equipment: [],
};

const INITIAL_SYNC: SyncStatus = {
  isOnline: false,
  isConnecting: true,
  lastSyncedAt: null,
  error: null,
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      rooms: INITIAL_ROOMS,
      bookings: getSeedBookings(),
      currentUser: null, // Guest mode mặc định
      availableUsers: DEMO_USERS,
      authModalVisible: false,
      filters: INITIAL_FILTERS,
      waitlist: [],
      syncStatus: INITIAL_SYNC,

      // ── Internal sync actions ──────────────────────────────────────────────
      _setBookingsFromFirestore: (bookings) => {
        set({ bookings });
      },

      _setSyncStatus: (status) => {
        set((state) => ({ syncStatus: { ...state.syncStatus, ...status } }));
      },

      // ── Auth ───────────────────────────────────────────────────────────────
      setAuthModalVisible: (visible) => set({ authModalVisible: visible }),

      login: (identifier, _password) => {
        const q = identifier.trim().toLowerCase();
        const found = get().availableUsers.find(
          (u) =>
            u.studentId.toLowerCase() === q ||
            u.email.toLowerCase() === q ||
            u.name.toLowerCase() === q
        );

        if (!found) {
          return {
            success: false,
            message: 'Không tìm thấy tài khoản với MSSV/Email này. Vui lòng chuyển sang tab "Đăng Ký Mới"!',
          };
        }

        set({ currentUser: found, authModalVisible: false });
        notificationService.notify(
          `👋 Xin chào ${found.name}!`,
          `Đăng nhập thành công (MSSV: ${found.studentId}). Bây giờ bạn có thể đặt phòng học.`,
          'SUCCESS'
        );
        return { success: true, message: 'Đăng nhập thành công' };
      },

      register: (name, studentId, email, major, _password) => {
        const cleanId = studentId.trim().toUpperCase();
        const cleanName = name.trim();
        const cleanEmail = email.trim() || `${cleanId.toLowerCase().replace('.', '')}@vku.udn.vn`;

        const exists = get().availableUsers.some(
          (u) => u.studentId.toUpperCase() === cleanId
        );
        if (exists) {
          return {
            success: false,
            message: `Mã sinh viên ${cleanId} đã được đăng ký. Vui lòng chuyển sang tab Đăng Nhập!`,
          };
        }

        const newUser: UserProfile = {
          name: cleanName,
          studentId: cleanId,
          email: cleanEmail,
          major: major.trim() || 'Sinh viên VKU',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        };

        set((state) => ({
          availableUsers: [newUser, ...state.availableUsers],
          currentUser: newUser,
          authModalVisible: false,
        }));

        notificationService.notify(
          `🎉 Đăng ký thành công: ${cleanName}`,
          `Tài khoản MSSV ${cleanId} đã được kích hoạt và tự động đăng nhập.`,
          'SUCCESS'
        );
        return { success: true, message: 'Đăng ký thành công' };
      },

      logout: () => {
        const prev = get().currentUser;
        set({ currentUser: null });
        if (prev) {
          notificationService.notify(
            '🚪 Đã đăng xuất',
            `Bạn đã đăng xuất khỏi tài khoản ${prev.name} (${prev.studentId}).`,
            'REMINDER'
          );
        }
      },

      // ── Filters ────────────────────────────────────────────────────────────
      setSearchQuery: (searchQuery) =>
        set((state) => ({ filters: { ...state.filters, searchQuery } })),

      setBuildingFilter: (building) =>
        set((state) => ({ filters: { ...state.filters, building } })),

      setMinCapacityFilter: (minCapacity) =>
        set((state) => ({ filters: { ...state.filters, minCapacity } })),

      toggleEquipmentFilter: (equipment) =>
        set((state) => {
          const current = state.filters.equipment;
          const exists = current.includes(equipment);
          const next = exists ? current.filter((e) => e !== equipment) : [...current, equipment];
          return { filters: { ...state.filters, equipment: next } };
        }),

      resetFilters: () => set({ filters: INITIAL_FILTERS }),

      // ── Conflict detection (local cache check — Firestore transaction là final arbiter) ───
      getSlotBooking: (roomId, date, slotId) => {
        const { bookings } = get();
        return bookings.find(
          (b) =>
            b.roomId === roomId &&
            b.date === date &&
            b.slotId === slotId &&
            b.status !== 'CANCELLED'
        );
      },

      isSlotBooked: (roomId, date, slotId) => {
        return Boolean(get().getSlotBooking(roomId, date, slotId));
      },

      checkSlotConflict: (roomId, date, slotId) => {
        const { bookings, rooms, currentUser } = get();

        const conflictBooking = bookings.find(
          (b) =>
            b.roomId === roomId &&
            b.date === date &&
            b.slotId === slotId &&
            b.status !== 'CANCELLED'
        );

        const studentOverlapping = currentUser
          ? bookings.find(
              (b) =>
                b.studentId === currentUser.studentId &&
                b.date === date &&
                b.slotId === slotId &&
                b.status !== 'CANCELLED' &&
                b.roomId !== roomId
            )
          : undefined;

        if (!conflictBooking && !studentOverlapping) {
          return { hasConflict: false };
        }

        const targetRoom = rooms.find((r) => r.id === roomId);
        const requiredCapacity = targetRoom?.capacity || 8;

        const alternativeRooms = rooms.filter((r) => {
          if (r.id === roomId) return false;
          const isBooked = bookings.some(
            (b) =>
              b.roomId === r.id &&
              b.date === date &&
              b.slotId === slotId &&
              b.status !== 'CANCELLED'
          );
          if (isBooked) return false;

          const sameBuilding = r.building === targetRoom?.building;
          const similarCapacity = Math.abs(r.capacity - requiredCapacity) <= 10;
          return sameBuilding || similarCapacity;
        });

        const alternativeSlots = TIME_SLOTS.filter((slot) => {
          if (slot.id === slotId) return false;
          const isSlotTaken = bookings.some(
            (b) =>
              b.roomId === roomId &&
              b.date === date &&
              b.slotId === slot.id &&
              b.status !== 'CANCELLED'
          );
          return !isSlotTaken;
        });

        let message = '';
        if (conflictBooking) {
          if (currentUser && conflictBooking.studentId === currentUser.studentId) {
            message = `Chính bạn (${currentUser.name} - ${currentUser.studentId}) đã đặt phòng này ở ca ${conflictBooking.slotLabel} rồi!`;
          } else {
            message = `Phòng ${targetRoom?.name} vào khung giờ này đã được sinh viên ${conflictBooking.studentName} (MSSV: ${conflictBooking.studentId}) đặt trước.`;
          }
        } else if (studentOverlapping && currentUser) {
          message = `Trùng lịch cá nhân: Bạn (${currentUser.name}) đã có lịch đặt tại ${studentOverlapping.roomName} trong cùng khung giờ ${studentOverlapping.slotLabel} ngày ${date}.`;
        }

        return {
          hasConflict: true,
          conflictingBooking: conflictBooking || studentOverlapping,
          message,
          alternativeRooms: alternativeRooms.slice(0, 3),
          alternativeSlots,
        };
      },

      // ── Booking: Firestore atomic write với local-first fallback ──────────
      addBooking: async (data) => {
        // Bước 1: Check local cache trước (UI nhanh hơn)
        const localConflict = get().checkSlotConflict(data.roomId, data.date, data.slotId);
        if (localConflict.hasConflict) {
          notificationService.notify(
            '⚠️ Phát hiện xung đột lịch đặt phòng',
            localConflict.message || 'Khung giờ này đã có người đặt.',
            'CONFLICT'
          );
          return { success: false, conflict: localConflict };
        }

        // Bước 2: Tạo booking object
        const uniqueCode = 'VKU-' + Math.floor(1000 + Math.random() * 9000);
        const bookingId = `${data.roomId}__${data.date}__${data.slotId}`;
        const qrData = JSON.stringify({
          bookingId,
          code: uniqueCode,
          roomId: data.roomId,
          roomCode: data.roomCode,
          date: data.date,
          slot: data.slotLabel,
          student: data.studentName,
          studentId: data.studentId,
          vku_auth: 'VERIFIED_STUDENT_PASS',
        });

        const newBooking: Booking = {
          ...data,
          id: bookingId,
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
          qrCodeData: qrData,
        };

        // Bước 3: Optimistic update (UI phản hồi ngay)
        set((state) => ({
          bookings: [newBooking, ...state.bookings],
          waitlist: state.waitlist.filter(
            (w) =>
              !(w.roomId === data.roomId && w.date === data.date && w.slotId === data.slotId)
          ),
        }));

        const { syncStatus } = get();

        if (syncStatus.isOnline) {
          // Bước 4: Atomic Firestore transaction (final arbiter)
          const result = await atomicAddBooking(newBooking);

          if (!result.success) {
            // ROLLBACK optimistic update nếu Firestore từ chối (race condition)
            set((state) => ({
              bookings: state.bookings.filter((b) => b.id !== bookingId),
            }));

            // Fetch lại để đảm bảo UI đồng bộ
            const conflictResolution = get().checkSlotConflict(data.roomId, data.date, data.slotId);

            notificationService.notify(
              '⚡ Xung đột thời gian thực!',
              result.message || 'Có người khác vừa đặt phòng này cùng lúc. Vui lòng chọn ca khác.',
              'CONFLICT'
            );

            return {
              success: false,
              conflict: {
                ...conflictResolution,
                hasConflict: true,
                message: result.message || 'Đặt phòng thất bại — xung đột đồng thời',
              },
            };
          }
        }
        // Nếu offline → lưu local, sẽ sync khi có mạng (offline-first)

        notificationService.scheduleBookingReminder(
          data.roomName,
          data.date,
          data.slotLabel.split(' - ')[0]
        );

        notificationService.notify(
          '✅ Đặt phòng thành công!',
          `Phòng ${data.roomName} | Ca ${data.slotLabel} | ${data.date}${syncStatus.isOnline ? '\n🔴 Đã đồng bộ real-time với tất cả thiết bị.' : '\n⚠️ Đang offline — sẽ đồng bộ khi có mạng.'}`,
          'SUCCESS'
        );

        return { success: true, booking: newBooking };
      },

      // ── Cancel: Firestore update ─────────────────────────────────────────
      cancelBooking: async (id) => {
        const targetBooking = get().bookings.find((b) => b.id === id);
        if (!targetBooking) return;

        // Optimistic update
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, status: 'CANCELLED' as const } : b
          ),
        }));

        notificationService.notify(
          'Đã hủy đặt phòng',
          `Lịch đặt phòng ${targetBooking.roomName} (${targetBooking.slotLabel} • ${targetBooking.date}) đã được hủy.`,
          'REMINDER'
        );

        if (get().syncStatus.isOnline) {
          try {
            await atomicCancelBooking(id);
          } catch {
            // Revert nếu Firestore fail
            set((state) => ({
              bookings: state.bookings.map((b) =>
                b.id === id ? { ...b, status: 'CONFIRMED' as const } : b
              ),
            }));
          }
        }

        const waitingUsers = get().waitlist.filter(
          (w) =>
            w.roomId === targetBooking.roomId &&
            w.date === targetBooking.date &&
            w.slotId === targetBooking.slotId
        );

        if (waitingUsers.length > 0) {
          notificationService.notify(
            '🔔 Phòng trong Hàng Đợi vừa trống!',
            `Phòng ${targetBooking.roomName} ca ${targetBooking.slotLabel} vừa được hủy. Bạn (${waitingUsers[0].studentName}) được ưu tiên vào đặt ngay!`,
            'WAITLIST_AVAILABLE'
          );
        }
      },

      // ── Check-in: Firestore update ────────────────────────────────────────
      checkInBooking: async (id) => {
        // Optimistic
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, status: 'CHECKED_IN' as const } : b
          ),
        }));

        notificationService.notify(
          'Check-in Thành Công!',
          'Bạn đã xác thực QR thành công. Chúc bạn có buổi học tập hiệu quả tại VKU!',
          'SUCCESS'
        );

        if (get().syncStatus.isOnline) {
          try {
            await atomicCheckInBooking(id);
          } catch {
            // Revert
            set((state) => ({
              bookings: state.bookings.map((b) =>
                b.id === id ? { ...b, status: 'CONFIRMED' as const } : b
              ),
            }));
          }
        }
      },

      // ── Waitlist ──────────────────────────────────────────────────────────
      joinWaitlist: (roomId, date, slotId) => {
        const { currentUser, waitlist, setAuthModalVisible } = get();
        if (!currentUser) {
          setAuthModalVisible(true);
          return;
        }
        const alreadyIn = waitlist.some(
          (w) =>
            w.roomId === roomId &&
            w.date === date &&
            w.slotId === slotId &&
            w.studentId === currentUser.studentId
        );
        if (alreadyIn) return;

        const item: WaitlistItem = {
          id: 'wait-' + Date.now(),
          roomId,
          date,
          slotId,
          studentId: currentUser.studentId,
          studentName: currentUser.name,
          createdAt: Date.now(),
        };

        set((state) => ({ waitlist: [...state.waitlist, item] }));
        notificationService.notify(
          'Đã vào Hàng Đợi (Waitlist)',
          `Tài khoản ${currentUser.name} (${currentUser.studentId}) sẽ nhận thông báo đẩy ngay khi ca này trống.`,
          'REMINDER'
        );
      },

      isUserInWaitlist: (roomId, date, slotId) => {
        const { currentUser, waitlist } = get();
        if (!currentUser) return false;
        return waitlist.some(
          (w) =>
            w.roomId === roomId &&
            w.date === date &&
            w.slotId === slotId &&
            w.studentId === currentUser.studentId
        );
      },
    }),
    {
      name: 'vku-booking-storage-v4',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        bookings: state.bookings,
        waitlist: state.waitlist,
        currentUser: state.currentUser,
        availableUsers: state.availableUsers,
        // syncStatus KHÔNG persist (tính mới mỗi lần launch)
      }),
    }
  )
);

// ─────────────────────────────────────────────────────────────────────────────
// Khởi tạo Firestore real-time listener
// Gọi hàm này 1 lần từ App.tsx khi app mount
// ─────────────────────────────────────────────────────────────────────────────
let _unsubscribeFirestore: (() => void) | null = null;

export function initializeRealtimeSync(): () => void {
  const store = useBookingStore.getState();

  store._setSyncStatus({ isConnecting: true, error: null });

  // Seed bookings vào Firestore nếu collection rỗng
  const seedBookings = getSeedBookings();
  seedFirestoreIfEmpty(seedBookings).catch(() => {
    // Silent fail — offline mode
  });

  _unsubscribeFirestore = subscribeToBookings(
    (bookings) => {
      // Lọc bỏ personal slot tracker documents
      const realBookings = bookings.filter((b) => !(b as any)._type);
      useBookingStore.getState()._setBookingsFromFirestore(realBookings);
      useBookingStore.getState()._setSyncStatus({
        isOnline: true,
        isConnecting: false,
        lastSyncedAt: new Date().toISOString(),
        error: null,
      });
    },
    (error) => {
      useBookingStore.getState()._setSyncStatus({
        isOnline: false,
        isConnecting: false,
        error: 'Không kết nối được Firestore: ' + error.message,
      });
    }
  );

  return () => {
    _unsubscribeFirestore?.();
    _unsubscribeFirestore = null;
  };
}
