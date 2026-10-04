# BÁO CÁO KỸ THUẬT TIỂU LUẬN / MINI-PROJECT 2
## HỌC PHẦN: LẬP TRÌNH ĐA NỀN TẢNG (CROSS-PLATFORM DEVELOPMENT)
**TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG VIỆT - HÀN (VKU)**  
**KHOA KHOA HỌC MÁY TÍNH**

---

### 📋 THÔNG TIN SINH VIÊN & ĐỀ TÀI
* **Họ và tên sinh viên:** Nguyễn Thị Thương
* **Mã số sinh viên (MSSV):** 23IT.B219
* **Lớp sinh hoạt:** 23ITB
* **Email sinh viên:** [thuongnt.23itb@vku.udn.vn](mailto:thuongnt.23itb@vku.udn.vn)
* **Giảng viên hướng dẫn:** TS. Nguyễn Thanh Tuấn
* **Tên đề tài:** *VKU Room Booking — Hệ thống tra cứu, mượn phòng học & kiểm soát mã QR thời gian thực (React Native, Expo SDK 57, Firestore & Offline-First PWA)*
* **Thời gian thực hiện:** Tuần 5 – Tuần 6 • **Trọng số điểm:** 10%

---

## 1. THÔNG TIN BÀN GIAO & LIÊN KẾT MINH CHỨNG (DELIVERABLES)

