import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen } from './src/screens/LoginScreen';
import { MyPickupsScreen } from './src/screens/MyPickupsScreen';

export type Session = {
  accessToken: string;
  username: string;
  fullName?: string | null;
  phone?: string | null;
  role: string;
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  return (
    <SafeAreaProvider>
      {session ? (
        <MyPickupsScreen session={session} onLogout={() => setSession(null)} />
      ) : (
        <LoginScreen onLogin={setSession} />
      )}
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
