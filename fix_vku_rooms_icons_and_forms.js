const fs = require('fs');
const path = require('path');

console.log('Applying full fix for App.tsx, AppNavigator icons, VKU real rooms, and Booking/Cancel forms...');

// 1. src/types/booking.ts
const bookingTypesContent = `export type Building = 'Khu V' | 'Khu K' | 'Khu B' | 'Khu A' | 'Khu C' | 'Thư viện';

export type Equipment = 'Projector' | 'Whiteboard' | 'High-spec PC' | 'AC' | 'Sound System';

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
}

export interface Room {
  id: string;
  name: string;
  code: string;
  building: Building;
  floor: string;
  capacity: number;
  equipment: Equipment[];
  image: string;
  description: string;
  type: 'Lab máy tính' | 'Phòng học nhóm' | 'Phòng hội thảo' | 'Phòng nghiên cứu';
}

export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN';

export interface Booking {
  id: string;
  roomId: string;
  roomName: string;
  roomCode: string;
  building: Building;
  floor: string;
  date: string; // YYYY-MM-DD
  slotId: string;
  slotLabel: string;
  studentName: string;
  studentId: string;
  studentEmail: string;
  groupSize: number;
  purpose: string;
  status: BookingStatus;
  createdAt: string;
  qrCodeData: string;
}

export interface ConflictResolution {
  hasConflict: boolean;
  conflictingBooking?: Booking;
  message?: string;
  alternativeRooms?: Room[];
  alternativeSlots?: TimeSlot[];
}

export interface FilterState {
  searchQuery: string;
  building: Building | 'ALL';
  minCapacity: number | null;
  equipment: Equipment[];
}

export interface UserProfile {
  name: string;
  studentId: string;
  email: string;
  major: string;
  avatar: string;
}
`;
fs.writeFileSync(path.join(__dirname, 'src/types/booking.ts'), bookingTypesContent, 'utf8');
console.log('✓ Updated src/types/booking.ts');

