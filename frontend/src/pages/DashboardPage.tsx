import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasMenuAccess, workflowFlow } from '../utils/menuHierarchy';
import { formatDateTimeIn } from '../utils/formatters';
import { useRequests } from './useRequests';

export function DashboardPage() {
  const { requests } = useRequests();
  const { role } = useAuth();
  const breached = requests.filter((request) => request.slaBreached).length;
  const aged = requests.filter((request) => {
    const ageMs = Date.now() - new Date(request.createdAt).getTime();
    return ageMs > 14 * 24 * 60 * 60 * 1000;
  }).length;
  const pendingPayments = requests.filter((request) => (request.invoice?.amountDue ?? 0) > 0).length;
  const openClaims = requests.filter((request) => request.status !== 'CLOSED').length;
  const pendingPickup = requests.filter((request) => request.status.includes('PICKUP')).length;
  const verificationQueue = requests.filter((request) => request.status === 'RECEIVED_AT_HUB').length;
  const estimateQueue = requests.filter((request) => request.status.includes('ESTIMATE') || request.status.includes('CASHLESS')).length;
  const dispatchQueue = requests.filter((request) => ['READY_FOR_DISPATCH', 'DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY'].includes(request.status)).length;
  const activeRepairs = requests.filter((request) => ['REPAIR_IN_PROGRESS', 'REPAIR_COMPLETED'].includes(request.status)).length;

  const quickTiles = [
    { title: 'Create Request', value: 'New', hint: 'Register a new service request', accent: 'accent-cyan', link: '/workspace/service-requests/create-request', sectionId: 'service-requests', itemId: 'create-request', icon: 'CR' },
    { title: 'Open Requests', value: String(openClaims), hint: 'Requests currently in progress', accent: 'accent-blue', link: '/workspace/service-requests/open-requests', sectionId: 'service-requests', itemId: 'open-requests', icon: 'OR' },
    { title: 'Pending Pickup', value: String(pendingPickup), hint: 'Collections waiting to be assigned or completed', accent: 'accent-teal', link: '/workspace/pickup-management/pending-pickup', sectionId: 'pickup-management', itemId: 'pending-pickup', icon: 'PU' },
    { title: 'Pending Verification', value: String(verificationQueue), hint: 'Hub validation and IMEI review', accent: 'accent-gold', link: '/workspace/hub-operations/pending-verification', sectionId: 'hub-operations', itemId: 'pending-verification', icon: 'HV' },
    { title: 'Estimate Approval', value: String(estimateQueue), hint: 'Approvals waiting for action', accent: 'accent-purple', link: '/estimate-approval', sectionId: 'estimates', itemId: 'awaiting-customer-approval', icon: 'EA' },
    { title: 'Out for Delivery', value: String(dispatchQueue), hint: 'Dispatches currently in transit', accent: 'accent-coral', link: '/delivery-tracking', sectionId: 'delivery', itemId: 'out-for-delivery', icon: 'DL' },
    { title: 'Billing Pending', value: String(pendingPayments), hint: 'Invoices awaiting payment', accent: 'accent-red', link: '/workspace/billing/pending-invoices', sectionId: 'billing', itemId: 'pending-invoices', icon: 'BP' },
    { title: 'SLA Alerts', value: String(breached + aged), hint: 'Breached or aging requests', accent: 'accent-orange', link: '/workspace/dashboard/alerts-escalations', sectionId: 'dashboard', itemId: 'alerts-escalations', icon: 'SA' },
  ].filter((tile) => hasMenuAccess(role, tile.sectionId, tile.itemId));

  const primaryMetrics = [
    { label: 'Open requests', value: openClaims, detail: 'Live service requests across all active teams.' },
    { label: 'Pickup queue', value: pendingPickup, detail: 'Assignments, reschedules, and field pickups pending closure.' },
    { label: 'Repair queue', value: activeRepairs, detail: 'Devices currently under repair or ready for QC.' },
    { label: 'Billing pending', value: pendingPayments, detail: 'Invoices or collections requiring finance action.' },
  ];

  const attentionQueues = [
    { label: 'Hub verification', value: verificationQueue, detail: 'Devices waiting for inward and IMEI validation.', link: '/workspace/hub-operations/pending-verification' },
    { label: 'Estimate approvals', value: estimateQueue, detail: 'Estimate or cashless review cases awaiting action.', link: '/estimate-approval' },
    { label: 'Dispatch readiness', value: dispatchQueue, detail: 'Cases approaching delivery handoff.', link: '/workspace/delivery/ready-for-dispatch' },
    { label: 'SLA risk', value: breached + aged, detail: 'Breached or aging claims that need escalation.', link: '/workspace/dashboard/alerts-escalations' },
  ].filter((queue) => queue.value > 0 || queue.label !== 'SLA risk');

  const recentRequests = [...requests]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 6);

  return (
    <section className="dashboard-shell dense-ops-dashboard">
      <article className="card dashboard-command-card">
        <div>
          <p className="eyebrow">Dense ops control</p>
          <h2>Compact command view for intake, pickup, repair, dispatch, and finance teams.</h2>
          <p>
            This view is designed for daily operational control. Monitor queue pressure, open the right module quickly,
            and keep each service request moving without losing billing or audit context.
          </p>
        </div>
        <div className="dashboard-command-actions">
          <Link className="primary-button" to="/workspace/service-requests/create-request">Create Request</Link>
          <Link className="secondary-button" to="/workspace/service-requests/open-requests">Open Requests</Link>
          <Link className="secondary-button" to="/workspace/pickup-management/pending-pickup">Pickup Queue</Link>
        </div>
      </article>

      <div className="dashboard-metric-strip">
        {primaryMetrics.map((metric) => (
          <article className="summary-stat compact-stat" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </div>

      <div className="dashboard-two-column">
        <article className="card dashboard-queue-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="eyebrow">Attention queues</p>
              <h3>Immediate action queues</h3>
            </div>
            <span className="dashboard-panel-badge">Live counts</span>
          </div>
          <div className="dashboard-queue-list">
            {attentionQueues.map((queue) => (
              <Link key={queue.label} to={queue.link} className="dashboard-queue-row">
                <div>
                  <strong>{queue.label}</strong>
                  <span>{queue.detail}</span>
                </div>
                <b>{queue.value}</b>
              </Link>
            ))}
          </div>
        </article>

        <article className="card dashboard-process-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="eyebrow">Workflow map</p>
              <h3>Workflow states</h3>
            </div>
            <span className="dashboard-panel-badge">End-to-end</span>
          </div>
          <div className="dashboard-process-grid">
            {workflowFlow.map((step, index) => (
              <div key={step} className="dashboard-process-step">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="dashboard-two-column">
        <article className="card dashboard-table-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="eyebrow">Recent activity</p>
              <h3>Latest request movement</h3>
            </div>
            <Link className="dashboard-inline-link" to="/workspace/service-requests/open-requests">View full queue</Link>
          </div>
          <div className="dashboard-request-table">
            <div className="dashboard-request-head">
              <span>Request</span>
              <span>Customer</span>
              <span>Status</span>
              <span>Updated</span>
            </div>
            {recentRequests.map((request) => (
              <Link className="dashboard-request-row" key={request.id} to={`/requests/${request.id}`}>
                <div>
                  <strong>{request.requestNumber}</strong>
                  <small>{request.deviceLabel}</small>
                </div>
                <div>
                  <strong>{request.customerName}</strong>
                  <small>{request.customerPhone}</small>
                </div>
                <div>
                  <strong>{request.status.replaceAll('_', ' ')}</strong>
                  <small>{request.pickupAgent ?? request.deliveryAgent ?? request.technician ?? 'Unassigned'}</small>
                </div>
                <div>
                  <strong>{formatDateTimeIn(request.updatedAt)}</strong>
                  <small>{request.partnerReference ?? 'Direct intake'}</small>
                </div>
              </Link>
            ))}
          </div>
        </article>

        <article className="card dashboard-action-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="eyebrow">Module shortcuts</p>
              <h3>High-use shortcuts</h3>
            </div>
            <span className="dashboard-panel-badge">Role aware</span>
          </div>
          <div className="dashboard-action-grid">
            {quickTiles.map((tile) => (
              <Link key={tile.title} to={tile.link} className={`merchant-tile dashboard-action-tile ${tile.accent}`}>
                <div className="merchant-tile-icon">{tile.icon}</div>
                <div className="merchant-tile-body">
                  <h3>{tile.title}</h3>
                  <strong>{tile.value}</strong>
                  <span>{tile.hint}</span>
                </div>
              </Link>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}