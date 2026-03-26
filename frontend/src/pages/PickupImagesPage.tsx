import { Link } from 'react-router-dom';
import { useRequests } from './useRequests';

export function PickupImagesPage() {
  const { requests, loading, error } = useRequests();
  const attachments = requests
    .flatMap((request) => request.attachments.map((attachment) => ({ ...attachment, requestId: request.id, requestNumber: request.requestNumber })))
    .filter((attachment) => attachment.attachmentType.startsWith('PICKUP_IMAGE_'));

  return (
    <section className="workspace-page">
      <div className="page-header merchant-page-header">
        <div>
          <p className="eyebrow">Pickup inspection</p>
          <h2>Pickup Evidence Gallery</h2>
          <p>Review real pickup evidence uploaded against service requests.</p>
        </div>
      </div>

      {error ? <div className="workspace-empty"><strong>Unable to load pickup evidence</strong><p>{error}</p></div> : null}
      {loading && attachments.length === 0 ? <div className="workspace-empty"><strong>Loading pickup evidence</strong><p>Please wait while images are fetched.</p></div> : null}

      <div className="gallery-grid">
        {attachments.length > 0 ? attachments.map((attachment) => (
          <article className="card image-card" key={attachment.id}>
            <a href={attachment.signedUrl} target="_blank" rel="noreferrer" className="workspace-link compact-links">
              <strong>{attachment.attachmentType.replace('PICKUP_IMAGE_', '').replaceAll('_', ' ')}</strong>
              <span>{attachment.fileName}</span>
            </a>
            <small>{attachment.requestNumber}</small>
            <Link className="secondary-button" to={`/requests/${attachment.requestId}`}>Open request</Link>
          </article>
        )) : (!loading && !error ? <div className="workspace-empty"><strong>No pickup evidence available</strong><p>Pickup images uploaded through request details will appear here.</p></div> : null)}
      </div>
    </section>
  );
}
