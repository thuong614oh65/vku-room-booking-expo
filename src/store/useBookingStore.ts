import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Booking, ConflictResolution, Equipment, FilterState, Room, UserProfile, Building } from '../types/booking';
import { INITIAL_ROOMS, CURRENT_USER, DEMO_USERS, TIME_SLOTS, getSeedBookings } from '../data/roomsData';
import { notificationService } from '../services/notificationService';

interface WaitlistItem {
  id: string;
  roomId: string;
  date: string;
  slotId: string;
  studentId: string;
  studentName: string;
  createdAt: number;
}

interface BookingState {
  rooms: Room[];
  bookings: Booking[];
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  filters: FilterState;
  waitlist: WaitlistItem[];

  // Account switching / Login
  switchUser: (studentId: string) => void;
  loginCustomUser: (name: string, studentId: string, email?: string) => void;

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

  // Booking actions
  addBooking: (
    data: Omit<Booking, 'id' | 'createdAt' | 'status' | 'qrCodeData'>
  ) => { success: boolean; booking?: Booking; conflict?: ConflictResolution };

  cancelBooking: (id: string) => void;
  checkInBooking: (id: string) => void;

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

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      rooms: INITIAL_ROOMS,
      bookings: getSeedBookings(),
      currentUser: CURRENT_USER,
      availableUsers: DEMO_USERS,
      filters: INITIAL_FILTERS,
      waitlist: [],

      switchUser: (studentId) => {
        const found = get().availableUsers.find((u) => u.studentId === studentId);
        if (found) {
          set({ currentUser: found });
          notificationService.notify(
            `👤 Đã chuyển tài khoản: ${found.name}`,
            `Đang phiên đăng nhập MSSV: ${found.studentId}. Mọi thao tác đặt phòng & kiểm tra trùng lịch sẽ tính theo tài khoản này.`,
            'SUCCESS'
          );
        }
      },

      loginCustomUser: (name, studentId, email) => {
        const cleanId = studentId.trim().toUpperCase();
        const cleanName = name.trim();
        if (!cleanId || !cleanName) return;
        const newUser: UserProfile = {
          name: cleanName,
          studentId: cleanId,
          email: email?.trim() || `${cleanId.toLowerCase().replace('.', '')}@vku.udn.vn`,
          major: 'Sinh viên VKU (Phiên đăng nhập trực tiếp)',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        };
        set((state) => {
          const exists = state.availableUsers.some((u) => u.studentId === cleanId);
          const updatedList = exists
            ? state.availableUsers.map((u) => (u.studentId === cleanId ? newUser : u))
            : [...state.availableUsers, newUser];
          return {
            currentUser: newUser,
            availableUsers: updatedList,
          };
        });
        notificationService.notify(
          `✅ Đăng nhập thành công: ${cleanName}`,
          `Mã SV: ${cleanId}. Bạn có thể đặt phòng hoặc kiểm tra xung đột lịch ngay.`,
          'SUCCESS'
        );
      },

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

        // 1. Kiểm tra xem slot này ở phòng này đã có ai đặt chưa
        const conflictBooking = bookings.find(
          (b) =>
            b.roomId === roomId &&
            b.date === date &&
            b.slotId === slotId &&
            b.status !== 'CANCELLED'
        );

        // 2. Kiểm tra xem chính sinh viên đang đăng nhập đã đặt phòng khác cùng khung giờ này chưa
        const studentOverlapping = bookings.find(
          (b) =>
            b.studentId === currentUser.studentId &&
            b.date === date &&
            b.slotId === slotId &&
            b.status !== 'CANCELLED' &&
            b.roomId !== roomId
        );

        if (!conflictBooking && !studentOverlapping) {
          return { hasConflict: false };
        }

        const targetRoom = rooms.find((r) => r.id === roomId);
        const requiredCapacity = targetRoom?.capacity || 8;

        // Tìm phòng thay thế tương đương còn trống cùng giờ
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

        // Tìm khung giờ khác còn trống của chính phòng này
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
          if (conflictBooking.studentId === currentUser.studentId) {
            message = `Chính bạn (${currentUser.name} - ${currentUser.studentId}) đã đặt phòng này ở ca ${conflictBooking.slotLabel} rồi! Bạn có thể vào mục "Lịch Đặt" để lấy mã QR Check-in.`;
          } else {
            message = `Phòng ${targetRoom?.name} vào khung giờ này đã được sinh viên ${conflictBooking.studentName} (MSSV: ${conflictBooking.studentId}) đặt trước.`;
          }
        } else if (studentOverlapping) {
          message = `Trùng lịch cá nhân: Bạn (${currentUser.name}) đã có lịch đặt tại ${studentOverlapping.roomName} trong cùng khung giờ ${studentOverlapping.slotLabel} ngày ${date}. Mỗi sinh viên chỉ được giữ 1 phòng tại 1 thời điểm!`;
        }

        return {
          hasConflict: true,
          conflictingBooking: conflictBooking || studentOverlapping,
          message,
          alternativeRooms: alternativeRooms.slice(0, 3),
          alternativeSlots,
        };
      },

      addBooking: (data) => {
        const conflict = get().checkSlotConflict(data.roomId, data.date, data.slotId);
        if (conflict.hasConflict) {
          notificationService.notify(
            '⚠️ Phát hiện xung đột lịch đặt phòng',
            conflict.message || 'Khung giờ này vừa có người đặt. Vui lòng xem gợi ý phòng thay thế.',
            'CONFLICT'
          );
          return { success: false, conflict };
        }

        const uniqueCode = 'VKU-' + Math.floor(1000 + Math.random() * 9000);
        const bookingId = 'BK-' + Date.now();
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

        set((state) => ({
          bookings: [newBooking, ...state.bookings],
          waitlist: state.waitlist.filter(
            (w) =>
              !(w.roomId === data.roomId && w.date === data.date && w.slotId === data.slotId)
          ),
        }));

        notificationService.scheduleBookingReminder(
          data.roomName,
          data.date,
          data.slotLabel.split(' - ')[0]
        );

        return { success: true, booking: newBooking };
      },

      cancelBooking: (id) => {
        const targetBooking = get().bookings.find((b) => b.id === id);
        if (!targetBooking) return;

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

      checkInBooking: (id) => {
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
      },

      joinWaitlist: (roomId, date, slotId) => {
        const { currentUser, waitlist } = get();
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
          `Tài khoản ${currentUser.name} (${currentUser.studentId}) sẽ nhận được thông báo đẩy ngay khi ca này trống.`,
          'REMINDER'
        );
      },

      isUserInWaitlist: (roomId, date, slotId) => {
        const { currentUser, waitlist } = get();
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
      name: 'vku-booking-storage-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        bookings: state.bookings,
        waitlist: state.waitlist,
        currentUser: state.currentUser,
        availableUsers: state.availableUsers,
      }),
    }
  )
);
