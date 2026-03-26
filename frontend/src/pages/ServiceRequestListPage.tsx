import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { useRequests } from './useRequests';

export function ServiceRequestListPage() {
  const { requests } = useRequests();
  const openRequests = requests.filter((request) => request.status !== 'CLOSED').length;
  const overdueRequests = requests.filter((request) => request.slaBreached).length;
  const totalDue = requests.reduce((sum, request) => sum + (request.invoice?.amountDue ?? 0), 0);

  return (
    <section className="workspace-page">
      <div className="page-header merchant-page-header">
        <div>
          <p className="eyebrow">Service requests</p>
          <h2>Request Queue</h2>
          <p>View active service requests, track status, review SLA due dates, and open detailed records.</p>
        </div>
      </div>

      <div className="summary-grid">
        <article className="summary-stat">
          <span>Total requests</span>
          <strong>{requests.length}</strong>
          <small>All requests available in the current environment.</small>
        </article>
        <article className="summary-stat">
          <span>Open requests</span>
          <strong>{openRequests}</strong>
          <small>Requests that still need operational action.</small>
        </article>
        <article className="summary-stat">
          <span>SLA breaches</span>
          <strong>{overdueRequests}</strong>
          <small>Requests already beyond the expected service timeline.</small>
        </article>
        <article className="summary-stat">
          <span>Total amount due</span>
          <strong>AED {totalDue}</strong>
          <small>Outstanding invoice value across visible requests.</small>
        </article>
      </div>

      <div className="claims-table-shell card">
        <div className="claims-table-head claims-table-row">
          <span>Request</span>
          <span>Merchant</span>
          <span>Partner Ref</span>
          <span>IMEI</span>
          <span>Status</span>
          <span>SLA Due</span>
          <span>Amount Due</span>
        </div>

        {requests.map((row) => (
          <div key={row.id} className="claims-table-row claims-table-body-row">
            <span><Link to={`/requests/${row.id}`}>{row.requestNumber}</Link></span>
            <span>{row.tenantCode}</span>
            <span>{row.partnerReference ?? 'Direct'}</span>
            <span>{row.imeiValidationStatus}</span>
            <span><StatusBadge status={row.status} /></span>
            <span>{new Date(row.slaDeadlineAt).toLocaleDateString()}</span>
            <span>{row.invoice ? `AED ${row.invoice.amountDue}` : 'Pending invoice'}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
