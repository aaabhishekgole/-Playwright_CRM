import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { useRequests } from './useRequests';

export function DeliveryTrackingPage() {
  const { requests, transitionStatus, loading, error } = useRequests();
  const deliveryRequests = requests.filter((request) => request.status.includes('DELIVERY') || request.status === 'OUT_FOR_DELIVERY' || request.status === 'READY_FOR_DISPATCH');

  async function handleAction(requestId: number, targetStatus: string) {
    await transitionStatus(requestId, targetStatus, targetStatus === 'OUT_FOR_DELIVERY' ? 'Delivery started' : 'Delivery completed');
  }

  return (
    <section className="workspace-page">
      <div className="page-header merchant-page-header">
        <div>
          <p className="eyebrow">Delivery dispatch</p>
          <h2>Delivery Tracking</h2>
          <p>Track final-mile handoff using live delivery statuses from the backend workflow.</p>
        </div>
      </div>

      {error ? <div className="workspace-empty"><strong>Unable to load delivery queue</strong><p>{error}</p></div> : null}
      {loading && deliveryRequests.length === 0 ? <div className="workspace-empty"><strong>Loading delivery queue</strong><p>Please wait while delivery records are fetched.</p></div> : null}

      <div className="stack-grid">
        {deliveryRequests.length > 0 ? deliveryRequests.map((request) => (
          <article className="card action-card" key={request.id}>
            <div className="split-row">
              <div>
                <h3>{request.requestNumber}</h3>
                <p>{request.customerName}</p>
              </div>
              <StatusBadge status={request.status} />
            </div>
            <p>Assigned agent: {request.deliveryAgent ?? 'Pending assignment'}</p>
            <p>Last update: {new Date(request.updatedAt).toLocaleString()}</p>
            <div className="action-row action-row-wrap">
              <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
              {request.status === 'DELIVERY_ASSIGNED' ? <button className="primary-button" onClick={() => handleAction(request.id, 'OUT_FOR_DELIVERY')}>Mark Out For Delivery</button> : null}
              {request.status === 'OUT_FOR_DELIVERY' ? <button className="primary-button" onClick={() => handleAction(request.id, 'DELIVERED')}>Mark Delivered</button> : null}
            </div>
          </article>
        )) : (!loading && !error ? <div className="workspace-empty"><strong>No delivery records available</strong><p>Requests in dispatch or delivery stages will appear here.</p></div> : null)}
      </div>
    </section>
  );
}
