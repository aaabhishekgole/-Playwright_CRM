
import type { ServiceRequest } from '../types/models';
import { formatDeviceCategory, supportedRepairCategories, usesImei } from './deviceCatalog';
import type { MenuLeaf, MenuSection } from './menuHierarchy';

type WorkspaceTone = 'default' | 'ok' | 'alert';

export type WorkspaceMetric = {
  label: string;
  value: string;
  helper: string;
  tone?: WorkspaceTone;
};

export type WorkspaceRecord = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  owner: string;
  due: string;
  amount: string;
  status: string;
  link?: string;
  tone?: WorkspaceTone;
};

export type WorkspaceFeedItem = {
  id: string;
  title: string;
  detail: string;
  meta: string;
  tone?: WorkspaceTone;
};

export type WorkspaceView = {
  heroTitle: string;
  heroDescription: string;
  searchPlaceholder: string;
  metrics: WorkspaceMetric[];
  records: WorkspaceRecord[];
  feedTitle: string;
  feed: WorkspaceFeedItem[];
  insightsTitle: string;
  insights: WorkspaceMetric[];
  emptyState: string;
};

type NotificationRecord = {
  id: string;
  requestNumber: string;
  tenantName: string;
  channel: string;
  recipient: string;
  subject: string;
  deliveryStatus: string;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
};

type AuditRecord = {
  id: string;
  requestNumber: string;
  tenantName: string;
  entityName: string;
  action: string;
  detail: string;
  changedBy: string;
  changedAt: string;
};

type ActorRecord = {
  id: string;
  name: string;
  lane: string;
  role: string;
  assignedRequests: number;
  activeRequests: number;
  breachedRequests: number;
};

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const dateFormat = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
});

const dateTimeFormat = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const activeStatuses = ['REQUEST', 'PICKUP', 'HUB', 'VERIFY', 'SERVICE_CENTER', 'ESTIMATE', 'QC', 'DELIVERY', 'REPAIR', 'INVOICED'];

function text(value?: string | null) {
  return value?.trim() || 'Not assigned';
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'No deadline';
  }
  return dateFormat.format(new Date(value));
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Awaiting update';
  }
  return dateTimeFormat.format(new Date(value));
}

function formatAmount(value?: number | null) {
  return money.format(value ?? 0);
}

function statusMatches(request: ServiceRequest, matches: string[]) {
  const status = request.status.toUpperCase();
  return matches.some((match) => status.includes(match));
}

function isClosed(request: ServiceRequest) {
  return statusMatches(request, ['CLOSED']);
}

function isCancelled(request: ServiceRequest) {
  return statusMatches(request, ['CANCELLED']);
}

function isOpen(request: ServiceRequest) {
  return activeStatuses.some((match) => request.status.toUpperCase().includes(match)) && !isClosed(request) && !isCancelled(request);
}

function requestOwner(sectionId: string, request: ServiceRequest) {
  switch (sectionId) {
    case 'pickup-management':
      return text(request.pickupAgent);
    case 'service-center':
    case 'quality-check':
      return text(request.technician);
    case 'delivery':
      return text(request.deliveryAgent);
    case 'billing':
      return request.invoice?.paymentStatus ?? 'Awaiting invoice';
    default:
      return text(request.technician ?? request.pickupAgent ?? request.deliveryAgent ?? request.tenantName);
  }
}

function requestDue(sectionId: string, request: ServiceRequest) {
  if (sectionId === 'billing') {
    return request.invoice ? `${formatAmount(request.invoice.amountDue)} due` : 'Invoice pending';
  }

  return formatDateTime(request.slaDeadlineAt);
}

function requestAmount(sectionId: string, request: ServiceRequest) {
  if (sectionId === 'billing') {
    return request.invoice ? formatAmount(request.invoice.totalAmount) : 'Not invoiced';
  }
  if (request.invoice) {
    return `${formatAmount(request.invoice.amountDue)} due`;
  }
  return 'No invoice';
}

