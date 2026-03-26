import { Pressable, Text, StyleSheet } from 'react-native';
import { palette } from '../utils/theme';

export function ActionButton({ label, onPress, variant = 'primary' }: { label: string; onPress?: () => void; variant?: 'primary' | 'secondary' }) {
  return (
    <Pressable onPress={onPress} style={[styles.button, variant === 'secondary' && styles.secondary]}>
      <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: palette.ink,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: palette.mist,
  },
  label: {
    color: 'white',
    fontWeight: '700',
  },
  secondaryLabel: {
    color: palette.ink,
  },
});
