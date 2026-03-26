import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette } from '../utils/theme';

export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 22,
    padding: 18,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '700',
  },
});