function getRequestScope(itemId: string, requests: ServiceRequest[]) {
  switch (itemId) {
    case 'overview':
    case 'all-requests':
    case 'search-request':
    case 'pickup-history':
    case 'delivery-history':
    case 'invoice-reports':
    case 'estimate-history':
      return requests;
    case 'sla-tat-summary':
      return requests.filter((request) => request.slaBreached || isOpen(request));
    case 'recent-activities':
      return [...requests].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
    case 'alerts-escalations':
      return requests.filter((request) => request.slaBreached || request.notifications.some((notification) => notification.deliveryStatus !== 'SENT'));
    case 'create-request':
      return requests.filter((request) => statusMatches(request, ['REQUEST_CREATED']));
    case 'open-requests':
      return requests.filter(isOpen);
    case 'in-progress':
      return requests.filter((request) => isOpen(request) && !statusMatches(request, ['REQUEST_CREATED', 'PICKUP_ASSIGNED']));
    case 'closed-requests':
      return requests.filter(isClosed);
    case 'cancelled-requests':
      return requests.filter(isCancelled);
    case 'assign-pickup':
      return requests.filter((request) => !request.pickupAgent || statusMatches(request, ['REQUEST_CREATED', 'PICKUP_ASSIGNED']));
    case 'pending-pickup':
      return requests.filter((request) => statusMatches(request, ['PICKUP']) && !statusMatches(request, ['PICKED_UP']));
    case 'picked-up-devices':
      return requests.filter((request) => statusMatches(request, ['PICKED_UP', 'HUB', 'INWARD']));
    case 'pickup-failed-cases':
      return requests.filter((request) => statusMatches(request, ['PICKUP_FAILED']));
    case 'device-received-at-hub':
      return requests.filter((request) => statusMatches(request, ['HUB', 'INWARD']));
    case 'pending-verification':
      return requests.filter((request) => request.imeiValidationStatus !== 'VALID' || statusMatches(request, ['VERIFY']));
    case 'send-to-service-center':
      return requests.filter((request) => !!request.technician || statusMatches(request, ['SERVICE_CENTER']));
    case 'inward-register':
      return requests.filter((request) => statusMatches(request, ['HUB', 'INWARD']) || request.attachments.length > 0);
    case 'hub-inventory':
      return requests.filter((request) => statusMatches(request, ['HUB', 'VERIFY', 'SERVICE_CENTER']) && !statusMatches(request, ['DELIVERY', 'CLOSED']));
    case 'devices-under-inspection':
      return requests.filter((request) => statusMatches(request, ['INSPECTION']));
    case 'estimate-pending':
      return requests.filter((request) => statusMatches(request, ['ESTIMATE_PENDING']) || (!!request.technician && !request.invoice));
    case 'estimate-submitted':
    case 'new-estimates':
      return requests.filter((request) => statusMatches(request, ['ESTIMATE_SUBMITTED', 'ESTIMATE']) || (!!request.technician && request.notifications.length > 0));
    case 'approved-estimates':
      return requests.filter((request) => statusMatches(request, ['APPROVED', 'UNDER_REPAIR']));
    case 'rejected-estimates':
      return requests.filter((request) => statusMatches(request, ['REJECTED']));
    case 'under-repair':
      return requests.filter((request) => statusMatches(request, ['REPAIR']));
    case 'repair-completed':
      return requests.filter((request) => statusMatches(request, ['REPAIR_COMPLETED', 'QC', 'DELIVERY', 'INVOICED']));
    case 'total-loss-cases':
      return requests.filter((request) => statusMatches(request, ['TOTAL_LOSS']));
    case 'pending-qc':
      return requests.filter((request) => statusMatches(request, ['QC']) || statusMatches(request, ['REPAIR_COMPLETED']));
    case 'qc-passed':
      return requests.filter((request) => statusMatches(request, ['QC_PASSED', 'DELIVERY', 'INVOICED']));
    case 'qc-failed':
      return requests.filter((request) => statusMatches(request, ['QC_FAILED']));
    case 'rework-required':
      return requests.filter((request) => statusMatches(request, ['REWORK']));
    case 'assign-delivery':
      return requests.filter((request) => !request.deliveryAgent || statusMatches(request, ['READY_FOR_DISPATCH', 'DELIVERY_ASSIGNED']));
    case 'ready-for-dispatch':
      return requests.filter((request) => statusMatches(request, ['READY_FOR_DISPATCH', 'QC_PASSED']));
    case 'out-for-delivery':
      return requests.filter((request) => statusMatches(request, ['OUT_FOR_DELIVERY', 'DELIVERY_ASSIGNED']));
    case 'delivered':
      return requests.filter((request) => statusMatches(request, ['DELIVERED', 'INVOICED', 'CLOSED']));
    case 'delivery-failed':
      return requests.filter((request) => statusMatches(request, ['DELIVERY_FAILED']));
    case 'generate-invoice':
      return requests.filter((request) => !request.invoice && statusMatches(request, ['DELIVERED', 'QC_PASSED', 'REPAIR_COMPLETED']));
    case 'pending-invoices':
      return requests.filter((request) => (request.invoice?.amountDue ?? 0) > 0);
    case 'paid-invoices':
      return requests.filter((request) => !!request.invoice && (request.invoice.amountDue ?? 0) <= 0);
    case 'refund-cases':
      return requests.filter((request) => (request.invoice?.refundAmount ?? 0) > 0 || request.payments.some((payment) => payment.refundAmount > 0));
    default:
      return requests;
  }
}

function toRequestRecord(sectionId: string, request: ServiceRequest): WorkspaceRecord {
  return {
    id: request.requestNumber,
    title: request.requestNumber,
    subtitle: `${request.customerName} | ${request.deviceLabel}`,
    category: `${formatDeviceCategory(request.deviceCategory)} | ${request.tenantCode}`,
    owner: requestOwner(sectionId, request),
    due: requestDue(sectionId, request),
    amount: requestAmount(sectionId, request),
    status: request.status.replaceAll('_', ' '),
    link: `/requests/${request.id}`,
    tone: request.slaBreached ? 'alert' : 'default',
  };
}

