import { Link, useParams } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { Timeline } from '../components/Timeline';
import { TypedEvidenceUploadPanel } from '../components/TypedEvidenceUploadPanel';
import { useAuth } from '../hooks/useAuth';
import { formatDeviceCategory, usesImei } from '../utils/deviceCatalog';
import { formatCurrencyInr, formatDateTimeIn } from '../utils/formatters';
import { getWorkflowStageMeta } from '../utils/workflowStages';
import { useRequests } from './useRequests';

function countByPrefix(types: string[], prefix: string) {
  return types.filter((type) => type.startsWith(prefix)).length;
}

export function ServiceRequestDetailsPage() {
  const { id } = useParams();
  const { role } = useAuth();
  const { requests, uploadAttachment, deleteAttachment, loading } = useRequests();
  const request = requests.find((item) => String(item.id) === id) ?? requests[0];

  if (loading && !request) {
    return <section className="workspace-empty"><strong>Loading request</strong><p>Please wait while the request details load.</p></section>;
  }

  if (!request) {
    return <section className="workspace-empty"><strong>Request not found</strong><p>The selected request could not be loaded.</p></section>;
  }

  const attachmentTypes = request.attachments.map((attachment) => attachment.attachmentType);
  const pickupPhotos = countByPrefix(attachmentTypes, 'PICKUP_IMAGE_');
  const pickupExtraPhotos = countByPrefix(attachmentTypes, 'PICKUP_EXTRA_IMAGE_');
  const cashlessDevicePhotos = countByPrefix(attachmentTypes, 'CASHLESS_DEVICE_IMAGE_');
  const cashlessDamagePhotos = countByPrefix(attachmentTypes, 'CASHLESS_DAMAGE_IMAGE_');
  const uploadMode = role === 'PICKUP_AGENT' ? 'runner' : 'standard';
  const allowedSectionIds = role === 'PICKUP_AGENT' ? ['pickup'] as const : undefined;
  const imeiExpected = usesImei(request.deviceCategory);
  const workflowMeta = getWorkflowStageMeta(request);

  return (
    <section className="workspace-page dense-ops-page request-detail-page">
      <div className="page-header request-detail-hero">
        <div>
          <p className="eyebrow">Request details</p>
          <h2>{request.requestNumber}</h2>
          <p>{request.tenantName} | {request.partnerReference ?? 'Direct intake'}</p>
          <div className="workspace-chip-row">
            <span className="workspace-chip">Stage: {workflowMeta.label}</span>
            <span className="workspace-chip">Owner: {workflowMeta.owner}</span>
            <span className="workspace-chip">Repair: {formatDeviceCategory(request.deviceCategory)}</span>
            <span className="workspace-chip">Device: {request.deviceLabel}</span>
          </div>
        </div>
        <div className="status-stack request-detail-status-stack">
          <StatusBadge status={request.status} />
          {request.slaBreached ? <span className="alert-badge">SLA Breached</span> : <span className="ok-badge">SLA On Track</span>}
          <Link className="secondary-button" to="/workspace/service-requests/open-requests">Back to Queue</Link>
        </div>
      </div>

      <div className="details-grid triple-grid request-detail-grid">
        <article className="card detail-card">
          <h3>Customer and Device</h3>
          <div className="data-grid">
            <span>Customer</span><strong>{request.customerName}</strong>
            <span>Contact Person</span><strong>{request.contactPerson ?? 'Self'}</strong>
            <span>Phone</span><strong>{request.customerPhone}</strong>
            <span>Alternate Phone</span><strong>{request.alternatePhone ?? 'N/A'}</strong>
            <span>WhatsApp</span><strong>{request.whatsappNumber ?? 'N/A'}</strong>
            <span>Email</span><strong>{request.customerEmail ?? 'N/A'}</strong>
            <span>GSTIN</span><strong>{request.customerGstin ?? 'N/A'}</strong>
            <span>Address</span><strong>{request.customerAddress ?? 'N/A'}</strong>
            <span>Landmark</span><strong>{request.landmark ?? 'N/A'}</strong>
            <span>Repair Type</span><strong>{formatDeviceCategory(request.deviceCategory)}</strong>
            <span>Device</span><strong>{request.deviceLabel}</strong>
            <span>Serial No.</span><strong>{request.serialNumber}</strong>
            <span>IMEI</span><strong>{imeiExpected ? request.imeiNumber ?? 'Not captured' : request.imeiNumber ?? 'Not applicable'}</strong>
            <span>Validation</span><strong>{request.imeiValidationStatus}</strong>
          </div>
          <p className="muted-line">QR payload: {request.qrCodePayload ?? 'Not scanned yet'}</p>
        </article>

        <article className="card detail-card">
          <h3>SLA / TAT</h3>
          <div className="data-grid">
            <span>Loan No.</span><strong>{request.loanNumber ?? 'N/A'}</strong>
            <span>COI No.</span><strong>{request.certificateOfInsuranceNumber ?? 'N/A'}</strong>
            <span>Previous Ticket</span><strong>{request.previousTicketNumber ?? 'N/A'}</strong>
            <span>Project</span><strong>{request.projectName ?? 'N/A'}</strong>
            <span>Branch</span><strong>{request.branchName ?? 'N/A'}</strong>
            <span>Employee</span><strong>{request.employeeName ?? request.employeeCode ?? 'N/A'}</strong>
            <span>Business Stage</span><strong>{workflowMeta.label}</strong>
            <span>Stage Owner</span><strong>{workflowMeta.owner}</strong>
            <span>Committed</span><strong>{formatDateTimeIn(request.committedAt)}</strong>
            <span>Expected</span><strong>{formatDateTimeIn(request.expectedCompletionAt)}</strong>
            <span>SLA Deadline</span><strong>{formatDateTimeIn(request.slaDeadlineAt)}</strong>
            <span>TAT Minutes</span><strong>{request.tatMinutes ?? 'Open'}</strong>
            <span>Breach</span><strong>{request.breachReason ?? 'None'}</strong>
          </div>
        </article>

        <article className="card detail-card detail-card-files">
          <h3>Assignments and Files</h3>
          <p>Pickup: {request.pickupAgent ?? 'Unassigned'}</p>
          <p>Pickup Schedule: {request.pickup?.scheduledAt ? formatDateTimeIn(request.pickup.scheduledAt) : 'Not scheduled'}</p>
          <p>Runner Portal: {request.pickup?.runnerPortalLink ? <a href={request.pickup.runnerPortalLink} target="_blank" rel="noreferrer">Open runner portal</a> : 'Not generated yet'}</p>
          <p>Technician: {request.technician ?? 'Unassigned'}</p>
          <p>Delivery: {request.deliveryAgent ?? 'Unassigned'}</p>
          <div className="mini-list">
            {request.attachments.length > 0 ? request.attachments.map((attachment) => (
              <a key={attachment.id} href={attachment.signedUrl} target="_blank" rel="noreferrer">
                {attachment.fileName} | {attachment.attachmentType}
              </a>
            )) : <p>No attachments uploaded yet.</p>}
          </div>
        </article>
      </div>

      <div className="summary-grid request-detail-summary-grid">
        <article className="summary-stat compact-stat">
          <span>Pickup photos</span>
          <strong>{pickupPhotos}/10</strong>
          <small>Required pickup photo set captured by the runner.</small>
        </article>
        <article className="summary-stat compact-stat">
          <span>Pickup extra photos</span>
          <strong>{pickupExtraPhotos}</strong>
          <small>Optional supporting pickup images for doorstep context or damage proof.</small>
        </article>
        <article className="summary-stat compact-stat">
          <span>Cashless device photos</span>
          <strong>{cashlessDevicePhotos}/6</strong>
          <small>Required device-angle evidence for cashless approval.</small>
        </article>
        <article className="summary-stat compact-stat">
          <span>Cashless damage photos</span>
          <strong>{cashlessDamagePhotos}/4</strong>
          <small>Required close-up damage evidence for cashless approval.</small>
        </article>
      </div>

      <TypedEvidenceUploadPanel
        requestId={request.id}
        attachments={request.attachments}
        mode={uploadMode}
        role={role}
        allowedSectionIds={allowedSectionIds ? [...allowedSectionIds] : undefined}
        onUpload={(attachmentType, file) => uploadAttachment(request.id, attachmentType, file).then(() => undefined)}
        onRemove={(attachmentId) => deleteAttachment(request.id, attachmentId).then(() => undefined)}
      />

      <div className="details-grid two-one-grid request-detail-lower-grid">
        <article className="card detail-card">
          <div className="split-row">
            <h3>Status timeline</h3>
            <Link to="/timeline">Open timeline view</Link>
          </div>
          <Timeline items={request.timeline} />
        </article>

        <article className="card detail-card">
          <h3>Notification Queue</h3>
          <div className="mini-list">
            {request.notifications.map((notification, index) => (
              <div key={`${notification.subject}-${index}`}>
                <strong>{notification.subject}</strong>
                <p>{notification.recipient}</p>
                <small>{notification.message}</small>
                <small>{notification.channel} | {notification.deliveryStatus} | attempts {notification.attemptCount}/{notification.maxAttempts}</small>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="details-grid two-one-grid request-detail-lower-grid">
        <article className="card detail-card">
          <div className="split-row">
            <h3>Invoice and Payments</h3>
            <StatusBadge status={request.invoice?.paymentStatus ?? 'PENDING'} />
          </div>
          {request.invoice ? (
            <>
              <div className="data-grid">
                <span>Invoice</span><strong>{request.invoice.invoiceNumber}</strong>
                <span>GST Type</span><strong>{request.invoice.gstType}</strong>
                <span>Total</span><strong>{formatCurrencyInr(request.invoice.totalAmount)}</strong>
                <span>Paid</span><strong>{formatCurrencyInr(request.invoice.amountPaid)}</strong>
                <span>Due</span><strong>{formatCurrencyInr(request.invoice.amountDue)}</strong>
                <span>Refund</span><strong>{formatCurrencyInr(request.invoice.refundAmount)}</strong>
              </div>
              <div className="mini-list">
                {request.invoice.items.map((item) => (
                  <div key={item.description}>
                    <strong>{item.description}</strong>
                    <small>{item.quantity} x {formatCurrencyInr(item.unitPrice)} | GST {item.gstRate}%</small>
                  </div>
                ))}
              </div>
              <div className="mini-list">
                {request.payments.map((payment) => (
                  <div key={payment.id}>
                    <strong>{payment.paymentReference}</strong>
                    <p>{payment.paymentMethod} | {formatCurrencyInr(payment.amount)}</p>
                    <small>UTR: {payment.utrNumber ?? 'Not captured'} | Reconciliation: {payment.reconciliationStatus ?? 'PENDING'}</small>
                    <small>{payment.reconciliationRemarks ?? 'No reconciliation remarks yet'}</small>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>No invoice generated yet.</p>
          )}
        </article>

        <article className="card detail-card">
          <h3>Audit Trail</h3>
          <div className="mini-list">
            {request.auditTrail.map((item, index) => (
              <div key={`${item.entityName}-${index}`}>
                <strong>{item.entityName} | {item.action}</strong>
                <p>{item.changedBy}</p>
                <small>{formatDateTimeIn(item.changedAt)}</small>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
