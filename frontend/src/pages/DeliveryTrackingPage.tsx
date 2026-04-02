import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';
import { getApiErrorMessage } from '../services/api';
import { formatDeviceCategory } from '../utils/deviceCatalog';
import { formatCurrencyInr } from '../utils/formatters';
import { formatDateTimeIn } from '../utils/formatters';
import { useRequests } from './useRequests';

export function DeliveryTrackingPage() {
  const { requests, transitionStatus, loading, error } = useRequests();
  const { showError, showSuccess } = useToast();
  const [busyId, setBusyId] = useState<number | null>(null);
  const deliveryRequests = requests.filter((request) => ['DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY'].includes(request.status));

  async function handleAction(requestId: number, targetStatus: string) {
    try {
      setBusyId(requestId);
      const remarksByStatus: Record<string, string> = {
        OUT_FOR_DELIVERY: 'Delivery started from dispatch board',
        DELIVERED: 'Delivery completed and customer handover captured',
        READY_FOR_DISPATCH: 'Delivery failed because customer was unavailable and case returned for reassignment',
      };
      const successByStatus: Record<string, { title: string; body: string }> = {
        OUT_FOR_DELIVERY: {
          title: 'Delivery started',
          body: 'Delivery marked out for delivery successfully.',
        },
        DELIVERED: {
          title: 'Delivery completed',
          body: 'Delivery marked completed successfully.',
        },
        READY_FOR_DISPATCH: {
          title: 'Delivery exception logged',
          body: 'Delivery returned to dispatch for reassignment and follow-up.',
        },
      };

      await transitionStatus(requestId, targetStatus, remarksByStatus[targetStatus] ?? 'Delivery workflow updated');
      const successMessage = successByStatus[targetStatus] ?? {
        title: 'Delivery updated',
        body: 'Delivery workflow updated successfully.',
      };
      showSuccess(
        successMessage.body,
        successMessage.title,
      );
    } catch (nextError) {
      showError(getApiErrorMessage(nextError), 'Delivery update failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="workspace-page dense-ops-page ops-workspace-page">
      <div className="page-header merchant-page-header dense-ops-titlebar">
        <div>
          <p className="eyebrow">Delivery dispatch</p>
          <h2>Delivery Tracking</h2>
          <p>Track final-mile handoff using live delivery statuses from the backend workflow.</p>
        </div>
        <div className="workspace-chip-row">
          <span className="workspace-chip">Tracked jobs: {deliveryRequests.length}</span>
          <span className="workspace-chip">Dispatch board live</span>
        </div>
      </div>

      {error ? <div className="workspace-empty"><strong>Unable to load delivery queue</strong><p>{error}</p></div> : null}
      {loading && deliveryRequests.length === 0 ? <div className="workspace-empty"><strong>Loading delivery queue</strong><p>Please wait while delivery records are fetched.</p></div> : null}

      <div className="stack-grid">
        {deliveryRequests.length > 0 ? deliveryRequests.map((request) => (
          <article className="card action-card ops-work-card" key={request.id}>
            <div className="split-row">
              <div>
                <h3>{request.requestNumber}</h3>
                <p>{request.customerName} | {formatDeviceCategory(request.deviceCategory)} | {request.deviceLabel}</p>
              </div>
              <StatusBadge status={request.status} />
            </div>
            <div className="workspace-chip-row">
              <span className="workspace-chip">Assigned agent: {request.deliveryAgent ?? 'Pending assignment'}</span>
              <span className="workspace-chip">Amount due: {formatCurrencyInr(request.invoice?.amountDue ?? 0)}</span>
            </div>
            <div className="data-grid">
              <span>Customer Phone</span><strong>{request.customerPhone}</strong>
              <span>Partner Ref</span><strong>{request.partnerReference ?? 'Direct Intake'}</strong>
              <span>Last update</span><strong>{formatDateTimeIn(request.updatedAt)}</strong>
              <span>Current owner</span><strong>{request.deliveryAgent ?? 'Dispatch queue'}</strong>
            </div>
            <div className="action-row action-row-wrap">
              <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
              {request.status === 'DELIVERY_ASSIGNED' ? <button className="primary-button" disabled={busyId === request.id} onClick={() => handleAction(request.id, 'OUT_FOR_DELIVERY')}>{busyId === request.id ? 'Saving...' : 'Mark Out For Delivery'}</button> : null}
              {request.status === 'OUT_FOR_DELIVERY' ? (
                <button className="secondary-button" disabled={busyId === request.id} onClick={() => handleAction(request.id, 'READY_FOR_DISPATCH')}>
                  {busyId === request.id ? 'Saving...' : 'Mark Delivery Failed'}
                </button>
              ) : null}
              {request.status === 'OUT_FOR_DELIVERY' ? <button className="primary-button" disabled={busyId === request.id} onClick={() => handleAction(request.id, 'DELIVERED')}>{busyId === request.id ? 'Saving...' : 'Mark Delivered'}</button> : null}
            </div>
          </article>
        )) : (!loading && !error ? <div className="workspace-empty"><strong>No delivery records available</strong><p>Requests in dispatch or delivery stages will appear here.</p></div> : null)}
      </div>
    </section>
  );
}