function flattenNotifications(requests: ServiceRequest[]): NotificationRecord[] {
  return requests.flatMap((request) =>
    request.notifications.map((notification, index) => ({
      id: `${request.id}-notification-${index}`,
      requestNumber: request.requestNumber,
      tenantName: request.tenantName,
      ...notification,
    })),
  );
}

function flattenAudit(requests: ServiceRequest[]): AuditRecord[] {
  const auditEntries = requests.flatMap((request) =>
    request.auditTrail.map((entry, index) => ({
      id: `${request.id}-audit-${index}`,
      requestNumber: request.requestNumber,
      tenantName: request.tenantName,
      entityName: entry.entityName,
      action: entry.action,
      detail: entry.afterJson ?? entry.beforeJson ?? 'No diff available',
      changedBy: entry.changedBy,
      changedAt: entry.changedAt,
    })),
  );

  const timelineEntries = requests.flatMap((request) =>
    request.timeline.map((entry, index) => ({
      id: `${request.id}-timeline-${index}`,
      requestNumber: request.requestNumber,
      tenantName: request.tenantName,
      entityName: 'Status',
      action: entry.toStatus,
      detail: entry.afterValueJson ?? entry.remarks,
      changedBy: entry.changedBy,
      changedAt: entry.changedAt,
    })),
  );

  return [...auditEntries, ...timelineEntries].sort(
    (left, right) => new Date(right.changedAt).getTime() - new Date(left.changedAt).getTime(),
  );
}
function uniqueActors(requests: ServiceRequest[]) {
  const actorMap = new Map<string, ActorRecord>();

  const ensureActor = (name: string | null | undefined, lane: string, role: string, request: ServiceRequest) => {
    if (!name) {
      return;
    }

    const key = `${lane}-${name}`;
    const current = actorMap.get(key) ?? {
      id: key,
      name,
      lane,
      role,
      assignedRequests: 0,
      activeRequests: 0,
      breachedRequests: 0,
    };

    current.assignedRequests += 1;
    current.activeRequests += isOpen(request) ? 1 : 0;
    current.breachedRequests += request.slaBreached ? 1 : 0;
    actorMap.set(key, current);
  };

  requests.forEach((request) => {
    ensureActor(request.pickupAgent, 'Pickup', 'PICKUP_AGENT', request);
    ensureActor(request.technician, 'Service Center', 'TECHNICIAN', request);
    ensureActor(request.deliveryAgent, 'Delivery', 'DELIVERY_AGENT', request);
  });

  const supportNames = Array.from(new Set(flattenAudit(requests).map((entry) => entry.changedBy).filter((name) => name && name !== 'SYSTEM')));
  supportNames.forEach((name) => {
    const key = `Ops-${name}`;
    if (!actorMap.has(key)) {
      actorMap.set(key, {
        id: key,
        name,
        lane: 'Ops',
        role: 'ADMIN',
        assignedRequests: requests.length,
        activeRequests: requests.filter(isOpen).length,
        breachedRequests: requests.filter((request) => request.slaBreached).length,
      });
    }
  });

  return Array.from(actorMap.values());
}

function buildRequestMetrics(scoped: ServiceRequest[], requests: ServiceRequest[]): WorkspaceMetric[] {
  const queueValue = scoped.reduce((sum, request) => sum + (request.invoice?.amountDue ?? 0), 0);
  const breached = scoped.filter((request) => request.slaBreached).length;
  const invalidImei = scoped.filter((request) => usesImei(request.deviceCategory) && request.imeiValidationStatus !== 'VALID').length;
  const partners = new Set(scoped.map((request) => request.tenantCode)).size;

  return [
    { label: 'Queue Size', value: String(scoped.length), helper: 'Records currently in this workbench.' },
    { label: 'Value At Risk', value: formatAmount(queueValue), helper: 'Open amount or settlement exposure tied to these requests.' },
    { label: 'SLA Breaches', value: String(breached), helper: 'Claims already beyond committed SLA.', tone: breached > 0 ? 'alert' : 'ok' },
    { label: 'Partner Coverage', value: String(partners || new Set(requests.map((request) => request.tenantCode)).size), helper: 'Tenants or partner lanes represented here.' },
    { label: 'IMEI Exceptions', value: String(invalidImei), helper: 'Requests still needing QR or IMEI correction.', tone: invalidImei > 0 ? 'alert' : 'ok' },
  ];
}

