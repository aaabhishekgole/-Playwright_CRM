import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Session } from '../../App';

const API_BASE = 'https://backend-uat-2fe5.up.railway.app/api';

type Pickup = {
  id: number;
  subject: string;
  message: string;
  deliveryStatus: string;
  createdAt: string;
  requestNumber?: string | null;
  customerName?: string | null;
  deviceLabel?: string | null;
  requestStatus?: string | null;
  scheduledAt?: string | null;
  runnerPortalToken?: string | null;
};

function statusColor(status?: string | null) {
  if (!status) return { bg: '#E3F2FD', text: '#1565C0' };
  const s = status.toUpperCase();
  if (s.includes('PROGRESS')) return { bg: '#EDE7F6', text: '#4527A0' };
  if (s.includes('ASSIGNED')) return { bg: '#E3F2FD', text: '#1565C0' };
  if (s.includes('DONE') || s.includes('COMPLETE')) return { bg: '#E8F5E9', text: '#2E7D32' };
  return { bg: '#FFF8E1', text: '#F57F17' };
}

function formatDate(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function MyPickupsScreen({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchPickups(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      const res = await fetch(`${API_BASE}/mobile/runner/notifications`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (res.status === 401 || res.status === 403) {
        Alert.alert('Session Expired', 'Please login again.');
        onLogout();
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setPickups(data);
      }
    } catch {
      Alert.alert('Error', 'Unable to load pickups. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchPickups();
    const interval = setInterval(() => fetchPickups(), 30000);
    return () => clearInterval(interval);
  }, []);

  function confirmLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: onLogout },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Blue header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Pickups</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn} onPress={() => fetchPickups(true)}>
            <Text style={styles.iconText}>⟳</Text>
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={confirmLogout}>
            <Text style={styles.iconText}>⎋</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={styles.loadingText}>Loading pickups...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPickups(true)} colors={['#1565C0']} />}
        >
          {pickups.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No pickups assigned yet</Text>
            </View>
          ) : (
            pickups.map((p) => {
              const color = statusColor(p.requestStatus);
              return (
                <View key={p.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.gshn}>{p.requestNumber ?? 'GSH-XXXXXXXX'}</Text>
                    <View style={[styles.badge, { backgroundColor: color.bg }]}>
                      <Text style={[styles.badgeText, { color: color.text }]}>
                        {(p.requestStatus ?? 'ASSIGNED').replace(/_/g, ' ')}
                      </Text>
                    </View>
                  </View>
                  {p.customerName ? <Text style={styles.line}>Customer:  {p.customerName}</Text> : null}
                  {p.deviceLabel ? <Text style={styles.line}>Device:      {p.deviceLabel}</Text> : null}
                  {p.scheduledAt ? <Text style={styles.line}>Scheduled: {formatDate(p.scheduledAt)}</Text> : null}
                  <Text style={styles.message} numberOfLines={3}>{p.message}</Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#1565C0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6 },
  iconText: { fontSize: 22, color: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 15 },
  list: { padding: 14, gap: 12 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#94a3b8' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  gshn: { fontSize: 15, fontWeight: '800', color: '#1565C0' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  line: { fontSize: 13, color: '#475569' },
  message: { fontSize: 12, color: '#94a3b8', lineHeight: 18, marginTop: 4 },
});
