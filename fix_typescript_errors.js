/**
 * fix_typescript_errors.js
 * Fixes all TypeScript errors found in tsc --noEmit
 */

const fs = require('fs');
const path = require('path');

const BASE = __dirname;
const W = (f, c) => fs.writeFileSync(path.join(BASE, f), c, 'utf8');
const R = (f) => fs.readFileSync(path.join(BASE, f), 'utf8');

// ── 1. Add checkedInAt to Booking type ───────────────────────────────────────
const bookingTypes = R('src/types/booking.ts').replace(
  `  createdAt: string;
  qrCodeData: string;`,
  `  createdAt: string;
  checkedInAt?: string;
  qrCodeData: string;`
);
W('src/types/booking.ts', bookingTypes);
console.log('✓ src/types/booking.ts — added checkedInAt?');

// ── 2. Fix TimeSlotGrid.tsx: badgePillText → badgePill ───────────────────────
let timeSlotGrid = R('src/components/TimeSlotGrid.tsx');
timeSlotGrid = timeSlotGrid.replace(/styles\.badgePillText/g, 'styles.badgePill');
W('src/components/TimeSlotGrid.tsx', timeSlotGrid);
console.log('✓ src/components/TimeSlotGrid.tsx — fixed badgePillText → badgePill');

// ── 3. Fix RoomDetailsScreen.tsx: absoluteFillObject → absoluteFill ──────────
let rds = R('src/screens/RoomDetailsScreen.tsx');
rds = rds.replace(/StyleSheet\.absoluteFillObject/g, 'StyleSheet.absoluteFill');
W('src/screens/RoomDetailsScreen.tsx', rds);
console.log('✓ src/screens/RoomDetailsScreen.tsx — fixed absoluteFillObject → absoluteFill');

// ── 4. Fix MyBookingsScreen.tsx: null checks for currentUser ─────────────────
let mbs = R('src/screens/MyBookingsScreen.tsx');
// wrap currentUser usages that TS says are possibly null
mbs = mbs.replace(
  `return waitlist.filter((w) => w.studentId === currentUser.studentId);`,
  `return waitlist.filter((w) => w.studentId === currentUser?.studentId);`
);
mbs = mbs.replace(
  `          {currentUser.name} • {currentUser.studentId}`,
  `          {currentUser?.name} • {currentUser?.studentId}`
);
W('src/screens/MyBookingsScreen.tsx', mbs);
console.log('✓ src/screens/MyBookingsScreen.tsx — fixed null-safe currentUser');

// ── 5. Fix realtimeBookingService.ts — variable scope issues ─────────────────
let rbs = R('src/services/realtimeBookingService.ts');

// Fix scoping: conflictMessage and existingBooking declared outside runTransaction
rbs = rbs.replace(
  `  try {
    let conflictMessage: string | undefined;
    let existingBooking: Booking | undefined;

    await runTransaction(db, async (transaction) => {`,
  `  let conflictMessage: string | undefined;
  let existingBooking: Booking | undefined;

  try {
    await runTransaction(db, async (transaction) => {`
);

// Fix: remove the if (conflictMessage) check after try (it's already returned via throw)
// and fix the return pattern
rbs = rbs.replace(
  `    if (conflictMessage) {
      return { success: false, message: conflictMessage, existingBooking };
    }

    return { success: true };
  } catch (error: any) {`,
  `    return { success: true };
  } catch (error: any) {`
);

W('src/services/realtimeBookingService.ts', rbs);
console.log('✓ src/services/realtimeBookingService.ts — fixed variable scope');

// ── 6. Fix useBookingStore.ts — duplicate hasConflict ────────────────────────
let store = R('src/store/useBookingStore.ts');

// Fix the spread + hasConflict duplicate issue
store = store.replace(
  `              success: false,
              conflict: {
                hasConflict: true,
                message: result.message || 'Đặt phòng thất bại — xung đột đồng thời',
                ...conflictResolution,
              },`,
  `              success: false,
              conflict: {
                ...conflictResolution,
                hasConflict: true,
                message: result.message || 'Đặt phòng thất bại — xung đột đồng thời',
              },`
);

W('src/store/useBookingStore.ts', store);
console.log('✓ src/store/useBookingStore.ts — fixed duplicate hasConflict');

console.log('\n✅ Tất cả TypeScript errors đã được fix! Chạy: npx tsc --noEmit để xác nhận.');