function buildRequestFeed(scoped: ServiceRequest[]): WorkspaceFeedItem[] {
  return flattenAudit(scoped)
    .slice(0, 6)
    .map((entry) => ({
      id: entry.id,
      title: `${entry.requestNumber} | ${entry.action.replaceAll('_', ' ')}`,
      detail: entry.detail,
      meta: `${entry.changedBy} | ${formatDateTime(entry.changedAt)}`,
      tone: entry.action.includes('BREACH') ? 'alert' : 'default',
    }));
}

function buildRequestInsights(scoped: ServiceRequest[]): WorkspaceMetric[] {
  const partialPayments = scoped.filter((request) => request.invoice?.paymentStatus === 'PARTIAL').length;
  const queuedNotifications = scoped.filter((request) =>
    request.notifications.some((notification) => notification.deliveryStatus === 'QUEUED'),
  ).length;
  const attachments = scoped.reduce((sum, request) => sum + request.attachments.length, 0);

  return [
    { label: 'Partial Payments', value: String(partialPayments), helper: 'Requests with open amount already partially settled.' },
    { label: 'Queued Notifications', value: String(queuedNotifications), helper: 'Notification engine entries waiting for retry or delivery.' },
    { label: 'Secure Files', value: String(attachments), helper: 'Signed attachment records available inside this module.' },
  ];
}

function buildRequestWorkspace(section: MenuSection, item: MenuLeaf, requests: ServiceRequest[]): WorkspaceView {
  const scoped = getRequestScope(item.id, requests);

  if (item.id === 'create-request') {
    return {
      heroTitle: 'Repair intake workbench',
      heroDescription: 'Register and triage repair requests for Mobile, TV, Laptop, AC, and Camera / DSLR devices with the right identifier captured at intake.',
      searchPlaceholder: 'Search draft requests, supported device types, or customer/device details',
      metrics: [
        { label: 'Supported Repairs', value: String(supportedRepairCategories.length), helper: 'Mobile, TV, Laptop, AC, and Camera / DSLR categories are intake-ready.' },
        { label: 'Draft Queue', value: String(scoped.length), helper: 'Requests still sitting at initial intake or request-created state.' },
        { label: 'IMEI Required', value: String(scoped.filter((request) => usesImei(request.deviceCategory)).length), helper: 'Mobile repairs expecting IMEI-led validation.' },
        { label: 'Serial-led Intake', value: String(scoped.filter((request) => !usesImei(request.deviceCategory)).length), helper: 'TV, Laptop, AC, and Camera / DSLR repairs keyed by serial number.' },
      ],
      records: scoped
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
        .map((request) => toRequestRecord(section.id, request)),
      feedTitle: 'Supported Repair Categories',
      feed: supportedRepairCategories.map((entry) => ({
        id: entry.id,
        title: `${entry.label} repairs`,
        detail: entry.detail,
        meta: `Primary identifier: ${entry.identifier}`,
        tone: 'ok',
      })),
      insightsTitle: 'Intake Rules',
      insights: [
        { label: 'Mobile', value: 'IMEI + serial', helper: 'Use IMEI validation for mobile devices and keep QR extraction when available.' },
        { label: 'TV / Laptop / AC / Camera', value: 'Serial-led', helper: 'Non-mobile repairs can proceed on serial number even when no IMEI exists.' },
        { label: 'Request routing', value: 'Repair-aware', helper: 'Surface device category early so pickup, hub, and service-center teams follow the right path.' },
      ],
      emptyState: 'No new intake requests yet. The repair categories above are ready to be used once request creation is wired into this workbench.',
    };
  }

  return {
    heroTitle: `${item.label} workbench`,
    heroDescription: `Live operational view for ${item.label.toLowerCase()} with tenant context, SLA/TAT signals, and next-step ownership.`,
    searchPlaceholder: 'Search request number, customer, device, or partner reference',
    metrics: buildRequestMetrics(scoped, requests),
    records: scoped
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
      .map((request) => toRequestRecord(section.id, request)),
    feedTitle: 'Live Activity Feed',
    feed: buildRequestFeed(scoped),
    insightsTitle: 'Operational Signals',
    insights: buildRequestInsights(scoped),
    emptyState: `No records currently match ${item.label}. Use the live workflow and filters to populate this queue.`,
  };
}

