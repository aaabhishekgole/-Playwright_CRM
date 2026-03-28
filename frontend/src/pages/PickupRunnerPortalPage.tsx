import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { TypedEvidenceUploadPanel } from '../components/TypedEvidenceUploadPanel';
import {
  acceptRunnerPickup,
  completeRunnerPickup,
  deleteRunnerPickupAttachment,
  fetchRunnerPickupPortal,
  getApiErrorMessage,
  uploadRunnerPickupAttachment,
} from '../services/api';
import type { ServiceRequest } from '../types/models';
import { formatDeviceCategory, usesImei } from '../utils/deviceCatalog';
import { formatDateTimeIn } from '../utils/formatters';

function countByPrefix(types: string[], prefix: string) {
  return types.filter((type) => type.startsWith(prefix)).length;
}

export function PickupRunnerPortalPage() {
  const { token } = useParams();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'accept' | 'complete' | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPickupPortal() {
      if (!token) {
        if (active) {
          setError('Runner link is missing.');
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const nextRequest = await fetchRunnerPickupPortal(token);
        if (active) {
          setRequest(nextRequest);
        }
      } catch (nextError) {
        if (active) {
          setError(getApiErrorMessage(nextError));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPickupPortal();

    return () => {
      active = false;
    };
  }, [token]);

  async function handleAccept() {
    if (!token) {
      return;
    }

    try {
      setBusyAction('accept');
      const updated = await acceptRunnerPickup(token);
      setRequest(updated);
      setActionMessage('Pickup accepted successfully. Customer and admin notifications were queued.');
    } catch (nextError) {
      setActionMessage(getApiErrorMessage(nextError));
    } finally {
      setBusyAction(null);
    }
  }

  async function handleComplete() {
    if (!token) {
      return;
    }

    try {
      setBusyAction('complete');
      const updated = await completeRunnerPickup(token);
      setRequest(updated);
      setActionMessage('Pickup marked complete. Customer and admin notifications were queued.');
    } catch (nextError) {
      setActionMessage(getApiErrorMessage(nextError));
    } finally {
      setBusyAction(null);
    }
  }

  if (loading) {
    return (
      <section className="runner-portal-shell">
        <div className="runner-portal-frame">
          <div className="workspace-empty">
            <strong>Loading runner portal</strong>
            <p>Please wait while the pickup assignment is fetched from the live API.</p>
          </div>
        </div>
      </section>
    );
  }

  if (!request || error) {
    return (
      <section className="runner-portal-shell">
        <div className="runner-portal-frame">
          <div className="workspace-empty">
            <strong>Runner link unavailable</strong>
            <p>{error ?? 'The pickup assignment could not be loaded from the runner link.'}</p>
          </div>
        </div>
      </section>
    );
  }

  const attachmentTypes = request.attachments.map((attachment) => attachment.attachmentType);
  const pickupPhotos = request.pickup?.uploadedRequiredPhotoCount ?? countByPrefix(attachmentTypes, 'PICKUP_IMAGE_');
  const pickupExtraPhotos = request.pickup?.uploadedOptionalPhotoCount ?? countByPrefix(attachmentTypes, 'PICKUP_EXTRA_IMAGE_');
  const requiredPickupPhotos = request.pickup?.requiredPhotoCount ?? 10;
  const pickupAccepted = Boolean(request.pickup?.acceptedAt);
  const pickupCompleted = Boolean(request.pickup?.completedAt) || request.status === 'PICKUP_COMPLETED';
  const canAccept = ['PICKUP_ASSIGNED', 'PICKUP_IN_PROGRESS'].includes(request.status) && !pickupAccepted;
  const canComplete = ['PICKUP_ASSIGNED', 'PICKUP_IN_PROGRESS'].includes(request.status) && pickupAccepted && pickupPhotos >= requiredPickupPhotos;
  const imeiExpected = usesImei(request.deviceCategory);

  return (
    <section className="runner-portal-shell">
      <div className="runner-portal-frame">
        <div className="runner-portal-header">
          <div>
            <p className="eyebrow">Runner Pickup Portal</p>
            <h1>{request.requestNumber}</h1>
            <p>{request.customerName} | {formatDeviceCategory(request.deviceCategory)} | {request.deviceLabel}</p>
          </div>
          <div className="runner-portal-status">
            <StatusBadge status={request.status} />
            <span className="workspace-chip">{request.pickup?.runnerName ?? request.pickupAgent ?? 'Assigned runner'}</span>
          </div>
        </div>

        <article className="card runner-portal-hero">
          <div className="workflow-step-list">
            <div className={`workflow-step${pickupAccepted ? ' complete' : ''}`}>
              <span>1</span>
              <p><strong>Accept Pickup</strong><br />Confirm that you received the job from the SMS / WhatsApp link.</p>
            </div>
            <div className={`workflow-step${pickupPhotos >= requiredPickupPhotos ? ' complete' : ''}`}>
              <span>2</span>
              <p><strong>Upload 10 Photos</strong><br />Capture the required device images before handoff from the customer.</p>
            </div>
            <div className={`workflow-step${pickupExtraPhotos > 0 ? ' complete' : ''}`}>
              <span>3</span>
              <p><strong>Add Optional Extras</strong><br />Upload any extra supporting photos if needed for damage, doorstep, or accessories.</p>
            </div>
            <div className={`workflow-step${pickupCompleted ? ' complete' : ''}`}>
              <span>4</span>
              <p><strong>Submit Pickup Done</strong><br />Mark pickup complete and trigger customer and admin notifications.</p>
            </div>
          </div>
        </article>

        <div className="summary-grid">
          <article className="summary-stat compact-stat">
            <span>Pickup Schedule</span>
            <strong>{request.pickup?.scheduledAt ? formatDateTimeIn(request.pickup.scheduledAt) : 'Not scheduled'}</strong>
            <small>Runner appointment time shared during pickup assignment.</small>
          </article>
          <article className="summary-stat compact-stat">
            <span>Required Photos</span>
            <strong>{pickupPhotos}/{requiredPickupPhotos}</strong>
            <small>Required device images before pickup can be submitted.</small>
          </article>
          <article className="summary-stat compact-stat">
            <span>Optional Extras</span>
            <strong>{pickupExtraPhotos}</strong>
            <small>Additional images for audit support, damage proof, or doorstep context.</small>
          </article>
        </div>

        <div className="details-grid triple-grid">
          <article className="card">
            <h3>Customer</h3>
            <div className="data-grid">
              <span>Name</span><strong>{request.customerName}</strong>
              <span>Phone</span><strong>{request.customerPhone}</strong>
              <span>WhatsApp</span><strong>{request.whatsappNumber ?? 'N/A'}</strong>
              <span>Alternate</span><strong>{request.alternatePhone ?? 'N/A'}</strong>
              <span>Address</span><strong>{request.customerAddress ?? 'N/A'}</strong>
              <span>Landmark</span><strong>{request.landmark ?? 'N/A'}</strong>
            </div>
            {request.googleMapLink ? <a className="secondary-button" href={request.googleMapLink} target="_blank" rel="noreferrer">Open Google Maps</a> : null}
          </article>

          <article className="card">
            <h3>Device</h3>
            <div className="data-grid">
              <span>Category</span><strong>{formatDeviceCategory(request.deviceCategory)}</strong>
              <span>Device</span><strong>{request.deviceLabel}</strong>
              <span>Serial No.</span><strong>{request.serialNumber}</strong>
              <span>IMEI</span><strong>{imeiExpected ? request.imeiNumber ?? 'Not captured' : request.imeiNumber ?? 'Not applicable'}</strong>
              <span>Issue</span><strong>{request.issueSummary}</strong>
              <span>Pickup OTP</span><strong>{request.pickup?.pickupOtp ?? 'Not set'}</strong>
            </div>
          </article>

          <article className="card">
            <h3>Runner Notes</h3>
            <p>{request.pickup?.notes ?? 'No pickup notes shared yet.'}</p>
            <div className="mini-list">
              <div>
                <strong>Acceptance</strong>
                <small>{request.pickup?.acceptedAt ? formatDateTimeIn(request.pickup.acceptedAt) : 'Not accepted yet'}</small>
              </div>
              <div>
                <strong>Completion</strong>
                <small>{request.pickup?.completedAt ? formatDateTimeIn(request.pickup.completedAt) : 'Not completed yet'}</small>
              </div>
              <div>
                <strong>Link Delivery</strong>
                <small>{request.pickup?.runnerLinkSentAt ? formatDateTimeIn(request.pickup.runnerLinkSentAt) : 'Link not logged yet'}</small>
              </div>
            </div>
          </article>
        </div>

        <article className="card runner-portal-actions">
          <div className="split-row">
            <div>
              <h3>Pickup Actions</h3>
              <p>Accept the job first, then upload all required images before submitting pickup done.</p>
            </div>
            {actionMessage ? <span className="workspace-chip">{actionMessage}</span> : null}
          </div>

          <div className="action-row action-row-wrap">
            <button type="button" className="secondary-button" disabled={!canAccept || busyAction !== null} onClick={handleAccept}>
              {busyAction === 'accept' ? 'Accepting...' : pickupAccepted ? 'Pickup Accepted' : 'Accept Pickup'}
            </button>
            <button type="button" className="primary-button" disabled={!canComplete || busyAction !== null || pickupCompleted} onClick={handleComplete}>
              {busyAction === 'complete' ? 'Submitting...' : pickupCompleted ? 'Pickup Completed' : 'Submit Pickup Done'}
            </button>
          </div>

          {!pickupAccepted ? <p className="runner-portal-hint">Accept the pickup before uploading or submitting the device handoff.</p> : null}
          {pickupAccepted && pickupPhotos < requiredPickupPhotos ? <p className="runner-portal-hint">Upload all {requiredPickupPhotos} required pickup photos before submitting pickup completion.</p> : null}
        </article>

        <TypedEvidenceUploadPanel
          requestId={request.id}
          attachments={request.attachments}
          mode="runner"
          role="PICKUP_AGENT"
          allowedSectionIds={['pickup']}
          onUpload={(attachmentType, file) => {
            if (!token) {
              return Promise.reject(new Error('Runner link is missing.'));
            }
            return uploadRunnerPickupAttachment(token, attachmentType, file).then((updated) => {
              setRequest(updated);
            });
          }}
          onRemove={(attachmentId) => {
            if (!token) {
              return Promise.reject(new Error('Runner link is missing.'));
            }
            return deleteRunnerPickupAttachment(token, attachmentId).then((updated) => {
              setRequest(updated);
            });
          }}
        />

        <article className="card">
          <div className="split-row">
            <h3>Notification Log</h3>
            <span className="workspace-chip">Customer + admin visibility</span>
          </div>
          <div className="mini-list">
            {request.notifications.length > 0 ? request.notifications.slice(0, 8).map((notification, index) => (
              <div key={`${notification.subject}-${notification.recipient}-${index}`}>
                <strong>{notification.subject}</strong>
                <p>{notification.recipient}</p>
                <small>{notification.message}</small>
                <small>{notification.channel} | {notification.deliveryStatus}</small>
              </div>
            )) : (
              <p>No notifications logged yet for this pickup.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