// 2. src/data/roomsData.ts (Chuẩn phòng học & Lab thực tế tại VKU: Khu V, Khu K, Khu B, Khu A, Khu C, Thư viện)
const roomsDataContent = `import { Booking, Room, TimeSlot, UserProfile } from '../types/booking';

export const TIME_SLOTS: TimeSlot[] = [
  { id: 'slot-1', startTime: '07:30', endTime: '09:30', label: '07:30 - 09:30' },
  { id: 'slot-2', startTime: '09:30', endTime: '11:30', label: '09:30 - 11:30' },
  { id: 'slot-3', startTime: '13:00', endTime: '15:00', label: '13:00 - 15:00' },
  { id: 'slot-4', startTime: '15:00', endTime: '17:00', label: '15:00 - 17:00' },
  { id: 'slot-5', startTime: '17:30', endTime: '19:30', label: '17:30 - 19:30' },
];

export const DEMO_USERS: UserProfile[] = [
  {
    name: 'Nguyễn Thị Thương',
    studentId: '23IT.B219',
    email: 'thuongnt.23itb@vku.udn.vn',
    major: 'Kỹ Thuật Phần Mềm & Lập Trình Đa Nền Tảng (Lớp 23ITB)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Trần Văn Nam',
    studentId: '23IT.B105',
    email: 'namtv.23itb@vku.udn.vn',
    major: 'Công Nghệ Thông Tin (Lớp 23ITB)',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Lê Hoàng Minh Anh',
    studentId: '23IT.B088',
    email: 'anhlhm.23itb@vku.udn.vn',
    major: 'An Toàn Thông Tin & Mạng (Lớp 23SE1)',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  },
];

export const CURRENT_USER: UserProfile = DEMO_USERS[0];

export const getTodayString = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return \`\${yyyy}-\${mm}-\${dd}\`;
};

export const getSeedBookings = (): Booking[] => {
  const today = getTodayString();
  return [
    {
      id: 'BK-VKU-101',
      roomId: 'ROOM-VA201',
      roomName: 'Phòng Lab Lập Trình Đa Nền Tảng V.A201',
      roomCode: 'V.A201',
      building: 'Khu V',
      floor: 'Tầng 2 - Tòa nhà V',
      date: today,
      slotId: 'slot-2',
      slotLabel: '09:30 - 11:30',
      studentName: 'Trần Văn Nam',
      studentId: '23IT.B105',
      studentEmail: 'namtv.23itb@vku.udn.vn',
      groupSize: 15,
      purpose: 'Thực hành nhóm môn Phát triển ứng dụng di động đa nền tảng',
      status: 'CONFIRMED',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      qrCodeData: JSON.stringify({
        bookingId: 'BK-VKU-101',
        code: 'VKU-8821',
        roomId: 'ROOM-VA201',
        roomCode: 'V.A201',
        date: today,
        slot: '09:30 - 11:30',
        student: 'Trần Văn Nam',
        studentId: '23IT.B105',
      }),
    },
    {
      id: 'BK-VKU-102',
      roomId: 'ROOM-KA203',
      roomName: 'Phòng Lab AI & Khoa Học Dữ Liệu K.A203',
      roomCode: 'K.A203',
      building: 'Khu K',
      floor: 'Tầng 2 - Tòa nhà K (KOICA)',
      date: today,
      slotId: 'slot-3',
      slotLabel: '13:00 - 15:00',
      studentName: 'Lê Hoàng Minh Anh',
      studentId: '23IT.B088',
      studentEmail: 'anhlhm.23itb@vku.udn.vn',
      groupSize: 10,
      purpose: 'Nghiên cứu mô hình nhận diện OCR & Học máy',
      status: 'CONFIRMED',
      createdAt: new Date(Date.now() - 5400000).toISOString(),
      qrCodeData: JSON.stringify({
        bookingId: 'BK-VKU-102',
        code: 'VKU-4092',
        roomId: 'ROOM-KA203',
        roomCode: 'K.A203',
        date: today,
        slot: '13:00 - 15:00',
        student: 'Lê Hoàng Minh Anh',
        studentId: '23IT.B088',
      }),
    },
  ];
};

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'ROOM-VA201',
    code: 'V.A201',
    name: 'Phòng Lab Lập Trình Đa Nền Tảng V.A201',
    building: 'Khu V',
    floor: 'Tầng 2 - Tòa nhà V',
    capacity: 30,
    equipment: ['High-spec PC', 'Projector', 'AC', 'Whiteboard'],
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    description: 'Phòng máy thực hành trung tâm tại Tòa nhà chữ V (VKU), trang bị 30 máy trạm cấu hình cao cài sẵn Android Studio, Expo SDK, Flutter & Xcode Simulator.',
    type: 'Lab máy tính',
  },
  {
    id: 'ROOM-VB302',
    code: 'V.B302',
    name: 'Phòng Lab Hệ Thống Nhúng & IoT V.B302',
    building: 'Khu V',
    floor: 'Tầng 3 - Tòa nhà V',
    capacity: 25,
    equipment: ['High-spec PC', 'Whiteboard', 'AC', 'Projector'],
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    description: 'Không gian thực hành vi điều khiển, bo mạch phát triển IoT, cảm biến thông minh và mạng truyền thông thế hệ mới tại cánh B tòa nhà V.',
    type: 'Lab máy tính',
  },
  {
    id: 'ROOM-VA401',
    code: 'V.A401',
    name: 'Không Gian Đổi Mới Sáng Tạo VKU (V.A401)',
    building: 'Khu V',
    floor: 'Tầng 4 - Tòa nhà V',
    capacity: 20,
    equipment: ['Projector', 'AC', 'Whiteboard', 'Sound System'],
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
    description: 'VKU Maker & Innovation Space dành cho các nhóm sinh viên phát triển dự án khởi nghiệp, luyện thi Hackathon và báo cáo đồ án.',
    type: 'Phòng nghiên cứu',
  },
  {
    id: 'ROOM-KA203',
    code: 'K.A203',
    name: 'Phòng Lab AI & Khoa Học Dữ Liệu K.A203',
    building: 'Khu K',
    floor: 'Tầng 2 - Tòa nhà K (KOICA)',
    capacity: 25,
    equipment: ['High-spec PC', 'Projector', 'AC', 'Whiteboard'],
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    description: 'Phòng Lab hiện đại thuộc dự án hợp tác Việt - Hàn (KOICA), trang bị dàn PC GPU NVIDIA RTX chuyên huấn luyện Deep Learning & Computer Vision.',
    type: 'Lab máy tính',
  },
  {
    id: 'ROOM-KB102',
    code: 'K.B102',
    name: 'Phòng Hội Thảo & Bảo Vệ Đồ Án K.B102',
    building: 'Khu K',
    floor: 'Tầng 1 - Tòa nhà K (KOICA)',
    capacity: 35,
    equipment: ['Projector', 'Sound System', 'AC', 'Whiteboard'],
    image: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80',
    description: 'Phòng seminar tiêu chuẩn quốc tế tại Khu K với hệ thống âm thanh hội nghị, màn chiếu lớn phục vụ bảo vệ đồ án cơ sở ngành và khóa luận.',
    type: 'Phòng hội thảo',
  },
  {
    id: 'ROOM-B201',
    code: 'B.201',
    name: 'Phòng Thực Hành Kỹ Thuật Phần Mềm B.201',
    building: 'Khu B',
    floor: 'Tầng 2 - Dãy nhà B',
    capacity: 24,
    equipment: ['High-spec PC', 'Projector', 'AC', 'Whiteboard'],
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    description: 'Phòng máy thực hành lập trình Web, cơ sở dữ liệu, kiểm thử phần mềm tự động và làm việc nhóm theo quy trình Agile/Scrum.',
    type: 'Lab máy tính',
  },
  {
    id: 'ROOM-B304',
    code: 'B.304',
    name: 'Phòng Lab An Toàn Thông Tin & Mạng B.304',
    building: 'Khu B',
    floor: 'Tầng 3 - Dãy nhà B',
    capacity: 20,
    equipment: ['High-spec PC', 'Projector', 'AC'],
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    description: 'Hệ thống phòng Lab mạng Cisco & Security phục vụ thực hành cấu hình định tuyến, tường lửa và diễn tập an ninh mạng CTF.',
    type: 'Lab máy tính',
  },
  {
    id: 'ROOM-A102',
    code: 'A.102',
    name: 'Phòng Thảo Luận Nhóm & Đồ Án A.102',
    building: 'Khu A',
    floor: 'Tầng 1 - Dãy nhà A',
    capacity: 10,
    equipment: ['Projector', 'Whiteboard', 'AC'],
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    description: 'Không gian học nhóm yên tĩnh tại Khu A với bàn họp nhóm 10 người, bảng từ trắng lớn và màn hình trình chiếu HDMI không dây.',
    type: 'Phòng học nhóm',
  },
  {
    id: 'ROOM-A205',
    code: 'A.205',
    name: 'Phòng Tự Học & Pair Programming A.205',
    building: 'Khu A',
    floor: 'Tầng 2 - Dãy nhà A',
    capacity: 6,
    equipment: ['Whiteboard', 'AC'],
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    description: 'Phòng học nhóm quy mô nhỏ 4-6 sinh viên, phù hợp để ôn thi học kỳ, code chung Mini-Project và thảo luận bài tập lớn.',
    type: 'Phòng học nhóm',
  },
  {
    id: 'ROOM-C201',
    code: 'C.201',
    name: 'Phòng Nghiên Cứu Khoa Học Sinh Viên C.201',
    building: 'Khu C',
    floor: 'Tầng 2 - Dãy nhà C',
    capacity: 16,
    equipment: ['Projector', 'Whiteboard', 'AC'],
    image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
    description: 'Phòng làm việc chuyên đề dành cho các nhóm sinh viên nghiên cứu khoa học (NCKH) và gặp gỡ giảng viên hướng dẫn tại Khu C.',
    type: 'Phòng nghiên cứu',
  },
  {
    id: 'ROOM-LIB201',
    code: 'LIB.201',
    name: 'Phòng Thảo Luận Nhóm Thư Viện Số LIB.201',
    building: 'Thư viện',
    floor: 'Tầng 2 - Trung tâm Học liệu & Thư viện VKU',
    capacity: 12,
    equipment: ['Projector', 'AC', 'Whiteboard'],
    image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
    description: 'Phòng học nhóm hiện đại nằm trong Trung tâm Học liệu & Thư viện số VKU, kết nối trực tiếp kho tài liệu số và Wi-Fi 6 tốc độ cao.',
    type: 'Phòng học nhóm',
  },
  {
    id: 'ROOM-LIB302',
    code: 'LIB.302',
    name: 'Cabin Học Nhóm Cách Âm Thư Viện LIB.302',
    building: 'Thư viện',
    floor: 'Tầng 3 - Trung tâm Học liệu & Thư viện VKU',
    capacity: 6,
    equipment: ['AC', 'Whiteboard'],
    image: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=800&q=80',
    description: 'Cabin kính cách âm tiêu chuẩn cao tại tầng 3 Thư viện VKU, lý tưởng cho nhóm làm việc tập trung hoặc thuyết trình trực tuyến.',
    type: 'Phòng học nhóm',
  },
];
`;
fs.writeFileSync(path.join(__dirname, 'src/data/roomsData.ts'), roomsDataContent, 'utf8');
console.log('✓ Updated src/data/roomsData.ts with 12 authentic VKU rooms');

