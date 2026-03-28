import type { UserRole } from '../types/models';

export type MenuLeaf = {
  id: string;
  label: string;
  description: string;
  path: string;
  roles?: UserRole[];
};

export type MenuSection = {
  id: string;
  label: string;
  description: string;
  accent: string;
  roles?: UserRole[];
  items: MenuLeaf[];
};

const workspace = (sectionId: string, itemId: string) => `/workspace/${sectionId}/${itemId}`;
const opsRoles: UserRole[] = ['ADMIN', 'CUSTOMER_SUPPORT', 'BACKEND_TEAM'];
const centerRoles: UserRole[] = ['ADMIN', 'TECHNICIAN', 'CUSTOMER_SUPPORT', 'BACKEND_TEAM'];
const financeRoles: UserRole[] = ['ADMIN', 'FINANCE', 'MSE_TEAM'];
const cashlessRoles: UserRole[] = ['ADMIN', 'BACKEND_TEAM', 'FINANCE', 'MSE_TEAM'];
const deliveryRoles: UserRole[] = ['ADMIN', 'DELIVERY_AGENT', 'CUSTOMER_SUPPORT', 'BACKEND_TEAM'];
const pickupRoles: UserRole[] = ['ADMIN', 'PICKUP_AGENT', 'CUSTOMER_SUPPORT', 'BACKEND_TEAM'];
const runnerAdminRoles: UserRole[] = ['ADMIN', 'BACKEND_TEAM'];
const broadRoles: UserRole[] = ['ADMIN', 'CUSTOMER_SUPPORT', 'BACKEND_TEAM', 'TECHNICIAN', 'PICKUP_AGENT', 'DELIVERY_AGENT', 'FINANCE', 'MSE_TEAM'];

