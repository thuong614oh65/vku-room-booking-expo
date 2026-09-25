#!/usr/bin/env node
/**
 * build_apk_guide.js
 * Hướng dẫn build APK đầy đủ
 * Chạy: node build_apk_guide.js
 */

console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║         VKU ROOM BOOKING — BUILD APK HƯỚNG DẪN ĐẦY ĐỦ           ║
╚═══════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🅐  CÁCH 1: EXPO GO (Xem thử ngay - không cần build APK)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bước 1: Cài app "Expo Go" trên điện thoại Android/iOS
         → Android: https://play.google.com/store/apps/details?id=host.exp.exponent
         → iOS: https://apps.apple.com/app/expo-go/id982107779

Bước 2: Chạy lệnh trên máy tính:
   npx expo start

Bước 3: Mở Expo Go → quét QR code → App chạy ngay!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🅑  CÁCH 2: EAS BUILD APK (File APK thật - cài như app bình thường)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Đây là cách build APK thật, cài được trực tiếp vào Android.

Bước 1: Cài EAS CLI
   npm install -g eas-cli

Bước 2: Đăng nhập Expo Account (miễn phí)
   eas login
   → Tạo tài khoản tại: https://expo.dev/signup nếu chưa có

Bước 3: Cấu hình project với tài khoản của bạn
   eas build:configure

Bước 4: Build APK (preview = APK file thật)
   eas build --platform android --profile preview

   → Sẽ upload code lên Expo cloud
   → Build mất khoảng 5-15 phút
   → Khi xong sẽ có link tải APK về

Bước 5: Tải APK về máy tính rồi copy sang điện thoại (hoặc quét QR)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🅒  CÁCH 3: LOCAL BUILD (Không cần internet, cần Android Studio)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Yêu cầu: Android Studio + Java 17 đã cài sẵn

Bước 1: Tạo native Android project
   npx expo run:android --no-build-cache

Bước 2: Build APK debug
   cd android
   ./gradlew assembleRelease

Bước 3: File APK ở: android/app/build/outputs/apk/release/app-release.apk

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 KHUYÊN DÙNG: Cách 1 (Expo Go) cho demo, Cách 2 (EAS) cho nộp bài
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
