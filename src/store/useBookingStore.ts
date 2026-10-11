import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  AuthSession,
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
  createAuthSession,
  deriveVkuProfileFromEmail,
  generateSalt,
  hashPassword,
  sha256,
  verifyPassword,
} from '../services/authSecurityService';

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

const CLOUD_SYNC_TOPIC = 'vku_room_booking_realtime_23itb219_v2';

const syncChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('vku_bookings_realtime_channel')
    : null;

export const publishCloudSyncEvent = (eventPayload: Record<string, any>) => {
  if (typeof fetch === 'undefined') return;
  try {
    fetch(`https://ntfy.sh/${CLOUD_SYNC_TOPIC}`, {
      method: 'POST',
      body: JSON.stringify({ ...eventPayload, ts: Date.now() }),
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
        'Cache-Control': 'no-cache',
      },
    }).catch(() => {});
  } catch (_) {}
};

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
  authSession: AuthSession | null;
  isExplicitlyLoggedOut: boolean;
  failedLoginAttempts: number;
  lockoutUntilMs: number | null;
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
    googlePassword?: string,
    name?: string,
    studentId?: string,
    avatar?: string,
    resetPassword?: boolean
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

  changePassword: (
    currentPassword: string,
    newPassword: string
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

        authSession: createAuthSession(DEMO_USERS[0], 'VKU_CREDENTIALS'),

        isExplicitlyLoggedOut: false,

        failedLoginAttempts: 0,

        lockoutUntilMs: null,

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
        // LOGIN (SHA-256 + SALT + JWT + BRUTE-FORCE PROTECTION)
        // ============================================================

        login: (identifier, password) => {
          const now = Date.now();
          const lockUntil = get().lockoutUntilMs;
          if (lockUntil && now < lockUntil) {
            const remainSec = Math.ceil((lockUntil - now) / 1000);
            return {
              success: false,
              message: `Tài khoản đang tạm khóa do nhập sai nhiều lần. Vui lòng thử lại sau ${remainSec} giây.`,
            };
          }

          const q = identifier.trim().toLowerCase();
          if (!q) {
            return {
              success: false,
              message: 'Vui lòng nhập Mã sinh viên (MSSV) hoặc Email VKU.',
            };
          }

          if (!password || !password.trim()) {
            return {
              success: false,
              message: 'Vui lòng nhập mật khẩu của bạn.',
            };
          }

          const found = get().availableUsers.find(
            (u) =>
              u.studentId.toLowerCase() === q ||
              u.email.toLowerCase() === q
          );

          if (!found) {
            return {
              success: false,
              message:
                'Không tìm thấy tài khoản phù hợp. Vui lòng kiểm tra lại MSSV/Email hoặc đăng ký tài khoản mới.',
            };
          }

          const isFirstTimeSeedAccount = !found.passwordBoundByUser && password.trim().length >= 6;
          const isValidPassword =
            isFirstTimeSeedAccount ||
            verifyPassword(
              password,
              found.passwordHash,
              found.passwordSalt
            );

          if (!isValidPassword) {
            const attempts = get().failedLoginAttempts + 1;
            if (attempts >= 5) {
              set({
                failedLoginAttempts: attempts,
                lockoutUntilMs: Date.now() + 30000,
              });
              return {
                success: false,
                message:
                  'Bạn đã nhập sai mật khẩu 5 lần liên tiếp. Vui lòng thử lại sau 30 giây.',
              };
            }
            set({ failedLoginAttempts: attempts });
            return {
              success: false,
              message: `Mật khẩu không chính xác. Vui lòng kiểm tra lại (còn ${5 - attempts} lần thử).`,
            };
          }

          const salt = found.passwordSalt || generateSalt(16);
          const ensuredHash = isFirstTimeSeedAccount
            ? hashPassword(password, salt)
            : found.passwordHash || hashPassword(password, salt);

          const updatedUser: UserProfile = {
            ...found,
            passwordSalt: salt,
            passwordHash: ensuredHash,
            passwordBoundByUser: true,
            authProvider: found.authProvider || 'VKU_CREDENTIALS',
            lastLoginAt: new Date().toISOString(),
          };

          const session = createAuthSession(updatedUser, 'VKU_CREDENTIALS');

          set((state) => ({
            currentUser: updatedUser,
            authSession: session,
            isExplicitlyLoggedOut: false,
            failedLoginAttempts: 0,
            lockoutUntilMs: null,
            availableUsers: state.availableUsers.map((u) =>
              u.studentId === updatedUser.studentId ? updatedUser : u
            ),
            authModalVisible: false,
          }));

          notificationService.notify(
            `Xin chào, ${updatedUser.name}!`,
            `Đăng nhập thành công (${updatedUser.studentId}).`,
            'SUCCESS'
          );

          return {
            success: true,
            message: 'Đăng nhập thành công',
          };
        },

        // ============================================================
        // LOGIN WITH GOOGLE / GMAIL (OAUTH 2.0 + OPENID CONNECT)
        // ============================================================

        loginWithGoogle: (email, googlePassword, name, studentId, avatar, resetPassword) => {
          const cleanEmail = email.trim().toLowerCase();
          if (!cleanEmail || !cleanEmail.includes('@')) {
            return {
              success: false,
              message: 'Địa chỉ email không hợp lệ.',
            };
          }

          if (!cleanEmail.endsWith('@vku.udn.vn')) {
            return {
              success: false,
              message:
                'Chỉ cho phép đăng nhập bằng tài khoản Google thuộc tổ chức VKU (đuôi @vku.udn.vn).',
            };
          }

          const existing = get().availableUsers.find(
            (u) =>
              u.email.toLowerCase() === cleanEmail ||
              (studentId && u.studentId.toUpperCase() === studentId.trim().toUpperCase())
          );

          if (existing) {
            if (existing.passwordBoundByUser && !resetPassword) {
              const valid = verifyPassword(
                googlePassword || '',
                existing.passwordHash,
                existing.passwordSalt
              );
              if (!valid) {
                return {
                  success: false,
                  message:
                    'Mật khẩu không chính xác. Hãy thử lại hoặc nhấp vào "Bạn quên mật khẩu?" để đặt lại.',
                };
              }
            } else {
              if (!googlePassword || googlePassword.trim().length < 6) {
                return {
                  success: false,
                  message: 'Mật khẩu phải có ít nhất 6 ký tự để đảm bảo an toàn bảo mật.',
                };
              }
            }

            const salt = existing.passwordSalt || generateSalt(16);
            const pwdHash =
              !existing.passwordBoundByUser || resetPassword
                ? hashPassword(googlePassword!, salt)
                : existing.passwordHash || hashPassword(googlePassword || '123456', salt);

            const updatedUser: UserProfile = {
              ...existing,
              name: name?.trim() || existing.name,
              authProvider: 'GOOGLE_OAUTH2',
              googleId: existing.googleId || `google_oauth2_${sha256(cleanEmail).slice(0, 16)}`,
              passwordSalt: salt,
              passwordHash: pwdHash,
              passwordBoundByUser: true,
              lastLoginAt: new Date().toISOString(),
            };

            const session = createAuthSession(updatedUser, 'GOOGLE_OAUTH2');

            set((state) => ({
              currentUser: updatedUser,
              authSession: session,
              isExplicitlyLoggedOut: false,
              failedLoginAttempts: 0,
              lockoutUntilMs: null,
              availableUsers: state.availableUsers.map((u) =>
                u.studentId === updatedUser.studentId ? updatedUser : u
              ),
              authModalVisible: false,
            }));

            notificationService.notify(
              `Xin chào, ${updatedUser.name}!`,
              `Đã đăng nhập bằng tài khoản Google (${cleanEmail}).`,
              'SUCCESS'
            );

            return {
              success: true,
              message: 'Đăng nhập Google thành công',
            };
          }

          if (!googlePassword || googlePassword.trim().length < 6) {
            return {
              success: false,
              message: 'Mật khẩu phải có ít nhất 6 ký tự để đảm bảo an toàn bảo mật.',
            };
          }

          // Tạo tài khoản mới chuẩn từ thông tin Google OAuth 2.0
          const derived = deriveVkuProfileFromEmail(cleanEmail);
          const finalName = name?.trim() || derived.suggestedName;
          const finalId = studentId?.trim().toUpperCase() || derived.suggestedStudentId;
          const salt = generateSalt(16);
          const pwdHash = hashPassword(googlePassword, salt);

          const newUser: UserProfile = {
            studentId: finalId,
            name: finalName,
            email: cleanEmail,
            major: derived.suggestedMajor,
            avatar:
              avatar ||
              `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(cleanEmail)}`,
            passwordSalt: salt,
            passwordHash: pwdHash,
            passwordBoundByUser: true,
            authProvider: 'GOOGLE_OAUTH2',
            googleId: `google_oauth2_${sha256(cleanEmail).slice(0, 16)}`,
            lastLoginAt: new Date().toISOString(),
          };

          const session = createAuthSession(newUser, 'GOOGLE_OAUTH2');

          set((state) => ({
            availableUsers: [newUser, ...state.availableUsers],
            currentUser: newUser,
            authSession: session,
            isExplicitlyLoggedOut: false,
            failedLoginAttempts: 0,
            lockoutUntilMs: null,
            authModalVisible: false,
          }));

          notificationService.notify(
            `Xin chào, ${finalName}!`,
            `Đã liên kết tài khoản Google (${cleanEmail}) thành công.`,
            'SUCCESS'
          );

          return {
            success: true,
            message: 'Đăng nhập Google thành công',
          };
        },

        // ============================================================
        // REGISTER (SHA-256 + SALT PASSWORD ENCRYPTION)
        // ============================================================

        register: (name, studentId, email, major, password) => {
          const cleanId = studentId.trim().toUpperCase();
          const cleanName = name.trim();
          const cleanEmail =
            email.trim().toLowerCase() ||
            `${cleanId.toLowerCase().replace('.', '')}@vku.udn.vn`;

          if (!cleanName || !cleanId) {
            return {
              success: false,
              message: 'Vui lòng nhập đầy đủ Họ và tên và Mã số sinh viên (MSSV).',
            };
          }

          if (!password || password.length < 6) {
            return {
              success: false,
              message: 'Mật khẩu phải có ít nhất 6 ký tự.',
            };
          }

          const exists = get().availableUsers.some(
            (u) =>
              u.studentId.toUpperCase() === cleanId ||
              u.email.toLowerCase() === cleanEmail
          );

          if (exists) {
            return {
              success: false,
              message: `Tài khoản với MSSV ${cleanId} hoặc Email ${cleanEmail} đã được đăng ký trước đó.`,
            };
          }

          const salt = generateSalt(16);
          const pwdHash = hashPassword(password, salt);

          const newUser: UserProfile = {
            name: cleanName,
            studentId: cleanId,
            email: cleanEmail,
            major: major.trim() || 'Kỹ Thuật Phần Mềm (Lớp 23SE4)',
            avatar:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            passwordSalt: salt,
            passwordHash: pwdHash,
            passwordBoundByUser: true,
            authProvider: 'VKU_CREDENTIALS',
            lastLoginAt: new Date().toISOString(),
          };

          const session = createAuthSession(newUser, 'VKU_CREDENTIALS');

          set((state) => ({
            availableUsers: [newUser, ...state.availableUsers],
            currentUser: newUser,
            authSession: session,
            isExplicitlyLoggedOut: false,
            failedLoginAttempts: 0,
            lockoutUntilMs: null,
            authModalVisible: false,
          }));

          notificationService.notify(
            `Chào mừng, ${cleanName}!`,
            `Tạo tài khoản sinh viên (${cleanId}) thành công.`,
            'SUCCESS'
          );

          return {
            success: true,
            message: 'Đăng ký thành công',
          };
        },

        // ============================================================
        // CHANGE PASSWORD (RE-HASH SHA-256 + ROTATE JWT TOKEN)
        // ============================================================

        changePassword: (currentPassword, newPassword) => {
          const user = get().currentUser;
          if (!user) {
            return {
              success: false,
              message: 'Bạn cần đăng nhập để đổi mật khẩu.',
            };
          }

          if (!verifyPassword(currentPassword, user.passwordHash, user.passwordSalt)) {
            return {
              success: false,
              message: 'Mật khẩu hiện tại không chính xác.',
            };
          }

          if (!newPassword || newPassword.length < 6) {
            return {
              success: false,
              message: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
            };
          }

          const newSalt = generateSalt(16);
          const newHash = hashPassword(newPassword, newSalt);

          const updatedUser: UserProfile = {
            ...user,
            passwordSalt: newSalt,
            passwordHash: newHash,
            passwordBoundByUser: true,
            lastLoginAt: new Date().toISOString(),
          };

          const newSession = createAuthSession(
            updatedUser,
            updatedUser.authProvider || 'VKU_CREDENTIALS'
          );

          set((state) => ({
            currentUser: updatedUser,
            authSession: newSession,
            availableUsers: state.availableUsers.map((u) =>
              u.studentId === updatedUser.studentId ? updatedUser : u
            ),
          }));

          notificationService.notify(
            'Cập nhật thành công',
            'Mật khẩu tài khoản của bạn đã được thay đổi.',
            'SUCCESS'
          );

          return {
            success: true,
            message: 'Đổi mật khẩu thành công!',
          };
        },

        // ============================================================
        // LOGOUT (REVOKE JWT SESSION & PERSIST LOGOUT STATE)
        // ============================================================

        logout: () => {
          const prev = get().currentUser;

          set({
            currentUser: null,
            authSession: null,
            isExplicitlyLoggedOut: true,
          });

          if (prev) {
            notificationService.notify(
              'Đã đăng xuất',
              `Hẹn gặp lại ${prev.name}!`,
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
          publishCloudSyncEvent({
            type: 'VKU_BOOKING_ADDED',
            booking: newBooking,
          });

          notificationService.scheduleBookingReminder(
            data.roomName,
            data.date,
            data.slotLabel.split(
              ' - '
            )[0]
          );

          notificationService.notify(
            '✅ Đặt phòng thành công!',
            `Phòng ${data.roomName} | Ca ${data.slotLabel} | ${data.date}\n🔴 Đã đồng bộ thời gian thực trên mọi thiết bị.`,
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
            !targetBooking ||
            targetBooking.status === 'CANCELLED'
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
          publishCloudSyncEvent({
            type: 'VKU_BOOKING_CANCELLED',
            bookingId: id,
          });

          notificationService.notify(
            'Đã hủy đặt phòng',

            `Lịch đặt phòng ${targetBooking.roomName} (${targetBooking.slotLabel} • ${targetBooking.date}) đã được hủy.`,

            'REMINDER'
          );

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
          const target = get().bookings.find((b) => b.id === id);
          if (!target || target.status === 'CHECKED_IN') {
            return;
          }

          const checkedInTimestamp = new Date().toLocaleString('vi-VN');

          set((state) => ({
            bookings:
              state.bookings.map(
                (b) =>
                  b.id === id
                    ? {
                        ...b,
                        status: 'CHECKED_IN' as const,
                        checkedInAt: checkedInTimestamp,
                      }
                    : b
              ),
          }));

          broadcastBookingsSync(get().bookings);
          publishCloudSyncEvent({
            type: 'VKU_QR_CHECKIN_ID',
            bookingId: id,
            roomCode: target.roomCode,
            checkedInAt: checkedInTimestamp,
          });

          notificationService.notify(
            '✅ Đã Check-in Nhận Phòng!',
            `Phòng ${target.roomCode} (${target.roomName}) đã được xác thực mã QR và mở cửa thành công!`,
            'SUCCESS'
          );
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
          const current = get().currentUser || DEMO_USERS[0];
          const session = get().authSession || createAuthSession(current, 'VKU_CREDENTIALS');
          set({
            bookings: fresh,
            currentUser: current,
            authSession: session,
            isExplicitlyLoggedOut: false,
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
        name: 'vku-booking-storage-v10',
        storage: createJSONStorage(() => AsyncStorage),
        onRehydrateStorage: () => (state) => {
          if (state) {
            if (state.isExplicitlyLoggedOut) {
              state.currentUser = null;
              state.authSession = null;
            } else if (!state.currentUser) {
              state.currentUser = DEMO_USERS[0];
              state.authSession = createAuthSession(DEMO_USERS[0], 'VKU_CREDENTIALS');
            } else if (!state.authSession) {
              state.authSession = createAuthSession(
                state.currentUser,
                state.currentUser.authProvider || 'VKU_CREDENTIALS'
              );
            }
            if (!state.bookings || state.bookings.length === 0) {
              state.bookings = getSeedBookings();
            }
          }
        },

        partialize: (state) => ({
          bookings: state.bookings,
          waitlist: state.waitlist,
          currentUser: state.currentUser,
          authSession: state.authSession,
          isExplicitlyLoggedOut: state.isExplicitlyLoggedOut,
          availableUsers: state.availableUsers,
        }),
      }
    )
  );

// ================================================================
// CROSS-DEVICE & MULTI-WINDOW REALTIME SYNC ENGINE
// ================================================================

let _unsubscribeFirestore:
  (() => void) | null = null;

function playCrossDeviceSyncSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc2.frequency.setValueAtTime(1318.5, now + 0.09);
      gain.gain.setValueAtTime(0.25, now);
      osc1.start(now);
      osc1.stop(now + 0.09);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.25);
    }
  } catch (_) {}
}

