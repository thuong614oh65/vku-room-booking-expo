import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { NotificationToast } from './src/components/NotificationToast';
import { AuthModal } from './src/components/AuthModal';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppNavigator />
      <NotificationToast />
      <AuthModal />
    </SafeAreaProvider>
  );
}
