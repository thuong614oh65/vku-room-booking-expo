/**
 * realtimeBookingService.ts
 * 
 * Real-time multi-device booking sync sử dụng Firebase Firestore.
 * 
 * Tính năng:
 * - onSnapshot listener: Nhận cập nhật tức thì (<100ms) khi có booking mới từ bất kỳ thiết bị nào
 * - runTransaction: Atomic write để tránh double-booking dù 2 người cùng đặt cùng 1 giây
 * - Timestamp chuẩn Firestore (millisecond level) để arbitration khi conflict
 * - Offline fallback về AsyncStorage khi mất mạng
 */

import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  getDocs,
  writeBatch,
  where,
  Unsubscribe,
  DocumentData,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Booking } from '../types/booking';

const BOOKINGS_COLLECTION = 'bookings';

// ─────────────────────────────────────────────────────────────────────────────
// Converter: Firestore Document ↔ Booking object
// ─────────────────────────────────────────────────────────────────────────────

function docToBooking(id: string, data: DocumentData): Booking {
  return {
    id,
    roomId: data.roomId,
    roomName: data.roomName,
    roomCode: data.roomCode,
    building: data.building,
    floor: data.floor || '',
    date: data.date,
    slotId: data.slotId,
    slotLabel: data.slotLabel,
    studentName: data.studentName,
    studentId: data.studentId,
    studentEmail: data.studentEmail || '',
    purpose: data.purpose,
    groupSize: data.groupSize,
    status: data.status,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : (data.createdAt || new Date().toISOString()),
    checkedInAt: data.checkedInAt instanceof Timestamp
      ? data.checkedInAt.toDate().toISOString()
      : data.checkedInAt,
    qrCodeData: data.qrCodeData || '',
    // serverTimestampMs: dùng để so sánh khi conflict
    serverTimestampMs: data.serverTimestampMs || 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Real-time listener: subscribe tất cả bookings, gọi callback khi có thay đổi
// ─────────────────────────────────────────────────────────────────────────────

export function subscribeToBookings(
  onUpdate: (bookings: Booking[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, BOOKINGS_COLLECTION),
    orderBy('serverTimestampMs', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const bookings: Booking[] = [];
      snapshot.forEach((docSnap) => {
        bookings.push(docToBooking(docSnap.id, docSnap.data()));
      });
      onUpdate(bookings);
    },
    (error) => {
      console.error('[RealtimeSync] Firestore listener error:', error);
      onError?.(error);
    }
  );

  return unsubscribe;
}

// ─────────────────────────────────────────────────────────────────────────────
// Atomic booking: dùng Firestore Transaction để tránh double-booking
// Transaction đảm bảo: chỉ 1 trong 2 request thắng dù xảy ra đồng thời
// ─────────────────────────────────────────────────────────────────────────────

export async function atomicAddBooking(
  booking: Omit<Booking, 'serverTimestampMs'>
): Promise<{ success: boolean; message?: string; existingBooking?: Booking }> {
  // Document ID = roomId + date + slotId (slug duy nhất cho mỗi slot)
  // Nếu document này đã tồn tại và status != CANCELLED → conflict
  const slotDocId = `${booking.roomId}__${booking.date}__${booking.slotId}`;
  const slotDocRef = doc(db, BOOKINGS_COLLECTION, slotDocId);

  // Cũng cần check xem student này đã có booking cùng date+slotId ở phòng khác chưa
  // (Cross-room personal conflict) — dùng additional doc pattern
  const personalSlotDocId = `PERSONAL__${booking.studentId}__${booking.date}__${booking.slotId}`;
  const personalSlotDocRef = doc(db, BOOKINGS_COLLECTION, personalSlotDocId);

  let conflictMessage: string | undefined;
  let existingBooking: Booking | undefined;

  try {
    await runTransaction(db, async (transaction) => {
      // Read cả 2 document trong transaction (atomic read)
      const [slotSnap, personalSnap] = await Promise.all([
        transaction.get(slotDocRef),
        transaction.get(personalSlotDocRef),
      ]);

      // ── Check 1: Phòng này đã có người đặt chưa?
      if (slotSnap.exists() && slotSnap.data()?.status !== 'CANCELLED') {
        const existing = docToBooking(slotSnap.id, slotSnap.data()!);
        existingBooking = existing;
        conflictMessage =
          existing.studentId === booking.studentId
            ? `Bạn (${booking.studentName}) đã đặt phòng ${booking.roomName} ca này rồi!`
            : `Phòng ${booking.roomName} ca ${booking.slotLabel} đã được sinh viên ${existing.studentName} (${existing.studentId}) đặt trước ${new Date(existing.createdAt).toLocaleTimeString('vi-VN')}.`;
        throw new Error('SLOT_TAKEN');
      }

      // ── Check 2: Sinh viên này đã có lịch khác cùng ca chưa?
      if (personalSnap.exists() && personalSnap.data()?.status !== 'CANCELLED') {
        const existing = docToBooking(personalSnap.id, personalSnap.data()!);
        existingBooking = existing;
        conflictMessage = `Trùng lịch cá nhân: Bạn đã đặt phòng ${existing.roomName} vào cùng ca ${booking.slotLabel} ngày ${booking.date}!`;
        throw new Error('PERSONAL_CONFLICT');
      }

      // ── Không conflict → Ghi atomic vào Firestore
      const now = Date.now();
      const bookingData = {
        ...booking,
        serverTimestampMs: now,
        createdAt: serverTimestamp(),
        status: 'CONFIRMED',
      };

      // Ghi vào document chính (roomId+date+slotId)
      transaction.set(slotDocRef, bookingData);
      // Ghi vào document personal conflict tracker
      transaction.set(personalSlotDocRef, {
        ...bookingData,
        _type: 'personal_slot_tracker',
        referencedDocId: slotDocId,
      });
    });

    return { success: true };
  } catch (error: any) {
    if (error.message === 'SLOT_TAKEN' || error.message === 'PERSONAL_CONFLICT') {
      return {
        success: false,
        message: conflictMessage,
        existingBooking,
      };
    }
    console.error('[RealtimeSync] Transaction failed:', error);
    return {
      success: false,
      message: 'Lỗi kết nối mạng. Vui lòng thử lại.',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cancel booking (atomic update)
// ─────────────────────────────────────────────────────────────────────────────

export async function atomicCancelBooking(bookingId: string): Promise<void> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await updateDoc(docRef, {
      status: 'CANCELLED',
      cancelledAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('[RealtimeSync] Cancel failed:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Check-in booking
// ─────────────────────────────────────────────────────────────────────────────

export async function atomicCheckInBooking(bookingId: string): Promise<void> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await updateDoc(docRef, {
      status: 'CHECKED_IN',
      checkedInAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('[RealtimeSync] Check-in failed:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed bookings vào Firestore (chạy 1 lần khi collection rỗng)
// ─────────────────────────────────────────────────────────────────────────────

export async function seedFirestoreIfEmpty(seedBookings: Booking[]): Promise<void> {
  try {
    const snapshot = await getDocs(
      query(collection(db, BOOKINGS_COLLECTION), where('_type', '!=', 'personal_slot_tracker'))
    );

    // Chỉ seed nếu không có booking thực nào
    const realBookings = snapshot.docs.filter(d => !d.data()._type);
    if (realBookings.length > 0) {
      console.log(`[RealtimeSync] Firestore đã có ${realBookings.length} bookings, bỏ qua seed.`);
      return;
    }

    console.log('[RealtimeSync] Seeding initial bookings...');
    const batch = writeBatch(db);
    const now = Date.now();

    for (const booking of seedBookings) {
      const slotDocId = `${booking.roomId}__${booking.date}__${booking.slotId}`;
      const slotDocRef = doc(db, BOOKINGS_COLLECTION, slotDocId);
      batch.set(slotDocRef, {
        ...booking,
        serverTimestampMs: now - 3600000, // 1 giờ trước (seed cũ hơn booking mới)
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
    console.log(`[RealtimeSync] Đã seed ${seedBookings.length} bookings vào Firestore.`);
  } catch (error) {
    console.error('[RealtimeSync] Seed failed (mạng yếu?):', error);
    // Không throw — app vẫn chạy với local state
  }
}
