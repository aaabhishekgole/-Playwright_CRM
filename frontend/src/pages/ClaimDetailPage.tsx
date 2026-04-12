import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';
import {
  approveClaim,
  approveClaimInvoice,
  closeClaim,
  fetchClaimById,
  getApiErrorMessage,
  rejectClaim,
  rejectClaimInvoice,
  submitClaimForApproval,
  submitClaimInvoice,
  submitClaimToInsurance,
  uploadClaimDocument,
} from '../services/api';
import type { Claim } from '../types/models';

const DOCUMENT_TYPES = [
  { value: 'CLAIM_DEVICE_PHOTO_1', label: 'Device Photo 1 (Front)' },
  { value: 'CLAIM_DEVICE_PHOTO_2', label: 'Device Photo 2 (Back)' },
  { value: 'CLAIM_DEVICE_PHOTO_3', label: 'Device Photo 3 (Left)' },
  { value: 'CLAIM_DEVICE_PHOTO_4', label: 'Device Photo 4 (Right)' },
  { value: 'CLAIM_DEVICE_PHOTO_5', label: 'Device Photo 5 (Top)' },
  { value: 'CLAIM_DEVICE_PHOTO_6', label: 'Device Photo 6 (Bottom)' },
  { value: 'PURCHASE_INVOICE', label: 'Purchase Invoice' },
  { value: 'REPAIR_INVOICE', label: 'Repair Invoice' },
  { value: 'EXCESS_PAYMENT_PROOF', label: 'Excess Payment Proof' },
  { value: 'INSURANCE_CLAIM_FILE', label: 'Insurance Claim File' },
  { value: 'INSURANCE_APPROVAL_DOC', label: 'Insurance Approval Document' },
  { value: 'OTHER', label: 'Other' },
];

