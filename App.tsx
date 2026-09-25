import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { NotificationToast } from './src/components/NotificationToast';
import { AuthModal } from './src/components/AuthModal';
import { initializeRealtimeSync, useBookingStore } from './src/store/useBookingStore';

// ── Sync Status Banner ────────────────────────────────────────────────────────
function SyncStatusBanner() {
  const syncStatus = useBookingStore((s) => s.syncStatus);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (syncStatus.isConnecting) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else if (syncStatus.isOnline) {
      // Hiện "đã kết nối" 2 giây rồi ẩn
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    } else if (syncStatus.error) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [syncStatus.isOnline, syncStatus.isConnecting, syncStatus.error]);

  if (!syncStatus.isConnecting && !syncStatus.error) return null;

  const isError = Boolean(syncStatus.error) && !syncStatus.isConnecting;
  const bgColor = syncStatus.isConnecting ? '#1e40af' : isError ? '#dc2626' : '#16a34a';
  const icon = syncStatus.isConnecting ? '⟳' : isError ? '⚠️' : '✓';
  const label = syncStatus.isConnecting
    ? 'Đang kết nối đồng bộ real-time...'
    : isError
    ? 'Offline — dữ liệu local'
    : 'Đã kết nối — đồng bộ real-time';

  return (
    <Animated.View style={[styles.syncBanner, { backgroundColor: bgColor, opacity: fadeAnim }]}>
      <Text style={styles.syncText}>{icon} {label}</Text>
    </Animated.View>
  );
}

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
        <SyncStatusBanner />
        <NotificationToast />
        <AuthModal />
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