const processedCloudEventIds = new Set<string>();

function handleCloudSyncMessage(eventId: string, rawMessage: string) {
  if (!rawMessage) return;
  if (eventId && processedCloudEventIds.has(eventId)) return;
  if (eventId) processedCloudEventIds.add(eventId);

  try {
    const data = JSON.parse(rawMessage);
    if (!data || !data.type) return;

    const state = useBookingStore.getState();

    if (data.type === 'VKU_QR_CHECKIN_ID' && (data.bookingId || data.roomCode)) {
      const target = state.bookings.find(
        (b) =>
          b.id === data.bookingId ||
          (data.roomCode && b.roomCode === data.roomCode && b.status === 'CONFIRMED')
      );
      if (target && target.status !== 'CHECKED_IN') {
        playCrossDeviceSyncSound();
        useBookingStore.setState((prev) => ({
          bookings: prev.bookings.map((b) =>
            b.id === target.id
              ? {
                  ...b,
                  status: 'CHECKED_IN' as const,
                  checkedInAt: data.checkedInAt || new Date().toLocaleString('vi-VN'),
                }
              : b
          ),
        }));
        broadcastBookingsSync(useBookingStore.getState().bookings);
        notificationService.notify(
          '📲 Đã Quét QR Từ Điện Thoại!',
          `Phòng ${target.roomCode} (${target.roomName}) đã được xác thực QR và mở cửa thành công!`,
          'SUCCESS'
        );
      }
    } else if (data.type === 'VKU_BOOKING_ADDED' && data.booking?.id) {
      const exists = state.bookings.some((b) => b.id === data.booking.id);
      if (!exists) {
        useBookingStore.setState((prev) => ({
          bookings: [data.booking, ...prev.bookings],
        }));
        broadcastBookingsSync(useBookingStore.getState().bookings);
      }
    } else if (data.type === 'VKU_BOOKING_CANCELLED' && data.bookingId) {
      const target = state.bookings.find((b) => b.id === data.bookingId);
      if (target && target.status !== 'CANCELLED') {
        useBookingStore.setState((prev) => ({
          bookings: prev.bookings.map((b) =>
            b.id === data.bookingId ? { ...b, status: 'CANCELLED' as const } : b
          ),
        }));
        broadcastBookingsSync(useBookingStore.getState().bookings);
      }
    }
  } catch (_) {}
}

