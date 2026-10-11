import React from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { RootStackParamList, BottomTabParamList } from './types';
import { BrowseRoomsScreen } from '../screens/BrowseRoomsScreen';
import { RoomDetailsScreen } from '../screens/RoomDetailsScreen';
import { BookingConfirmationPassScreen } from '../screens/BookingConfirmationPassScreen';
import { MyBookingsScreen } from '../screens/MyBookingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useBookingStore } from '../store/useBookingStore';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

const TAB_CONFIG: Record<
  keyof BottomTabParamList,
  { label: string; symbol: string }
> = {
  BrowseRooms: { label: 'Tìm Phòng VKU', symbol: '🏫' },
  MyBookings: { label: 'Lịch Đã Đặt', symbol: '📅' },
  Profile: { label: 'Tài Khoản SV', symbol: '🎓' },
};

const CustomBottomTabBar: React.FC<BottomTabBarProps & { activeBookingsCount: number }> = ({
  state,
  navigation,
  activeBookingsCount,
}) => {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBarInner}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name as keyof BottomTabParamList] || {
            label: route.name,
            symbol: '•',
          };
          const showBadge = route.name === 'MyBookings' && activeBookingsCount > 0;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={({ pressed }) => [
                styles.tabItem,
                pressed && { opacity: 0.75 },
              ]}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
            >
              <View style={[styles.tabPill, isFocused && styles.tabPillActive]}>
                <View style={styles.iconBox}>
                  <Text style={styles.iconSymbol}>{config.symbol}</Text>
                  {showBadge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {activeBookingsCount > 99 ? '99+' : activeBookingsCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                  numberOfLines={1}
                >
                  {config.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const BottomTabs = () => {
  const { bookings, currentUser } = useBookingStore();
  const activeBookingsCount = currentUser
    ? bookings.filter(
        (b) => b.studentId === currentUser.studentId && b.status === 'CONFIRMED'
      ).length
    : 0;

  return (
    <Tab.Navigator
      tabBar={(props) => (
        <CustomBottomTabBar {...props} activeBookingsCount={activeBookingsCount} />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="BrowseRooms" component={BrowseRoomsScreen} />
      <Tab.Screen name="MyBookings" component={MyBookingsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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
  tabBarContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -2px 10px rgba(15, 23, 42, 0.04)',
      },
    }),
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 8,
    backgroundColor: 'transparent',
  },
  tabPillActive: {
    backgroundColor: '#e0f2fe',
  },
  iconBox: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSymbol: {
    fontSize: 18,
    lineHeight: 22,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#0284c7',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  tabLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  tabLabelActive: {
    color: '#0284c7',
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: '#64748b',
    fontWeight: '700',
  },
});
