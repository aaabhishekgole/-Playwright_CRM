import type { TimelineItem } from '../types/models';
import { formatDateTimeIn } from '../utils/formatters';

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="timeline">
      {items.map((item, index) => (
        <div className="timeline-item" key={`${item.toStatus}-${index}`}>
          <div className="timeline-marker" />
          <div>
            <strong>{item.toStatus.replace(/_/g, ' ')}</strong>
            <p>{item.remarks}</p>
            <small>{item.changedBy} on {formatDateTimeIn(item.changedAt)}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
