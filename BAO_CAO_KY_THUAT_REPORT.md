# BÁO CÁO KỸ THUẬT TIỂU LUẬN / MINI-PROJECT 2
## HỌC PHẦN: PHÁT TRIỂN ỨNG DỤNG DI ĐỘNG ĐA NỀN TẢNG (LỚP 4)
**TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG VIỆT - HÀN (VKU)**

---

### 📋 THÔNG TIN SINH VIÊN & ĐỀ TÀI
* **Họ và tên sinh viên:** Nguyễn Thị Thương
* **Mã số sinh viên (MSSV):** 23IT.B219
* **Lớp sinh hoạt:** 23SE4
* **Lớp học phần:** Phát triển ứng dụng di động đa nền tảng (4)
* **Email sinh viên:** [thuongnt.23itb@vku.udn.vn](mailto:thuongnt.23itb@vku.udn.vn)
* **Giảng viên hướng dẫn:** TS. Nguyễn Thanh Tuấn
* **Tên đề tài:** *VKU Room Booking — Hệ thống Đăng ký Mượn Phòng Học Thời Gian Thực, Xác Thực QR Đa Thiết Bị & Liên Thông Đánh Giá CSVC (React Native, Expo SDK 57 & PWA)*
* **Thời gian thực hiện:** Tuần 5 – Tuần 6 • **Trọng số điểm:** 10% • **Ngày cập nhật:** 12/10/2026

---