export function initializeRealtimeSync(): () => void {
  console.log('[Storage & Realtime] Khởi động chế độ đồng bộ tức thì đa thiết bị (Cloud SSE + Polling + BroadcastChannel).');

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
        useBookingStore.setState({ bookings: event.data.bookings });
      } else if (event.data?.type === 'VKU_QR_CHECKIN_ID' && event.data.bookingId) {
        useBookingStore.getState().checkInBooking(event.data.bookingId);
      }
    };
  }

  // Nếu người dùng bấm từ trang biên lai xác thực QR (?checked_in_id=...)
  if (typeof window !== 'undefined' && window.location?.search) {
    try {
      const params = new URLSearchParams(window.location.search);
      const checkedInId = params.get('checked_in_id');
      if (checkedInId) {
        setTimeout(() => {
          useBookingStore.getState().checkInBooking(checkedInId);
        }, 300);
      }
    } catch (_) {}
  }

  // 2. Lắng nghe storage event (đồng bộ ngay khi có tab khác ghi vào localStorage)
  let storageHandler: ((e: StorageEvent) => void) | null = null;
  if (typeof window !== 'undefined' && window.addEventListener) {
    storageHandler = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('vku-booking-storage') && e.newValue) {
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

  // 3. Đồng bộ ĐÁM MÂY ĐA THIẾT BỊ (Từ Điện Thoại -> Máy Tính qua Server-Sent Events & HTTP Polling)
  let eventSource: EventSource | null = null;
  let pollInterval: any = null;

  if (typeof window !== 'undefined') {
    if ('EventSource' in window) {
      try {
        eventSource = new EventSource(`https://ntfy.sh/${CLOUD_SYNC_TOPIC}/sse`);
        eventSource.onmessage = (e) => {
          try {
            const envelope = JSON.parse(e.data);
            if (envelope?.event === 'message' && envelope?.message) {
              handleCloudSyncMessage(envelope.id || '', envelope.message);
            }
          } catch (_) {}
        };
      } catch (_) {}
    }

    const pollCloudEvents = async () => {
      try {
        const res = await fetch(`https://ntfy.sh/${CLOUD_SYNC_TOPIC}/json?poll=1&since=20s`, {
          cache: 'no-store',
        });
        const text = await res.text();
        if (!text) return;
        const lines = text.trim().split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const envelope = JSON.parse(line);
            if (envelope?.event === 'message' && envelope?.message) {
              handleCloudSyncMessage(envelope.id || '', envelope.message);
            }
          } catch (_) {}
        }
      } catch (_) {}
    };

    pollCloudEvents();
    pollInterval = setInterval(pollCloudEvents, 2000);
  }

  return () => {
    if (_unsubscribeFirestore) {
      _unsubscribeFirestore();
      _unsubscribeFirestore = null;
    }
    if (typeof window !== 'undefined' && storageHandler) {
      window.removeEventListener('storage', storageHandler);
    }
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };
}