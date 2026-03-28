import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';
import { getApiErrorMessage } from '../services/api';
import { formatDeviceCategory } from '../utils/deviceCatalog';
import { useRequests } from './useRequests';

function countAttachments(attachmentTypes: string[], prefix: string) {
  return attachmentTypes.filter((type) => type.startsWith(prefix)).length;
}

export function CashlessApprovalPage() {
  const { requests, approveEstimate, transitionStatus } = useRequests();
  const { showError, showSuccess } = useToast();
  const [remarksById, setRemarksById] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [messageById, setMessageById] = useState<Record<number, string>>({});

  const cashlessQueue = useMemo(
    () => requests.filter((request) => ['ESTIMATE_PREPARED', 'CASHLESS_PENDING_APPROVAL', 'CASHLESS_REVISION_REQUIRED', 'CASHLESS_APPROVED'].includes(request.status)),
    [requests],
  );

  async function handleMoveToReview(requestId: number) {
    try {
      setBusyId(requestId);
      await transitionStatus(requestId, 'CASHLESS_PENDING_APPROVAL', remarksById[requestId] ?? 'Cashless evidence reviewed');
      setMessageById((current) => ({ ...current, [requestId]: 'Case moved to cashless review.' }));
      showSuccess('Case moved into cashless review successfully.', 'Cashless review updated');
    } catch (error) {
      const nextMessage = getApiErrorMessage(error);
      setMessageById((current) => ({ ...current, [requestId]: nextMessage }));
      showError(nextMessage, 'Cashless review update failed');
    } finally {
      setBusyId(null);
    }
  }

  async function handleApprove(requestId: number) {
    try {
      setBusyId(requestId);
      await approveEstimate(requestId, remarksById[requestId] ?? 'Cashless approval completed');
      setMessageById((current) => ({ ...current, [requestId]: 'Cashless approval saved.' }));
      showSuccess('Cashless approval saved successfully.', 'Cashless approved');
    } catch (error) {
      const nextMessage = getApiErrorMessage(error);
      setMessageById((current) => ({ ...current, [requestId]: nextMessage }));
      showError(nextMessage, 'Cashless approval failed');
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevision(requestId: number) {
    try {
      setBusyId(requestId);
      await transitionStatus(requestId, 'CASHLESS_REVISION_REQUIRED', remarksById[requestId] ?? 'Additional evidence is required');
      setMessageById((current) => ({ ...current, [requestId]: 'Revision request sent for additional evidence.' }));
      showSuccess('Revision request sent successfully.', 'Cashless revision requested');
    } catch (error) {
      const nextMessage = getApiErrorMessage(error);
      setMessageById((current) => ({ ...current, [requestId]: nextMessage }));
      showError(nextMessage, 'Cashless revision failed');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(requestId: number) {
    try {
      setBusyId(requestId);
      await transitionStatus(requestId, 'CASHLESS_REJECTED', remarksById[requestId] ?? 'Cashless request rejected');
      setMessageById((current) => ({ ...current, [requestId]: 'Cashless request rejected.' }));
      showSuccess('Cashless request rejected successfully.', 'Cashless rejected');
    } catch (error) {
      const nextMessage = getApiErrorMessage(error);
      setMessageById((current) => ({ ...current, [requestId]: nextMessage }));
      showError(nextMessage, 'Cashless reject failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="workspace-page">
      <div className="page-header merchant-page-header">
        <div>
          <p className="eyebrow">Cashless module</p>
          <h2>Cashless Approval Queue</h2>
          <p>Review estimate cases, verify the required 6 + 4 evidence set, and approve, reject, or request revised evidence from the same queue.</p>
        </div>
      </div>

      <div className="summary-grid">
        <article className="summary-stat">
          <span>Queue size</span>
          <strong>{cashlessQueue.length}</strong>
          <small>Requests currently active in cashless review.</small>
        </article>
        <article className="summary-stat">
          <span>Ready for approval</span>
          <strong>{cashlessQueue.filter((request) => {
            const types = request.attachments.map((attachment) => attachment.attachmentType);
            return countAttachments(types, 'CASHLESS_DEVICE_IMAGE_') >= 6 && countAttachments(types, 'CASHLESS_DAMAGE_IMAGE_') >= 4;
          }).length}</strong>
          <small>Requests with the full 6 + 4 evidence set uploaded.</small>
        </article>
        <article className="summary-stat">
          <span>Revision required</span>
          <strong>{cashlessQueue.filter((request) => request.status === 'CASHLESS_REVISION_REQUIRED').length}</strong>
          <small>Cases waiting for revised evidence before approval can continue.</small>
        </article>
      </div>

      <div className="stack-grid">
        {cashlessQueue.length > 0 ? cashlessQueue.map((request) => {
          const attachmentTypes = request.attachments.map((attachment) => attachment.attachmentType);
          const devicePhotos = countAttachments(attachmentTypes, 'CASHLESS_DEVICE_IMAGE_');
          const damagePhotos = countAttachments(attachmentTypes, 'CASHLESS_DAMAGE_IMAGE_');
          const ready = devicePhotos >= 6 && damagePhotos >= 4;
          const remarks = remarksById[request.id] ?? '';
          const busy = busyId === request.id;

          return (
            <article key={request.id} className="card action-card">
              <div className="split-row">
                <div>
                  <h3>{request.requestNumber}</h3>
                  <p>{request.customerName} | {formatDeviceCategory(request.deviceCategory)} | {request.deviceLabel}</p>
                </div>
                <StatusBadge status={request.status} />
              </div>

              <div className="summary-grid">
                <article className="summary-stat compact-stat">
                  <span>Device photos</span>
                  <strong>{devicePhotos}/6</strong>
                  <small>Device-angle evidence for cashless review.</small>
                </article>
                <article className="summary-stat compact-stat">
                  <span>Damage photos</span>
                  <strong>{damagePhotos}/4</strong>
                  <small>Damage close-up evidence for cashless review.</small>
                </article>
                <article className="summary-stat compact-stat">
                  <span>Readiness</span>
                  <strong>{ready ? 'Ready' : 'Pending'}</strong>
                  <small>{ready ? 'Evidence set is complete.' : 'More evidence is required before approval.'}</small>
                </article>
              </div>

              <label className="action-field">
                <span>Remarks</span>
                <textarea
                  value={remarks}
                  onChange={(event) => setRemarksById((current) => ({ ...current, [request.id]: event.target.value }))}
                  placeholder="Add approval notes, revision points, or rejection reason"
                />
              </label>

              <div className="action-row action-row-wrap">
                <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
                {request.status === 'ESTIMATE_PREPARED' ? (
                  <button className="primary-button" disabled={!ready || busy} onClick={() => handleMoveToReview(request.id)}>
                    {busy ? 'Saving...' : 'Move To Cashless Review'}
                  </button>
                ) : request.status === 'CASHLESS_PENDING_APPROVAL' ? (
                  <>
                    <button className="primary-button" disabled={!ready || busy} onClick={() => handleApprove(request.id)}>
                      {busy ? 'Saving...' : 'Approve Cashless'}
                    </button>
                    <button className="secondary-button" disabled={busy} onClick={() => handleRevision(request.id)}>
                      {busy ? 'Saving...' : 'Request Revision'}
                    </button>
                    <button className="secondary-button danger-button" disabled={busy} onClick={() => handleReject(request.id)}>
                      {busy ? 'Saving...' : 'Reject'}
                    </button>
                  </>
                ) : request.status === 'CASHLESS_REVISION_REQUIRED' ? (
                  <button className="primary-button" disabled={!ready || busy} onClick={() => handleMoveToReview(request.id)}>
                    {busy ? 'Saving...' : 'Re-submit To Review'}
                  </button>
                ) : (
                  <span className="ok-badge">Cashless approved</span>
                )}
              </div>

              <small className="action-message">
                {messageById[request.id] ?? (request.status === 'CASHLESS_REVISION_REQUIRED'
                  ? 'This case needs revised evidence before it can move back into approval.'
                  : ready
                    ? 'This case is ready for the next cashless step.'
                    : 'Open the request and complete the missing evidence slots.')}
              </small>
            </article>
          );
        }) : (
          <div className="workspace-empty">
            <strong>No cashless cases in queue</strong>
            <p>When requests reach estimate or cashless review stages, they will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
}
