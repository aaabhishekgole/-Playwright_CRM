import { useState } from 'react';
import { SafeAreaView, Text, TextInput, View, StyleSheet } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { palette } from '../utils/theme';

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('pickup.agent');
  const [password, setPassword] = useState('Agent@123');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Gadget Seva Hub</Text>
        <Text style={styles.heading}>Field operations app</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Username" />
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
        <ActionButton label="Login" onPress={onLogin} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: palette.sand,
  },
  card: {
    gap: 14,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: palette.accent,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.ink,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d5dfe2',
    borderRadius: 14,
    padding: 14,
  },
});
