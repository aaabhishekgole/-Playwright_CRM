import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';
import { fetchClaims, getApiErrorMessage } from '../services/api';
import type { Claim } from '../types/models';

const CLAIM_STATUSES = [
  { value: '', label: 'All Claims' },
  { value: 'CLAIM_SUBMITTED', label: 'Submitted' },
  { value: 'APPROVAL_PENDING', label: 'Approval Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'REUPLOAD_PENDING', label: 'Re-upload Pending' },
  { value: 'INVOICE_SUBMITTED', label: 'Invoice Submitted' },
  { value: 'INVOICE_APPROVED', label: 'Invoice Approved' },
  { value: 'INVOICE_REJECTED', label: 'Invoice Rejected' },
  { value: 'INVOICE_REUPLOAD_PENDING', label: 'Invoice Re-upload Pending' },
  { value: 'READY_FOR_INSURANCE', label: 'Ready for Insurance' },
  { value: 'SUBMITTED_TO_INSURANCE', label: 'Submitted to Insurance' },
  { value: 'CLOSED', label: 'Closed' },
];

export function ClaimsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') ?? '';
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchClaims(statusFilter || undefined)
      .then(setClaims)
      .catch((err) => {
        const msg = getApiErrorMessage(err);
        setError(msg);
        showError(msg, 'Failed to load claims');
      })
      .finally(() => setLoading(false));
  }, [statusFilter]);

  function handleStatusChange(value: string) {
    if (value) {
      setSearchParams({ status: value });
    } else {
      setSearchParams({});
    }
  }

  const counts = {
    pending: claims.filter((c) => c.claimStatus === 'APPROVAL_PENDING').length,
    approved: claims.filter((c) => c.claimStatus === 'APPROVED').length,
    reupload: claims.filter((c) => ['REUPLOAD_PENDING', 'INVOICE_REUPLOAD_PENDING'].includes(c.claimStatus)).length,
    insurance: claims.filter((c) => c.claimStatus === 'READY_FOR_INSURANCE').length,
  };

  return (
    <section className="workspace-page">
      <div className="page-header merchant-page-header">
        <div>
          <p className="eyebrow">Cashless Claims</p>
          <h2>Claims Management</h2>
          <p>View and manage all cashless claim requests across all stages of the claim lifecycle.</p>
        </div>
      </div>

      <div className="summary-grid">
        <article className="summary-stat">
          <span>Total Claims</span>
          <strong>{claims.length}</strong>
          <small>All claims in the system.</small>
        </article>
        <article className="summary-stat">
          <span>Approval Pending</span>
          <strong>{counts.pending}</strong>
          <small>Waiting for backend verification.</small>
        </article>
        <article className="summary-stat">
          <span>Approved</span>
          <strong>{counts.approved}</strong>
          <small>Claims approved for repair.</small>
        </article>
        <article className="summary-stat">
          <span>Re-upload Required</span>
          <strong>{counts.reupload}</strong>
          <small>Customer needs to re-upload documents.</small>
        </article>
        <article className="summary-stat">
          <span>Ready for Insurance</span>
          <strong>{counts.insurance}</strong>
          <small>Invoice approved, awaiting insurance submission.</small>
        </article>
      </div>

      <div className="filter-row">
        <label className="action-field" style={{ maxWidth: '280px' }}>
          <span>Filter by status</span>
          <select value={statusFilter} onChange={(e) => handleStatusChange(e.target.value)}>
            {CLAIM_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {error && <div className="workspace-empty"><strong>Error loading claims</strong><p>{error}</p></div>}
      {loading && <div className="workspace-empty"><strong>Loading claims…</strong></div>}

      {!loading && !error && claims.length === 0 && (
        <div className="workspace-empty">
          <strong>No claims found</strong>
          <p>When cashless claims are raised, they will appear here.</p>
        </div>
      )}

      {!loading && claims.length > 0 && (
        <div className="stack-grid">
          {claims.map((claim) => (
            <article key={claim.id} className="card action-card">
              <div className="split-row">
                <div>
                  <h3>{claim.claimNumber}</h3>
                  <p>{claim.customerName} | {claim.deviceLabel}</p>
                  <small>Request: {claim.requestNumber}</small>
                </div>
                <StatusBadge status={claim.claimStatus} />
              </div>

              <div className="summary-grid">
                <article className="summary-stat compact-stat">
                  <span>IMEI Verified</span>
                  <strong>{claim.imeiVerified ? 'Yes' : 'No'}</strong>
                </article>
                <article className="summary-stat compact-stat">
                  <span>Approved Amount</span>
                  <strong>{claim.approvedAmount != null ? `₹${claim.approvedAmount.toLocaleString()}` : '—'}</strong>
                </article>
                <article className="summary-stat compact-stat">
                  <span>Documents</span>
                  <strong>{claim.documents.length}</strong>
                </article>
              </div>

              {claim.rejectionReason && (
                <p className="rejection-note"><strong>Rejection reason:</strong> {claim.rejectionReason}</p>
              )}

              <div className="action-row">
                <Link className="primary-button" to={`/claims/${claim.id}`}>View Details</Link>
                <Link className="secondary-button" to={`/requests/${claim.serviceRequestId}`}>View Request</Link>
              </div>

              <small className="action-message">
                Submitted {new Date(claim.submittedAt).toLocaleDateString('en-IN')}
                {claim.reuploadAttemptCount > 0 && ` · ${claim.reuploadAttemptCount}/${claim.maxReuploadAttempts} re-upload attempts`}
                {claim.lockedForAdmin && ' · LOCKED – Admin review required'}
              </small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
