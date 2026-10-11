# MINI-PROJECT SHORT TECHNICAL REPORT
**Course:** Cross-Platform Mobile App Development (VKU)
**Mini-Project Title:** Mini-Project 2: VKU Room Booking & Real-Time QR Check-In System
**Team / Student Name:** Nguyễn Thị Thương
**Submission Date:** 12/10/2026

---

## 1. GENERAL INFORMATION & DELIVERABLE LINKS
* **Team Members:**
  1. Nguyễn Thị Thương — Student ID: 23IT.B219 — Lớp SH: 23SE4 — Lớp HP: Phát triển ứng dụng di động đa nền tảng (4) — Role: Full-Stack Developer — Contribution: 100%
* **🔗 Live Demo URL (VKU Room Booking):** [https://vku-room-booking-17t.pages.dev/](https://vku-room-booking-17t.pages.dev/)
* **🔗 Linked Ecosystem App (VKU Field Survey - Mini-Project 1):** [https://vku-field-survey-28x.pages.dev/](https://vku-field-survey-28x.pages.dev/)
* **💻 GitHub Repository:** [https://github.com/thuong614oh65/vku-room-booking-expo](https://github.com/thuong614oh65/vku-room-booking-expo)
* **📱 APK Download Link:** [app-release.apk (78.8 MB)](https://github.com/thuong614oh65/vku-room-booking-expo/releases/download/v1.0.0/app-release.apk)
* **🎥 Video Demo (Optional):** N/A

---

## 2. FEATURE IMPLEMENTATION CHECKLIST
| # | Required Feature | Status | Implementation Details & Acceptance Level |
|:---:|---|:---:|---|
| 1 | Responsive Mobile Viewport | ✅ Complete | 100% responsive across mobile viewports via React Native Web; dark navy header, bottom tab navigation, custom VKU branding icons (`192px`, `512px`, `1024px`). |
| 2 | Real Google OAuth 2.0 (`@vku.udn.vn`) & `SHA-256` Auth | ✅ Complete | Official Google Identity Services (`accounts.google.com/gsi/client`) with `hd: vku.udn.vn` domain restriction + `SHA-256 + Salt` local password hashing (`authService.ts`). |
| 3 | Auto Zalo WebView → Safari/Chrome Redirect | ✅ Complete | Detects embedded WebViews (`Zalo`, `Messenger`, `FBAN`) and auto-redirects to **Safari** on iOS (`x-safari-https://`) or **Chrome** on Android (`intent://`) so Google OAuth & Camera work seamlessly. |
| 4 | Local Offline Persistence | ✅ Complete | Uses Zustand + `@react-native-async-storage/async-storage` for local caching of bookings, waitlist, and authenticated student profile. |
| 5 | Automatic Background Sync | ✅ Complete | Auto-syncs booking data to Google Cloud Firestore & `ntfy.sh` pub/sub cloud channels upon network reconnection (`isSynced` flag queue). |
| 6 | Multi-Parameter Filter | ✅ Complete | Real-time filtering by keyword, building (Khu A/B/C/V/Lib), capacity, equipment, and date/time slot. |
| 7 | VKU 2-Hour Slot Grid | ✅ Complete | 5 standard VKU time slots (07:30–19:30) with visual locking for occupied slots in `TimeSlotGrid.tsx`. |
| 8 | First-Committed-Wins Booking | ✅ Complete | `atomicAddBooking()` in Zustand store prevents duplicate bookings via synchronous `checkSlotConflict()`. |
| 9 | Smart Conflict Resolution | ✅ Complete | Modal recommends alternative rooms (±10 seats), adjacent open slots, or priority waitlist entry. |
| 10 | Priority Waitlist | ✅ Complete | Students queue for booked slots; push notification dispatched automatically when slot is released. |
| 11 | Digital Booking Pass & Smart Verification QR | ✅ Complete | Electronic pass with Student ID, room code, slot time, UUID, and scannable URL QR matrix (`/verify/?id=...`). |
| 12 | Universal QR Check-In (Zalo / Phone Camera / In-App) | ✅ Complete | Scanning via phone Camera/Zalo opens `/verify/index.html` and broadcasts real-time `CHECKED_IN` status (`< 0.5s` via `ntfy.sh` SSE + Polling) to PC/Phone; also supports in-app `jsQR` camera & image upload. |
| 13 | Cross-App Integration with VKU Field Survey (MP1) | ✅ Complete | One-tap **`📊 Đánh Giá CSVC (VKU Field Survey)`** button passes `room`, `building`, `floor`, `name`, and `studentId` via URL query params to Mini-Project 1 (`vku-field-survey-28x.pages.dev`) with real-time server clock. |
| 14 | Booking Lifecycle Management | ✅ Complete | `MyBookingsScreen` with tabs (Upcoming / Checked-In / Cancelled) and one-tap cancellation. |
| 15 | 15-Minute Reminder Notification | ✅ Complete | Background scheduler sends push alert 15 minutes before check-in time. |
| 16 | Cloud Firestore 2-Way Sync | ✅ Complete | Real-time bidirectional sync via Google Cloud Firestore REST API for multi-device consistency. |
| 17 | Native Android APK | ✅ Complete | Production APK (78.8 MB) built via Expo EAS Build, installable on Android 10–15 devices. |
| 18 | PWA Standalone Mode | ✅ Complete | Full PWA with custom VKU Room Booking icons (`192x192`, `512x512`, `180x180`), Service Worker v15, and install prompt. |

---

## 3. TECHNICAL ARCHITECTURE & PROJECT STRUCTURE
* **Directory structure:** App root `App.tsx` → `src/screens/` (BrowseRooms, RoomDetails, BookingConfirmationPass, MyBookings, QRScanner, Profile) → `src/components/` (AuthModal, RoomCard, FilterBar, TimeSlotGrid, ConflictResolutionModal, QRCodeModal, InstallAppModal) → `src/hooks/useRoomsQuery.ts` (TanStack Query) → `src/store/useBookingStore.ts` (Zustand) → `src/services/` (`authService.ts`, `googleOAuthPopupService.ts`, `cloudCheckInSyncService.ts`, `qrVerificationLink.ts`, `fieldSurveyLinkService.ts`, `notificationService.ts`, `realtimeBookingService.ts`) → `public/` (`manifest.json`, `sw.js`, `verify/index.html`, `icons/`).
* **State management & real-time sync flow:** Hybrid State Architecture combining **TanStack Query** (`@tanstack/react-query`) for server state/room caching and **Zustand** (`useBookingStore.ts`) for client state, session, and atomic booking transactions. Cross-device QR Check-In synchronization is powered by `cloudCheckInSyncService.ts` using **Server-Sent Events (`EventSource` SSE)** + HTTP polling over `ntfy.sh` plus `BroadcastChannel` for instant `< 0.5s` status updates between Phone and PC.
* **Exception handling:** (1) Concurrent booking collisions handled by synchronous pre-flight check before state mutation. (2) Embedded WebView restrictions (`403 disallowed_useragent` on Zalo/Messenger): automatically escaped via `x-safari-https://` (iOS) and `intent://` (Android Chrome). (3) Camera permission denied or desktop environment: QR scanner provides graceful fallback to upload a QR image/screenshot (`jsQR` canvas decoder).

---

## 4. EMPIRICAL EVIDENCE & SCREENSHOTS
* *Screenshot 1 — Browse Rooms & Header Integration:* Dark navy header with custom VKU Room Booking logo, `🟢 Online` / `⚡ Real-time` badges, **`📊 Đánh Giá CSVC`** cross-app button, building filter chips (Khu V, A, B, C, Lib), and 60 FPS `FlatList`.
* *Screenshot 2 — Real Google OAuth 2.0 (`@vku.udn.vn`) & Zalo Auto-Redirect:* Official Google Sign-In popup enforcing `@vku.udn.vn` student accounts and auto- extracting MSSV/Class, with automatic Zalo WebView → Safari redirect on iPhone.
* *Screenshot 3 — Digital Booking Pass & Cross-Device QR Check-In:* Student pass (`Nguyễn Thị Thương / 23IT.B219 / 23SE4 / V.A201`) with dynamic QR code; scanning on phone opens `/verify/index.html` receipt and immediately updates the booking pass to `✅ ĐÃ CHECK-IN THÀNH CÔNG`.
* *Screenshot 4 — Ecosystem Link to VKU Field Survey (Mini-Project 1):* Clicking **`📊 Đánh Giá CSVC Phòng V.A201`** opens `https://vku-field-survey-28x.pages.dev/` with pre-filled room code, building, floor, student name, MSSV, and live server-calibrated timestamp.

---

## 5. TECHNICAL CHALLENGES & RESOLUTIONS
* **Challenge 1 — Concurrent Booking Race Condition:** When two students book the same slot simultaneously, async writes can cause duplicates. *Resolution:* Implemented synchronous `checkSlotConflict(roomId, date, slotId)` inside `atomicAddBooking()` so only the first commit is confirmed; the second triggers `ConflictResolutionModal` with alternative rooms and slots.
* **Challenge 2 — Google OAuth `403 disallowed_useragent` in Zalo WebView:** Google blocks OAuth 2.0 inside embedded in-app browsers (Zalo, Messenger) for security. *Resolution:* Removed all simulated in-app login screens, integrated official Google Identity Services (`accounts.google.com/gsi/client`), and implemented automatic WebView detection in `index.html`, `verify/index.html`, and `googleOAuthPopupService.ts` that immediately triggers `x-safari-https://...` on iOS or `intent://...#Intent;package=com.android.chrome;end` on Android to open the native browser.
* **Challenge 3 — Cross-Device QR Check-In Without Same-Browser Session:** Scanning a QR code generated on a laptop using a phone's native Camera or Zalo runs on two completely separate devices. *Resolution:* Encoded booking metadata into a signed verification URL (`/verify/?id=...`) that dispatches an instant cloud pub/sub payload via `ntfy.sh` (`cloudCheckInSyncService.ts`), updating the laptop/phone app screen to `CHECKED_IN` in under `0.5s`.
