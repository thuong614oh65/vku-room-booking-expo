/**
 * Script tự động tạo Firebase project và lấy config thực
 * Chạy: node setup_firebase.js
 * 
 * Hoặc bạn có thể:
 * 1. Vào https://console.firebase.google.com
 * 2. Tạo project mới tên "vku-room-booking-17t" 
 * 3. Vào Project Settings > Your apps > Add web app
 * 4. Copy firebaseConfig và paste vào src/services/firebaseConfig.ts
 * 5. Vào Firestore Database > Create database > Start in test mode
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║           VKU Room Booking - Firebase Setup Guide           ║
╚══════════════════════════════════════════════════════════════╝

Bạn cần tạo Firebase project miễn phí (Spark Plan) để dùng Firestore.

📋 Các bước thực hiện:

1. Truy cập: https://console.firebase.google.com
   → Click "Add project" (hoặc "Tạo dự án")
   → Tên project: vku-room-booking-17t
   → Tắt Google Analytics (không cần)
   → Click "Create project"

2. Trong project, click "Firestore Database" ở sidebar
   → Click "Create database"
   → Chọn "Start in test mode" (đọc/ghi tự do 30 ngày)
   → Chọn vùng: asia-southeast1 (Singapore - gần VN nhất)
   → Click "Done"

3. Lấy cấu hình Web App:
   → Vào Project Overview (biểu tượng ⚙️) > Project settings
   → Scroll xuống "Your apps" > Click "</>" (Web)
   → App nickname: VKU Room Booking Web
   → KHÔNG cần Firebase Hosting (đã có Cloudflare Pages)
   → Click "Register app"
   → Copy đoạn firebaseConfig

4. Paste firebaseConfig vào file:
   src/services/firebaseConfig.ts

5. Chạy lại: npx expo export -p web && npx wrangler pages deploy dist ...

Ví dụ firebaseConfig sẽ trông như:
  const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "vku-room-booking-17t.firebaseapp.com",
    projectId: "vku-room-booking-17t",
    storageBucket: "vku-room-booking-17t.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:xxxxxxxxxxxxxxxxxxxx"
  };

Sau khi có config thực, chạy lại script deploy.
`);
