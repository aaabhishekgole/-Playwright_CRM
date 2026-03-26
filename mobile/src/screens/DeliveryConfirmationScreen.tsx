import { SafeAreaView, TextInput, Text, StyleSheet } from 'react-native';
import { useState } from 'react';
import { ActionButton } from '../components/ActionButton';
import { SectionCard } from '../components/SectionCard';
import { palette } from '../utils/theme';

export function DeliveryConfirmationScreen() {
  const [otp, setOtp] = useState('');
  return (
    <SafeAreaView style={styles.container}>
      <SectionCard title="Delivery confirmation">
        <Text>Capture OTP and signature at doorstep.</Text>
        <TextInput style={styles.input} value={otp} onChangeText={setOtp} placeholder="Enter OTP" />
        <ActionButton label="Capture signature" variant="secondary" />
        <ActionButton label="Mark drop done" />
      </SectionCard>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.sand, padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#d5dfe2',
    borderRadius: 14,
    padding: 14,
  },
});