function buildNotificationWorkspace(item: MenuLeaf, requests: ServiceRequest[]): WorkspaceView {
  let scoped = flattenNotifications(requests);
  if (item.id === 'sms-logs') {
    scoped = scoped.filter((entry) => entry.channel === 'SMS');
  }
  if (item.id === 'email-logs') {
    scoped = scoped.filter((entry) => entry.channel === 'EMAIL');
  }
  if (item.id === 'failed-notifications') {
    scoped = scoped.filter((entry) => entry.deliveryStatus !== 'SENT');
  }

  const records = scoped
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .map<WorkspaceRecord>((entry) => ({
      id: entry.id,
      title: `${entry.channel} | ${entry.recipient}`,
      subtitle: entry.subject,
      category: `${entry.requestNumber} | ${entry.tenantName}`,
      owner: `${entry.attemptCount}/${entry.maxAttempts} attempts`,
      due: formatDateTime(entry.nextRetryAt ?? entry.createdAt),
      amount: entry.errorMessage ?? 'No error',
      status: entry.deliveryStatus,
      tone: entry.deliveryStatus === 'SENT' ? 'ok' : 'alert',
    }));

  const failed = scoped.filter((entry) => entry.deliveryStatus !== 'SENT').length;
  const queued = scoped.filter((entry) => entry.deliveryStatus === 'QUEUED').length;

  return {
    heroTitle: `${item.label} control room`,
    heroDescription: 'Channel-level delivery visibility with retry posture, dead-letter watch, and template-ready metadata.',
    searchPlaceholder: 'Search by recipient, subject, request number, or channel',
    metrics: [
      { label: 'Messages', value: String(scoped.length), helper: 'Notification records in this current view.' },
      { label: 'Queued', value: String(queued), helper: 'Retries currently waiting in queue.', tone: queued > 0 ? 'alert' : 'ok' },
      { label: 'Failed', value: String(failed), helper: 'Messages needing retry or manual intervention.', tone: failed > 0 ? 'alert' : 'ok' },
      { label: 'Unique Recipients', value: String(new Set(scoped.map((entry) => entry.recipient)).size), helper: 'Distinct delivery targets represented here.' },
    ],
    records,
    feedTitle: 'Retry Watch',
    feed: scoped.slice(0, 6).map((entry) => ({
      id: entry.id,
      title: `${entry.requestNumber} | ${entry.channel}`,
      detail: entry.errorMessage ?? `Delivery status is ${entry.deliveryStatus.toLowerCase()}.`,
      meta: `${entry.recipient} | ${formatDateTime(entry.createdAt)}`,
      tone: entry.deliveryStatus === 'SENT' ? 'ok' : 'alert',
    })),
    insightsTitle: 'Engine Health',
    insights: [
      { label: 'Template Families', value: String(new Set(scoped.map((entry) => entry.subject)).size), helper: 'Distinct notification intents active in this queue.' },
      { label: 'Queue Depth', value: String(queued), helper: 'Pending retry jobs under notification orchestration.' },
      { label: 'Partner Reach', value: String(new Set(scoped.map((entry) => entry.tenantName)).size), helper: 'Tenants impacted by these messages.' },
    ],
    emptyState: 'No notification records are available for this channel right now.',
  };
}

