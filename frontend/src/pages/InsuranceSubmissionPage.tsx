import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';
import { fetchClaims, getApiErrorMessage, submitClaimToInsurance } from '../services/api';
import type { Claim } from '../types/models';

export function InsuranceSubmissionPage() {
  const [readyClaims, setReadyClaims] = useState<Claim[]>([]);
  const [submittedClaims, setSubmittedClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notesById, setNotesById] = useState<Record<number, string>>({});
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchClaims('READY_FOR_INSURANCE'),
      fetchClaims('SUBMITTED_TO_INSURANCE'),
    ])
      .then(([ready, submitted]) => {
        setReadyClaims(ready);
        setSubmittedClaims(submitted);
      })
      .catch((err) => showError(getApiErrorMessage(err), 'Failed to load insurance data'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(claim: Claim) {
    setBusyId(claim.id);
    try {
      const updated = await submitClaimToInsurance(claim.id, { notes: notesById[claim.id] });
      setReadyClaims((prev) => prev.filter((c) => c.id !== claim.id));
      setSubmittedClaims((prev) => [updated, ...prev]);
      showSuccess(`Claim ${claim.claimNumber} submitted to insurance.`);
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="workspace-page">
      <div className="page-header merchant-page-header">
        <div>
          <p className="eyebrow">Insurance Submission</p>
          <h2>Insurance Portal</h2>
          <p>Submit final claim documents to the insurance company and track submission status.</p>
        </div>
      </div>

      <div className="summary-grid">
        <article className="summary-stat">
          <span>Ready for Submission</span>
          <strong>{readyClaims.length}</strong>
          <small>Claims with approved invoice waiting to be submitted.</small>
        </article>
        <article className="summary-stat">
          <span>Submitted to Insurance</span>
          <strong>{submittedClaims.length}</strong>
          <small>Claims already submitted to insurance company.</small>
        </article>
      </div>

      {loading && <div className="workspace-empty"><strong>Loading insurance data…</strong></div>}

      {/* Ready for Submission */}
      {!loading && readyClaims.length > 0 && (
        <>
          <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Ready for Submission</h3>
          <div className="stack-grid">
            {readyClaims.map((claim) => {
              const busy = busyId === claim.id;
              return (
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
                      <span>Approved Amount</span>
                      <strong>
                        {claim.approvedAmount != null
                          ? `₹${claim.approvedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </strong>
                    </article>
                    <article className="summary-stat compact-stat">
                      <span>Documents</span>
                      <strong>{claim.documents.length}</strong>
                    </article>
                    <article className="summary-stat compact-stat">
                      <span>Invoice Amount</span>
                      <strong>
                        {claim.invoiceVerification?.invoiceAmount != null
                          ? `₹${claim.invoiceVerification.invoiceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </strong>
                    </article>
                  </div>

                  <label className="action-field">
                    <span>Submission Notes</span>
                    <textarea
                      value={notesById[claim.id] ?? ''}
                      onChange={(e) => setNotesById((prev) => ({ ...prev, [claim.id]: e.target.value }))}
                      placeholder="Notes for insurance company (reference numbers, instructions, etc.)"
                    />
                  </label>

                  <div className="action-row">
                    <Link className="secondary-button" to={`/claims/${claim.id}`}>View Claim</Link>
                    <button
                      className="primary-button"
                      disabled={busy}
                      onClick={() => handleSubmit(claim)}
                    >
                      {busy ? 'Submitting…' : 'Submit to Insurance'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {!loading && readyClaims.length === 0 && (
        <div className="workspace-empty">
          <strong>No claims ready for insurance submission</strong>
          <p>Claims with approved invoices will appear here.</p>
        </div>
      )}

      {/* Already Submitted */}
      {!loading && submittedClaims.length > 0 && (
        <>
          <h3 style={{ marginTop: '2rem', marginBottom: '0.75rem' }}>Submitted to Insurance</h3>
          <div className="stack-grid">
            {submittedClaims.map((claim) => (
              <article key={claim.id} className="card">
                <div className="split-row">
                  <div>
                    <h3>{claim.claimNumber}</h3>
                    <p>{claim.customerName} | {claim.deviceLabel}</p>
                  </div>
                  <StatusBadge status={claim.claimStatus} />
                </div>
                {claim.insuranceSubmission && (
                  <div className="summary-grid">
                    <article className="summary-stat compact-stat">
                      <span>Submitted by</span>
                      <strong>{claim.insuranceSubmission.submittedBy ?? '—'}</strong>
                    </article>
                    <article className="summary-stat compact-stat">
                      <span>Submitted at</span>
                      <strong>
                        {claim.insuranceSubmission.submittedAt
                          ? new Date(claim.insuranceSubmission.submittedAt).toLocaleDateString('en-IN')
                          : '—'}
                      </strong>
                    </article>
                  </div>
                )}
                <div className="action-row">
                  <Link className="secondary-button" to={`/claims/${claim.id}`}>View Claim</Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
