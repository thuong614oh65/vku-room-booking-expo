import React from 'react';
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
