export type Building = 'Khu A' | 'Khu B' | 'Khu C' | 'Khu V' | 'Thư viện';

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
