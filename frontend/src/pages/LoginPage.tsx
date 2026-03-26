import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
      setError(nextError instanceof Error ? nextError.message : 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Gadget Seva Hub</p>
        <h1>Sign in</h1>
        <p className="login-copy">Access service operations, request queues, billing, and audit workflows from one console.</p>

        <label className="form-field">
          <span>Username</span>
          <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" />
        </label>

        <label className="form-field">
          <span>Password</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
        </label>

        <button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in'}</button>
        {error ? <p className="login-hint">{error}</p> : <p className="login-hint">Local users are seeded in the database with `Admin@123` for development.</p>}
      </form>
    </div>
  );
}