function buildAuditWorkspace(item: MenuLeaf, requests: ServiceRequest[]): WorkspaceView {
  let scoped = flattenAudit(requests);
  if (item.id === 'status-history') {
    scoped = scoped.filter((entry) => entry.entityName === 'Status');
  }
  if (item.id === 'user-actions') {
    scoped = scoped.filter((entry) => entry.changedBy !== 'SYSTEM');
  }
  if (item.id === 'change-logs') {
    scoped = scoped.filter((entry) => entry.detail.includes('{'));
  }

  const records = scoped.map<WorkspaceRecord>((entry) => ({
    id: entry.id,
    title: `${entry.requestNumber} | ${entry.action.replaceAll('_', ' ')}`,
    subtitle: entry.detail,
    category: `${entry.entityName} | ${entry.tenantName}`,
    owner: entry.changedBy,
    due: formatDateTime(entry.changedAt),
    amount: entry.entityName === 'Status' ? 'Lifecycle event' : 'Before/after diff',
    status: entry.entityName,
    tone: entry.action.includes('BREACH') ? 'alert' : 'default',
  }));

  return {
    heroTitle: `${item.label} explorer`,
    heroDescription: 'Enterprise audit visibility with before/after traces, request-linked history, and actor accountability.',
    searchPlaceholder: 'Search by request number, entity, action, or user',
    metrics: [
      { label: 'Entries', value: String(scoped.length), helper: 'Audit and history entries in this slice.' },
      { label: 'Users', value: String(new Set(scoped.map((entry) => entry.changedBy)).size), helper: 'Actors represented in this log view.' },
      { label: 'Status Events', value: String(scoped.filter((entry) => entry.entityName === 'Status').length), helper: 'Lifecycle transitions captured here.' },
      { label: 'Change Diffs', value: String(scoped.filter((entry) => entry.detail.includes('{')).length), helper: 'Entries containing JSON before/after values.' },
    ],
    records,
    feedTitle: 'Recent Changes',
    feed: scoped.slice(0, 6).map((entry) => ({
      id: entry.id,
      title: `${entry.entityName} | ${entry.action.replaceAll('_', ' ')}`,
      detail: entry.detail,
      meta: `${entry.changedBy} | ${formatDateTime(entry.changedAt)}`,
      tone: entry.action.includes('BREACH') ? 'alert' : 'default',
    })),
    insightsTitle: 'Compliance Signals',
    insights: [
      { label: 'Tenant Coverage', value: String(new Set(scoped.map((entry) => entry.tenantName)).size), helper: 'Tenants represented in this audit window.' },
      { label: 'System Events', value: String(scoped.filter((entry) => entry.changedBy === 'SYSTEM').length), helper: 'Automated audit events captured by the platform.' },
      { label: 'Manual Events', value: String(scoped.filter((entry) => entry.changedBy !== 'SYSTEM').length), helper: 'Human-operated actions logged in this view.' },
    ],
    emptyState: 'No audit entries are available for this view right now.',
  };
}
function buildUserWorkspace(item: MenuLeaf, requests: ServiceRequest[]): WorkspaceView {
  const actors = uniqueActors(requests);

  let scoped: ActorRecord[];
  switch (item.id) {
    case 'delivery-executives':
      scoped = actors.filter((actor) => actor.role === 'DELIVERY_AGENT');
      break;
    case 'hub-operators':
      scoped = actors.filter((actor) => actor.lane === 'Pickup' || actor.lane === 'Ops');
      break;
    case 'service-center-users':
      scoped = actors.filter((actor) => actor.role === 'TECHNICIAN');
      break;
    case 'customers':
      scoped = requests.map((request) => ({
        id: `customer-${request.id}`,
        name: request.customerName,
        lane: request.tenantName,
        role: 'CUSTOMER',
        assignedRequests: 1,
        activeRequests: isOpen(request) ? 1 : 0,
        breachedRequests: request.slaBreached ? 1 : 0,
      }));
      break;
    default:
      scoped = actors;
      break;
  }

  const records = scoped.map<WorkspaceRecord>((actor) => ({
    id: actor.id,
    title: actor.name,
    subtitle: `${actor.role} | ${actor.lane}`,
    category: `${actor.assignedRequests} assigned`,
    owner: `${actor.activeRequests} active`,
    due: `${actor.breachedRequests} breached`,
    amount: actor.role === 'CUSTOMER' ? 'Customer profile' : 'Team workload',
    status: actor.role,
    tone: actor.breachedRequests > 0 ? 'alert' : 'ok',
  }));

  return {
    heroTitle: `${item.label} workspace`,
    heroDescription: 'Operational directory view with workload, SLA pressure, and role-specific assignment visibility.',
    searchPlaceholder: 'Search by name, role, lane, or team',
    metrics: [
      { label: 'Profiles', value: String(scoped.length), helper: 'Profiles currently visible in this role directory.' },
      { label: 'Active Workload', value: String(scoped.reduce((sum, actor) => sum + actor.activeRequests, 0)), helper: 'Open claims owned by this user slice.' },
      { label: 'SLA Pressure', value: String(scoped.reduce((sum, actor) => sum + actor.breachedRequests, 0)), helper: 'Breached requests linked to this role view.', tone: scoped.some((actor) => actor.breachedRequests > 0) ? 'alert' : 'ok' },
      { label: 'Tenant Reach', value: String(new Set(requests.map((request) => request.tenantName)).size), helper: 'Partners and tenants currently served by the portal.' },
    ],
    records,
    feedTitle: 'Assignment Watch',
    feed: records.slice(0, 6).map((record) => ({
      id: record.id,
      title: `${record.title} | ${record.status}`,
      detail: `${record.category}, ${record.owner}, ${record.due}`,
      meta: record.amount,
      tone: record.tone,
    })),
    insightsTitle: 'Access Snapshot',
    insights: [
      { label: 'Admin Roles', value: String(actors.filter((actor) => actor.role === 'ADMIN').length), helper: 'Users operating with admin-like workflow coverage.' },
      { label: 'Field Roles', value: String(actors.filter((actor) => actor.role.includes('AGENT')).length), helper: 'Pickup and delivery users in the field network.' },
      { label: 'Technical Roles', value: String(actors.filter((actor) => actor.role === 'TECHNICIAN').length), helper: 'Repair and QC lane users currently mapped.' },
    ],
    emptyState: 'No user profiles are available in this role view right now.',
  };
}

