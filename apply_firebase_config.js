/**
 * apply_firebase_config.js
 * 
 * Sau khi bạn lấy được firebaseConfig từ https://console.firebase.google.com
 * Paste config vào biến FIREBASE_CONFIG bên dưới rồi chạy: node apply_firebase_config.js
 */

const fs = require('fs');
const path = require('path');

// ══════════════════════════════════════════════════════
// 👇 DÁN FIREBASE CONFIG CỦA BẠN VÀO ĐÂY
// ══════════════════════════════════════════════════════
const FIREBASE_CONFIG = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_AUTH_DOMAIN_HERE",
  projectId: "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "PASTE_YOUR_APP_ID_HERE",
};
// ══════════════════════════════════════════════════════

if (FIREBASE_CONFIG.apiKey === 'PASTE_YOUR_API_KEY_HERE') {
  console.error(`
❌ Bạn chưa paste Firebase config!

Hướng dẫn:
1. Vào https://console.firebase.google.com
2. Tạo project mới (hoặc chọn project có sẵn)
3. Project Settings > Your apps > Web app (</>)
4. Copy firebaseConfig
5. Paste vào file này (thay thế PASTE_YOUR_... )
6. Chạy lại: node apply_firebase_config.js
`);
  process.exit(1);
}

const TARGET_FILE = path.join(__dirname, 'src', 'services', 'firebaseConfig.ts');

const content = `// Firebase configuration for VKU Room Booking App
// Real-time sync: Firestore onSnapshot + runTransaction
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "${FIREBASE_CONFIG.apiKey}",
  authDomain: "${FIREBASE_CONFIG.authDomain}",
  projectId: "${FIREBASE_CONFIG.projectId}",
  storageBucket: "${FIREBASE_CONFIG.storageBucket}",
  messagingSenderId: "${FIREBASE_CONFIG.messagingSenderId}",
  appId: "${FIREBASE_CONFIG.appId}",
};

let app: FirebaseApp;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = getFirestore(app);

export { db };
export default app;
`;

fs.writeFileSync(TARGET_FILE, content, 'utf8');
console.log(`✅ Đã ghi Firebase config vào: ${TARGET_FILE}`);
console.log(`\n📦 Bây giờ chạy deploy:\n  npx expo export -p web\n  npx wrangler pages deploy dist --project-name vku-room-booking --branch master --commit-dirty=true\n`);
