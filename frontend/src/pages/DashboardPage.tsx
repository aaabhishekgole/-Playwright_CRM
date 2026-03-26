import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasMenuAccess, workflowFlow } from '../utils/menuHierarchy';
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

  const quickTiles = [
    { title: 'Create Request', value: 'New', hint: 'Register a new service request', accent: 'accent-cyan', link: '/workspace/service-requests/create-request', sectionId: 'service-requests', itemId: 'create-request', icon: 'CR' },
    { title: 'Open Requests', value: String(openClaims), hint: 'Requests currently in progress', accent: 'accent-blue', link: '/workspace/service-requests/open-requests', sectionId: 'service-requests', itemId: 'open-requests', icon: 'OR' },
    { title: 'Pending Pickup', value: String(requests.filter((request) => request.status.includes('PICKUP')).length), hint: 'Collections waiting to be assigned or completed', accent: 'accent-teal', link: '/workspace/pickup-management/pending-pickup', sectionId: 'pickup-management', itemId: 'pending-pickup', icon: 'PU' },
    { title: 'Pending Verification', value: String(requests.filter((request) => request.imeiValidationStatus !== 'VALID').length), hint: 'Hub validation and IMEI review', accent: 'accent-gold', link: '/workspace/hub-operations/pending-verification', sectionId: 'hub-operations', itemId: 'pending-verification', icon: 'HV' },
    { title: 'Estimate Approval', value: String(requests.filter((request) => request.status.includes('ESTIMATE')).length), hint: 'Approvals waiting for action', accent: 'accent-purple', link: '/estimate-approval', sectionId: 'estimates', itemId: 'awaiting-customer-approval', icon: 'EA' },
    { title: 'Quality Review', value: 'Live', hint: 'QC and rework monitoring', accent: 'accent-rose', link: '/workspace/quality-check/pending-qc', sectionId: 'quality-check', itemId: 'pending-qc', icon: 'QC' },
    { title: 'Out for Delivery', value: String(requests.filter((request) => request.status.includes('DELIVERY') || request.status === 'OUT_FOR_DELIVERY').length), hint: 'Dispatches currently in transit', accent: 'accent-coral', link: '/delivery-tracking', sectionId: 'delivery', itemId: 'out-for-delivery', icon: 'DL' },
    { title: 'Billing Pending', value: String(pendingPayments), hint: 'Invoices awaiting payment', accent: 'accent-red', link: '/workspace/billing/pending-invoices', sectionId: 'billing', itemId: 'pending-invoices', icon: 'BP' },
    { title: 'SLA Alerts', value: String(breached + aged), hint: 'Breached or aging requests', accent: 'accent-orange', link: '/workspace/dashboard/alerts-escalations', sectionId: 'dashboard', itemId: 'alerts-escalations', icon: 'SA' },
  ].filter((tile) => hasMenuAccess(role, tile.sectionId, tile.itemId));

  return (
    <section className="merchant-dashboard">
      <div className="dashboard-hero-modern">
        <div>
          <p className="eyebrow">Operations dashboard</p>
          <h2>Track service requests, field activity, repair progress, delivery, and billing from one workspace.</h2>
          <p className="hero-copy">Use this dashboard to monitor queues, review exceptions, and move quickly into the part of the workflow that needs attention.</p>
        </div>
        <div className="hero-metrics">
          <div>
            <strong>{openClaims}</strong>
            <span>Open requests</span>
          </div>
          <div>
            <strong>{pendingPayments}</strong>
            <span>Pending invoices</span>
          </div>
          <div>
            <strong>{breached}</strong>
            <span>SLA breaches</span>
          </div>
        </div>
      </div>

      <div className="flow-ribbon card">
        {workflowFlow.map((step, index) => (
          <div key={step} className="flow-step">
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>

      <div className="merchant-tile-grid">
        {quickTiles.map((tile) => (
          <Link key={tile.title} to={tile.link} className={`merchant-tile ${tile.accent}`}>
            <div className="merchant-tile-icon">{tile.icon}</div>
            <div className="merchant-tile-body">
              <h3>{tile.title}</h3>
              <strong>{tile.value}</strong>
              <span>{tile.hint}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