function buildReportWorkspace(item: MenuLeaf, requests: ServiceRequest[]): WorkspaceView {
  const auditDepth = flattenAudit(requests);
  const reportCards: WorkspaceRecord[] = [
    {
      id: 'request-report',
      title: 'Request Funnel',
      subtitle: `${requests.length} requests across intake, repair, and closure.`,
      category: `${requests.filter(isOpen).length} open`,
      owner: `${requests.filter((request) => request.slaBreached).length} breached`,
      due: `${new Set(requests.map((request) => request.tenantCode)).size} tenants`,
      amount: formatAmount(requests.reduce((sum, request) => sum + (request.invoice?.totalAmount ?? 0), 0)),
      status: 'REPORT',
    },
    {
      id: 'pickup-report',
      title: 'Pickup Productivity',
      subtitle: `${requests.filter((request) => !!request.pickupAgent).length} requests already assigned.`,
      category: `${requests.filter((request) => statusMatches(request, ['PICKUP'])).length} pickup-stage`,
      owner: `${requests.filter((request) => statusMatches(request, ['PICKUP_FAILED'])).length} failed`,
      due: `${requests.filter((request) => request.attachments.length > 0).length} with images`,
      amount: 'Operational report',
      status: 'REPORT',
    },
    {
      id: 'repair-report',
      title: 'Repair Throughput',
      subtitle: `${requests.filter((request) => !!request.technician).length} repair-lane requests mapped.`,
      category: `${requests.filter((request) => statusMatches(request, ['REPAIR', 'QC'])).length} active repair`,
      owner: `${requests.filter((request) => statusMatches(request, ['TOTAL_LOSS'])).length} total loss`,
      due: `${requests.filter((request) => request.imeiValidationStatus !== 'VALID').length} verification issues`,
      amount: 'Repair report',
      status: 'REPORT',
    },
    {
      id: 'delivery-report',
      title: 'Delivery Closure',
      subtitle: `${requests.filter((request) => !!request.deliveryAgent).length} delivery-owned requests.`,
      category: `${requests.filter((request) => statusMatches(request, ['OUT_FOR_DELIVERY'])).length} in transit`,
      owner: `${requests.filter((request) => statusMatches(request, ['DELIVERED', 'INVOICED'])).length} delivered`,
      due: `${requests.filter((request) => statusMatches(request, ['DELIVERY_FAILED'])).length} failed`,
      amount: 'Delivery report',
      status: 'REPORT',
    },
    {
      id: 'sla-tat-report',
      title: 'SLA and TAT',
      subtitle: `${requests.filter((request) => request.slaBreached).length} breached requests need escalation.`,
      category: `${requests.filter(isOpen).length} active`,
      owner: `${requests.filter((request) => !request.actualResolutionAt).length} unresolved`,
      due: `${requests.filter((request) => request.notifications.some((notification) => notification.deliveryStatus !== 'SENT')).length} alert-linked`,
      amount: 'Service report',
      status: 'REPORT',
    },
    {
      id: 'revenue-report',
      title: 'Revenue View',
      subtitle: `${requests.filter((request) => !!request.invoice).length} invoiced requests.`,
      category: `${requests.filter((request) => (request.invoice?.amountDue ?? 0) > 0).length} pending`,
      owner: `${requests.filter((request) => request.payments.length > 0).length} paid`,
      due: `${requests.filter((request) => request.payments.some((payment) => payment.refundAmount > 0)).length} refund cases`,
      amount: formatAmount(requests.reduce((sum, request) => sum + (request.invoice?.amountDue ?? 0), 0)),
      status: 'REPORT',
    },
    {
      id: 'audit-logs',
      title: 'Audit Coverage',
      subtitle: `${auditDepth.length} enterprise log entries captured.`,
      category: `${new Set(auditDepth.map((entry) => entry.changedBy)).size} actors`,
      owner: `${auditDepth.filter((entry) => entry.entityName === 'Status').length} status changes`,
      due: `${auditDepth.filter((entry) => entry.detail.includes('{')).length} diff-ready`,
      amount: 'Audit report',
      status: 'REPORT',
    },
  ];

  const scoped = reportCards.filter((record) => record.id === item.id);

  return {
    heroTitle: `${item.label} analytics`,
    heroDescription: 'Client-friendly operational reporting with SLA, workflow, revenue, and audit readiness built into the merchant portal.',
    searchPlaceholder: 'Search report name or signal',
    metrics: [
      { label: 'Reports Ready', value: String(reportCards.length), helper: 'Report packs represented in this reporting area.' },
      { label: 'SLA Breaches', value: String(requests.filter((request) => request.slaBreached).length), helper: 'Breaches feeding the report outputs.', tone: requests.some((request) => request.slaBreached) ? 'alert' : 'ok' },
      { label: 'Invoiced Value', value: formatAmount(requests.reduce((sum, request) => sum + (request.invoice?.totalAmount ?? 0), 0)), helper: 'Gross invoice value available for reporting.' },
      { label: 'Audit Depth', value: String(auditDepth.length), helper: 'Audit entries available to support enterprise reporting.' },
    ],
    records: scoped,
    feedTitle: 'Reporting Signals',
    feed: auditDepth.slice(0, 6).map((entry) => ({
      id: entry.id,
      title: `${entry.requestNumber} | ${entry.action.replaceAll('_', ' ')}`,
      detail: entry.detail,
      meta: `${entry.tenantName} | ${formatDateTime(entry.changedAt)}`,
      tone: entry.action.includes('BREACH') ? 'alert' : 'default',
    })),
    insightsTitle: 'Export Readiness',
    insights: [
      { label: 'Partners', value: String(new Set(requests.map((request) => request.tenantCode)).size), helper: 'Tenant lanes represented in the report layer.' },
      { label: 'Invoices', value: String(requests.filter((request) => !!request.invoice).length), helper: 'GST-compliant invoice rows available for export.' },
      { label: 'Notifications', value: String(flattenNotifications(requests).length), helper: 'Message records available for compliance reporting.' },
    ],
    emptyState: 'No report rows are available for this report right now.',
  };
}

