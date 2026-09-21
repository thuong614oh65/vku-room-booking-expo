import { NavigatorScreenParams } from '@react-navigation/native';

export type BottomTabParamList = {
  BrowseRooms: undefined;
  MyBookings: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<BottomTabParamList>;
  RoomDetails: { roomId: string };
  BookingConfirmationPass: { bookingId: string };
};
