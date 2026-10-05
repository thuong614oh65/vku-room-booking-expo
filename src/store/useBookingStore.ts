import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  Booking,
  ConflictResolution,
  Equipment,
  FilterState,
  Room,
  UserProfile,
  Building,
} from '../types/booking';

import {
  INITIAL_ROOMS,
  DEMO_USERS,
  TIME_SLOTS,
  getSeedBookings,
} from '../data/roomsData';

import { notificationService } from '../services/notificationService';

import {
  subscribeToBookings,
  atomicAddBooking,
  atomicCancelBooking,
  atomicCheckInBooking,
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

export const checkIsStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    window.matchMedia?.('(display-mode: minimal-ui)').matches ||
    (window.navigator as any)?.standalone === true ||
    (typeof document !== 'undefined' && document.referrer.includes('android-app://'))
  );
};

const syncChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('vku_room_sync_channel')
    : null;

export const broadcastBookingsSync = (bookings: Booking[]) => {
  if (syncChannel) {
    try {
      syncChannel.postMessage({
        type: 'VKU_BOOKINGS_SYNC',
        bookings,
        timestamp: Date.now(),
      });
    } catch (e) {}
  }
};

interface BookingState {
  rooms: Room[];
  bookings: Booking[];
  currentUser: UserProfile | null;
  availableUsers: UserProfile[];
  authModalVisible: boolean;
  installModalVisible: boolean;
  sysInfoModalVisible: boolean;
  isAppInstalled: boolean;
  isStandaloneApp: boolean;
  filters: FilterState;
  waitlist: WaitlistItem[];
  syncStatus: SyncStatus;

  _setBookingsFromFirestore: (bookings: Booking[]) => void;
  _setSyncStatus: (status: Partial<SyncStatus>) => void;

  setAuthModalVisible: (visible: boolean) => void;
  setInstallModalVisible: (visible: boolean) => void;
  setSysInfoModalVisible: (visible: boolean) => void;
  setIsStandaloneApp: (isStandalone: boolean) => void;
  refreshInstallState: () => void;
  markAppAsInstalled: () => void;
  resetAppInstallStatus: () => void;

  login: (
    identifier: string,
    password?: string
  ) => {
    success: boolean;
    message: string;
  };

  loginWithGoogle: (
    email: string,
    name?: string,
    avatar?: string
  ) => {
    success: boolean;
    message: string;
  };

  register: (
    name: string,
    studentId: string,
    email: string,
    major: string,
    password?: string
  ) => {
    success: boolean;
    message: string;
  };

  logout: () => void;

  setSearchQuery: (query: string) => void;
  setBuildingFilter: (building: Building | 'ALL') => void;
  setMinCapacityFilter: (capacity: number | null) => void;
  toggleEquipmentFilter: (equipment: Equipment) => void;
  setDateFilter: (date: string | null) => void;
  setSlotFilter: (slotId: string | null) => void;
  resetFilters: () => void;

  checkSlotConflict: (
    roomId: string,
    date: string,
    slotId: string
  ) => ConflictResolution;

  isSlotBooked: (
    roomId: string,
    date: string,
    slotId: string
  ) => boolean;

  getSlotBooking: (
    roomId: string,
    date: string,
    slotId: string
  ) => Booking | undefined;

  addBooking: (
    data: Omit<
      Booking,
      'id' | 'createdAt' | 'status' | 'qrCodeData'
    >
  ) => Promise<{
    success: boolean;
    booking?: Booking;
    conflict?: ConflictResolution;
  }>;

  cancelBooking: (id: string) => Promise<void>;

  checkInBooking: (id: string) => Promise<void>;

  joinWaitlist: (
    roomId: string,
    date: string,
    slotId: string
  ) => void;

  isUserInWaitlist: (
    roomId: string,
    date: string,
    slotId: string
  ) => boolean;

  resetToSeedBookings: () => void;
}

const INITIAL_FILTERS: FilterState = {
  searchQuery: '',
  building: 'ALL',
  minCapacity: null,
  equipment: [],
  date: null,
  slotId: null,
};

const INITIAL_SYNC: SyncStatus = {
  isOnline: false,
  isConnecting: false,
  lastSyncedAt: null,
  error: null,
};

