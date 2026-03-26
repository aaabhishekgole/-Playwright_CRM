import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRequests } from './useRequests';

export function PaymentReconciliationPage() {
  const { requests, reconcilePayment } = useRequests();
  const [statusByPaymentId, setStatusByPaymentId] = useState<Record<number, string>>({});
  const [remarksByPaymentId, setRemarksByPaymentId] = useState<Record<number, string>>({});
  const [busyPaymentId, setBusyPaymentId] = useState<number | null>(null);
  const [messageByPaymentId, setMessageByPaymentId] = useState<Record<number, string>>({});

  const rows = useMemo(
    () => requests.flatMap((request) =>
      request.payments.map((payment) => ({
        requestId: request.id,
        requestNumber: request.requestNumber,
        customerName: request.customerName,
        invoiceNumber: request.invoice?.invoiceNumber ?? 'Pending invoice',
        payment,
      })),
    ),
    [requests],
  );

  async function handleSave(row: (typeof rows)[number]) {
    const nextStatus = statusByPaymentId[row.payment.id] ?? row.payment.reconciliationStatus ?? 'PENDING';
    const nextRemarks = remarksByPaymentId[row.payment.id] ?? row.payment.reconciliationRemarks ?? '';

    try {
      setBusyPaymentId(row.payment.id);
      await reconcilePayment(row.requestId, row.payment.id, nextStatus, nextRemarks);
      setMessageByPaymentId((current) => ({ ...current, [row.payment.id]: 'Reconciliation updated.' }));
    } catch (error) {
      setMessageByPaymentId((current) => ({ ...current, [row.payment.id]: error instanceof Error ? error.message : 'Failed to update reconciliation' }));
    } finally {
      setBusyPaymentId(null);
    }
  }

  return (
    <section className="workspace-page">
      <div className="page-header merchant-page-header">
        <div>
          <p className="eyebrow">Billing</p>
          <h2>Payment Reconciliation</h2>
          <p>Capture reconciliation decisions, track UTR references, and close out payment-level exceptions.</p>
        </div>
      </div>

      <div className="summary-grid">
        <article className="summary-stat">
          <span>Total payments</span>
          <strong>{rows.length}</strong>
          <small>All recorded payments available for finance and MSE review.</small>
        </article>
        <article className="summary-stat">
          <span>Pending review</span>
          <strong>{rows.filter((row) => (row.payment.reconciliationStatus ?? 'PENDING') !== 'RECONCILED').length}</strong>
          <small>Payments that still need reconciliation action.</small>
        </article>
      </div>

      <div className="stack-grid">
        {rows.length > 0 ? rows.map((row) => (
          <article key={row.payment.id} className="card action-card">
            <div className="split-row">
              <div>
                <h3>{row.invoiceNumber}</h3>
                <p>{row.requestNumber} | {row.customerName}</p>
              </div>
              <span className={row.payment.reconciliationStatus === 'RECONCILED' ? 'ok-badge' : row.payment.reconciliationStatus === 'MISMATCHED' ? 'alert-badge' : 'status-badge'}>
                {row.payment.reconciliationStatus ?? 'PENDING'}
              </span>
            </div>

            <div className="data-grid">
              <span>Payment Ref</span><strong>{row.payment.paymentReference}</strong>
              <span>UTR</span><strong>{row.payment.utrNumber ?? 'Not captured'}</strong>
              <span>Method</span><strong>{row.payment.paymentMethod}</strong>
              <span>Amount</span><strong>AED {row.payment.amount}</strong>
              <span>Payment Status</span><strong>{row.payment.paymentStatus}</strong>
            </div>

            <div className="action-form-grid">
              <label className="action-field">
                <span>Reconciliation Status</span>
                <select
                  value={statusByPaymentId[row.payment.id] ?? row.payment.reconciliationStatus ?? 'PENDING'}
                  onChange={(event) => setStatusByPaymentId((current) => ({ ...current, [row.payment.id]: event.target.value }))}
                >
                  <option value="PENDING">Pending</option>
                  <option value="RECONCILED">Reconciled</option>
                  <option value="MISMATCHED">Mismatched</option>
                </select>
              </label>

              <label className="action-field">
                <span>Remarks</span>
                <textarea
                  value={remarksByPaymentId[row.payment.id] ?? row.payment.reconciliationRemarks ?? ''}
                  onChange={(event) => setRemarksByPaymentId((current) => ({ ...current, [row.payment.id]: event.target.value }))}
                  placeholder="Add reconciliation notes, mismatch reason, or follow-up context"
                />
              </label>
            </div>

            <div className="action-row">
              <Link className="secondary-button" to={`/requests/${row.requestId}`}>Open request</Link>
              <button className="primary-button" disabled={busyPaymentId === row.payment.id} onClick={() => handleSave(row)}>
                {busyPaymentId === row.payment.id ? 'Saving...' : 'Save Reconciliation'}
              </button>
            </div>

            <small className="action-message">{messageByPaymentId[row.payment.id] ?? (row.payment.reconciledAt ? `Reconciled on ${new Date(row.payment.reconciledAt).toLocaleString()}` : 'Awaiting reconciliation update.')}</small>
          </article>
        )) : (
          <div className="workspace-empty">
            <strong>No payments recorded</strong>
            <p>Recorded payments with UTR and reconciliation details will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
}
