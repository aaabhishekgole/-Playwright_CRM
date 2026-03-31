import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import {
  fetchRunnerAppNotifications,
  getApiErrorMessage,
  loginRunnerApp,
} from '../services/api';
import type { LoginResponse, RunnerNotification } from '../types/models';
import { formatDateTimeIn } from '../utils/formatters';

type RunnerSession = Pick<LoginResponse, 'accessToken' | 'username' | 'role' | 'fullName' | 'phone'>;

const RUNNER_SESSION_STORAGE_KEY = 'gsh_runner_app_session';

function readStoredRunnerSession() {
  const rawSession = window.sessionStorage.getItem(RUNNER_SESSION_STORAGE_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as RunnerSession;
  } catch {
    window.sessionStorage.removeItem(RUNNER_SESSION_STORAGE_KEY);
    return null;
  }
}

function storeRunnerSession(session: RunnerSession | null) {
  if (!session) {
    window.sessionStorage.removeItem(RUNNER_SESSION_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(RUNNER_SESSION_STORAGE_KEY, JSON.stringify(session));
}

function normalizeRunnerError(error: unknown) {
  const message = getApiErrorMessage(error);
  if (/status (401|403)/i.test(message)) {
    return 'Runner session expired. Sign in again with the scheduled mobile number or username.';
  }
  return message;
}

export function RunnerAppInboxPage() {
  const [searchParams] = useSearchParams();
  const { showError, showInfo, showSuccess } = useToast();
  const pickupToken = searchParams.get('token');
  const [session, setSession] = useState<RunnerSession | null>(() => readStoredRunnerSession());
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<RunnerNotification[]>([]);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const directPickupPath = useMemo(() => (
    pickupToken ? `/runner-portal/${pickupToken}` : null
  ), [pickupToken]);

  const highlightedNotification = useMemo(() => {
    if (!pickupToken) {
      return null;
    }
    return notifications.find((notification) => notification.runnerPortalToken === pickupToken) ?? null;
  }, [notifications, pickupToken]);

  async function loadNotifications(currentSession = session, notify = false) {
    if (!currentSession) {
      return;
    }

    try {
      setLoadingNotifications(true);
      setNotificationsError(null);
      const nextNotifications = await fetchRunnerAppNotifications(currentSession.accessToken);
      setNotifications(nextNotifications);
      setLastSyncedAt(formatDateTimeIn(new Date().toISOString()));
      if (notify) {
        showInfo('Runner inbox refreshed successfully.', 'Sync complete');
      }
    } catch (error) {
      const nextMessage = normalizeRunnerError(error);
      setNotificationsError(nextMessage);
      if (notify || /session expired/i.test(nextMessage)) {
        showError(nextMessage, 'Runner inbox sync failed');
      }
      if (/session expired/i.test(nextMessage)) {
        storeRunnerSession(null);
        setSession(null);
        setNotifications([]);
      }
    } finally {
      setLoadingNotifications(false);
    }
  }

  useEffect(() => {
    if (!session) {
      return;
    }

    void loadNotifications(session);
    const interval = window.setInterval(() => {
      void loadNotifications(session);
    }, 20000);

    return () => {
      window.clearInterval(interval);
    };
  }, [session]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setLoginError(null);
      const response = await loginRunnerApp(loginIdentifier.trim(), password);
      if (response.role !== 'PICKUP_AGENT') {
        throw new Error('Only pickup runners can sign in to the runner inbox.');
      }

      const nextSession: RunnerSession = {
        accessToken: response.accessToken,
        username: response.username,
        role: response.role,
        fullName: response.fullName,
        phone: response.phone,
      };
      storeRunnerSession(nextSession);
      setSession(nextSession);
      setPassword('');
      showSuccess('Runner inbox opened successfully for the scheduled rider.', 'Signed in');
    } catch (error) {
      const nextMessage = normalizeRunnerError(error);
      setLoginError(nextMessage);
      showError(nextMessage, 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    storeRunnerSession(null);
    setSession(null);
    setNotifications([]);
    setLoginIdentifier('');
    setPassword('');
    setLoginError(null);
    setNotificationsError(null);
    setLastSyncedAt(null);
    showInfo('Runner inbox session closed successfully.', 'Signed out');
  }

  return (
    <section className="runner-portal-shell runner-app-shell">
      <div className="runner-portal-frame runner-app-frame">
        <article className="card runner-app-hero">
          <div className="split-row">
            <div>
              <p className="eyebrow">Runner Web Inbox</p>
              <h1>{session ? (session.fullName ?? session.username) : 'Hybrid Runner Flow In Browser'}</h1>
              <p>
                This browser page mirrors the hybrid runner app. Riders can sign in with the same onboarded mobile number,
                receive only their own pickup assignments, and open the exact same pickup portal flow.
              </p>
            </div>
            <div className="runner-app-chip-stack">
              <span className="workspace-chip">Web + app parity</span>
              <span className="workspace-chip">Rider-specific inbox</span>
              {pickupToken ? <span className="workspace-chip">Pickup link ready</span> : null}
            </div>
          </div>

          <div className="runner-app-meta-grid">
            <div className="runner-app-meta-card">
              <strong>Sign In</strong>
              <small>Use mobile number or rider username from onboarding.</small>
            </div>
            <div className="runner-app-meta-card">
              <strong>Inbox Sync</strong>
              <small>Only APP notifications for the scheduled runner are visible here.</small>
            </div>
            <div className="runner-app-meta-card">
              <strong>Pickup Flow</strong>
              <small>Open the same accept, customer update, 10-photo, and pickup-done flow used inside the hybrid app.</small>
            </div>
          </div>

          <div className="action-row action-row-wrap">
            {directPickupPath ? <Link className="secondary-button" to={directPickupPath}>Open Direct Pickup Flow</Link> : null}
            <Link className="secondary-button" to="/login">Open Admin Portal</Link>
            {session ? (
              <>
                <button className="primary-button" type="button" onClick={() => void loadNotifications(session, true)} disabled={loadingNotifications}>
                  {loadingNotifications ? 'Refreshing...' : 'Refresh Runner Inbox'}
                </button>
                <button className="secondary-button" type="button" onClick={handleLogout}>Sign Out</button>
              </>
            ) : null}
          </div>

          {session ? (
            <p className="runner-app-footnote">
              Signed in as <strong>{session.fullName ?? session.username}</strong>
              {session.phone ? ` | Mobile ${session.phone}` : ''}
              {lastSyncedAt ? ` | Last synced ${lastSyncedAt}` : ''}
            </p>
          ) : (
            <p className="runner-app-footnote">
              Default onboarding password pattern: <strong>Runner@</strong> plus the last 4 digits of the rider mobile number.
            </p>
          )}
        </article>

        {!session ? (
          <div className="runner-app-grid">
            <form className="card runner-app-form" onSubmit={handleLogin}>
              <h2>Sign In To Runner Inbox</h2>
              <p>Use the same rider profile created from admin runner onboarding. Mobile number is recommended.</p>

              <label className="form-field">
                <span>Mobile Number Or Username</span>
                <input
                  autoCapitalize="none"
                  autoComplete="username"
                  placeholder="Enter scheduled rider mobile number"
                  required
                  spellCheck={false}
                  value={loginIdentifier}
                  onChange={(event) => setLoginIdentifier(event.target.value)}
                />
              </label>

              <label className="form-field">
                <span>Password</span>
                <input
                  autoComplete="current-password"
                  placeholder="Enter rider password"
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>

              {loginError ? <p className="login-alert login-alert-error">{loginError}</p> : null}

              <button className="primary-button" disabled={submitting} type="submit">
                {submitting ? 'Signing In...' : 'Open Runner Inbox'}
              </button>
            </form>

            <article className="card runner-app-form runner-app-sidecard">
              <h2>Browser Flow</h2>
              <p>
                The web inbox is the browser-side twin of the hybrid runner app. Riders can review assignments here and then open
                the same tokenized pickup portal.
              </p>
              <div className="mini-list">
                <div>
                  <strong>SMS / WhatsApp</strong>
                  <small>Rider receives the pickup link on the mobile and WhatsApp numbers set during scheduling.</small>
                </div>
                <div>
                  <strong>App Inbox</strong>
                  <small>The same rider also sees the assignment inside the hybrid app and this browser inbox.</small>
                </div>
                <div>
                  <strong>Direct Flow</strong>
                  <small>After opening a pickup, the same customer update, 10-photo, and pickup-done portal flow is used everywhere.</small>
                </div>
              </div>
              {directPickupPath ? <Link className="secondary-button" to={directPickupPath}>Open Linked Pickup Now</Link> : null}
            </article>
          </div>
        ) : (
          <>
            {highlightedNotification ? (
              <article className="card runner-app-highlight">
                <div className="split-row">
                  <div>
                    <p className="eyebrow">Linked Pickup</p>
                    <h2>{highlightedNotification.requestNumber ?? 'Pickup request ready'}</h2>
                    <p>
                      {highlightedNotification.customerName ?? 'Customer pending'} | {highlightedNotification.deviceLabel ?? 'Device details pending'} | {highlightedNotification.requestStatus ?? 'Assigned'}
                    </p>
                  </div>
                  {highlightedNotification.runnerPortalToken ? (
                    <Link className="primary-button" to={`/runner-portal/${highlightedNotification.runnerPortalToken}`}>Open Pickup Flow</Link>
                  ) : null}
                </div>
              </article>
            ) : null}

            {notificationsError ? (
              <article className="card runner-app-feedback runner-app-feedback-error">
                <strong>Unable to load runner inbox</strong>
                <p>{notificationsError}</p>
              </article>
            ) : null}

            {loadingNotifications && notifications.length === 0 ? (
              <article className="card runner-app-feedback">
                <strong>Loading rider assignments</strong>
                <p>Please wait while the browser inbox fetches the latest pickup notifications.</p>
              </article>
            ) : null}

            {!loadingNotifications && notifications.length === 0 ? (
              <article className="card runner-app-feedback">
                <strong>No assignments yet</strong>
                <p>Once pickup is scheduled against this runner profile, the same assignment appears here and in the hybrid app.</p>
              </article>
            ) : null}

            {notifications.length > 0 ? (
              <div className="runner-app-list">
                {notifications.map((notification) => {
                  const isHighlighted = pickupToken && notification.runnerPortalToken === pickupToken;
                  return (
                    <article
                      className={`card runner-app-notification${isHighlighted ? ' runner-app-notification-highlighted' : ''}`}
                      key={notification.id}
                    >
                      <div className="split-row">
                        <div>
                          <p className="eyebrow">{notification.channel}</p>
                          <h2>{notification.subject}</h2>
                          <p>{notification.requestNumber ?? 'Pickup request'} | {notification.requestStatus ?? 'Assigned'}</p>
                        </div>
                        <span className="workspace-chip">{notification.deliveryStatus}</span>
                      </div>

                      <p className="runner-app-message">{notification.message}</p>

                      <div className="runner-app-detail-grid">
                        <div>
                          <span>Customer</span>
                          <strong>{notification.customerName ?? 'Customer pending'}</strong>
                        </div>
                        <div>
                          <span>Device</span>
                          <strong>{notification.deviceLabel ?? 'Device details pending'}</strong>
                        </div>
                        <div>
                          <span>Pickup Slot</span>
                          <strong>{formatDateTimeIn(notification.scheduledAt)}</strong>
                        </div>
                        <div>
                          <span>Notification Time</span>
                          <strong>{formatDateTimeIn(notification.createdAt)}</strong>
                        </div>
                      </div>

                      <div className="action-row action-row-wrap">
                        {notification.runnerPortalToken ? (
                          <Link className="primary-button" to={`/runner-portal/${notification.runnerPortalToken}`}>Open Pickup Flow</Link>
                        ) : null}
                        {pickupToken && directPickupPath ? <Link className="secondary-button" to={directPickupPath}>Open Current Link</Link> : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
