// Firebase configuration for VKU Room Booking App
// Sử dụng Firebase Firestore để đồng bộ real-time giữa tất cả thiết bị
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDKVku_BookingApp_Demo_Key_2024",
  authDomain: "vku-room-booking-app.firebaseapp.com",
  projectId: "vku-room-booking-17t",
  storageBucket: "vku-room-booking-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef",
};

let app: FirebaseApp;
let db: Firestore;

// Khởi tạo Firebase chỉ một lần
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = getFirestore(app);

export { db };
export default app;
