import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GadgetSevaLogo } from '../components/GadgetSevaLogo';
import { getApiErrorMessage } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const signalCards = [
  { value: '22', label: 'workflow states', detail: 'from intake to final delivery' },
  { value: '8', label: 'seeded operator roles', detail: 'admin, support, tech, finance and more' },
  { value: '<4h', label: 'triage target', detail: 'built for fast local debugging' },
];

const railItems = [
  'Repair intake, diagnostics, approval, dispatch and reconciliation in one command surface.',
  'JWT-based access with seeded local operators for quick role testing.',
  'Traceable service-request history so each state transition stays visible.',
];

const operatorRoles = ['admin', 'support', 'backend', 'pickup', 'tech', 'delivery', 'mse', 'finance'];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await login(username, password);
      navigate('/');
    } catch (nextError) {
      setError(getApiErrorMessage(nextError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-grid" aria-hidden="true" />
      <div className="login-layout">
        <section className="login-brand-panel">
          <div className="login-brand-lockup">
            <div className="login-logo-frame">
              <GadgetSevaLogo className="login-logo" />
            </div>
            <div className="login-brand-copy">
              <p className="login-overline">Repair Command Center</p>
              <h1>Gadget Seva Hub</h1>
              <p className="login-copy">
                Operate service intake, diagnostics, approvals, dispatch, and billing from one high-clarity control surface.
              </p>
            </div>
          </div>

          <div className="login-metric-grid">
            {signalCards.map((card) => (
              <article className="login-metric-card" key={card.label}>
                <strong>{card.value}</strong>
                <span>{card.label}</span>
                <small>{card.detail}</small>
              </article>
            ))}
          </div>

          <div className="login-console-card">
            <div className="login-console-head">
              <span className="login-console-badge">Ops Matrix</span>
              <span className="login-console-status">Local stack ready</span>
            </div>
            <ul className="login-console-list">
              {railItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card-head">
            <p className="login-card-eyebrow">Secure access node</p>
            <h2 className="login-card-title">Sign in</h2>
            <p className="login-card-copy">Use a seeded operator account to enter the dashboard and test real workflow routes.</p>
          </div>

          <label className="form-field">
            <span>Username</span>
            <input
              autoComplete="username"
              placeholder="admin"
              required
              spellCheck={false}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              placeholder="Password"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <button className="primary-button login-submit" type="submit" disabled={submitting}>
            {submitting ? 'Authorizing...' : 'Enter Console'}
          </button>

          {error ? <p className="login-alert login-alert-error">{error}</p> : null}

          <div className="login-devnote">
            <div className="login-devnote-head">
              <span className="login-devnote-badge">Local dev</span>
              <strong>Seeded password: `Admin@123`</strong>
            </div>
            <div className="login-role-pills">
              {operatorRoles.map((role) => (
                <span className="login-role-pill" key={role}>
                  {role}
                </span>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