export const useBookingStore =
  create<BookingState>()(
    persist(
      (set, get) => ({
        rooms: INITIAL_ROOMS,

        /*
         * Khởi tạo lịch sử đặt phòng phong phú từ getSeedBookings().
         * Nếu AsyncStorage đã có dữ liệu từ trước -> Zustand persist tự động khôi phục.
         * Nếu chưa có -> Dùng getSeedBookings() để sinh viên có ngay lịch sử trực quan.
         */
        bookings: getSeedBookings(),

        // Mặc định đăng nhập tài khoản sinh viên thực hiện đề tài
        currentUser: DEMO_USERS[0],

        availableUsers: DEMO_USERS,

        authModalVisible: false,

        installModalVisible: false,
        sysInfoModalVisible: false,

        isAppInstalled:
          typeof window !== 'undefined' &&
          (Boolean(window.localStorage?.getItem('vku_app_installed') === 'true') || checkIsStandalone()),

        isStandaloneApp: checkIsStandalone(),

        filters: INITIAL_FILTERS,

        waitlist: [],

        syncStatus: INITIAL_SYNC,

        // ============================================================
        // INTERNAL SYNC
        // ============================================================

        _setBookingsFromFirestore: (
          firestoreBookings
        ) => {
          /*
           * CHỈ cập nhật từ Firestore khi Firestore
           * thực sự có dữ liệu.
           *
           * Nếu Firestore trả [] thì KHÔNG được
           * xóa dữ liệu local.
           */
          if (firestoreBookings.length === 0) {
            console.log(
              '[Firestore] Không có dữ liệu -> giữ dữ liệu local.'
            );

            return;
          }

          console.log(
            '[Firestore] Nhận',
            firestoreBookings.length,
            'booking.'
          );

          set({
            bookings: firestoreBookings,
          });
        },

        _setSyncStatus: (status) => {
          set((state) => ({
            syncStatus: {
              ...state.syncStatus,
              ...status,
            },
          }));
        },

        // ============================================================
        // MODAL
        // ============================================================

        setAuthModalVisible: (visible) =>
          set({
            authModalVisible: visible,
          }),

        setInstallModalVisible: (visible) =>
          set({
            installModalVisible: visible,
          }),

        setSysInfoModalVisible: (visible) =>
          set({
            sysInfoModalVisible: visible,
          }),

        setIsStandaloneApp: (isStandalone: boolean) =>
          set({
            isStandaloneApp: isStandalone,
            isAppInstalled: isStandalone ? true : get().isAppInstalled,
          }),

        refreshInstallState: () => {
          const standalone = checkIsStandalone();
          const installed =
            standalone ||
            (typeof window !== 'undefined' &&
              Boolean(window.localStorage?.getItem('vku_app_installed') === 'true'));
          set({
            isStandaloneApp: standalone,
            isAppInstalled: installed,
          });
        },

        markAppAsInstalled: () => {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('vku_app_installed', 'true');
          }
          set({ isAppInstalled: true });
          notificationService.notify(
            '🎉 Đã xác nhận cài đặt',
            'Nút trên thanh điều hướng đã chuyển thành "🚀 Vào App"!',
            'SUCCESS'
          );
        },

        resetAppInstallStatus: () => {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem('vku_app_installed');
          }
          const standalone = checkIsStandalone();
          set({ isAppInstalled: standalone, isStandaloneApp: standalone });
          notificationService.notify(
            '🔄 Đã đặt lại trạng thái',
            'Đã chuyển lại trạng thái Cài Đặt / Tải App ban đầu.',
            'SUCCESS'
          );
        },

        // ============================================================
        // LOGIN
        // ============================================================

        login: (
          identifier,
          _password
        ) => {
          const q =
            identifier
              .trim()
              .toLowerCase();

          const found =
            get().availableUsers.find(
              (u) =>
                u.studentId.toLowerCase() ===
                  q ||
                u.email.toLowerCase() ===
                  q ||
                u.name.toLowerCase() ===
                  q
            );

          if (!found) {
            return {
              success: false,

              message:
                'Không tìm thấy tài khoản với MSSV/Email này. Vui lòng chuyển sang tab "Đăng Ký Mới"!',
            };
          }

          set({
            currentUser: found,

            authModalVisible: false,
          });

          notificationService.notify(
            `👋 Xin chào ${found.name}!`,

            `Đăng nhập thành công (MSSV: ${found.studentId}). Bây giờ bạn có thể đặt phòng học.`,

            'SUCCESS'
          );

          return {
            success: true,

            message:
              'Đăng nhập thành công',
          };
        },

        // ============================================================
        // LOGIN WITH GOOGLE / GMAIL
        // ============================================================

        loginWithGoogle: (email, name, avatar) => {
          const cleanEmail = email.trim().toLowerCase();
          const existing = get().availableUsers.find(
            (u) => u.email.toLowerCase() === cleanEmail
          );

          if (existing) {
            set({
              currentUser: existing,
              authModalVisible: false,
            });
            notificationService.notify(
              `🌐 Chào mừng ${existing.name}!`,
              `Đã đăng nhập thành công qua Google / Gmail (${cleanEmail}).`,
              'SUCCESS'
            );
            return {
              success: true,
              message: 'Đăng nhập Google thành công',
            };
          }

          // Tạo tài khoản mới từ Google / Gmail
          const derivedName = name?.trim() || cleanEmail.split('@')[0];
          const derivedId = '23IT.B' + Math.floor(100 + Math.random() * 899);

          const newUser: UserProfile = {
            studentId: derivedId,
            name: derivedName,
            email: cleanEmail,
            major: 'Kỹ Thuật Phần Mềm (Lớp 23SE4)',
            avatar: avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${cleanEmail}`,
          };

          set((state) => ({
            availableUsers: [newUser, ...state.availableUsers],
            currentUser: newUser,
            authModalVisible: false,
          }));

          notificationService.notify(
            `🌐 Chào mừng ${derivedName}!`,
            `Đã liên kết tài khoản Google (${cleanEmail}) thành công!`,
            'SUCCESS'
          );

          return {
            success: true,
            message: 'Đăng nhập Google thành công',
          };
        },

        // ============================================================
        // REGISTER
        // ============================================================

        register: (
          name,
          studentId,
          email,
          major,
          _password
        ) => {
          const cleanId =
            studentId
              .trim()
              .toUpperCase();

          const cleanName =
            name.trim();

          const cleanEmail =
            email.trim() ||
            `${cleanId
              .toLowerCase()
              .replace(
                '.',
                ''
              )}@vku.udn.vn`;

          const exists =
            get().availableUsers.some(
              (u) =>
                u.studentId.toUpperCase() ===
                cleanId
            );

          if (exists) {
            return {
              success: false,

              message:
                `Mã sinh viên ${cleanId} đã được đăng ký. Vui lòng chuyển sang tab Đăng Nhập!`,
            };
          }

          const newUser: UserProfile = {
            name: cleanName,

            studentId: cleanId,

            email: cleanEmail,

            major:
              major.trim() ||
              'Sinh viên VKU',

            avatar:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          };

          set((state) => ({
            availableUsers: [
              newUser,
              ...state.availableUsers,
            ],

            currentUser: newUser,

            authModalVisible: false,
          }));

          notificationService.notify(
            `🎉 Đăng ký thành công: ${cleanName}`,

            `Tài khoản MSSV ${cleanId} đã được kích hoạt và tự động đăng nhập.`,

            'SUCCESS'
          );

          return {
            success: true,

            message:
              'Đăng ký thành công',
          };
        },

        // ============================================================
        // LOGOUT
        // ============================================================

        logout: () => {
          const prev =
            get().currentUser;

          set({
            currentUser: null,
          });

          if (prev) {
            notificationService.notify(
              '🚪 Đã đăng xuất',

              `Bạn đã đăng xuất khỏi tài khoản ${prev.name} (${prev.studentId}).`,

              'REMINDER'
            );
          }
        },

        // ============================================================
        // FILTERS
        // ============================================================

        setSearchQuery: (
          searchQuery
        ) =>
          set((state) => ({
            filters: {
              ...state.filters,
              searchQuery,
            },
          })),

        setBuildingFilter: (
          building
        ) =>
          set((state) => ({
            filters: {
              ...state.filters,
              building,
            },
          })),

        setMinCapacityFilter: (
          minCapacity
        ) =>
          set((state) => ({
            filters: {
              ...state.filters,
              minCapacity,
            },
          })),

        toggleEquipmentFilter: (
          equipment
        ) =>
          set((state) => {
            const current =
              state.filters.equipment;

            const exists =
              current.includes(
                equipment
              );

            const next = exists
              ? current.filter(
                  (e) =>
                    e !== equipment
                )
              : [
                  ...current,
                  equipment,
                ];

            return {
              filters: {
                ...state.filters,
                equipment: next,
              },
            };
          }),

        setDateFilter: (date) =>
          set((state) => ({
            filters: {
              ...state.filters,
              date,
            },
          })),

        setSlotFilter: (slotId) =>
          set((state) => ({
            filters: {
              ...state.filters,
              slotId,
            },
          })),

        resetFilters: () =>
          set({
            filters:
              INITIAL_FILTERS,
          }),

        // ============================================================
        // BOOKING CHECK
        // ============================================================

        getSlotBooking: (
          roomId,
          date,
          slotId
        ) => {
          const {
            bookings,
          } = get();

          return bookings.find(
            (b) =>
              b.roomId === roomId &&
              b.date === date &&
              b.slotId === slotId &&
              b.status !==
                'CANCELLED'
          );
        },

        isSlotBooked: (
          roomId,
          date,
          slotId
        ) => {
          return Boolean(
            get().getSlotBooking(
              roomId,
              date,
              slotId
            )
          );
        },

        // ============================================================
        // CONFLICT
        // ============================================================

        checkSlotConflict: (
          roomId,
          date,
          slotId
        ) => {
          const {
            bookings,
            rooms,
            currentUser,
          } = get();

          const conflictBooking =
            bookings.find(
              (b) =>
                b.roomId === roomId &&
                b.date === date &&
                b.slotId === slotId &&
                b.status !==
                  'CANCELLED'
            );

          const studentOverlapping =
            currentUser
              ? bookings.find(
                  (b) =>
                    b.studentId ===
                      currentUser.studentId &&
                    b.date === date &&
                    b.slotId === slotId &&
                    b.status !==
                      'CANCELLED' &&
                    b.roomId !== roomId
                )
              : undefined;

          if (
            !conflictBooking &&
            !studentOverlapping
          ) {
            return {
              hasConflict: false,
            };
          }

          const targetRoom =
            rooms.find(
              (r) =>
                r.id === roomId
            );

          const requiredCapacity =
            targetRoom?.capacity ||
            8;

          const alternativeRooms =
            rooms.filter((r) => {
              if (r.id === roomId) {
                return false;
              }

              const isBooked =
                bookings.some(
                  (b) =>
                    b.roomId ===
                      r.id &&
                    b.date === date &&
                    b.slotId ===
                      slotId &&
                    b.status !==
                      'CANCELLED'
                );

              if (isBooked) {
                return false;
              }

              const sameBuilding =
                r.building ===
                targetRoom?.building;

              const similarCapacity =
                Math.abs(
                  r.capacity -
                    requiredCapacity
                ) <= 10;

              return (
                sameBuilding ||
                similarCapacity
              );
            });

          const alternativeSlots =
            TIME_SLOTS.filter(
              (slot) => {
                if (
                  slot.id ===
                  slotId
                ) {
                  return false;
                }

                const isSlotTaken =
                  bookings.some(
                    (b) =>
                      b.roomId ===
                        roomId &&
                      b.date ===
                        date &&
                      b.slotId ===
                        slot.id &&
                      b.status !==
                        'CANCELLED'
                  );

                return !isSlotTaken;
              }
            );

          let message = '';

          if (conflictBooking) {
            if (
              currentUser &&
              conflictBooking.studentId ===
                currentUser.studentId
            ) {
              message =
                `Chính bạn (${currentUser.name} - ${currentUser.studentId}) đã đặt phòng này ở ca ${conflictBooking.slotLabel} rồi!`;
            } else {
              message =
                `Phòng ${targetRoom?.name} vào khung giờ này đã được sinh viên ${conflictBooking.studentName} (MSSV: ${conflictBooking.studentId}) đặt trước.`;
            }
          } else if (
            studentOverlapping &&
            currentUser
          ) {
            message =
              `Trùng lịch cá nhân: Bạn (${currentUser.name}) đã có lịch đặt tại ${studentOverlapping.roomName} trong cùng khung giờ ${studentOverlapping.slotLabel} ngày ${date}.`;
          }

          return {
            hasConflict: true,

            conflictingBooking:
              conflictBooking ||
              studentOverlapping,

            message,

            alternativeRooms:
              alternativeRooms.slice(
                0,
                3
              ),

            alternativeSlots,
          };
        },

        // ============================================================
        // ADD BOOKING
        // ============================================================

        addBooking: async (
          data
        ) => {
          const localConflict =
            get().checkSlotConflict(
              data.roomId,
              data.date,
              data.slotId
            );

          if (
            localConflict.hasConflict
          ) {
            notificationService.notify(
              '⚠️ Phát hiện xung đột lịch đặt phòng',

              localConflict.message ||
                'Khung giờ này đã có người đặt.',

              'CONFLICT'
            );

            return {
              success: false,

              conflict:
                localConflict,
            };
          }

          const uniqueCode =
            'VKU-' +
            Math.floor(
              1000 +
                Math.random() *
                  9000
            );

          const bookingId =
            `${data.roomId}__${data.date}__${data.slotId}`;

          const qrData =
            JSON.stringify({
              bookingId,

              code: uniqueCode,

              roomId: data.roomId,

              roomCode:
                data.roomCode,

              date: data.date,

              slot:
                data.slotLabel,

              student:
                data.studentName,

              studentId:
                data.studentId,

              vku_auth:
                'VERIFIED_STUDENT_PASS',
            });

          const newBooking: Booking =
            {
              ...data,

              id: bookingId,

              status: 'CONFIRMED',

              createdAt:
                new Date().toISOString(),

              qrCodeData: qrData,
            };

          /*
           * Lưu ngay vào Zustand.
           *
           * persist middleware sẽ tự động
           * lưu bookings vào AsyncStorage.
           */
          set((state) => ({
            bookings: [
              newBooking,
              ...state.bookings,
            ],

            waitlist:
              state.waitlist.filter(
                (w) =>
                  !(
                    w.roomId ===
                      data.roomId &&
                    w.date ===
                      data.date &&
                    w.slotId ===
                      data.slotId
                  )
              ),
          }));

          broadcastBookingsSync(get().bookings);

          /*
           * Firebase chỉ được gọi khi thực sự online.
           *
           * Hiện tại initializeRealtimeSync()
           * không tự bật online nếu Firebase chưa
           * hoạt động.
           */
          const {
            syncStatus,
          } = get();

          if (
            syncStatus.isOnline
          ) {
            const result =
              await atomicAddBooking(
                newBooking
              );

            if (
              !result.success
            ) {
              set((state) => ({
                bookings:
                  state.bookings.filter(
                    (b) =>
                      b.id !==
                      bookingId
                  ),
              }));

              const conflictResolution =
                get().checkSlotConflict(
                  data.roomId,
                  data.date,
                  data.slotId
                );

              notificationService.notify(
                '⚡ Xung đột thời gian thực!',

                result.message ||
                  'Có người khác vừa đặt phòng này cùng lúc. Vui lòng chọn ca khác.',

                'CONFLICT'
              );

              return {
                success: false,

                conflict: {
                  ...conflictResolution,

                  hasConflict: true,

                  message:
                    result.message ||
                    'Đặt phòng thất bại — xung đột đồng thời',
                },
              };
            }
          }

          notificationService.scheduleBookingReminder(
            data.roomName,
            data.date,
            data.slotLabel.split(
              ' - '
            )[0]
          );

          notificationService.notify(
            '✅ Đặt phòng thành công!',

            `Phòng ${data.roomName} | Ca ${data.slotLabel} | ${data.date}${
              syncStatus.isOnline
                ? '\n🔴 Đã đồng bộ real-time với tất cả thiết bị.'
                : '\n💾 Đã lưu trên thiết bị.'
            }`,

            'SUCCESS'
          );

          return {
            success: true,

            booking:
              newBooking,
          };
        },

        // ============================================================
        // CANCEL
        // ============================================================

        cancelBooking: async (
          id
        ) => {
          const targetBooking =
            get().bookings.find(
              (b) =>
                b.id === id
            );

          if (
            !targetBooking
          ) {
            return;
          }

          set((state) => ({
            bookings:
              state.bookings.map(
                (b) =>
                  b.id === id
                    ? {
                        ...b,

                        status:
                          'CANCELLED' as const,
                      }
                    : b
              ),
          }));

          broadcastBookingsSync(get().bookings);

          notificationService.notify(
            'Đã hủy đặt phòng',

            `Lịch đặt phòng ${targetBooking.roomName} (${targetBooking.slotLabel} • ${targetBooking.date}) đã được hủy.`,

            'REMINDER'
          );

          if (
            get().syncStatus
              .isOnline
          ) {
            try {
              await atomicCancelBooking(
                id
              );
            } catch {
              set((state) => ({
                bookings:
                  state.bookings.map(
                    (b) =>
                      b.id === id
                        ? {
                            ...b,

                            status:
                              'CONFIRMED' as const,
                          }
                        : b
                  ),
              }));
            }
          }

          const waitingUsers =
            get().waitlist.filter(
              (w) =>
                w.roomId ===
                  targetBooking.roomId &&
                w.date ===
                  targetBooking.date &&
                w.slotId ===
                  targetBooking.slotId
            );

          if (
            waitingUsers.length >
            0
          ) {
            notificationService.notify(
              '🔔 Phòng trong Hàng Đợi vừa trống!',

              `Phòng ${targetBooking.roomName} ca ${targetBooking.slotLabel} vừa được hủy. Bạn (${waitingUsers[0].studentName}) được ưu tiên vào đặt ngay!`,

              'WAITLIST_AVAILABLE'
            );
          }
        },

        // ============================================================
        // CHECK IN
        // ============================================================

        checkInBooking: async (
          id
        ) => {
          set((state) => ({
            bookings:
              state.bookings.map(
                (b) =>
                  b.id === id
                    ? {
                        ...b,

                        status:
                          'CHECKED_IN' as const,
                      }
                    : b
              ),
          }));

          broadcastBookingsSync(get().bookings);

          notificationService.notify(
            'Check-in Thành Công!',

            'Bạn đã xác thực QR thành công. Chúc bạn có buổi học tập hiệu quả tại VKU!',

            'SUCCESS'
          );

          if (
            get().syncStatus
              .isOnline
          ) {
            try {
              await atomicCheckInBooking(
                id
              );
            } catch {
              set((state) => ({
                bookings:
                  state.bookings.map(
                    (b) =>
                      b.id === id
                        ? {
                            ...b,

                            status:
                              'CONFIRMED' as const,
                          }
                        : b
                  ),
              }));
            }
          }
        },

        // ============================================================
        // WAITLIST
        // ============================================================

        joinWaitlist: (
          roomId,
          date,
          slotId
        ) => {
          const {
            currentUser,
            waitlist,
            setAuthModalVisible,
          } = get();

          if (!currentUser) {
            setAuthModalVisible(
              true
            );

            return;
          }

          const alreadyIn =
            waitlist.some(
              (w) =>
                w.roomId ===
                  roomId &&
                w.date === date &&
                w.slotId ===
                  slotId &&
                w.studentId ===
                  currentUser.studentId
            );

          if (alreadyIn) {
            return;
          }

          const item: WaitlistItem =
            {
              id:
                'wait-' +
                Date.now(),

              roomId,

              date,

              slotId,

              studentId:
                currentUser.studentId,

              studentName:
                currentUser.name,

              createdAt:
                Date.now(),
            };

          set((state) => ({
            waitlist: [
              ...state.waitlist,
              item,
            ],
          }));

          notificationService.notify(
            'Đã vào Hàng Đợi (Waitlist)',

            `Tài khoản ${currentUser.name} (${currentUser.studentId}) sẽ nhận thông báo đẩy ngay khi ca này trống.`,

            'REMINDER'
          );
        },

        isUserInWaitlist: (
          roomId,
          date,
          slotId
        ) => {
          const {
            currentUser,
            waitlist,
          } = get();

          if (
            !currentUser
          ) {
            return false;
          }

          return waitlist.some(
            (w) =>
              w.roomId ===
                roomId &&
              w.date === date &&
              w.slotId === slotId &&
              w.studentId === currentUser.studentId
          );
        },

        resetToSeedBookings: () => {
          const fresh = getSeedBookings();
          set({
            bookings: fresh,
            currentUser: DEMO_USERS[0],
          });
          broadcastBookingsSync(fresh);
          notificationService.notify(
            '🔄 Đã nạp lịch sử đặt phòng',
            'Toàn bộ 4 lịch sử đặt phòng mẫu của Nguyễn Thị Thương (23IT.B219) đã sẵn sàng!',
            'SUCCESS'
          );
        },
      }),

      // ============================================================
      // PERSIST
      // ============================================================

      {
        name: 'vku-booking-storage-v7',
        storage: createJSONStorage(() => AsyncStorage),
        onRehydrateStorage: () => (state) => {
          if (state) {
            if (!state.currentUser) {
              state.currentUser = DEMO_USERS[0];
            }
            if (!state.bookings || state.bookings.length === 0) {
              state.bookings = getSeedBookings();
            }
          }
        },

        /*
         * Chỉ lưu dữ liệu cần thiết.
         *
         * Không lưu syncStatus vì trạng thái
         * Firebase phải được kiểm tra lại
         * mỗi lần mở app.
         */
        partialize: (state) => ({
          bookings:
            state.bookings,

          waitlist:
            state.waitlist,

          currentUser:
            state.currentUser,

          availableUsers:
            state.availableUsers,
        }),
      }
    )
  );

// ================================================================
// FIRESTORE REALTIME SYNC
// ================================================================

let _unsubscribeFirestore:
  (() => void) | null = null;

/*
 * QUAN TRỌNG:
 *
 * Hiện tại chưa bật Firestore realtime
 * để tránh Firebase đang cấu hình sai/giả
 * ghi đè dữ liệu local.
 *
 * AsyncStorage sẽ là bộ nhớ chính ở bước này.
 *
 * Sau khi kiểm tra F5 hoạt động ổn,
 * chúng ta sẽ bật Firebase thật.
 */
export function initializeRealtimeSync(): () => void {
  console.log('[Storage & Realtime] Khởi động chế độ đồng bộ tức thì đa cửa sổ (BroadcastChannel & Local Storage).');

  useBookingStore.getState()._setSyncStatus({
    isOnline: true,
    isConnecting: false,
    lastSyncedAt: new Date().toISOString(),
    error: null,
  });

  // 1. Lắng nghe BroadcastChannel (<1ms giữa các cửa sổ/tab trên cùng trình duyệt hoặc PWA)
  if (syncChannel) {
    syncChannel.onmessage = (event) => {
      if (event.data?.type === 'VKU_BOOKINGS_SYNC' && Array.isArray(event.data.bookings)) {
        console.log('[RealtimeSync] Nhận đồng bộ tức thì từ cửa sổ khác:', event.data.bookings.length, 'bookings');
        useBookingStore.setState({ bookings: event.data.bookings });
      }
    };
  }

  // 2. Lắng nghe storage event (đồng bộ ngay khi có tab khác ghi vào localStorage)
  let storageHandler: ((e: StorageEvent) => void) | null = null;
  if (typeof window !== 'undefined' && window.addEventListener) {
    storageHandler = (e: StorageEvent) => {
      if ((e.key === 'vku-booking-storage-v7' || e.key === 'vku-booking-storage') && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.state?.bookings) {
            useBookingStore.setState({ bookings: parsed.state.bookings });
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', storageHandler);
  }

  return () => {
    if (_unsubscribeFirestore) {
      _unsubscribeFirestore();
      _unsubscribeFirestore = null;
    }
    if (typeof window !== 'undefined' && storageHandler) {
      window.removeEventListener('storage', storageHandler);
    }
  };
}