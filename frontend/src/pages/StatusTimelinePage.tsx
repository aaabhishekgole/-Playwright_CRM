import { Timeline } from '../components/Timeline';
import { useRequests } from './useRequests';

export function StatusTimelinePage() {
  const { requests } = useRequests();
  return (
    <section>
      <div className="page-header">
        <div>
          <p className="eyebrow">Workflow progress</p>
          <h2>Cross-request status audit</h2>
        </div>
      </div>
      <div className="stack-grid">
        {requests.map((request) => (
          <article className="card" key={request.id}>
            <h3>{request.requestNumber}</h3>
            <Timeline items={request.timeline} />
          </article>
        ))}
      </div>
    </section>
  );
}