// 3. Update App.tsx (Restore NavigationContainer!)
const appTsxContent = `import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { NotificationToast } from './src/components/NotificationToast';
import { AuthModal } from './src/components/AuthModal';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppNavigator />
        <NotificationToast />
        <AuthModal />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
`;
fs.writeFileSync(path.join(__dirname, 'App.tsx'), appTsxContent, 'utf8');
console.log('✓ Restored NavigationContainer in App.tsx');

// 4. Update src/navigation/AppNavigator.tsx (Fix null currentUser bug AND replace broken Ionicons with crisp cross-platform icons)
const appNavigatorContent = `import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, BottomTabParamList } from './types';
import { BrowseRoomsScreen } from '../screens/BrowseRoomsScreen';
import { RoomDetailsScreen } from '../screens/RoomDetailsScreen';
import { BookingConfirmationPassScreen } from '../screens/BookingConfirmationPassScreen';
import { MyBookingsScreen } from '../screens/MyBookingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useBookingStore } from '../store/useBookingStore';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

const TabBadgeIcon: React.FC<{ symbol: string; focused: boolean }> = ({ symbol, focused }) => (
  <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
    <Text style={styles.iconSymbol}>{symbol}</Text>
  </View>
);

const BottomTabs = () => {
  const { bookings, currentUser } = useBookingStore();
  const activeBookingsCount = currentUser
    ? bookings.filter((b) => b.studentId === currentUser.studentId && b.status === 'CONFIRMED').length
    : 0;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0284c7',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11.5,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="BrowseRooms"
        component={BrowseRoomsScreen}
        options={{
          tabBarLabel: 'Tìm Phòng VKU',
          tabBarIcon: ({ focused }) => <TabBadgeIcon symbol="🏫" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={{
          tabBarLabel: 'Lịch Đã Đặt',
          tabBarBadge: activeBookingsCount > 0 ? activeBookingsCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#0284c7',
            color: '#ffffff',
            fontSize: 10,
            fontWeight: '800',
          },
          tabBarIcon: ({ focused }) => <TabBadgeIcon symbol="📅" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Tài Khoản SV',
          tabBarIcon: ({ focused }) => <TabBadgeIcon symbol="🎓" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabs} />
      <Stack.Screen
        name="RoomDetails"
        component={RoomDetailsScreen}
        options={{
          animation: 'fade_from_bottom',
        }}
      />
      <Stack.Screen
        name="BookingConfirmationPass"
        component={BookingConfirmationPassScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  iconWrap: {
    width: 34,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapActive: {
    backgroundColor: '#e0f2fe',
  },
  iconSymbol: {
    fontSize: 17,
  },
});
`;
fs.writeFileSync(path.join(__dirname, 'src/navigation/AppNavigator.tsx'), appNavigatorContent, 'utf8');
console.log('✓ Fixed src/navigation/AppNavigator.tsx (null-safe + crisp icons)');

