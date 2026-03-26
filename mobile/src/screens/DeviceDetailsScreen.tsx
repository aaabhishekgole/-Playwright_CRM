import { SafeAreaView, ScrollView, Text, StyleSheet } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { SectionCard } from '../components/SectionCard';
import { palette } from '../utils/theme';

export function DeviceDetailsScreen({ onCapture }: { onCapture: () => void }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Device Details</Text>
        <SectionCard title="Customer and device">
          <Text>Nisha Verma</Text>
          <Text>Apple iPhone 14 • Screen crack</Text>
          <Text>Pickup OTP: 4821</Text>
        </SectionCard>
        <SectionCard title="Collection checklist">
          <Text>- Verify IMEI and serial number</Text>
          <Text>- Capture six-side device photos</Text>
          <Text>- Record accessories handed over</Text>
        </SectionCard>
        <ActionButton label="Capture six photos" onPress={onCapture} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.sand },
  content: { padding: 16, gap: 14 },
  heading: { fontSize: 28, fontWeight: '800', color: palette.ink },
});
