# 🏫 VKU Room Booking - Ứng Dụng Mượn Phòng Học Thời Gian Thực (React Native & Expo)

<div align="center">

![VKU Room Booking Banner](https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80)

**HỌC PHẦN: LẬP TRÌNH ĐA NỀN TẢNG (CROSS-PLATFORM APPLICATION DEVELOPMENT)**  
**TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG VIỆT - HÀN (VKU)**  
*Mini-Project #2 (Tuần 5 - 6) • Trọng số: 10%*

---

[![React Native](https://img.shields.io/badge/React_Native-0.86.3-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo SDK](https://img.shields.io/badge/Expo_SDK-57.0-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Zustand](https://img.shields.io/badge/State-Zustand_5-443e38)](https://github.com/pmndrs/zustand)
[![Cloudflare Pages](https://img.shields.io/badge/Deployed-Cloudflare_Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com/)

</div>

---

## 📌 1. THÔNG TIN SINH VIÊN & HỌC PHẦN
* **Họ và tên sinh viên:** Nguyễn Thị Thương
* **Mã số sinh viên (MSSV):** 23IT.B219
* **Lớp sinh hoạt:** 23ITB
* **Email sinh viên:** [thuongnt.23itb@vku.udn.vn](mailto:thuongnt.23itb@vku.udn.vn)
* **Giảng viên giảng dạy:** TS. Nguyễn Thanh Tuấn
* **Học kỳ:** II - Năm học 2025 - 2026

---

## 🚀 2. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)
**VKU Room Booking** là ứng dụng di động đa nền tảng (iOS, Android, Web) được xây dựng trên nền tảng **React Native** và **Expo SDK 57**, phục vụ nhu cầu tra cứu và đăng ký mượn phòng học nhóm, phòng lab máy tính, phòng hội thảo tại khuôn viên trường VKU (Khu A, B, C, V, Thư viện).

### 🎯 Mục tiêu học tập đạt được (Learning Objectives)
1. **Kiến trúc điều hướng chuẩn (React Navigation):** Kết hợp phân cấp `NativeStackNavigator` và `BottomTabNavigator` (`BrowseRooms`, `MyBookings`, `Profile`).
2. **Quản trị trạng thái toàn cục (Zustand State Management):** Quản lý mượn phòng, hàng đợi (Waitlist), bộ lọc đa tiêu chí, phiên người dùng, đồng bộ lưu trữ bền vững với `@react-native-async-storage/async-storage`.
3. **Tối ưu hóa hiệu năng danh sách 60 FPS:** Áp dụng `FlatList` với `React.memo`, `keyExtractor`, `getItemLayout`, `initialNumToRender`, `windowSize`, loại bỏ triệt để hiện tượng giật lag khi cuộn.
4. **Động cơ chống xung đột thời gian thực (Real-time Conflict Prevention):** Cơ chế First-Committed-Wins, khoá lịch tức thì, phân tích giải quyết xung đột khi 2 người cùng đặt 1 phòng cùng lúc.
5. **Dịch vụ thông báo cục bộ & nhắc nhở 15 phút (Notification Engine):** Tự động lên lịch nhắc nhở 15 phút trước giờ nhận phòng và thông báo đẩy khi có phòng trống từ hàng đợi.
6. **Thẻ điện tử sinh viên VKU (Digital Booking Pass & QR):** Tạo thẻ mượn phòng kèm mã QR xác thực và cơ chế mô phỏng Check-in tức thì tại cửa phòng.

---

## 🧠 3. GIẢI PHÁP CHO 2 CÂU HỎI KIẾN TRÚC TRỌNG TÂM

### ❓ Câu hỏi 1: Làm thế nào giải quyết xung đột khi 2 người cùng bấm đặt 1 phòng tại cùng 1 thời điểm?
> **Giải pháp kỹ thuật:**
> 1. **Visual Lock & Real-time State Check:** Trên giao diện, các slot đã được đặt trước sẽ ngay lập tức chuyển sang trạng thái khoá thị giác (màu đỏ, badge "Đã Kín", vô hiệu hoá chọn trực tiếp).
> 2. **Cơ chế First-Committed-Wins (Atomic Commit):** Khi 2 người dùng cùng bấm nút mượn phòng ở mili-giây sát nhau, hàm `addBooking()` trong Zustand Store sẽ thực hiện kiểm tra nguyên tử `checkSlotConflict(roomId, date, slotId)` ngay trước khi commit vào danh sách. Yêu cầu nào đến trước (First-Committed) sẽ được chấp thuận thành công (`status: 'CONFIRMED'`), tạo mã vé và lưu trữ; yêu cầu đến sau lập tức bị chặn và trả về cờ `{ success: false, conflict }`.

### ❓ Câu hỏi 2: Xử lý trải nghiệm cho người không được ưu tiên (người đến sau / người thất bại) như thế nào?
> **Giải pháp kỹ thuật (Smart Conflict Resolution Modal):**  
> Thay vì chỉ báo lỗi đơn thuần làm gián đoạn trải nghiệm người dùng, hệ thống kích hoạt **Modal Điều Phối Thông Minh** với 3 cấp độ hỗ trợ:
> 1. **Gợi ý phòng tương đương còn trống (Smart Alternative Rooms):** Thuật toán tự động quét toàn bộ danh sách phòng để tìm các phòng cùng toà nhà (Khu A, Khu B, Thư viện,...) hoặc có cùng sức chứa (độ lệch $\pm 10$ chỗ) đang còn trống tại đúng khung giờ bị xung đột đó. Sinh viên chỉ cần bấm 1 nút để đổi sang phòng mới ngay lập tức.
> 2. **Gợi ý khung giờ lân cận còn trống (Alternative Time Slots):** Nếu sinh viên bắt buộc phải dùng đúng phòng này (ví dụ do phòng có dàn máy High-spec PC), hệ thống sẽ liệt kê các ca học còn trống khác trong cùng ngày (VD: 07:30 - 09:30, 13:00 - 15:00) để sinh viên bấm đổi ca ngay.
> 3. **Đăng ký vào Hàng Đợi Ưu Tiên (Priority Waitlist Subscription):** Người dùng có thể nhấn đăng ký vào danh sách chờ của ca học đó. Khi người đặt trước thực hiện thao tác "Huỷ phòng", hệ thống thông báo sẽ lập tức kích hoạt thông báo đẩy ưu tiên đến người đang chờ để vào giữ chỗ.

---

## 🏗️ 4. KIẾN TRÚC THƯ MỤC & CẤU TRÚC MÃ NGUỒN

```
Tuan_05_06_MiniProject2_VKU_RoomBooking/
├── App.tsx                          # Điểm khởi chạy ứng dụng, NavigationContainer, Safe Area, Toast
├── app.json                         # Cấu hình Expo SDK 57 (Name, Slug, Web bundler metro)
├── package.json                     # Danh sách thư viện phụ thuộc (Zustand, React Navigation, AsyncStorage)
├── tsconfig.json                    # Cấu hình TypeScript
├── src/
│   ├── types/
│   │   └── booking.ts               # Định nghĩa kiểu dữ liệu (Room, Booking, TimeSlot, ConflictResolution...)
│   ├── data/
│   │   └── roomsData.ts             # Dữ liệu 10 phòng học VKU chuẩn thực tế, 5 ca học VKU 2 tiếng, User Profile
│   ├── store/
│   │   └── useBookingStore.ts       # Zustand store quản lý state, bộ lọc, xung đột, lưu trữ AsyncStorage
│   ├── services/
│   │   └── notificationService.ts   # Quản lý thông báo nhắc nhở 15 phút, cảnh báo xung đột, thông báo waitlist
│   ├── navigation/
│   │   ├── types.ts                 # Type định tuyến cho Stack và Tab Navigator
│   │   └── AppNavigator.tsx         # Bottom Tab (Browse, MyBookings, Profile) + NativeStack
│   ├── components/
│   │   ├── NotificationToast.tsx    # Animated toast hiển thị thông báo đẩy nổi
│   │   ├── RoomCard.tsx             # Thẻ phòng học tối ưu React.memo 60 FPS
│   │   ├── FilterBar.tsx            # Thanh tìm kiếm + chip toà nhà + lọc trang thiết bị/sức chứa
│   │   ├── DateSelector.tsx         # Thanh chọn lịch 7 ngày liên tiếp từ hôm nay
│   │   ├── TimeSlotGrid.tsx         # Lưới ca học 2 tiếng VKU với khoá thị giác slot đã kín
│   │   ├── ConflictResolutionModal.tsx # Modal giải quyết xung đột thông minh
│   │   └── QRCodeModal.tsx          # Modal mã QR Pass xác thực
│   └── screens/
│       ├── BrowseRoomsScreen.tsx    # Màn hình tra cứu & tìm kiếm phòng học (FlatList 60 FPS)
│       ├── RoomDetailsScreen.tsx    # Màn hình chi tiết phòng, chọn ngày, chọn ca, xác nhận đặt
│       ├── BookingConfirmationPassScreen.tsx # Vé điện tử sinh viên VKU & mã QR Check-in
│       ├── MyBookingsScreen.tsx     # Danh sách phòng đã đặt (Sắp tới, Đã vào, Đã huỷ, Waitlist)
│       └── ProfileScreen.tsx        # Hồ sơ sinh viên, thống kê hoạt động, nội quy VKU
```

---

## 📋 5. BẢNG TIÊU CHÍ TÍNH NĂNG (FEATURE CHECKLIST)

| STT | Tính năng yêu cầu | Trạng thái | Mô tả thực hiện |
|:---:|:---|:---:|:---|
| 1 | **Danh sách phòng học 60 FPS** | ✅ Hoàn thành | Dùng `FlatList` với `React.memo(RoomCard)`, hiển thị toà nhà, tầng, loại phòng, sức chứa, thiết bị. |
| 2 | **Bộ lọc đa tiêu chí** | ✅ Hoàn thành | Lọc tức thì theo từ khoá tên/mã phòng, chip toà nhà (Khu A, B, C, V, Thư viện), sức chứa tối thiểu và trang thiết bị. |
| 3 | **Chọn ngày linh hoạt (7 ngày)** | ✅ Hoàn thành | `DateSelector` cuộn ngang 7 ngày tính từ ngày hiện tại, đánh dấu ca "Hôm nay". |
| 4 | **Lưới ca học chuẩn VKU (2 tiếng)** | ✅ Hoàn thành | 5 khung giờ: 07:30–09:30, 09:30–11:30, 13:00–15:00, 15:00–17:00, 17:30–19:30. |
| 5 | **Khoá thị giác slot đã đặt** | ✅ Hoàn thành | Slot đã có người đặt hiển thị viền đỏ, badge "Đã kín", bấm vào sẽ kích hoạt giải pháp thay thế. |
| 6 | **Xử lý xung đột First-Committed** | ✅ Hoàn thành | `checkSlotConflict()` kiểm tra xung đột nguyên tử trong Zustand store, ngăn chặn trùng phòng và trùng lịch cá nhân. |
| 7 | **Gợi ý phòng tương đương thông minh** | ✅ Hoàn thành | Tìm phòng cùng toà nhà hoặc sức chứa tương đương đang trống ở ca đó. |
| 8 | **Gợi ý ca học thay thế** | ✅ Hoàn thành | Tìm các khung giờ còn trống khác trong ngày của chính phòng đó. |
| 9 | **Hàng đợi ưu tiên (Waitlist)** | ✅ Hoàn thành | Cho phép người dùng đăng ký nhận thông báo đẩy ngay khi có người huỷ lịch. |
| 10 | **Thẻ mượn phòng số (Digital Pass)** | ✅ Hoàn thành | Hiển thị thông tin sinh viên, toà nhà, ca học, mã định danh thẻ và ma trận mã QR. |
| 11 | **Check-in xác thực tại cửa** | ✅ Hoàn thành | Nút mô phỏng quét QR xác thực vào phòng, cập nhật trạng thái `CHECKED_IN`. |
| 12 | **Quản lý lịch sử đặt phòng** | ✅ Hoàn thành | Tab "Lịch của tôi" phân loại: Sắp tới, Đã vào phòng, Đã huỷ; hỗ trợ huỷ phòng giải phóng tài nguyên. |
| 13 | **Thông báo tự động 15 phút** | ✅ Hoàn thành | `notificationService` tự động hẹn giờ nhắc nhở trước khi ca học diễn ra 15 phút. |
| 14 | **Lưu trữ bền vững (Persistence)** | ✅ Hoàn thành | Tích hợp Zustand với `AsyncStorage`, dữ liệu không bị mất khi reload hoặc tắt ứng dụng. |

---

## 💻 6. HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG

### Bước 1: Khởi tạo và cài đặt thư viện
```bash
cd D:\TÀI LIỆU\LẬP TRÌNH ĐA NỀN TẢNG\CODE_BAITAP\Tuan_05_06_MiniProject2_VKU_RoomBooking
npm install
```

### Bước 2: Chạy ứng dụng trên Trình duyệt Web (Nhanh nhất)
```bash
npm run web
# hoặc
npx expo start --web
```
Ứng dụng sẽ tự động mở tại địa chỉ: `http://localhost:8081`

### Bước 3: Chạy ứng dụng trên Điện thoại thật (Expo Go)
```bash
npm start
# hoặc
npx expo start
```
Dùng ứng dụng **Expo Go** (trên iOS hoặc Android) quét mã QR hiển thị trên màn hình terminal để trải nghiệm trực tiếp trên thiết bị di động.

---

## 🌐 7. TRIỂN KHAI LIVE DEMO & NỘP BÀI
- **Live Demo Link (Cloudflare Pages):** [https://vku-room-booking-17t.pages.dev/](https://vku-room-booking-17t.pages.dev/)
- **Mã nguồn GitHub:** Đang đồng bộ repository
- **Báo cáo PDF:** Đính kèm tệp `BAO_CAO_KY_THUAT_REPORT.md` (xuất bản PDF theo mẫu chuẩn VKU 2-4 trang)

---
*Bản quyền © 2026 Nguyễn Thị Thương (23IT.B219) - Trường ĐH CNTT&TT Việt - Hàn (VKU).*