// 5. Update src/components/FilterBar.tsx & src/components/RoomCard.tsx to include Khu V & Khu K colors and filter chips
let filterBarContent = fs.readFileSync(path.join(__dirname, 'src/components/FilterBar.tsx'), 'utf8');
filterBarContent = filterBarContent.replace(
  "const BUILDINGS: (Building | 'ALL')[] = ['ALL', 'Khu A', 'Khu B', 'Khu C', 'Khu V', 'Thư viện'];",
  "const BUILDINGS: (Building | 'ALL')[] = ['ALL', 'Khu V', 'Khu K', 'Khu B', 'Khu A', 'Khu C', 'Thư viện'];"
);
filterBarContent = filterBarContent.replace(
  'placeholder="Tìm tên phòng, mã phòng (vd: B201, AI, Lab...)"',
  'placeholder="Tìm mã phòng VKU (VD: V.A201, K.A203, B.201, LIB...)"'
);
fs.writeFileSync(path.join(__dirname, 'src/components/FilterBar.tsx'), filterBarContent, 'utf8');
console.log('✓ Updated src/components/FilterBar.tsx');

let roomCardContent = fs.readFileSync(path.join(__dirname, 'src/components/RoomCard.tsx'), 'utf8');
roomCardContent = roomCardContent.replace(
  "    case 'Khu V':\n      return { bg: '#f3e8ff', text: '#7e22ce' };",
  "    case 'Khu V':\n      return { bg: '#dbeafe', text: '#1d4ed8' };\n    case 'Khu K':\n      return { bg: '#fce7f3', text: '#be185d' };"
);
fs.writeFileSync(path.join(__dirname, 'src/components/RoomCard.tsx'), roomCardContent, 'utf8');
console.log('✓ Updated src/components/RoomCard.tsx');
