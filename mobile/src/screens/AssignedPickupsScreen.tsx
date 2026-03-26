import { SafeAreaView, ScrollView, Text, View, StyleSheet } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { SectionCard } from '../components/SectionCard';
import { pickupTasks } from '../services/mockWorkflow';
import { palette } from '../utils/theme';

export function AssignedPickupsScreen({ onOpenDetails }: { onOpenDetails: () => void }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Assigned Pickups</Text>
        {pickupTasks.map((task) => (
          <SectionCard key={task.id} title={`${task.id} • ${task.customer}`}>
            <Text>{task.device}</Text>
            <Text>{task.address}</Text>
            <Text>Status: {task.status}</Text>
            <ActionButton label="Open device details" onPress={onOpenDetails} />
          </SectionCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.sand },
  content: { padding: 16, gap: 14 },
  heading: { fontSize: 28, fontWeight: '800', color: palette.ink },
});