* **🌐 Live Web Demo (Cloudflare Pages):** [https://vku-room-booking-17t.pages.dev/](https://vku-room-booking-17t.pages.dev/)
* **📁 GitHub Repository (Public):** [https://github.com/thuong614oh65/vku-room-booking-expo](https://github.com/thuong614oh65/vku-room-booking-expo)
* **📱 Tải Trực Tiếp Native Android APK:** [app-release.apk (v1.0.0 - 78.8 MB)](https://github.com/thuong614oh65/vku-room-booking-expo/releases/download/v1.0.0/app-release.apk)
* **⚡ Expo Application Services (EAS Build):** [EAS Build Artifact Details (Build ID: 56663180-6a06-4ae6-91e6-f991c7d8d73c)](https://expo.dev/accounts/thuong221332/projects/vku-room-booking/builds/56663180-6a06-4ae6-91e6-f991c7d8d73c)

---

## 2. BẢNG KIỂM TRA ĐỐI SOÁT TÍNH NĂNG (FEATURE CHECKLIST)

| STT | Tính năng yêu cầu | Trạng thái | Minh chứng kỹ thuật trong mã nguồn |
|:---:|:---|:---:|:---|
| 1 | **Danh sách phòng học 60 FPS** | ✅ Đạt 100% | `BrowseRoomsScreen.tsx`: Dùng `FlatList` kết hợp `React.memo(RoomCard)`, `initialNumToRender: 6`, `windowSize: 5`, cuộn mượt mà không rớt khung hình. |
| 2 | **Bộ lọc đa tiêu chí & Ngày giờ** | ✅ Đạt 100% | `FilterBar.tsx`: Lọc theo từ khóa, tòa nhà (Khu A, B, C, V, Lib), sức chứa, thiết bị và lọc ca học/ngày giờ khả dụng. |
| 3 | **Lưới ca học chuẩn VKU (2 tiếng)** | ✅ Đạt 100% | `TimeSlotGrid.tsx`: 5 ca học VKU (07:30–09:30, 09:30–11:30, 13:00–15:00, 15:00–17:00, 17:30–19:30) kèm trạng thái khóa thị giác slot đã kín. |
| 4 | **Giải quyết xung đột First-Committed** | ✅ Đạt 100% | `useBookingStore.ts`: Cơ chế Atomic Commit với `checkSlotConflict()`, đảm bảo khi 2 người cùng bấm đặt phòng, chỉ người đến trước thành công. |
| 5 | **Modal điều phối thông minh** | ✅ Đạt 100% | `ConflictResolutionModal.tsx`: Gợi ý phòng tương đương cùng tòa/sức chứa, gợi ý ca học khác và đăng ký danh sách chờ. |
| 6 | **Hàng đợi ưu tiên (Priority Waitlist)** | ✅ Đạt 100% | `useBookingStore.ts`: Đăng ký nhận giữ chỗ tự động; khi người trước hủy phòng, hệ thống tự động đẩy thông báo ưu tiên cho người chờ. |
| 7 | **Thẻ mượn phòng số (Digital Pass)** | ✅ Đạt 100% | `BookingConfirmationPassScreen.tsx`: Vé điện tử chứa mã sinh viên, mã phòng, ca học, mã định danh duy nhất và mã QR xác thực. |
| 8 | **Quét mã QR camera thực tế** | ✅ Đạt 100% | `QRScannerScreen.tsx`: Tích hợp camera thực tế phân tích mã QR sub-second, có đèn Flash toggle và nhận diện tức thì. |
| 9 | **Xác thực Check-in tại cửa** | ✅ Đạt 100% | Xác thực mã vé hợp lệ, tự động cập nhật trạng thái `CHECKED_IN` và ghi nhận thời gian vào phòng. |
| 10 | **Quản lý lịch mượn phòng cá nhân** | ✅ Đạt 100% | `MyBookingsScreen.tsx`: Phân loại 3 tab Sắp tới / Đã vào / Đã hủy, hỗ trợ hủy phòng giải phóng slot cho người khác. |
| 11 | **Nhắc nhở tự động 15 phút** | ✅ Đạt 100% | `notificationService.ts`: Tự động hẹn giờ phát thông báo đẩy trước ca học 15 phút và phát Toast tương tác trực quan. |
| 12 | **Lưu trữ Offline-First (Persistence)** | ✅ Đạt 100% | Tích hợp Zustand với `@react-native-async-storage/async-storage`, lưu trữ toàn bộ dữ liệu phòng và vé không bị mất khi F5. |
| 13 | **Đồng bộ thời gian thực Firestore** | ✅ Đạt 100% | `realtimeBookingService.ts`: Tích hợp Google Firestore REST API, đồng bộ hai chiều thời gian thực giữa các thiết bị. |
| 14 | **Đóng gói Native Android APK** | ✅ Đạt 100% | Xây dựng thành công tệp Native Release APK độc lập (`78.8 MB`), cài đặt trực tiếp trên các dòng máy Android. |
| 15 | **PWA Standalone & Bộ icon chuẩn** | ✅ Đạt 100% | `manifest.json` & `sw.js` (Cache-First v15), icon 192x192 & 512x512, hỗ trợ cài đặt Add to Home Screen và cửa sổ độc lập. |

---

## 3. KIẾN TRÚC HỆ THỐNG & GIẢI PHÁP KỸ THUẬT TRỌNG TÂM

### 3.1. Kiến trúc phân tầng (Three-Layer Architecture)
Ứng dụng được thiết kế theo mô hình 3 lớp phân tách trách nhiệm rõ ràng (Separation of Concerns):
1. **Lớp Giao diện (Presentation Layer):**
   - Xây dựng bằng React Native kết hợp React Navigation (Native Stack + Bottom Tabs).
   - Áp dụng các kỹ thuật tối ưu hóa 60 FPS: `React.memo`, `useCallback`, `useMemo`, `initialNumToRender: 6`.
2. **Lớp Xử lý nghiệp vụ & Quản lý trạng thái (Business & State Layer):**
   - Trung tâm điều phối bởi Zustand Store (`useBookingStore.ts`).
   - Động cơ giải quyết xung đột nguyên tử (Atomic Commit Engine) xử lý tranh chấp tài nguyên phòng.
   - Dịch vụ thông báo cục bộ (`notificationService.ts`) điều phối lịch nhắc nhở 15 phút và cảnh báo hàng đợi.
3. **Lớp Lưu trữ & Đồng bộ đám mây (Data & Sync Layer):**
   - **Cục bộ (Local):** `AsyncStorage` lưu trữ cấu hình, vé và phòng học ngoại tuyến (Offline-First).
   - **Đám mây (Cloud):** Google Cloud Firestore lưu trữ tập trung, đồng bộ 2 chiều thời gian thực.

---

### 3.2. Sơ đồ luồng giải quyết xung đột đặt phòng (Atomic Conflict Resolution)

```
[Sinh viên A & B cùng bấm đặt Phòng X - Ca 07:30]
                       │
                       ▼
          [checkSlotConflict() trong Zustand]
         /                                   \
   (Đến trước - 1st Commit)            (Đến sau - 2nd Commit)
        /                                     \
       ▼                                       ▼
[Tạo vé CONFIRMED]                    [Kích hoạt Conflict Modal]
[Khoá slot trên UI]                   ├─ Gợi ý phòng tương đương
[Ghi Firestore & AsyncStorage]        ├─ Gợi ý ca học khác
[Đặt thông báo nhắc 15 phút]          └─ Đăng ký Priority Waitlist
```

---

### 3.3. Giải pháp cho 2 câu hỏi kiến trúc cốt lõi của đề tài

#### ❓ Câu hỏi 1: Xử lý thế nào khi 2 người cùng bấm đặt 1 phòng tại cùng 1 thời điểm?
* **Khóa thị giác tức thời (Visual Lock):** Ngay khi một slot được chọn và commit, trạng thái trên toàn bộ giao diện lập tức chuyển sang màu đỏ (badge "Đã kín") và vô hiệu hóa nút bấm đối với các người dùng khác.
* **Cơ chế First-Committed-Wins:** Khi 2 yêu cầu gửi đến gần như đồng thời (chênh lệch mili-giây), hàm `atomicAddBooking()` trong Zustand Store sẽ thực hiện kiểm tra nguyên tử tính hợp lệ của slot `(roomId, date, slotId)`. Yêu cầu đến trước sẽ được cấp phát thành công (`status: 'CONFIRMED'`), sinh mã thẻ điện tử; yêu cầu đến sau lập tức bị chặn lại và trả về cờ xung đột `{ success: false, conflict: ... }`.

#### ❓ Câu hỏi 2: Trải nghiệm cho người thất bại (đến sau) được giải quyết như thế nào?
Thay vì ngắt quãng trải nghiệm bằng thông báo lỗi đơn thuần, hệ thống kích hoạt **Modal Điều Phối Thông Minh** với 3 cấp độ hỗ trợ:
1. **Gợi ý phòng tương đương còn trống (Smart Alternative Rooms):** Thuật toán tự động tìm các phòng cùng tòa nhà hoặc cùng sức chứa (độ lệch $\pm 10$ chỗ) đang còn trống tại chính ca học đó để sinh viên đổi phòng ngay với 1 chạm.
2. **Gợi ý ca học lân cận (Alternative Time Slots):** Nếu sinh viên bắt buộc dùng đúng phòng đã chọn (do đặc thù dàn máy PC hoặc phòng lab), hệ thống hiển thị các ca học còn trống khác trong ngày để chuyển ca.
3. **Đăng ký Hàng đợi Ưu tiên (Priority Waitlist):** Sinh viên có thể đăng ký giữ chỗ dự bị. Khi người đặt trước hủy phòng, hệ thống tự động gửi thông báo đẩy để người chờ vào xác nhận đặt phòng.

---

## 4. HƯỚNG DẪN CÀI ĐẶT & TRIỂN KHAI HỆ THỐNG

### 4.1. Khởi chạy trên Web Browser
```bash
# Di chuyển vào thư mục dự án
cd "D:\TÀI LIỆU\LẬP TRÌNH ĐA NỀN TẢNG\CODE_BAITAP\Tuan_05_06_MiniProject2_VKU_RoomBooking"

# Cài đặt các gói thư viện phụ thuộc
npm install

# Xuất bản và chạy thử nghiệm trên Web
npm run web
# Hoặc chạy bản build PWA Production
npx expo export -p web
```

### 4.2. Cài đặt file Native Android APK
1. Tải tệp tin cài đặt [app-release.apk](https://github.com/thuong614oh65/vku-room-booking-expo/releases/download/v1.0.0/app-release.apk) trực tiếp về điện thoại Android.
2. Mở tệp tin và cấp quyền *"Cài đặt ứng dụng từ nguồn này"*.
3. Nhấn **"Cài đặt"** (Install) để hoàn tất. Ứng dụng sẽ xuất hiện trên màn hình chính với đầy đủ quyền truy cập Camera quét mã QR và lưu trữ offline.

### 4.3. Cài đặt trực tiếp qua PWA Standalone (iOS & Android Chrome)
1. Mở liên kết [https://vku-room-booking-17t.pages.dev/](https://vku-room-booking-17t.pages.dev/) trên Google Chrome hoặc Safari.
2. Bấm nút **`📲 Cài Đặt App`** trên thanh tiêu đề ➔ Chọn **`📲 Bấm Vào Đây Để Cài Đặt Ngay`**.
3. Bấm **"Install"** trên hộp thoại của trình duyệt. Ứng dụng sẽ được ghim vào màn hình chính / Start Menu và chạy ở chế độ cửa sổ độc lập 100%.

---

*Đà Nẵng, Ngày 04 tháng 10 năm 2026*  
**Sinh viên thực hiện:**  
**Nguyễn Thị Thương (MSSV: 23IT.B219 — Lớp 23ITB)**
