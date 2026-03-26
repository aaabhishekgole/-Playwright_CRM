import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen } from './src/screens/LoginScreen';
import { AssignedPickupsScreen } from './src/screens/AssignedPickupsScreen';
import { DeviceDetailsScreen } from './src/screens/DeviceDetailsScreen';
import { CapturePhotosScreen } from './src/screens/CapturePhotosScreen';
import { PickupConfirmationScreen } from './src/screens/PickupConfirmationScreen';
import { AssignedDeliveriesScreen } from './src/screens/AssignedDeliveriesScreen';
import { DeliveryConfirmationScreen } from './src/screens/DeliveryConfirmationScreen';

type ScreenName = 'login' | 'pickups' | 'details' | 'capture' | 'pickupDone' | 'deliveries' | 'deliveryDone';

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('login');

  return (
    <SafeAreaProvider>
      {screen === 'login' && <LoginScreen onLogin={() => setScreen('pickups')} />}
      {screen === 'pickups' && <AssignedPickupsScreen onOpenDetails={() => setScreen('details')} />}
      {screen === 'details' && <DeviceDetailsScreen onCapture={() => setScreen('capture')} />}
      {screen === 'capture' && <CapturePhotosScreen onConfirm={() => setScreen('pickupDone')} />}
      {screen === 'pickupDone' && <PickupConfirmationScreen onContinue={() => setScreen('deliveries')} />}
      {screen === 'deliveries' && <AssignedDeliveriesScreen onConfirm={() => setScreen('deliveryDone')} />}
      {screen === 'deliveryDone' && <DeliveryConfirmationScreen />}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