function buildSettingsWorkspace(item: MenuLeaf, requests: ServiceRequest[]): WorkspaceView {
  const configRecords: WorkspaceRecord[] = [
    {
      id: 'status-configuration',
      title: 'Status Configuration',
      subtitle: `${new Set(requests.map((request) => request.status)).size} active workflow statuses in live data.`,
      category: `${requests.filter(isOpen).length} open requests`,
      owner: 'Workflow engine',
      due: 'Enterprise config',
      amount: 'No revenue impact',
      status: 'ACTIVE',
    },
    {
      id: 'notification-settings',
      title: 'Notification Settings',
      subtitle: `${flattenNotifications(requests).length} total notification records currently visible.`,
      category: `${flattenNotifications(requests).filter((entry) => entry.deliveryStatus !== 'SENT').length} failed or queued`,
      owner: 'Notification engine',
      due: 'Retry enabled',
      amount: 'Channel config',
      status: 'ACTIVE',
    },
    {
      id: 'sla-configuration',
      title: 'SLA Configuration',
      subtitle: `${requests.filter((request) => request.slaBreached).length} breached requests require review.`,
      category: `${new Set(requests.map((request) => request.tenantCode)).size} tenant rules`,
      owner: 'TAT engine',
      due: 'Rule-backed',
      amount: 'Ops impact',
      status: 'ACTIVE',
      tone: requests.some((request) => request.slaBreached) ? 'alert' : 'ok',
    },
    {
      id: 'file-storage-config',
      title: 'File Storage',
      subtitle: `${requests.reduce((sum, request) => sum + request.attachments.length, 0)} secure attachment records tracked.`,
      category: `${requests.filter((request) => request.attachments.length > 0).length} requests with files`,
      owner: 'Signed URL service',
      due: 'Protected access',
      amount: 'Storage ready',
      status: 'ACTIVE',
    },
    {
      id: 'system-preferences',
      title: 'System Preferences',
      subtitle: `${new Set(requests.map((request) => request.sourceChannel)).size} intake channels are active.`,
      category: `${requests.filter((request) => request.priority === 'HIGH' || request.priority === 'CRITICAL').length} high priority`,
      owner: 'Portal shell',
      due: 'Policy driven',
      amount: 'Platform settings',
      status: 'ACTIVE',
    },
  ];

  const scoped = configRecords.filter((record) => record.id === item.id);

  return {
    heroTitle: `${item.label} administration`,
    heroDescription: 'Configuration-focused workspace reflecting current operational health, SLA posture, and secure platform setup.',
    searchPlaceholder: 'Search configuration area or system signal',
    metrics: [
      { label: 'Config Areas', value: String(configRecords.length), helper: 'Primary enterprise settings areas tracked here.' },
      { label: 'Breaches', value: String(requests.filter((request) => request.slaBreached).length), helper: 'SLA configuration pressure visible in live data.', tone: requests.some((request) => request.slaBreached) ? 'alert' : 'ok' },
      { label: 'File Objects', value: String(requests.reduce((sum, request) => sum + request.attachments.length, 0)), helper: 'Private attachments under signed access rules.' },
      { label: 'Tenants', value: String(new Set(requests.map((request) => request.tenantCode)).size), helper: 'Partner tenants currently using the system.' },
    ],
    records: scoped,
    feedTitle: 'Configuration Signals',
    feed: scoped.map((record) => ({
      id: record.id,
      title: record.title,
      detail: record.subtitle,
      meta: `${record.owner} | ${record.due}`,
      tone: record.tone,
    })),
    insightsTitle: 'Platform Posture',
    insights: [
      { label: 'Multi-Tenant', value: 'Enabled', helper: 'Tenant-aware lanes are reflected throughout the workspace.' },
      { label: 'Signed URLs', value: 'Enabled', helper: 'Secure file access is represented in attachment metadata.' },
      { label: 'Retry Queue', value: 'Enabled', helper: 'Failed notifications can be surfaced and retried from queue-aware flows.' },
    ],
    emptyState: 'No configuration signals are available in this settings view right now.',
  };
}

export function buildWorkspaceView(section: MenuSection, item: MenuLeaf, requests: ServiceRequest[]): WorkspaceView {
  if (section.id === 'notifications') {
    return buildNotificationWorkspace(item, requests);
  }

  if (section.id === 'audit') {
    return buildAuditWorkspace(item, requests);
  }

  if (section.id === 'users') {
    return buildUserWorkspace(item, requests);
  }

  if (section.id === 'reports') {
    return buildReportWorkspace(item, requests);
  }

  if (section.id === 'settings') {
    return buildSettingsWorkspace(item, requests);
  }

  return buildRequestWorkspace(section, item, requests);
}
