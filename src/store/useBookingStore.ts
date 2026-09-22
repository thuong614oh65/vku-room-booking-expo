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
       * ĐỘNG CƠ KIỂM TRA VÀ GIẢI QUYẾT XUNG ĐỘT (CONFLICT RESOLUTION ENGINE)
       * Trả lời trực tiếp 2 câu hỏi:
       * 1. Phát hiện trùng phòng / cùng thời điểm
       * 2. Tìm giải pháp thông minh cho người không được ưu tiên (Gợi ý phòng tương đương, khung giờ khác)
       */
      checkSlotConflict: (roomId, date, slotId) => {
        const { bookings, rooms, currentUser } = get();

        // 1. Kiểm tra xem slot này đã có ai đặt chưa
        const conflictBooking = bookings.find(
          (b) =>
            b.roomId === roomId &&
            b.date === date &&
            b.slotId === slotId &&
            b.status !== 'CANCELLED'
        );

        // 2. Kiểm tra xem chính sinh viên này đã có lịch ở phòng khác cùng giờ chưa
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

        // TÌM PHÒNG THAY THẾ TƯƠNG ĐƯƠNG (SMART ALTERNATIVE ROOMS)
        // Tiêu chí: Cùng tòa nhà hoặc cùng sức chứa, và slot đó ĐANG TRỐNG
        const alternativeRooms = rooms.filter((r) => {
          if (r.id === roomId) return false;
          // Kiểm tra slot này ở phòng r có trống không
          const isBooked = bookings.some(
            (b) =>
              b.roomId === r.id &&
              b.date === date &&
              b.slotId === slotId &&
              b.status !== 'CANCELLED'
          );
          if (isBooked) return false;

          // Ưu tiên cùng tòa nhà hoặc cùng sức chứa chênh lệch +-10
          const sameBuilding = r.building === targetRoom?.building;
          const similarCapacity = Math.abs(r.capacity - requiredCapacity) <= 10;
          return sameBuilding || similarCapacity;
        });

        // TÌM KHUNG GIỜ KHÁC TRỐNG CỦA CHÍNH PHÒNG NÀY (ALTERNATIVE TIME SLOTS)
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
          message = `Phòng ${targetRoom?.name} vào khung giờ này đã được sinh viên ${conflictBooking.studentName} đặt trước.`;
        } else if (studentOverlapping) {
          message = `Bạn đã có lịch đặt phòng ${studentOverlapping.roomName} trong khung giờ này. Mỗi sinh viên chỉ được giữ 1 phòng tại 1 thời điểm!`;
        }

        return {
          hasConflict: true,
          conflictingBooking: conflictBooking || studentOverlapping,
          message,
          alternativeRooms: alternativeRooms.slice(0, 3), // Lấy tối đa 3 phòng tối ưu nhất
          alternativeSlots,
        };
      },

      addBooking: (data) => {
        const conflict = get().checkSlotConflict(data.roomId, data.date, data.slotId);
        if (conflict.hasConflict) {
          notificationService.notify(
            '⚠️ Phát hiện xung đột phòng học',
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
          // Xóa khỏi waitlist nếu đang chờ slot này
          waitlist: state.waitlist.filter(
            (w) =>
              !(w.roomId === data.roomId && w.date === data.date && w.slotId === data.slotId)
          ),
        }));

        // Kích hoạt lịch nhắc nhở 15 phút trước giờ bắt đầu
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
          `Lịch đặt phòng ${targetBooking.roomName} (${targetBooking.date}) đã được hủy thành công.`,
          'REMINDER'
        );

        // KIỂM TRA HÀNG ĐỢI WAITLIST VÀ BÁO CHO NGƯỜI CHỜ
        const waitingUsers = get().waitlist.filter(
          (w) =>
            w.roomId === targetBooking.roomId &&
            w.date === targetBooking.date &&
            w.slotId === targetBooking.slotId
        );

        if (waitingUsers.length > 0) {
          notificationService.notify(
            '🔔 Phòng bạn chờ đã trống!',
            `Phòng ${targetBooking.roomName} vừa có bạn hủy lúc ${targetBooking.slotLabel}. Hãy vào đặt ngay!`,
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
          'Hệ thống sẽ ưu tiên gửi thông báo ngay khi có sinh viên hủy khung giờ này.',
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