function fmt(amount: number | null | undefined) {
  return amount != null ? `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
}

export function ClaimDetailPage() {
  const { claimId } = useParams<{ claimId: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  // Form state
  const [approvedAmount, setApprovedAmount] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [excessPayment, setExcessPayment] = useState(false);
  const [insuranceNotes, setInsuranceNotes] = useState('');
  const [uploadDocType, setUploadDocType] = useState(DOCUMENT_TYPES[0].value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!claimId) return;
    setLoading(true);
    fetchClaimById(Number(claimId))
      .then(setClaim)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [claimId]);

  async function run(action: () => Promise<Claim>, successMsg: string) {
    setBusy(true);
    try {
      const updated = await action();
      setClaim(updated);
      showSuccess(successMsg);
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !claim) return;
    await run(
      () => uploadClaimDocument(claim.id, uploadDocType, file),
      'Document uploaded successfully.',
    );
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  if (loading) return <section className="workspace-page"><div className="workspace-empty"><strong>Loading claim…</strong></div></section>;
  if (error || !claim) return <section className="workspace-page"><div className="workspace-empty"><strong>Claim not found</strong><p>{error}</p></div></section>;

  const canSubmitForApproval = ['CLAIM_SUBMITTED', 'REUPLOAD_PENDING'].includes(claim.claimStatus);
  const canApproveReject = claim.claimStatus === 'APPROVAL_PENDING';
  const canSubmitInvoice = claim.claimStatus === 'APPROVED';
  const canApproveRejectInvoice = claim.claimStatus === 'INVOICE_SUBMITTED';
  const canSubmitToInsurance = claim.claimStatus === 'READY_FOR_INSURANCE';
  const canClose = claim.claimStatus === 'SUBMITTED_TO_INSURANCE';

  const devicePhotos = claim.documents.filter((d) => d.documentType.startsWith('CLAIM_DEVICE_PHOTO_'));
  const hasAllPhotos = devicePhotos.length >= 6;
  const hasPurchaseInvoice = claim.documents.some((d) => d.documentType === 'PURCHASE_INVOICE');

  return (
    <section className="workspace-page">
      <div className="page-header merchant-page-header">
        <div>
          <p className="eyebrow">Cashless Claim</p>
          <h2>{claim.claimNumber}</h2>
          <p>{claim.customerName} · {claim.deviceLabel} · Request: <Link to={`/requests/${claim.serviceRequestId}`}>{claim.requestNumber}</Link></p>
        </div>
        <StatusBadge status={claim.claimStatus} />
      </div>

      {claim.lockedForAdmin && (
        <div className="workspace-empty" style={{ background: 'var(--color-danger-bg)', marginBottom: '1rem' }}>
          <strong>Claim Locked</strong>
          <p>Maximum re-upload attempts reached. Admin review required before further action.</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="summary-grid">
        <article className="summary-stat">
          <span>Approved Amount</span>
          <strong>{fmt(claim.approvedAmount)}</strong>
        </article>
        <article className="summary-stat">
          <span>IMEI Verified</span>
          <strong>{claim.imeiVerified ? 'Yes' : 'Pending'}</strong>
          <small>{claim.imeiVerificationNote ?? '—'}</small>
        </article>
        <article className="summary-stat">
          <span>Device Photos</span>
          <strong>{devicePhotos.length}/6</strong>
          <small>{hasAllPhotos ? 'All 6 photos uploaded' : 'More photos required'}</small>
        </article>
        <article className="summary-stat">
          <span>Purchase Invoice</span>
          <strong>{hasPurchaseInvoice ? 'Uploaded' : 'Missing'}</strong>
        </article>
        {claim.reuploadAttemptCount > 0 && (
          <article className="summary-stat">
            <span>Re-upload Attempts</span>
            <strong>{claim.reuploadAttemptCount}/{claim.maxReuploadAttempts}</strong>
          </article>
        )}
      </div>

      {/* Documents */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3>Documents</h3>
        {claim.documents.length === 0
          ? <p>No documents uploaded yet.</p>
          : (
            <div className="summary-grid">
              {claim.documents.map((doc) => (
                <article key={doc.id} className="summary-stat compact-stat">
                  <span>{DOCUMENT_TYPES.find((t) => t.value === doc.documentType)?.label ?? doc.documentType}</span>
                  <strong>{doc.fileName}</strong>
                  <small>v{doc.versionNumber} · {doc.uploadedBy} · {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</small>
                </article>
              ))}
            </div>
          )}

        {/* Upload panel */}
        <div className="action-row" style={{ marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <select
            value={uploadDocType}
            onChange={(e) => setUploadDocType(e.target.value)}
            style={{ flex: '1', minWidth: '180px' }}
          >
            {DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" />
          <button className="primary-button" disabled={busy} onClick={handleUpload}>
            {busy ? 'Uploading…' : 'Upload Document'}
          </button>
        </div>
      </div>

      {/* Submit for Approval */}
      {canSubmitForApproval && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>Submit for Approval</h3>
          <p>Ensure 6 device photos and purchase invoice are uploaded before submitting.</p>
          <div className="action-row">
            <button
              className="primary-button"
              disabled={busy || !hasAllPhotos || !hasPurchaseInvoice}
              onClick={() => run(() => submitClaimForApproval(claim.id), 'Claim submitted for approval.')}
            >
              {busy ? 'Submitting…' : 'Submit for Approval'}
            </button>
          </div>
          {(!hasAllPhotos || !hasPurchaseInvoice) && (
            <small className="action-message">
              {!hasAllPhotos && 'Missing device photos. '}
              {!hasPurchaseInvoice && 'Missing purchase invoice.'}
            </small>
          )}
        </div>
      )}

      {/* Approve / Reject Claim */}
      {canApproveReject && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>Claim Verification Decision</h3>
          <div className="summary-grid">
            <label className="action-field">
              <span>IMEI / Serial Match</span>
              <select value={claim.imeiVerified ? 'true' : 'false'} disabled>
                <option value="false">Not Verified</option>
                <option value="true">Verified</option>
              </select>
            </label>
          </div>
          <label className="action-field">
            <span>Approved Amount (₹)</span>
            <input
              type="number"
              value={approvedAmount}
              onChange={(e) => setApprovedAmount(e.target.value)}
              placeholder="Enter approved amount"
            />
          </label>
          <label className="action-field">
            <span>Rejection Reason (if rejecting)</span>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Blur image / Invoice missing / IMEI mismatch"
            />
          </label>
          <label className="action-field">
            <span>Remarks</span>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks" />
          </label>
          <div className="action-row">
            <button
              className="primary-button"
              disabled={busy || !approvedAmount}
              onClick={() => run(
                () => approveClaim(claim.id, { approvedAmount: Number(approvedAmount), remarks, imeiVerified: true }),
                'Claim approved successfully.',
              )}
            >
              {busy ? 'Saving…' : 'Approve Claim'}
            </button>
            <button
              className="secondary-button danger-button"
              disabled={busy || !rejectionReason}
              onClick={() => run(
                () => rejectClaim(claim.id, { rejectionReason, remarks }),
                'Claim rejected.',
              )}
            >
              {busy ? 'Saving…' : 'Reject Claim'}
            </button>
          </div>
        </div>
      )}

      {/* Submit Invoice */}
      {canSubmitInvoice && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>Submit Repair Invoice</h3>
          <p>Upload the repair invoice document above, then submit for backend verification.</p>
          <label className="action-field">
            <span>Repair Invoice Amount (₹)</span>
            <input
              type="number"
              value={invoiceAmount}
              onChange={(e) => setInvoiceAmount(e.target.value)}
              placeholder="Enter total repair invoice amount"
            />
          </label>
          <label className="action-field" style={{ flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
            <input type="checkbox" checked={excessPayment} onChange={(e) => setExcessPayment(e.target.checked)} />
            <span>Customer paid excess amount</span>
          </label>
          {excessPayment && (
            <small className="action-message">Please upload the excess payment proof document above before submitting.</small>
          )}
          <div className="action-row">
            <button
              className="primary-button"
              disabled={busy || !invoiceAmount}
              onClick={() => run(
                () => submitClaimInvoice(claim.id, { invoiceAmount: Number(invoiceAmount), excessPaymentMade: excessPayment }),
                'Invoice submitted for verification.',
              )}
            >
              {busy ? 'Submitting…' : 'Submit Invoice'}
            </button>
          </div>
        </div>
      )}

      {/* Approve / Reject Invoice */}
      {canApproveRejectInvoice && claim.invoiceVerification && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>Invoice Verification</h3>
          <div className="summary-grid">
            <article className="summary-stat compact-stat">
              <span>Invoice Amount</span>
              <strong>{fmt(claim.invoiceVerification.invoiceAmount)}</strong>
            </article>
            <article className="summary-stat compact-stat">
              <span>Approved Amount</span>
              <strong>{fmt(claim.invoiceVerification.approvedAmount)}</strong>
            </article>
            <article className="summary-stat compact-stat">
              <span>Excess Amount</span>
              <strong>{fmt(claim.invoiceVerification.excessAmount)}</strong>
            </article>
            {claim.invoiceVerification.approvalThresholdBreached && (
              <article className="summary-stat compact-stat">
                <span>Admin Approval</span>
                <strong>Required</strong>
                <small>Invoice exceeds 10% of approved amount.</small>
              </article>
            )}
          </div>
          <label className="action-field">
            <span>Rejection Reason (if rejecting)</span>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejecting invoice"
            />
          </label>
          <label className="action-field">
            <span>Remarks</span>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks" />
          </label>
          <div className="action-row">
            <button
              className="primary-button"
              disabled={busy}
              onClick={() => run(
                () => approveClaimInvoice(claim.id, { remarks }),
                'Invoice approved.',
              )}
            >
              {busy ? 'Saving…' : 'Approve Invoice'}
            </button>
            <button
              className="secondary-button danger-button"
              disabled={busy || !rejectionReason}
              onClick={() => run(
                () => rejectClaimInvoice(claim.id, { rejectionReason, remarks }),
                'Invoice rejected.',
              )}
            >
              {busy ? 'Saving…' : 'Reject Invoice'}
            </button>
          </div>
        </div>
      )}

      {/* Submit to Insurance */}
      {canSubmitToInsurance && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>Submit to Insurance</h3>
          <p>Upload all insurance documents above (claim file, invoice, photos, approval details), then submit.</p>
          <label className="action-field">
            <span>Notes</span>
            <textarea
              value={insuranceNotes}
              onChange={(e) => setInsuranceNotes(e.target.value)}
              placeholder="Notes for insurance submission"
            />
          </label>
          <div className="action-row">
            <button
              className="primary-button"
              disabled={busy}
              onClick={() => run(
                () => submitClaimToInsurance(claim.id, { notes: insuranceNotes }),
                'Documents submitted to insurance company.',
              )}
            >
              {busy ? 'Submitting…' : 'Submit to Insurance'}
            </button>
          </div>
        </div>
      )}

      {/* Close Claim */}
      {canClose && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>Close Claim</h3>
          <p>Confirm device delivery to customer (OTP / signature obtained) and close the claim.</p>
          <label className="action-field">
            <span>Closure Remarks</span>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Device delivered, OTP confirmed" />
          </label>
          <div className="action-row">
            <button
              className="primary-button"
              disabled={busy}
              onClick={() => run(
                () => closeClaim(claim.id, { remarks }),
                'Claim closed successfully.',
              )}
            >
              {busy ? 'Closing…' : 'Close Claim'}
            </button>
          </div>
        </div>
      )}

      {/* Insurance Submission Status */}
      {claim.insuranceSubmission && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>Insurance Submission</h3>
          <div className="summary-grid">
            <article className="summary-stat compact-stat">
              <span>Status</span>
              <strong>{claim.insuranceSubmission.subStatus.replace(/_/g, ' ')}</strong>
            </article>
            {claim.insuranceSubmission.submittedBy && (
              <article className="summary-stat compact-stat">
                <span>Submitted by</span>
                <strong>{claim.insuranceSubmission.submittedBy}</strong>
              </article>
            )}
            {claim.insuranceSubmission.submittedAt && (
              <article className="summary-stat compact-stat">
                <span>Submitted at</span>
                <strong>{new Date(claim.insuranceSubmission.submittedAt).toLocaleDateString('en-IN')}</strong>
              </article>
            )}
          </div>
          {claim.insuranceSubmission.notes && <p>{claim.insuranceSubmission.notes}</p>}
        </div>
      )}

      {/* Approval Timeline */}
      {claim.approvalLogs.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>Claim Timeline</h3>
          <div className="stack-grid">
            {claim.approvalLogs.map((log) => (
              <div key={log.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <div className="split-row">
                  <strong>{log.action.replace(/_/g, ' ')}</strong>
                  <small>{new Date(log.actionAt).toLocaleString('en-IN')}</small>
                </div>
                <small>{log.actionBy}</small>
                {log.remarks && <p style={{ margin: '0.25rem 0 0' }}>{log.remarks}</p>}
                {log.approvedAmount != null && <p><strong>Approved: {fmt(log.approvedAmount)}</strong></p>}
                {log.rejectionReason && <p style={{ color: 'var(--color-danger)' }}>{log.rejectionReason}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
