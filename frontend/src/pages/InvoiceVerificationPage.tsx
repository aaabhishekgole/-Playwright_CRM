import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';
import {
  approveClaimInvoice,
  fetchClaims,
  getApiErrorMessage,
  rejectClaimInvoice,
} from '../services/api';
import type { Claim } from '../types/models';

function fmt(amount: number | null | undefined) {
  return amount != null ? `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
}

export function InvoiceVerificationPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [remarksById, setRemarksById] = useState<Record<number, string>>({});
  const [rejectionById, setRejectionById] = useState<Record<number, string>>({});
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    setLoading(true);
    fetchClaims('INVOICE_SUBMITTED')
      .then(setClaims)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(claim: Claim) {
    setBusyId(claim.id);
    try {
      const updated = await approveClaimInvoice(claim.id, { remarks: remarksById[claim.id] });
      setClaims((prev) => prev.map((c) => (c.id === claim.id ? updated : c)));
      showSuccess(`Invoice approved for claim ${claim.claimNumber}.`);
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(claim: Claim) {
    const reason = rejectionById[claim.id] ?? '';
    if (!reason.trim()) {
      showError('Rejection reason is required.');
      return;
    }
    setBusyId(claim.id);
    try {
      const updated = await rejectClaimInvoice(claim.id, {
        rejectionReason: reason,
        remarks: remarksById[claim.id],
      });
      setClaims((prev) => prev.map((c) => (c.id === claim.id ? updated : c)));
      showSuccess(`Invoice rejected for claim ${claim.claimNumber}.`);
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const pending = claims.filter((c) => c.claimStatus === 'INVOICE_SUBMITTED');
  const adminRequired = pending.filter((c) => c.invoiceVerification?.adminApprovalRequired);

  return (
    <section className="workspace-page">
      <div className="page-header merchant-page-header">
        <div>
          <p className="eyebrow">Invoice Verification</p>
          <h2>Invoice Approval Queue</h2>
          <p>Review submitted repair invoices, verify amounts against approved limits, and approve or reject.</p>
        </div>
      </div>

      <div className="summary-grid">
        <article className="summary-stat">
          <span>Pending Review</span>
          <strong>{pending.length}</strong>
          <small>Invoices awaiting approval.</small>
        </article>
        <article className="summary-stat">
          <span>Admin Approval Required</span>
          <strong>{adminRequired.length}</strong>
          <small>Invoices exceeding 10% threshold.</small>
        </article>
      </div>

      {error && <div className="workspace-empty"><strong>Error loading invoices</strong><p>{error}</p></div>}
      {loading && <div className="workspace-empty"><strong>Loading invoices…</strong></div>}

      {!loading && pending.length === 0 && !error && (
        <div className="workspace-empty">
          <strong>No invoices pending verification</strong>
          <p>When invoices are submitted after repair, they will appear here.</p>
        </div>
      )}

      <div className="stack-grid">
        {pending.map((claim) => {
          const inv = claim.invoiceVerification;
          const busy = busyId === claim.id;

          return (
            <article key={claim.id} className="card action-card">
              <div className="split-row">
                <div>
                  <h3>{claim.claimNumber}</h3>
                  <p>{claim.customerName} | {claim.deviceLabel}</p>
                </div>
                <StatusBadge status={claim.claimStatus} />
              </div>

              {inv && (
                <div className="summary-grid">
                  <article className="summary-stat compact-stat">
                    <span>Invoice Amount</span>
                    <strong>{fmt(inv.invoiceAmount)}</strong>
                  </article>
                  <article className="summary-stat compact-stat">
                    <span>Approved Amount</span>
                    <strong>{fmt(inv.approvedAmount)}</strong>
                  </article>
                  <article className="summary-stat compact-stat">
                    <span>Excess Amount</span>
                    <strong style={{ color: (inv.excessAmount ?? 0) > 0 ? 'var(--color-warning)' : undefined }}>
                      {fmt(inv.excessAmount)}
                    </strong>
                  </article>
                  <article className="summary-stat compact-stat">
                    <span>Excess Proof</span>
                    <strong>{inv.excessProofUploaded ? 'Uploaded' : (inv.excessAmount ?? 0) > 0 ? 'Missing' : 'N/A'}</strong>
                  </article>
                  {inv.adminApprovalRequired && (
                    <article className="summary-stat compact-stat" style={{ background: 'var(--color-warning-bg)' }}>
                      <span>Admin Approval</span>
                      <strong>Required</strong>
                      <small>Exceeds 10% threshold.</small>
                    </article>
                  )}
                </div>
              )}

              <label className="action-field">
                <span>Rejection Reason</span>
                <textarea
                  value={rejectionById[claim.id] ?? ''}
                  onChange={(e) => setRejectionById((prev) => ({ ...prev, [claim.id]: e.target.value }))}
                  placeholder="Required if rejecting"
                />
              </label>

              <label className="action-field">
                <span>Remarks</span>
                <textarea
                  value={remarksById[claim.id] ?? ''}
                  onChange={(e) => setRemarksById((prev) => ({ ...prev, [claim.id]: e.target.value }))}
                  placeholder="Optional approval / rejection notes"
                />
              </label>

              <div className="action-row action-row-wrap">
                <Link className="secondary-button" to={`/claims/${claim.id}`}>View Full Claim</Link>
                <button className="primary-button" disabled={busy} onClick={() => handleApprove(claim)}>
                  {busy ? 'Saving…' : 'Approve Invoice'}
                </button>
                <button
                  className="secondary-button danger-button"
                  disabled={busy}
                  onClick={() => handleReject(claim)}
                >
                  {busy ? 'Saving…' : 'Reject Invoice'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