## 1. THÔNG TIN BÀN GIAO & LIÊN KẾT MINH CHỨNG (DELIVERABLES)
* **🌐 Live Demo URL (VKU Room Booking - Mini-Project 2):** [https://vku-room-booking-17t.pages.dev/](https://vku-room-booking-17t.pages.dev/)
* **🌐 Hệ sinh thái liên kết (VKU Field Survey - Mini-Project 1):** [https://vku-field-survey-28x.pages.dev/](https://vku-field-survey-28x.pages.dev/)
* **📁 GitHub Repository:** [https://github.com/thuong614oh65/vku-room-booking-expo](https://github.com/thuong614oh65/vku-room-booking-expo)
* **📱 Tệp cài đặt Android APK (Production):** [app-release.apk (78.8 MB)](https://github.com/thuong614oh65/vku-room-booking-expo/releases/download/v1.0.0/app-release.apk)

---

## 2. BẢNG ĐỐI SOÁT TIÊU CHÍ TÍNH NĂNG (FEATURE IMPLEMENTATION CHECKLIST)

| STT | Tính năng yêu cầu & Nâng cấp thực tế | Trạng thái | Minh chứng kỹ thuật trong mã nguồn |
|:---:|:---|:---:|:---|
| 1 | **Giao diện Responsive & Bộ nhận diện VKU** | ✅ Hoàn thành | Tương thích 100% Mobile/Tablet/Desktop qua React Native Web; bộ icon thương hiệu VKU Room Booking (`1024px`, `512px`, `192px`, `180px`). |
| 2 | **Đăng nhập Google OAuth 2.0 Thật (`@vku.udn.vn`)** | ✅ Mới nâng cấp | Tích hợp Google Identity Services chính thức (`accounts.google.com/gsi/client`), giới hạn tên miền `hd: vku.udn.vn`, tự động bóc tách MSSV từ email. |
| 3 | **Bảo mật mật khẩu `SHA-256 + Salt`** | ✅ Mới nâng cấp | `authService.ts`: Băm mật khẩu một chiều bằng Web Crypto API (`crypto.subtle.digest('SHA-256')`) kết hợp Salt riêng của VKU. |
| 4 | **Tự động thoát Zalo WebView sang Safari / Chrome** | ✅ Mới nâng cấp | Tự động phát hiện trình duyệt nhúng (`Zalo`, `Messenger`, `Facebook`) và phóng thẳng sang **Safari** (`x-safari-https://`) trên iOS hoặc **Chrome** (`intent://`) trên Android. |
| 5 | **Danh sách phòng học mượt 60 FPS** | ✅ Hoàn thành | `BrowseRoomsScreen.tsx` + `React.memo(RoomCard)` với `getItemLayout`, `windowSize`, lọc tức thì theo khu nhà (Khu A, B, C, V, Thư viện), sức chứa, thiết bị. |
| 6 | **Lưới ca học chuẩn VKU (5 ca × 2 tiếng)** | ✅ Hoàn thành | `TimeSlotGrid.tsx`: 5 khung giờ chuẩn VKU (07:30–19:30), khoá thị giác màu đỏ (`🔒 Đã Kín`) đối với các slot đã có người đặt. |
| 7 | **Chống xung đột First-Committed-Wins** | ✅ Hoàn thành | `atomicAddBooking()` kiểm tra nguyên tử `checkSlotConflict(roomId, date, slotId)` trước khi ghi nhận giao dịch. |
| 8 | **Modal Điều phối Giải quyết Xung đột Thông minh** | ✅ Hoàn thành | `ConflictResolutionModal.tsx`: Gợi ý phòng tương đương ($\pm 10$ chỗ), ca học liền kề còn trống, hoặc đăng ký Hàng đợi ưu tiên (`Waitlist`). |
| 9 | **Vé điện tử sinh viên VKU & Mã QR Thông minh** | ✅ Hoàn thành | `BookingConfirmationPassScreen.tsx`: Tạo vé điện tử kèm mã QR chứa đường dẫn xác thực liên thiết bị `/verify/?id=...`. |
| 10 | **Quét QR Thật bằng Camera Điện thoại / Zalo / Ảnh** | ✅ Mới nâng cấp | Quét bằng Camera iPhone/Android hoặc Zalo mở biên lai `/verify/index.html`; đồng thời hỗ trợ quét `jsQR` trực tiếp trong ứng dụng hoặc tải ảnh QR từ thư viện. |
| 11 | **Đồng bộ Check-In Đám mây Tức thì (`< 0.5s`)** | ✅ Mới nâng cấp | `cloudCheckInSyncService.ts`: Kết hợp kênh `ntfy.sh` (SSE `EventSource` + Polling) và `BroadcastChannel` giúp điện thoại quét mã là màn hình máy tính tự nhảy sang `✅ ĐÃ CHECK-IN`. |
| 12 | **Liên thông Hệ sinh thái VKU Field Survey (MP1)** | ✅ Mới nâng cấp | `fieldSurveyLinkService.ts`: Nút **`📊 Đánh Giá CSVC (VKU Field Survey)`** truyền tự động mã phòng, tòa nhà, tầng, tên SV, MSSV sang Mini-Project 1 kèm đồng hồ thời gian thực. |
| 13 | **Lưu trữ Offline & Đồng bộ Cloud Firestore** | ✅ Hoàn thành | Lưu trữ bền vững qua `AsyncStorage`, tự động đồng bộ 2 chiều với Google Cloud Firestore khi có kết nối mạng. |
| 14 | **Đóng gói PWA Standalone & Native Android APK** | ✅ Hoàn thành | Hỗ trợ cài đặt PWA ra màn hình chính iOS/Android (`manifest.json`, `sw.js`) và bản build `app-release.apk` (78.8 MB). |

---

## 3. KIẾN TRÚC KỸ THUẬT & CÁC NÂNG CẤP TRỌNG TÂM

### 3.1. Kiến trúc Xác thực Google OAuth 2.0 (`@vku.udn.vn`) & Tự động chuyển Zalo sang Safari/Chrome
1. **Xác thực Google thật 100%:** Sử dụng thư viện chính thức `https://accounts.google.com/gsi/client` với Client ID `1003178768971-qn13952kqgsbbkqcdkebet5jblf748je.apps.googleusercontent.com` và tham số `hd: 'vku.udn.vn'`. Sau khi nhận `access_token`, hệ thống gọi API `https://www.googleapis.com/oauth2/v3/userinfo` để xác minh email đuôi `@vku.udn.vn` và tự động trích xuất mã sinh viên (ví dụ `thuongnt.23itb@vku.udn.vn` $\rightarrow$ MSSV `23IT.B219`).
2. **Loại bỏ hoàn toàn màn hình giả lập & Tự động vượt rào cản Zalo WebView:** Do Google chặn OAuth 2.0 bên trong WebView của Zalo/Messenger (`403 disallowed_useragent`), hệ thống tích hợp bộ nhận diện User-Agent ngay tại `public/index.html`, `public/verify/index.html` và `googleOAuthPopupService.ts`. Khi người dùng bấm link hoặc quét mã từ Zalo trên iPhone, hệ thống lập tức kích hoạt giao thức `x-safari-https://...` để chuyển thẳng sang trình duyệt **Safari** gốc (hoặc `intent://...` sang **Chrome** trên Android).

### 3.2. Cơ chế Quét QR Thực Tế & Đồng Bộ Đám Mây Đa Thiết Bị (`< 0.5 giây`)
* Mã QR trên thẻ mượn phòng được mã hóa dưới dạng URL xác thực: `https://vku-room-booking-17t.pages.dev/verify/?id=<bookingId>&code=<verificationCode>&room=...`.
* Khi sinh viên hoặc cán bộ quản lý dùng **Camera điện thoại / Zalo** quét mã QR hiển thị trên màn hình Laptop:
  1. Điện thoại mở trang biên lai xác thực `/verify/index.html`, hiển thị đầy đủ thông tin phòng, ca học, sinh viên và tự động phát tín hiệu xác nhận lên kênh đám mây `ntfy.sh` (`vku_checkin_sync_v2_23itb219`).
  2. Màn hình Laptop (đang lắng nghe qua kết nối thời gian thực **Server-Sent Events `EventSource`** kết hợp HTTP Polling dự phòng trong `cloudCheckInSyncService.ts`) lập tức nhận tín hiệu trong `< 0.5 giây` và tự động chuyển trạng thái vé sang **`✅ ĐÃ CHECK-IN THÀNH CÔNG`**.

### 3.3. Liên thông Hệ sinh thái 2 Mini-Project (`VKU Room Booking` $\leftrightarrow$ `VKU Field Survey`)
* Sau khi mượn phòng hoặc Check-in xong, sinh viên có thể nhấn nút **`📊 Đánh Giá CSVC (VKU Field Survey)`** ngay trên Header, Chi tiết phòng, Thẻ QR Pass, Lịch của tôi hoặc trên Biên lai quét QR điện thoại.
* Hệ thống (`fieldSurveyLinkService.ts`) tự động chuyển hướng sang ứng dụng **Mini-Project 1 (`https://vku-field-survey-28x.pages.dev/`)** kèm các tham số URL (`?from=room-booking&room=V.A201&building=Khu+V&floor=Tầng+2&name=...&studentId=...`), giúp điền sẵn toàn bộ thông tin phòng học, tòa nhà, tầng, họ tên, MSSV và đồng bộ **thời gian khảo sát thực tế từng giây** từ máy chủ Cloudflare. Ngược lại, trên **VKU Field Survey** cũng có nút **`🏫 Đặt Phòng VKU`** để quay về ứng dụng đặt phòng tức thì.

---

## 4. CẤU TRÚC THƯ MỤC DỰ ÁN (PROJECT STRUCTURE)

```
Tuan_05_06_MiniProject2_VKU_RoomBooking/
├── App.tsx                                # Root Component, Navigation, Cloud Check-In Listener
├── public/
│   ├── index.html                         # PWA Shell + Auto Zalo-to-Safari/Chrome Redirect
│   ├── verify/index.html                  # Trang biên lai xác thực QR & đồng bộ đám mây + Link Đánh giá CSVC
│   ├── icons/                             # Bộ icon thương hiệu VKU Room Booking (192px, 512px, 180px)
│   └── sw.js                              # Service Worker v15 hỗ trợ Offline & PWA Standalone
└── src/
    ├── components/                        # AuthModal, RoomCard, FilterBar, TimeSlotGrid, QRCodeModal...
    ├── screens/                           # BrowseRooms, RoomDetails, BookingConfirmationPass, MyBookings, QRScanner, Profile
    ├── store/useBookingStore.ts           # Zustand Store + AsyncStorage + Atomic Conflict Check
    └── services/
        ├── authService.ts                 # Xác thực Google OAuth 2.0 (@vku.udn.vn) & SHA-256 + Salt
        ├── googleOAuthPopupService.ts     # Cổng Google Identity Services & Zalo WebView Escape
        ├── cloudCheckInSyncService.ts     # Đồng bộ QR Check-in đa thiết bị thời gian thực (ntfy.sh SSE)
        ├── qrVerificationLink.ts          # Sinh & giải mã URL xác thực QR liên thiết bị
        ├── fieldSurveyLinkService.ts      # Liên kết truyền tham số sang Mini-Project 1 (VKU Field Survey)
        └── notificationService.ts         # Nhắc lịch trước 15 phút & thông báo hàng đợi ưu tiên
```

---

*Đà Nẵng, Ngày 12 tháng 10 năm 2026*  
**Sinh viên thực hiện:**  
**Nguyễn Thị Thương (23IT.B219 - Lớp 23SE4)**
