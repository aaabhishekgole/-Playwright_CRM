import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { createPickupRunner, fetchUsers, getApiErrorMessage } from '../services/api';
import type { CreatePickupRunnerPayload, UserSummary } from '../types/models';

const initialForm: CreatePickupRunnerPayload = {
  fullName: '',
  phone: '',
  whatsappNumber: '',
  email: '',
  username: '',
  active: true,
};

export function PickupRunnerOnboardingPage() {
  const { showError, showSuccess } = useToast();
  const [form, setForm] = useState<CreatePickupRunnerPayload>(initialForm);
  const [sameAsMobile, setSameAsMobile] = useState(true);
  const [runners, setRunners] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadRunners() {
    try {
      setLoading(true);
      setError(null);
      const roster = await fetchUsers('PICKUP_AGENT');
      setRunners(roster);
    } catch (nextError) {
      const nextMessage = getApiErrorMessage(nextError);
      setError(nextMessage);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRunners();
  }, []);

  const activeRunners = useMemo(() => runners.filter((runner) => runner.active), [runners]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const created = await createPickupRunner({
        ...form,
        whatsappNumber: sameAsMobile ? form.phone : form.whatsappNumber,
      });
      const nextMessage = `${created.fullName} is onboarded. The runner is now available in the Assign Pickup dropdown and will receive pickup links on SMS and WhatsApp.`;
      setMessage(nextMessage);
      showSuccess(nextMessage, 'Runner onboarded');
      setForm(initialForm);
      setSameAsMobile(true);
      await loadRunners();
    } catch (nextError) {
      const nextMessage = getApiErrorMessage(nextError);
      setError(nextMessage);
      showError(nextMessage, 'Runner onboarding failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="workspace-page">
      <div className="page-header merchant-page-header">
        <div>
          <p className="eyebrow">Pickup Management</p>
          <h2>Runner Onboarding</h2>
          <p>Onboard pickup runners in the admin portal, capture the mandatory mobile number, and push them live into pickup assignment.</p>
        </div>
        <div className="workspace-chip-row">
          <span className="workspace-chip">Mobile mandatory</span>
          <span className="workspace-chip">Dropdown linked</span>
          <span className="workspace-chip">Runner portal live</span>
        </div>
      </div>

      <article className="card workflow-playbook">
        <div className="split-row">
          <div>
            <p className="eyebrow">Market Flow</p>
            <h3>Runner Onboarding To Pickup Completion</h3>
          </div>
          <span className="workspace-chip">Admin portal</span>
        </div>
        <div className="workflow-step-list">
          <div className="workflow-step">
            <span>1</span>
            <p>Admin onboards the pickup runner with full name, mandatory mobile number, and WhatsApp contact.</p>
          </div>
          <div className="workflow-step">
            <span>2</span>
            <p>The runner becomes active immediately in the Assign Pickup dropdown for `REQUEST_CREATED` claims.</p>
          </div>
          <div className="workflow-step">
            <span>3</span>
            <p>When pickup is assigned, the runner receives the secure portal link over SMS and WhatsApp.</p>
          </div>
          <div className="workflow-step">
            <span>4</span>
            <p>Runner accepts pickup, customer and admin notifications are logged, 10 required photos plus optional extras are uploaded, and pickup is completed.</p>
          </div>
        </div>
      </article>

      <div className="summary-grid">
        <article className="summary-stat">
          <span>Active Pickup Runners</span>
          <strong>{activeRunners.length}</strong>
          <small>Runners currently available for assignment dropdowns.</small>
        </article>
        <article className="summary-stat">
          <span>Total Runner Records</span>
          <strong>{runners.length}</strong>
          <small>All onboarded pickup runners stored in the portal.</small>
        </article>
        <article className="summary-stat">
          <span>Next Workflow</span>
          <strong>Assign Pickup</strong>
          <small>Use the assign board to send the runner link and schedule the doorstep visit.</small>
        </article>
      </div>

      {error ? <div className="workspace-empty"><strong>Runner onboarding error</strong><p>{error}</p></div> : null}
      {message ? <div className="workspace-empty workspace-success"><strong>Runner onboarded</strong><p>{message}</p></div> : null}

      <div className="workspace-grid">
        <article className="card workspace-panel workspace-panel-wide">
          <div className="workspace-panel-head">
            <h3>Onboard Pickup Runner</h3>
            <p>Create a pickup runner who can receive assignment links and appear under the pickup runner dropdown.</p>
          </div>
          <form className="runner-onboarding-form" onSubmit={handleSubmit}>
            <div className="action-form-grid">
              <label className="action-field">
                <span>Runner Full Name</span>
                <input
                  value={form.fullName ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                  placeholder="Enter runner name"
                  required
                />
              </label>
              <label className="action-field">
                <span>Mobile Number</span>
                <input
                  value={form.phone ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="10-digit mobile number"
                  required
                />
              </label>
            </div>
            <div className="action-form-grid">
              <label className="action-field">
                <span>WhatsApp Number</span>
                <input
                  value={sameAsMobile ? (form.phone ?? '') : (form.whatsappNumber ?? '')}
                  onChange={(event) => setForm((current) => ({ ...current, whatsappNumber: event.target.value }))}
                  placeholder="Defaults to the same mobile number"
                  disabled={sameAsMobile}
                />
              </label>
              <label className="action-field">
                <span>Email</span>
                <input
                  value={form.email ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Optional. System generates one if left blank."
                />
              </label>
            </div>
            <div className="action-form-grid">
              <label className="action-field">
                <span>Username</span>
                <input
                  value={form.username ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  placeholder="Optional. System generates one if left blank."
                />
              </label>
              <label className="runner-onboarding-toggle">
                <input
                  type="checkbox"
                  checked={sameAsMobile}
                  onChange={(event) => setSameAsMobile(event.target.checked)}
                />
                <span>Use the same number for WhatsApp delivery</span>
              </label>
            </div>
            <div className="action-row action-row-wrap">
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? 'Onboarding...' : 'Onboard Runner'}
              </button>
              <Link className="secondary-button" to="/workspace/pickup-management/assign-pickup">Go To Assign Pickup</Link>
            </div>
          </form>
        </article>

        <article className="card workspace-panel">
          <div className="workspace-panel-head">
            <h3>Workflow Guarantee</h3>
            <p>What happens automatically once the runner is onboarded.</p>
          </div>
          <div className="workspace-links compact-links">
            <Link className="workspace-link" to="/workspace/pickup-management/assign-pickup">
              <strong>Assign Pickup</strong>
              <span>Runner appears in the live dropdown for `REQUEST_CREATED` cases.</span>
            </Link>
            <Link className="workspace-link" to="/workspace/pickup-management/pending-pickup">
              <strong>Pending Pickup</strong>
              <span>Accepted jobs move here for field execution and evidence upload.</span>
            </Link>
            <Link className="workspace-link" to="/workspace/pickup-management/pickup-history">
              <strong>Pickup History</strong>
              <span>Completed pickup cases remain linked with runner evidence and timeline.</span>
            </Link>
          </div>
        </article>
      </div>

      <article className="card workspace-panel">
        <div className="split-row workspace-panel-head">
          <div>
            <h3>Pickup Runner Roster</h3>
            <p>Live pickup runners stored in the admin portal and available to the assignment flow.</p>
          </div>
          <span className="workspace-chip">{activeRunners.length} active runners</span>
        </div>

        {loading ? (
          <div className="workspace-empty">
            <strong>Loading runner roster</strong>
            <p>Please wait while the pickup runner directory is fetched.</p>
          </div>
        ) : runners.length > 0 ? (
          <div className="portal-table">
            <div className="portal-table-row portal-table-head">
              <span>Runner</span>
              <span>Mobile</span>
              <span>WhatsApp</span>
              <span>Username</span>
              <span>Status</span>
              <span>Flow</span>
            </div>
            {runners.map((runner) => (
              <div className="portal-table-row portal-table-body" key={runner.id}>
                <div>
                  <strong>{runner.fullName}</strong>
                  <small>{runner.email ?? 'System-generated email'}</small>
                </div>
                <div>{runner.phone ?? 'N/A'}</div>
                <div>{runner.whatsappNumber ?? runner.phone ?? 'N/A'}</div>
                <div>{runner.username}</div>
                <div><span className="status-badge workspace-status-badge">{runner.active ? 'ACTIVE' : 'INACTIVE'}</span></div>
                <div>{runner.active ? 'Ready for pickup assignment' : 'Not visible in dropdown'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="workspace-empty">
            <strong>No pickup runners onboarded yet</strong>
            <p>Create the first runner here and the Assign Pickup dropdown will start using that live roster.</p>
          </div>
        )}
      </article>
    </section>
  );
}
