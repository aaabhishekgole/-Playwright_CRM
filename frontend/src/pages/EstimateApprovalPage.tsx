import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';
import { getApiErrorMessage } from '../services/api';
import { formatDeviceCategory } from '../utils/deviceCatalog';
import { useRequests } from './useRequests';

export function EstimateApprovalPage() {
  const { requests, approveEstimate, transitionStatus, loading, error } = useRequests();
  const { showError, showSuccess } = useToast();
  const estimateQueue = requests.filter((request) => request.status === 'ESTIMATE_PREPARED');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [messageById, setMessageById] = useState<Record<number, string>>({});

  async function handleApprove(requestId: number) {
    try {
      setBusyId(requestId);
      await approveEstimate(requestId, 'Estimate approved from approval desk');
      setMessageById((current) => ({ ...current, [requestId]: 'Estimate approved.' }));
      showSuccess('Estimate approved and moved forward in the workflow.', 'Estimate approved');
    } catch (nextError) {
      const nextMessage = getApiErrorMessage(nextError);
      setMessageById((current) => ({ ...current, [requestId]: nextMessage }));
      showError(nextMessage, 'Estimate approval failed');
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevision(requestId: number) {
    try {
      setBusyId(requestId);
      await transitionStatus(requestId, 'DIAGNOSIS_IN_PROGRESS', 'Estimate revision requested');
      setMessageById((current) => ({ ...current, [requestId]: 'Sent back for estimate revision.' }));
      showSuccess('Estimate sent back for revision successfully.', 'Revision requested');
    } catch (nextError) {
      const nextMessage = getApiErrorMessage(nextError);
      setMessageById((current) => ({ ...current, [requestId]: nextMessage }));
      showError(nextMessage, 'Revision request failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="workspace-page">
      <div className="page-header merchant-page-header">
        <div>
          <p className="eyebrow">Approval desk</p>
          <h2>Estimate Approval Queue</h2>
          <p>Review submitted estimates and either approve them or send them back for diagnosis revision.</p>
        </div>
      </div>

      {error ? <div className="workspace-empty"><strong>Unable to load estimates</strong><p>{error}</p></div> : null}
      {loading && estimateQueue.length === 0 ? <div className="workspace-empty"><strong>Loading estimates</strong><p>Please wait while the approval queue loads.</p></div> : null}

      <div className="stack-grid">
        {estimateQueue.length > 0 ? estimateQueue.map((request) => (
          <article className="card action-card" key={request.id}>
            <div className="split-row">
              <div>
                <h3>{request.requestNumber}</h3>
                <p>{request.customerName} | {formatDeviceCategory(request.deviceCategory)} | {request.deviceLabel}</p>
              </div>
              <StatusBadge status={request.status} />
            </div>
            <p>{request.issueDescription}</p>
            <div className="action-row action-row-wrap">
              <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
              <button className="secondary-button" disabled={busyId === request.id} onClick={() => handleRevision(request.id)}>
                {busyId === request.id ? 'Saving...' : 'Request Revision'}
              </button>
              <button className="primary-button" disabled={busyId === request.id} onClick={() => handleApprove(request.id)}>
                {busyId === request.id ? 'Saving...' : 'Approve Estimate'}
              </button>
            </div>
            <small className="action-message">{messageById[request.id] ?? 'This queue is now wired to real estimate approval and revision status transitions.'}</small>
          </article>
        )) : (!loading && !error ? <div className="workspace-empty"><strong>No estimates awaiting approval</strong><p>Requests in `ESTIMATE_PREPARED` will appear here automatically.</p></div> : null)}
      </div>
    </section>
  );
}
