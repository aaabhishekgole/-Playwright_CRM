import { SafeAreaView, Text, StyleSheet } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { SectionCard } from '../components/SectionCard';
import { palette } from '../utils/theme';

export function PickupConfirmationScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <SafeAreaView style={styles.container}>
      <SectionCard title="Pickup confirmed">
        <Text>OTP matched and six-side photo set captured.</Text>
        <Text>Device moved to workshop intake queue.</Text>
      </SectionCard>
      <ActionButton label="Go to deliveries" onPress={onContinue} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.sand, padding: 16, gap: 16 },
});
