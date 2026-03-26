import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { palette } from '../utils/theme';

const photoLabels = ['Front', 'Back', 'Left', 'Right', 'Top', 'Bottom'];

export function CapturePhotosScreen({ onConfirm }: { onConfirm: () => void }) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Capture 6 Photos</Text>
      <View style={styles.grid}>
        {photoLabels.map((label) => (
          <View key={label} style={styles.photoBox}>
            <Text>{label}</Text>
          </View>
        ))}
      </View>
      <ActionButton label="Confirm pickup" onPress={onConfirm} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.sand, padding: 16, gap: 16 },
  heading: { fontSize: 28, fontWeight: '800', color: palette.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  photoBox: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
