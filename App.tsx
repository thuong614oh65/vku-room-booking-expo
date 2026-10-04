import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { NotificationToast } from './src/components/NotificationToast';
import { AuthModal } from './src/components/AuthModal';
import { InstallAppModal } from './src/components/InstallAppModal';
import { SystemInfoModal } from './src/components/SystemInfoModal';
import { initializeRealtimeSync, useBookingStore } from './src/store/useBookingStore';

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => {
    // Khởi tạo Firestore real-time listener
    const unsubscribe = initializeRealtimeSync();
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppNavigator />
        <NotificationToast />
        <AuthModal />
        <InstallAppModal />
        <SystemInfoModal />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  syncBanner: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 70 : 85,
    left: 16,
    right: 16,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 999,
  },
  syncText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
