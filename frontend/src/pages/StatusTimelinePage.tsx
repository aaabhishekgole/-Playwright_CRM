import { Timeline } from '../components/Timeline';
import { useRequests } from './useRequests';

type StatusTimelinePageProps = {
  title?: string;
  description?: string;
};

export function StatusTimelinePage({
  title = 'Cross-request status audit',
  description = 'Review request timeline changes across the portal.',
}: StatusTimelinePageProps) {
  const { requests } = useRequests();
  return (
    <section>
      <div className="page-header">
        <div>
          <p className="eyebrow">Workflow progress</p>
          <h2>{title}</h2>
          <p>{description}</p>
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
