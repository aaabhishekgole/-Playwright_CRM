import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const DEFAULT_WEB_ORIGIN = 'http://localhost:5173';
const DEFAULT_API_BASE_URL = 'http://localhost:8081/api';

type AuthSession = {
  accessToken: string;
  username: string;
  role: string;
  fullName?: string | null;
  phone?: string | null;
};

type RunnerNotification = {
  id: number;
  channel: string;
  subject: string;
  message: string;
  deliveryStatus: string;
  createdAt: string;
  serviceRequestId?: number | null;
  requestNumber?: string | null;
  customerName?: string | null;
  deviceLabel?: string | null;
  requestStatus?: string | null;
  scheduledAt?: string | null;
  runnerPortalToken?: string | null;
};

function normalizeWebOrigin(value?: string | null) {
  if (!value) {
    return DEFAULT_WEB_ORIGIN;
  }
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function resolveApiBaseUrl(webOrigin: string) {
  try {
    const parsed = new URL(normalizeWebOrigin(webOrigin));
    parsed.port = parsed.port === '5174' || parsed.port === '5173' ? '8081' : parsed.port || '8081';
    parsed.pathname = '/api';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return DEFAULT_API_BASE_URL;
  }
}

function parseRunnerDeepLink(url: string) {
  try {
    const parsed = new URL(url);
    const token = parsed.pathname.replace(/^\/+/, '');
    const route = parsed.hostname;
    const webUrl = parsed.searchParams.get('webUrl');
    if (route !== 'pickup' || !token) {
      return null;
    }
    return {
      token,
      webOrigin: normalizeWebOrigin(webUrl),
    };
  } catch {
    return null;
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const bodyText = await response.text();
  if (!bodyText) {
    return {} as T;
  }
  return JSON.parse(bodyText) as T;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Not scheduled yet';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function App() {
  const [runnerToken, setRunnerToken] = useState<string | null>(null);
  const [webOrigin, setWebOrigin] = useState(DEFAULT_WEB_ORIGIN);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [notifications, setNotifications] = useState<RunnerNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const initialUrl = await Linking.getInitialURL();
      if (active && initialUrl) {
        const payload = parseRunnerDeepLink(initialUrl);
        if (payload) {
          setRunnerToken(payload.token);
          setWebOrigin(payload.webOrigin);
        }
      }
      if (active) {
        setLoading(false);
      }
    }

    bootstrap();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      const payload = parseRunnerDeepLink(url);
      if (!payload) {
        return;
      }
      setRunnerToken(payload.token);
      setWebOrigin(payload.webOrigin);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const apiBaseUrl = useMemo(() => resolveApiBaseUrl(webOrigin), [webOrigin]);
  const webRunnerUrl = useMemo(() => {
    if (!runnerToken) {
      return null;
    }
    return `${normalizeWebOrigin(webOrigin)}/runner-portal/${runnerToken}?source=hybrid-app`;
  }, [runnerToken, webOrigin]);

  async function handleLogin() {
    try {
      setLoggingIn(true);
      setLoginError(null);
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginIdentifier.trim(),
          password,
        }),
      });
      const payload = await readJson<AuthSession & { message?: string }>(response);
      if (!response.ok) {
        throw new Error(payload.message ?? 'Unable to sign in to the runner app.');
      }
      setSession({
        accessToken: payload.accessToken,
        username: payload.username,
        role: payload.role,
        fullName: payload.fullName,
        phone: payload.phone,
      });
      setPassword('');
      Alert.alert('Signed in', 'Runner inbox opened successfully for the scheduled rider.');
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Unable to sign in to the runner app.';
      setLoginError(nextMessage);
      Alert.alert('Sign in failed', nextMessage);
    } finally {
      setLoggingIn(false);
    }
  }

  async function loadNotifications(currentSession = session, notify = false) {
    if (!currentSession) {
      return;
    }

    try {
      setNotificationsLoading(true);
      setNotificationsError(null);
      const response = await fetch(`${apiBaseUrl}/mobile/runner/notifications`, {
        headers: {
          Authorization: `Bearer ${currentSession.accessToken}`,
        },
      });
      const payload = await readJson<RunnerNotification[] | { message?: string }>(response);
      if (response.status === 401 || response.status === 403) {
        setSession(null);
        setNotifications([]);
        throw new Error('Runner session expired. Please sign in again with the assigned mobile number.');
      }
      if (!response.ok || !Array.isArray(payload)) {
        throw new Error(
          !Array.isArray(payload) && payload.message
            ? payload.message
            : 'Unable to load runner notifications.',
        );
      }
      setNotifications(payload);
      setLastUpdated(new Date().toLocaleTimeString('en-IN'));
      if (notify) {
        Alert.alert('Sync complete', 'Runner inbox refreshed successfully.');
      }
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Unable to load runner notifications.';
      setNotificationsError(nextMessage);
      if (notify || /session expired/i.test(nextMessage)) {
        Alert.alert('Runner inbox sync failed', nextMessage);
      }
    } finally {
      setNotificationsLoading(false);
    }
  }

  useEffect(() => {
    if (!session || runnerToken) {
      return;
    }

    void loadNotifications(session);
    const interval = setInterval(() => {
      void loadNotifications(session);
    }, 20000);

    return () => clearInterval(interval);
  }, [session, runnerToken, apiBaseUrl]);

  function handleOpenNotification(notification: RunnerNotification) {
    if (!notification.runnerPortalToken) {
      return;
    }
    setRunnerToken(notification.runnerPortalToken);
  }

  function handleLogout() {
    setSession(null);
    setNotifications([]);
    setLoginIdentifier('');
    setPassword('');
    setRunnerToken(null);
    setLoginError(null);
    setNotificationsError(null);
    Alert.alert('Signed out', 'Runner inbox session closed successfully.');
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.title}>Opening Runner App</Text>
            <Text style={styles.copyDark}>Preparing the pickup flow from the SMS, WhatsApp, or app notification.</Text>
          </View>
        ) : webRunnerUrl ? (
          <View style={styles.webviewShell}>
            <View style={styles.webviewHeader}>
              <Pressable style={styles.secondaryButton} onPress={() => setRunnerToken(null)}>
                <Text style={styles.secondaryButtonText}>Back To Inbox</Text>
              </Pressable>
              <Pressable style={styles.ghostButton} onPress={handleLogout}>
                <Text style={styles.ghostButtonText}>Sign Out</Text>
              </Pressable>
            </View>
            <WebView
              source={{ uri: webRunnerUrl }}
              style={styles.webview}
              startInLoadingState
              javaScriptEnabled
              domStorageEnabled
              setSupportMultipleWindows={false}
              originWhitelist={['*']}
              renderLoading={() => (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text style={styles.title}>Loading Pickup Flow</Text>
                  <Text style={styles.copyDark}>The same runner web portal is opening inside the hybrid app.</Text>
                </View>
              )}
              onShouldStartLoadWithRequest={(request) => {
                if (request.url.startsWith('gshrunner://')) {
                  const payload = parseRunnerDeepLink(request.url);
                  if (payload) {
                    setRunnerToken(payload.token);
                    setWebOrigin(payload.webOrigin);
                  }
                  return false;
                }
                return true;
              }}
            />
          </View>
        ) : session ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.heroCard}>
              <Text style={styles.eyebrow}>Runner App Inbox</Text>
              <Text style={styles.heroTitle}>{session.fullName ?? session.username}</Text>
              <Text style={styles.copy}>
                Pickup assignments show here for the same runner account that is scheduled in the admin portal. SMS and WhatsApp still go to the rider mobile number, and this inbox stays limited to your own assignments.
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaChip}>Mobile: {session.phone ?? 'Not mapped'}</Text>
                <Text style={styles.metaChip}>Role: {session.role}</Text>
              </View>
              <View style={styles.actionsRow}>
                <Pressable style={styles.primaryButton} onPress={() => void loadNotifications(session, true)}>
                  <Text style={styles.primaryButtonText}>Refresh Inbox</Text>
                </Pressable>
                <Pressable style={styles.ghostButton} onPress={handleLogout}>
                  <Text style={styles.ghostButtonText}>Sign Out</Text>
                </Pressable>
              </View>
              {lastUpdated ? <Text style={styles.footnote}>Last synced at {lastUpdated}</Text> : null}
            </View>

            {notificationsError ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>Notification Sync Error</Text>
                <Text style={styles.errorCopy}>{notificationsError}</Text>
              </View>
            ) : null}

            {notificationsLoading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.copyDark}>Loading rider assignments from the mobile inbox.</Text>
              </View>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <View key={notification.id} style={styles.notificationCard}>
                  <View style={styles.notificationHeader}>
                    <View style={styles.notificationHeaderCopy}>
                      <Text style={styles.notificationTitle}>{notification.subject}</Text>
                      <Text style={styles.notificationMeta}>{notification.requestNumber ?? 'Pickup request'} | {notification.requestStatus ?? 'Scheduled'}</Text>
                    </View>
                    <Text style={styles.statusBadge}>{notification.deliveryStatus}</Text>
                  </View>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                  <View style={styles.notificationGrid}>
                    <Text style={styles.gridLine}>Customer: {notification.customerName ?? 'Customer not mapped'}</Text>
                    <Text style={styles.gridLine}>Device: {notification.deviceLabel ?? 'Device details pending'}</Text>
                    <Text style={styles.gridLine}>Pickup Slot: {formatDateTime(notification.scheduledAt)}</Text>
                    <Text style={styles.gridLine}>Created: {formatDateTime(notification.createdAt)}</Text>
                  </View>
                  <View style={styles.actionsRow}>
                    <Pressable
                      style={[styles.primaryButton, !notification.runnerPortalToken ? styles.disabledButton : null]}
                      disabled={!notification.runnerPortalToken}
                      onPress={() => handleOpenNotification(notification)}
                    >
                      <Text style={styles.primaryButtonText}>Open Pickup Flow</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryButton} onPress={() => Linking.openURL(normalizeWebOrigin(webOrigin))}>
                      <Text style={styles.secondaryButtonText}>Open Web Portal</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No app assignments yet</Text>
                <Text style={styles.copyDark}>
                  Once admin schedules pickup against your runner profile, the assignment shows here in the hybrid app and only for your rider account.
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.heroCard}>
              <Text style={styles.eyebrow}>Hybrid Runner App</Text>
              <Text style={styles.heroTitle}>Sign In With Mobile Or Username</Text>
              <Text style={styles.copy}>
                Use the same runner account that was onboarded in the admin portal. Mobile number is recommended. After sign-in, only your own pickup assignments appear in the app inbox.
              </Text>
              <Text style={styles.footnote}>
                If admin used the default onboarding flow, the temporary app password is usually `Runner@` plus the last 4 digits of your mobile number.
              </Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Mobile Number Or Username</Text>
              <TextInput
                value={loginIdentifier}
                onChangeText={setLoginIdentifier}
                autoCapitalize="none"
                placeholder="Enter rider mobile number"
                placeholderTextColor="#94a3b8"
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Enter password"
                placeholderTextColor="#94a3b8"
                style={styles.input}
              />

              {loginError ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorTitle}>Sign In Failed</Text>
                  <Text style={styles.errorCopy}>{loginError}</Text>
                </View>
              ) : null}

              <Pressable
                style={[styles.primaryButton, loggingIn ? styles.disabledButton : null]}
                disabled={loggingIn}
                onPress={() => void handleLogin()}
              >
                <Text style={styles.primaryButtonText}>{loggingIn ? 'Signing In...' : 'Sign In To Rider Inbox'}</Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={() => Linking.openURL(normalizeWebOrigin(webOrigin))}>
                <Text style={styles.secondaryButtonText}>Open Gadget Seva Hub</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}
        <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e2e8f0',
  },
  webviewShell: {
    flex: 1,
    backgroundColor: '#e2e8f0',
  },
  webviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dbe5f4',
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 14,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
    gap: 18,
  },
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 22,
    gap: 10,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: '#93c5fd',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  copy: {
    fontSize: 16,
    lineHeight: 24,
    color: '#cbd5e1',
  },
  copyDark: {
    fontSize: 16,
    lineHeight: 24,
    color: '#475569',
    textAlign: 'center',
  },
  footnote: {
    fontSize: 13,
    lineHeight: 20,
    color: '#94a3b8',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  metaChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1e293b',
    color: '#dbeafe',
    fontSize: 13,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#dbe5f4',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    borderRadius: 16,
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#1d4ed8',
    fontSize: 15,
    fontWeight: '700',
  },
  ghostButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  ghostButtonText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorCard: {
    borderRadius: 18,
    backgroundColor: '#fff1f2',
    padding: 16,
    borderWidth: 1,
    borderColor: '#fecdd3',
    gap: 6,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#9f1239',
  },
  errorCopy: {
    fontSize: 14,
    lineHeight: 21,
    color: '#be123c',
  },
  loadingCard: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 24,
    borderWidth: 1,
    borderColor: '#dbe5f4',
    alignItems: 'center',
    gap: 12,
  },
  emptyCard: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 24,
    borderWidth: 1,
    borderColor: '#dbe5f4',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  notificationCard: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 20,
    borderWidth: 1,
    borderColor: '#dbe5f4',
    gap: 14,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  notificationHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  notificationTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  notificationMeta: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 999,
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
  },
  notificationMessage: {
    fontSize: 15,
    lineHeight: 23,
    color: '#334155',
  },
  notificationGrid: {
    gap: 6,
  },
  gridLine: {
    fontSize: 14,
    color: '#475569',
  },
});
