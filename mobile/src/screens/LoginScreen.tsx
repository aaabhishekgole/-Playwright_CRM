import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Session } from '../../App';

const API_BASE = 'https://backend-uat-2fe5.up.railway.app/api';

export function LoginScreen({ onLogin }: { onLogin: (session: Session) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Required', 'Enter your mobile number and password.');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? 'Login failed.');
      }
      onLogin({
        accessToken: data.accessToken,
        username: data.username,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role,
      });
    } catch (e: any) {
      Alert.alert('Login Failed', e.message ?? 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>Gadget Seva Hub</Text>
        <Text style={styles.subtitle}>Runner App</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Mobile Number / Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter mobile number"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
          placeholderTextColor="#94a3b8"
          secureTextEntry
        />
        <Pressable style={[styles.loginBtn, loading && styles.disabled]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Login</Text>}
        </Pressable>
        <Text style={styles.hint}>Default password: Runner@ + last 4 digits of mobile</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1565C0' },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  appName: { fontSize: 28, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 16, color: '#BBDEFB', marginTop: 4 },
  form: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, gap: 12 },
  label: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#0f172a', backgroundColor: '#f8fafc' },
  loginBtn: { backgroundColor: '#1565C0', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  hint: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4 },
});