export const menuHierarchy: MenuSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Operational overview, SLA watch, and escalations.',
    accent: 'accent-blue',
    roles: broadRoles,
    items: [
      { id: 'overview', label: 'Overview', description: 'Primary merchant snapshot and KPI summary.', path: '/', roles: broadRoles },
      { id: 'sla-tat-summary', label: 'SLA / TAT Summary', description: 'Turnaround and breach monitoring.', path: workspace('dashboard', 'sla-tat-summary'), roles: broadRoles },
      { id: 'recent-activities', label: 'Recent Activities', description: 'Latest actions across the workflow.', path: workspace('dashboard', 'recent-activities'), roles: broadRoles },
      { id: 'alerts-escalations', label: 'Alerts & Escalations', description: 'Critical issues and aging alerts.', path: workspace('dashboard', 'alerts-escalations'), roles: broadRoles },
    ],
  },
  {
    id: 'service-requests',
    label: 'Service Requests',
    description: 'Core request intake and lifecycle management.',
    accent: 'accent-cyan',
    roles: broadRoles,
    items: [
      { id: 'create-request', label: 'Create Request', description: 'Register a fresh service request.', path: workspace('service-requests', 'create-request'), roles: opsRoles },
      { id: 'all-requests', label: 'All Requests', description: 'Master request queue across all tenants.', path: '/requests', roles: broadRoles },
      { id: 'open-requests', label: 'Open Requests', description: 'Requests that are still active.', path: workspace('service-requests', 'open-requests'), roles: broadRoles },
      { id: 'in-progress', label: 'In Progress', description: 'Requests under active operational work.', path: workspace('service-requests', 'in-progress'), roles: broadRoles },
      { id: 'closed-requests', label: 'Closed Requests', description: 'Completed and closed claims.', path: workspace('service-requests', 'closed-requests'), roles: broadRoles },
      { id: 'cancelled-requests', label: 'Cancelled Requests', description: 'Cancelled or voided requests.', path: workspace('service-requests', 'cancelled-requests'), roles: opsRoles },
      { id: 'search-request', label: 'Search Request', description: 'Search by request number or partner ref.', path: workspace('service-requests', 'search-request'), roles: broadRoles },
    ],
  },
  {
    id: 'pickup-management',
    label: 'Pickup Management',
    description: 'Pickup assignment and field execution controls.',
    accent: 'accent-teal',
    roles: pickupRoles,
    items: [
      { id: 'pickup-dashboard', label: 'Pickup Dashboard', description: 'Stage-wise pickup overview and runner readiness.', path: workspace('pickup-management', 'pickup-dashboard'), roles: pickupRoles },
      { id: 'runner-onboarding', label: 'Runner Onboarding', description: 'Onboard pickup runners and link them to assignment flow.', path: workspace('pickup-management', 'runner-onboarding'), roles: runnerAdminRoles },
      { id: 'assign-pickup', label: 'Assign Pickup', description: 'Allocate pickup executives.', path: workspace('pickup-management', 'assign-pickup'), roles: opsRoles },
      { id: 'pending-pickup', label: 'Pending Pickup', description: 'Awaiting doorstep collection.', path: workspace('pickup-management', 'pending-pickup'), roles: pickupRoles },
      { id: 'picked-up-devices', label: 'Picked Up Devices', description: 'Collected devices and image sets.', path: workspace('pickup-management', 'picked-up-devices'), roles: pickupRoles },
      { id: 'pickup-failed-cases', label: 'Pickup Failed Cases', description: 'Failed attempts and reschedules.', path: workspace('pickup-management', 'pickup-failed-cases'), roles: pickupRoles },
      { id: 'pickup-history', label: 'Pickup History', description: 'Completed pickup records.', path: workspace('pickup-management', 'pickup-history'), roles: pickupRoles },
    ],
  },
  {
    id: 'hub-operations',
    label: 'Hub Operations',
    description: 'Scanning, inward, and inventory handling.',
    accent: 'accent-gold',
    roles: opsRoles,
    items: [
      { id: 'device-received-at-hub', label: 'Device Received at Hub', description: 'Mark inward receipt at the hub.', path: workspace('hub-operations', 'device-received-at-hub'), roles: opsRoles },
      { id: 'pending-verification', label: 'Pending Verification', description: 'IMEI, QR, and package validation.', path: workspace('hub-operations', 'pending-verification'), roles: opsRoles },
      { id: 'send-to-service-center', label: 'Send to Service Center', description: 'Move devices to repair partners.', path: workspace('hub-operations', 'send-to-service-center'), roles: opsRoles },
      { id: 'inward-register', label: 'Inward Register', description: 'Hub inward register and logs.', path: workspace('hub-operations', 'inward-register'), roles: opsRoles },
      { id: 'hub-inventory', label: 'Hub Inventory', description: 'Devices waiting within the hub.', path: workspace('hub-operations', 'hub-inventory'), roles: opsRoles },
    ],
  },
  {
    id: 'service-center',
    label: 'Service Center',
    description: 'Inspection, repair, and total loss tracking.',
    accent: 'accent-orange',
    roles: centerRoles,
    items: [
      { id: 'devices-under-inspection', label: 'Devices Under Inspection', description: 'Initial diagnosis queue.', path: workspace('service-center', 'devices-under-inspection'), roles: centerRoles },
      { id: 'estimate-pending', label: 'Estimate Pending', description: 'Devices awaiting cost estimate.', path: workspace('service-center', 'estimate-pending'), roles: centerRoles },
      { id: 'estimate-submitted', label: 'Estimate Submitted', description: 'Submitted estimates pending action.', path: workspace('service-center', 'estimate-submitted'), roles: centerRoles },
      { id: 'under-repair', label: 'Under Repair', description: 'Repair in progress at service center.', path: workspace('service-center', 'under-repair'), roles: centerRoles },
      { id: 'repair-completed', label: 'Repair Completed', description: 'Repair finished, awaiting next stage.', path: workspace('service-center', 'repair-completed'), roles: centerRoles },
      { id: 'total-loss-cases', label: 'Total Loss Cases', description: 'Write-off and total loss decisions.', path: workspace('service-center', 'total-loss-cases'), roles: centerRoles },
    ],
  },
  {
    id: 'estimates',
    label: 'Estimates',
    description: 'Customer decision and estimate governance.',
    accent: 'accent-purple',
    roles: [...centerRoles, 'FINANCE'],
    items: [
      { id: 'new-estimates', label: 'New Estimates', description: 'Fresh estimates submitted by repair partners.', path: workspace('estimates', 'new-estimates'), roles: [...centerRoles, 'FINANCE'] },
      { id: 'awaiting-customer-approval', label: 'Awaiting Customer Approval', description: 'Waiting for customer consent.', path: '/estimate-approval', roles: [...centerRoles, 'FINANCE'] },
      { id: 'approved-estimates', label: 'Approved Estimates', description: 'Approved work authorizations.', path: workspace('estimates', 'approved-estimates'), roles: [...centerRoles, 'FINANCE'] },
      { id: 'rejected-estimates', label: 'Rejected Estimates', description: 'Rejected or declined estimates.', path: workspace('estimates', 'rejected-estimates'), roles: [...centerRoles, 'FINANCE'] },
      { id: 'estimate-history', label: 'Estimate History', description: 'Historical estimate timeline.', path: workspace('estimates', 'estimate-history'), roles: [...centerRoles, 'FINANCE'] },
    ],
  },
  {
    id: 'cashless',
    label: 'Cashless',
    description: 'Evidence review, approvals, and exceptions for cashless cases.',
    accent: 'accent-purple',
    roles: cashlessRoles,
    items: [
      { id: 'approval-queue', label: 'Approval Queue', description: 'Cases waiting for cashless evidence review and approval.', path: '/cashless-approval', roles: cashlessRoles },
      { id: 'pending-photos', label: 'Pending Photos', description: 'Cases missing the required 6 + 4 evidence set.', path: workspace('cashless', 'pending-photos'), roles: cashlessRoles },
      { id: 'approved-cases', label: 'Approved Cases', description: 'Cashless cases approved and ready for execution.', path: workspace('cashless', 'approved-cases'), roles: cashlessRoles },
    ],
  },  {
    id: 'quality-check',
    label: 'Quality Check',
    description: 'Repair validation and rework control.',
    accent: 'accent-rose',
    roles: centerRoles,
    items: [
      { id: 'pending-qc', label: 'Pending QC', description: 'Repairs waiting for validation.', path: workspace('quality-check', 'pending-qc'), roles: centerRoles },
      { id: 'qc-passed', label: 'QC Passed', description: 'Validated repairs cleared for dispatch.', path: workspace('quality-check', 'qc-passed'), roles: centerRoles },
      { id: 'qc-failed', label: 'QC Failed', description: 'Repairs failed in quality review.', path: workspace('quality-check', 'qc-failed'), roles: centerRoles },
      { id: 'rework-required', label: 'Rework Required', description: 'Devices sent back for rework.', path: workspace('quality-check', 'rework-required'), roles: centerRoles },
    ],
  },
  {
    id: 'delivery',
    label: 'Delivery',
    description: 'Dispatch, OTP, and signature completion.',
    accent: 'accent-coral',
    roles: deliveryRoles,
    items: [
      { id: 'assign-delivery', label: 'Assign Delivery', description: 'Allocate final-mile delivery.', path: workspace('delivery', 'assign-delivery'), roles: opsRoles },
      { id: 'ready-for-dispatch', label: 'Ready for Dispatch', description: 'Devices cleared for shipment.', path: workspace('delivery', 'ready-for-dispatch'), roles: deliveryRoles },
      { id: 'out-for-delivery', label: 'Out for Delivery', description: 'In-transit delivery workloads.', path: '/delivery-tracking', roles: deliveryRoles },
      { id: 'delivered', label: 'Delivered', description: 'Completed handovers.', path: workspace('delivery', 'delivered'), roles: deliveryRoles },
      { id: 'delivery-failed', label: 'Delivery Failed', description: 'Attempt failed or customer unavailable.', path: workspace('delivery', 'delivery-failed'), roles: deliveryRoles },
      { id: 'delivery-history', label: 'Delivery History', description: 'Historical delivery archive.', path: workspace('delivery', 'delivery-history'), roles: deliveryRoles },
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    description: 'Invoices, payments, refunds, and reports.',
    accent: 'accent-red',
    roles: financeRoles,
    items: [
      { id: 'generate-invoice', label: 'Generate Invoice', description: 'Create GST-compliant invoice.', path: workspace('billing', 'generate-invoice'), roles: financeRoles },
      { id: 'pending-invoices', label: 'Pending Invoices', description: 'Invoices awaiting settlement.', path: workspace('billing', 'pending-invoices'), roles: financeRoles },
      { id: 'payment-reconciliation', label: 'Payment Reconciliation', description: 'Track UTR entries and reconcile captured payments.', path: '/payment-reconciliation', roles: financeRoles },
      { id: 'paid-invoices', label: 'Paid Invoices', description: 'Fully settled invoices.', path: workspace('billing', 'paid-invoices'), roles: financeRoles },
      { id: 'refund-cases', label: 'Refund Cases', description: 'Partial and full refund review.', path: workspace('billing', 'refund-cases'), roles: financeRoles },
      { id: 'invoice-reports', label: 'Invoice Reports', description: 'Billing analytics and exports.', path: workspace('billing', 'invoice-reports'), roles: financeRoles },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Message delivery logs and template controls.',
    accent: 'accent-teal',
    roles: ['ADMIN', 'CUSTOMER_SUPPORT', 'BACKEND_TEAM', 'FINANCE', 'MSE_TEAM'],
    items: [
      { id: 'sms-logs', label: 'SMS Logs', description: 'SMS activity audit.', path: workspace('notifications', 'sms-logs'), roles: ['ADMIN', 'CUSTOMER_SUPPORT'] },
      { id: 'email-logs', label: 'Email Logs', description: 'Email delivery audit.', path: workspace('notifications', 'email-logs'), roles: ['ADMIN', 'CUSTOMER_SUPPORT', 'FINANCE'] },
      { id: 'failed-notifications', label: 'Failed Notifications', description: 'Retry queue and dead letters.', path: workspace('notifications', 'failed-notifications'), roles: ['ADMIN', 'CUSTOMER_SUPPORT', 'FINANCE'] },
      { id: 'templates', label: 'Templates', description: 'Notification templates and settings.', path: workspace('notifications', 'templates'), roles: ['ADMIN'] },
    ],
  },
  {
    id: 'users',
    label: 'Users',
    description: 'Actors, customers, and permission controls.',
    accent: 'accent-blue',
    roles: ['ADMIN'],
    items: [
      { id: 'admin-users', label: 'Admin Users', description: 'Admin account management.', path: workspace('users', 'admin-users'), roles: ['ADMIN'] },
      { id: 'delivery-executives', label: 'Delivery Executives', description: 'Field delivery operators.', path: workspace('users', 'delivery-executives'), roles: ['ADMIN'] },
      { id: 'hub-operators', label: 'Hub Operators', description: 'Hub and inward operations users.', path: workspace('users', 'hub-operators'), roles: ['ADMIN'] },
      { id: 'service-center-users', label: 'Service Center Users', description: 'Repair and inspection users.', path: workspace('users', 'service-center-users'), roles: ['ADMIN'] },
      { id: 'customers', label: 'Customers', description: 'Customer directory and profiles.', path: workspace('users', 'customers'), roles: ['ADMIN'] },
      { id: 'roles-permissions', label: 'Roles & Permissions', description: 'Access control matrix.', path: workspace('users', 'roles-permissions'), roles: ['ADMIN'] },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    description: 'Client-facing and operational reports.',
    accent: 'accent-gold',
    roles: ['ADMIN', 'FINANCE', 'MSE_TEAM', 'CUSTOMER_SUPPORT', 'BACKEND_TEAM'],
    items: [
      { id: 'request-report', label: 'Request Report', description: 'Intake and request funnel report.', path: workspace('reports', 'request-report'), roles: ['ADMIN', 'CUSTOMER_SUPPORT'] },
      { id: 'pickup-report', label: 'Pickup Report', description: 'Pickup productivity and aging.', path: workspace('reports', 'pickup-report'), roles: ['ADMIN', 'CUSTOMER_SUPPORT'] },
      { id: 'repair-report', label: 'Repair Report', description: 'Repair throughput and outcomes.', path: workspace('reports', 'repair-report'), roles: ['ADMIN', 'CUSTOMER_SUPPORT'] },
      { id: 'delivery-report', label: 'Delivery Report', description: 'Dispatch and completion report.', path: workspace('reports', 'delivery-report'), roles: ['ADMIN', 'CUSTOMER_SUPPORT'] },
      { id: 'sla-tat-report', label: 'SLA / TAT Report', description: 'Breach and turnaround reporting.', path: workspace('reports', 'sla-tat-report'), roles: ['ADMIN', 'CUSTOMER_SUPPORT'] },
      { id: 'revenue-report', label: 'Revenue Report', description: 'Revenue and collections analytics.', path: workspace('reports', 'revenue-report'), roles: ['ADMIN', 'FINANCE'] },
      { id: 'audit-logs', label: 'Audit Logs', description: 'Enterprise change log reporting.', path: '/timeline', roles: ['ADMIN', 'CUSTOMER_SUPPORT', 'FINANCE'] },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Operational and system-wide configuration.',
    accent: 'accent-orange',
    roles: ['ADMIN'],
    items: [
      { id: 'status-configuration', label: 'Status Configuration', description: 'Manage workflow states.', path: workspace('settings', 'status-configuration'), roles: ['ADMIN'] },
      { id: 'notification-settings', label: 'Notification Settings', description: 'Retry and channel configuration.', path: workspace('settings', 'notification-settings'), roles: ['ADMIN'] },
      { id: 'sla-configuration', label: 'SLA Configuration', description: 'Tenant SLA rules and timings.', path: workspace('settings', 'sla-configuration'), roles: ['ADMIN'] },
      { id: 'file-storage-config', label: 'File Storage Config', description: 'Secure storage and signed URL settings.', path: workspace('settings', 'file-storage-config'), roles: ['ADMIN'] },
      { id: 'system-preferences', label: 'System Preferences', description: 'Global platform preferences.', path: workspace('settings', 'system-preferences'), roles: ['ADMIN'] },
    ],
  },
  {
    id: 'audit',
    label: 'Audit',
    description: 'Enterprise tracking, logs, and change review.',
    accent: 'accent-purple',
    roles: ['ADMIN', 'CUSTOMER_SUPPORT', 'BACKEND_TEAM', 'FINANCE', 'MSE_TEAM'],
    items: [
      { id: 'activity-logs', label: 'Activity Logs', description: 'Cross-system activity stream.', path: workspace('audit', 'activity-logs'), roles: ['ADMIN', 'CUSTOMER_SUPPORT'] },
      { id: 'status-history', label: 'Status History', description: 'Request status transitions.', path: '/timeline', roles: ['ADMIN', 'CUSTOMER_SUPPORT', 'FINANCE'] },
      { id: 'user-actions', label: 'User Actions', description: 'User-level audit and activity.', path: workspace('audit', 'user-actions'), roles: ['ADMIN'] },
      { id: 'change-logs', label: 'Change Logs', description: 'Before/after change details.', path: workspace('audit', 'change-logs'), roles: ['ADMIN', 'FINANCE'] },
    ],
  },
];

export function findMenuContext(sectionId?: string, itemId?: string) {
  const section = menuHierarchy.find((entry) => entry.id === sectionId);
  const item = section?.items.find((entry) => entry.id === itemId);
  return { section, item };
}

export function getVisibleMenuHierarchy(role: UserRole | null) {
  if (!role) {
    return [];
  }

  return menuHierarchy
    .filter((section) => !section.roles || section.roles.includes(role))
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);
}

function matchesPath(candidatePath: string, pathname: string) {
  if (candidatePath === '/') {
    return pathname === '/';
  }

  return pathname === candidatePath || pathname.startsWith(`${candidatePath}/`);
}

export function findMenuByPath(pathname: string) {
  for (const section of menuHierarchy) {
    for (const item of section.items) {
      if (matchesPath(item.path, pathname)) {
        return { section, item };
      }
    }
  }

  return null;
}

export function isSectionActive(section: MenuSection, pathname: string) {
  return section.items.some((item) => matchesPath(item.path, pathname));
}

export function hasMenuAccess(role: UserRole | null, sectionId?: string, itemId?: string) {
  if (!role || !sectionId || !itemId) {
    return false;
  }

  const { section, item } = findMenuContext(sectionId, itemId);
  if (!section || !item) {
    return false;
  }

  const sectionAllowed = !section.roles || section.roles.includes(role);
  const itemAllowed = !item.roles || item.roles.includes(role);
  return sectionAllowed && itemAllowed;
}

export const workflowFlow = ['Dashboard', 'Service Requests', 'Pickup', 'Hub', 'Service Center', 'Estimate', 'QC', 'Delivery', 'Billing', 'Closure'];



