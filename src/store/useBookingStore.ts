import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Booking, ConflictResolution, Equipment, FilterState, Room, UserProfile, Building, TimeSlot } from '../types/booking';
import { INITIAL_ROOMS, CURRENT_USER, TIME_SLOTS } from '../data/roomsData';
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
  filters: FilterState;
  waitlist: WaitlistItem[];

  // Filter actions
  setSearchQuery: (query: string) => void;
  setBuildingFilter: (building: Building | 'ALL') => void;
  setMinCapacityFilter: (capacity: number | null) => void;
  toggleEquipmentFilter: (equipment: Equipment) => void;
  resetFilters: () => void;

  // Conflict detection & resolution engine
  checkSlotConflict: (roomId: string, date: string, slotId: string) => ConflictResolution;
  isSlotBooked: (roomId: string, date: string, slotId: string) => boolean;

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
      bookings: [],
      currentUser: CURRENT_USER,
      filters: INITIAL_FILTERS,
      waitlist: [],

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

      isSlotBooked: (roomId, date, slotId) => {
        const { bookings } = get();
        return bookings.some(
          (b) =>
            b.roomId === roomId &&
            b.date === date &&
            b.slotId === slotId &&
            b.status !== 'CANCELLED'
        );
      },

      /**
       * Ð?NG CO KI?M TRA VÀ GI?I QUY?T XUNG Ð?T (CONFLICT RESOLUTION ENGINE)
       * Tr? l?i tr?c ti?p 2 câu h?i:
       * 1. Phát hi?n trùng phòng / cùng th?i di?m
       * 2. Tìm gi?i pháp thông minh cho ngu?i không du?c uu tiên (G?i ý phòng tuong duong, khung gi? khác)
       */
      checkSlotConflict: (roomId, date, slotId) => {
        const { bookings, rooms, currentUser } = get();

        // 1. Ki?m tra xem slot này dã có ai d?t chua
        const conflictBooking = bookings.find(
          (b) =>
            b.roomId === roomId &&
            b.date === date &&
            b.slotId === slotId &&
            b.status !== 'CANCELLED'
        );

        // 2. Ki?m tra xem chính sinh viên này dã có l?ch ? phòng khác cùng gi? chua
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

        // TÌM PHÒNG THAY TH? TUONG ÐUONG (SMART ALTERNATIVE ROOMS)
        // Tiêu chí: Cùng tòa nhà ho?c cùng s?c ch?a, và slot dó ÐANG TR?NG
        const alternativeRooms = rooms.filter((r) => {
          if (r.id === roomId) return false;
          // Ki?m tra slot này ? phòng r có tr?ng không
          const isBooked = bookings.some(
            (b) =>
              b.roomId === r.id &&
              b.date === date &&
              b.slotId === slotId &&
              b.status !== 'CANCELLED'
          );
          if (isBooked) return false;

          // Uu tiên cùng tòa nhà ho?c cùng s?c ch?a chênh l?ch +-5
          const sameBuilding = r.building === targetRoom?.building;
          const similarCapacity = Math.abs(r.capacity - requiredCapacity) <= 10;
          return sameBuilding || similarCapacity;
        });

        // TÌM KHUNG GI? KHÁC TR?NG C?A CHÍNH PHÒNG NÀY (ALTERNATIVE TIME SLOTS)
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
          message = `Phòng ${targetRoom?.name} vào khung gi? này dã du?c sinh viên ${conflictBooking.studentName} d?t tru?c.`;
        } else if (studentOverlapping) {
          message = `B?n dã có l?ch d?t phòng ${studentOverlapping.roomName} trong khung gi? này. M?i sinh viên ch? du?c gi? 1 phòng t?i 1 th?i di?m!`;
        }

        return {
          hasConflict: true,
          conflictingBooking: conflictBooking || studentOverlapping,
          message,
          alternativeRooms: alternativeRooms.slice(0, 3), // L?y t?i da 3 phòng t?i uu nh?t
          alternativeSlots,
        };
      },

      addBooking: (data) => {
        const conflict = get().checkSlotConflict(data.roomId, data.date, data.slotId);
        if (conflict.hasConflict) {
          notificationService.notify(
            '?? Phát hi?n xung d?t phòng h?c',
            conflict.message || 'Khung gi? này v?a có ngu?i d?t. Vui lòng xem g?i ý phòng thay th?.',
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
          // Xóa kh?i waitlist n?u dang ch? slot này
          waitlist: state.waitlist.filter(
            (w) =>
              !(w.roomId === data.roomId && w.date === data.date && w.slotId === data.slotId)
          ),
        }));

        // Kích ho?t l?ch nh?c nh? 15 phút tru?c gi? b?t d?u
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
          'Ðã h?y d?t phòng',
          `L?ch d?t phòng ${targetBooking.roomName} (${targetBooking.date}) dã du?c h?y thành công.`,
          'REMINDER'
        );

        // KI?M TRA HÀNG Ð?I WAITLIST VÀ BÁO CHO NGU?I CH?
        const waitingUsers = get().waitlist.filter(
          (w) =>
            w.roomId === targetBooking.roomId &&
            w.date === targetBooking.date &&
            w.slotId === targetBooking.slotId
        );

        if (waitingUsers.length > 0) {
          const firstWaiting = waitingUsers[0];
          notificationService.notify(
            '?? Phòng b?n ch? dã tr?ng!',
            `Phòng ${targetBooking.roomName} v?a có b?n h?y lúc ${targetBooking.slotLabel}. Hãy vào d?t ngay!`,
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
          'B?n dã xác th?c QR thành công. Chúc b?n có bu?i h?c t?p hi?u qu? t?i VKU!',
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
          'Ðã vào Hàng Ð?i (Waitlist)',
          'H? th?ng s? uu tiên g?i thông báo ngay khi có sinh viên h?y khung gi? này.',
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
      name: 'vku-booking-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        bookings: state.bookings,
        waitlist: state.waitlist,
      }),
    }
  )
);
