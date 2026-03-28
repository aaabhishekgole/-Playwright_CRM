import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatDeviceCategory } from '../utils/deviceCatalog';
import { formatCurrencyInr, formatDateTimeIn } from '../utils/formatters';
import { getWorkflowStageMeta } from '../utils/workflowStages';
import { useRequests } from './useRequests';

function countByPrefix(attachmentTypes: string[], prefix: string) {
  return attachmentTypes.filter((type) => type.startsWith(prefix)).length;
}

function timelineContains(request: { timeline: Array<{ remarks: string; toStatus: string }> }, patterns: string[]) {
  return request.timeline.some((entry) => {
    const haystack = `${entry.toStatus} ${entry.remarks}`.toLowerCase();
    return patterns.some((pattern) => haystack.includes(pattern));
  });
}

function hasReachedStatus(request: { status: string; timeline: Array<{ toStatus: string }> }, statuses: string[]) {
  return statuses.includes(request.status) || request.timeline.some((entry) => statuses.includes(entry.toStatus));
}

export function PickupManagementDashboardPage() {
  const { requests, loading, error } = useRequests();

  const queues = useMemo(() => {
    const newCaseRequests = requests.filter((request) => request.status === 'REQUEST_CREATED');
    const pendingPickup = requests.filter((request) => ['PICKUP_ASSIGNED', 'PICKUP_IN_PROGRESS'].includes(request.status));
    const pickedUpDevices = requests.filter((request) => countByPrefix(request.attachments.map((attachment) => attachment.attachmentType), 'PICKUP_IMAGE_') > 0);
    const pickupFailedCases = requests.filter((request) => timelineContains(request, ['pickup failed', 'failed pickup', 'pickup rescheduled']));
    const pickupHistory = requests.filter((request) => hasReachedStatus(request, ['PICKUP_COMPLETED', 'RECEIVED_AT_HUB', 'DIAGNOSIS_IN_PROGRESS', 'ESTIMATE_PREPARED', 'ESTIMATE_APPROVED', 'CASHLESS_PENDING_APPROVAL', 'CASHLESS_APPROVED', 'REPAIR_IN_PROGRESS', 'REPAIR_COMPLETED', 'READY_FOR_DISPATCH', 'DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'INVOICED', 'CLOSED']));

    return {
      newCaseRequests,
      pendingPickup,
      pickedUpDevices,
      pickupFailedCases,
      pickupHistory,
    };
  }, [requests]);

  const stageCards = [
    {
      title: 'New Case Request',
      systemStatus: 'REQUEST_CREATED',
      count: queues.newCaseRequests.length,
      description: 'Fresh claims created with customer, device, loan, and COI details before runner assignment.',
      link: '/workspace/pickup-management/assign-pickup',
      cta: 'Open Assign Pickup',
    },
    {
      title: 'Pickup Assign',
      systemStatus: 'PICKUP_ASSIGNED',
      count: queues.pendingPickup.length,
      description: 'Assigned runner jobs waiting for acceptance, schedule confirmation, and doorstep action.',
      link: '/workspace/pickup-management/pending-pickup',
      cta: 'Open Pending Pickup',
    },
    {
      title: 'Pick Up Done',
      systemStatus: 'PICKUP_COMPLETED',
      count: queues.pickedUpDevices.length,
      description: 'Collected devices with the 10-photo pickup set captured and ready for hub inward processing.',
      link: '/workspace/pickup-management/picked-up-devices',
      cta: 'Open Picked Up Devices',
    },
    {
      title: 'Pickup History',
      systemStatus: 'POST_PICKUP_FLOW',
      count: queues.pickupHistory.length,
      description: 'Completed pickup records that already moved into hub, service-center, or downstream stages.',
      link: '/workspace/pickup-management/pickup-history',
      cta: 'Open Pickup History',
    },
  ];

  const recentPickupCases = useMemo(
    () => requests
      .filter((request) => ['REQUEST_CREATED', 'PICKUP_ASSIGNED', 'PICKUP_IN_PROGRESS', 'PICKUP_COMPLETED'].includes(request.status) || timelineContains(request, ['pickup failed', 'pickup rescheduled']))
      .slice(0, 8),
    [requests],
  );

  const pickupExposure = useMemo(
    () => requests
      .filter((request) => ['REQUEST_CREATED', 'PICKUP_ASSIGNED', 'PICKUP_IN_PROGRESS', 'PICKUP_COMPLETED'].includes(request.status))
      .reduce((sum, request) => sum + (request.invoice?.amountDue ?? 0), 0),
    [requests],
  );

  return (
    <section className="workspace-page">
      <div className="page-header merchant-page-header">
        <div>
          <p className="eyebrow">Pickup Management</p>
          <h2>Pickup Dashboard</h2>
          <p>Live pickup intake, runner assignment, doorstep execution, and pickup evidence visibility in one board.</p>
        </div>
        <div className="workspace-chip-row">
          <span className="workspace-chip">Live pickup section</span>
          <span className="workspace-chip">Runner readiness</span>
        </div>
      </div>

      <article className="card workflow-playbook pickup-dashboard-hero">
        <div className="split-row">
          <div>
            <p className="eyebrow">Inner Flow</p>
            <h3>Pickup Lifecycle From New Case Request To Pick Up Done</h3>
          </div>
          <span className="workspace-chip">REQUEST_CREATED live stage</span>
        </div>
        <div className="workflow-step-list">
          <div className="workflow-step">
            <span>1</span>
            <p><strong>New Case Request</strong><br />System status: <code>REQUEST_CREATED</code>. Back-end team captures customer, device, loan, and COI details.</p>
          </div>
          <div className="workflow-step">
            <span>2</span>
            <p><strong>Pickup Assign</strong><br />A pickup runner is selected, and the portal link is shared over SMS and WhatsApp to the runner.</p>
          </div>
          <div className="workflow-step">
            <span>3</span>
            <p><strong>Runner Action</strong><br />Runner accepts the task, customer and admin are notified, and the runner captures 10 required device photos plus optional extras.</p>
          </div>
          <div className="workflow-step">
            <span>4</span>
            <p><strong>Pick Up Done</strong><br />Pickup is completed and the device becomes ready for inward and hub operations.</p>
          </div>
        </div>
      </article>

      <div className="summary-grid">
        <article className="summary-stat">
          <span>New Case Requests</span>
          <strong>{queues.newCaseRequests.length}</strong>
          <small>Claims currently sitting in <code>REQUEST_CREATED</code> and awaiting pickup assignment.</small>
        </article>
        <article className="summary-stat">
          <span>Runner Queue</span>
          <strong>{queues.pendingPickup.length}</strong>
          <small>Assigned pickup jobs waiting for acceptance or completion in the field.</small>
        </article>
        <article className="summary-stat">
          <span>Evidence Sets</span>
          <strong>{queues.pickedUpDevices.length}</strong>
          <small>Requests that already contain pickup evidence and can be tracked for inward processing.</small>
        </article>
        <article className="summary-stat">
          <span>Pickup Failed</span>
          <strong>{queues.pickupFailedCases.length}</strong>
          <small>Cases with reschedule or failed doorstep attempts recorded in the live timeline.</small>
        </article>
        <article className="summary-stat">
          <span>Pickup Exposure</span>
          <strong>{formatCurrencyInr(pickupExposure)}</strong>
          <small>Outstanding billing value still tied to cases inside the pickup operational window.</small>
        </article>
      </div>

      {error ? <div className="workspace-empty"><strong>Unable to load pickup dashboard</strong><p>{error}</p></div> : null}
      {loading && requests.length === 0 ? <div className="workspace-empty"><strong>Loading pickup dashboard</strong><p>Please wait while the live pickup queues are fetched.</p></div> : null}

      <div className="pickup-stage-grid">
        {stageCards.map((card) => (
          <article className="card pickup-stage-card" key={card.title}>
            <div className="workspace-chip-row">
              <span className="workspace-chip">{card.title}</span>
              <span className="workspace-chip">{card.systemStatus}</span>
            </div>
            <strong>{card.count}</strong>
            <p>{card.description}</p>
            <Link className="secondary-button" to={card.link}>{card.cta}</Link>
          </article>
        ))}
      </div>

      <div className="workspace-grid">
        <article className="card workspace-panel workspace-panel-wide">
          <div className="split-row workspace-panel-head">
            <div>
              <h3>Pickup Worklist</h3>
              <p>Latest live pickup cases across new request, assigned runner, evidence, and failed-attempt stages.</p>
            </div>
            <div className="workspace-chip-row">
              <span className="workspace-chip">{recentPickupCases.length} visible pickup cases</span>
            </div>
          </div>

          {recentPickupCases.length > 0 ? (
            <div className="portal-table">
              <div className="portal-table-row portal-table-head">
                <span>Request</span>
                <span>Business Stage</span>
                <span>Owner</span>
                <span>Evidence</span>
                <span>Updated</span>
                <span>Action</span>
              </div>
              {recentPickupCases.map((request) => {
                const attachmentTypes = request.attachments.map((attachment) => attachment.attachmentType);
                const pickupImages = countByPrefix(attachmentTypes, 'PICKUP_IMAGE_');
                const workflowMeta = getWorkflowStageMeta(request);
                return (
                  <div className="portal-table-row portal-table-body" key={request.id}>
                    <div>
                      <strong><Link to={`/requests/${request.id}`}>{request.requestNumber}</Link></strong>
                      <small>{request.customerName} | {formatDeviceCategory(request.deviceCategory)} | {request.deviceLabel}</small>
                    </div>
                    <div>
                      <strong>{workflowMeta.label}</strong>
                      <small>{request.status}</small>
                    </div>
                    <div>{request.pickupAgent ?? workflowMeta.owner}</div>
                    <div>{pickupImages}/10 photos</div>
                    <div>{formatDateTimeIn(request.updatedAt)}</div>
                    <div><Link to={request.status === 'REQUEST_CREATED' ? '/workspace/pickup-management/assign-pickup' : '/workspace/pickup-management/pending-pickup'}>Open stage</Link></div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="workspace-empty">
              <strong>No pickup records available</strong>
              <p>Create a new claim or assign a pickup runner to populate this dashboard.</p>
            </div>
          )}
        </article>

        <article className="card workspace-panel">
          <div className="workspace-panel-head">
            <h3>Pickup Shortcuts</h3>
            <p>Jump into the exact pickup board needed for the next step.</p>
          </div>
          <div className="workspace-links compact-links">
            <Link className="workspace-link" to="/workspace/pickup-management/assign-pickup">
              <strong>Assign Pickup</strong>
              <span>Work on `REQUEST_CREATED` claims.</span>
            </Link>
            <Link className="workspace-link" to="/workspace/pickup-management/pending-pickup">
              <strong>Pending Pickup</strong>
              <span>Runner acceptance and completion queue.</span>
            </Link>
            <Link className="workspace-link" to="/workspace/pickup-management/picked-up-devices">
              <strong>Picked Up Devices</strong>
              <span>Inspect evidence-backed collected devices.</span>
            </Link>
            <Link className="workspace-link" to="/workspace/pickup-management/pickup-failed-cases">
              <strong>Pickup Failed Cases</strong>
              <span>Reschedules and failed attempt handling.</span>
            </Link>
            <Link className="workspace-link" to="/workspace/pickup-management/pickup-history">
              <strong>Pickup History</strong>
              <span>Completed pickup archive and downstream references.</span>
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
