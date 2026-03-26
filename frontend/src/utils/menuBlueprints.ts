import type { MenuLeaf, MenuSection } from './menuHierarchy';

type SectionBlueprint = {
  moduleSummary: string;
  widgets: string[];
  actions: string[];
  dbTables: string[];
  apiEndpoints: string[];
  apiMode: string;
  notes: string[];
};

export type MenuBlueprint = {
  screenTitle: string;
  screenSummary: string;
  layout: string;
  primaryPanel: string;
  secondaryPanel: string;
  widgets: string[];
  actions: string[];
  dbTables: string[];
  apiEndpoints: string[];
  apiMode: string;
  notes: string[];
};

const sectionBlueprints: Record<string, SectionBlueprint> = {
  dashboard: {
    moduleSummary: 'Executive landing area for SLA, activity, and escalation monitoring.',
    widgets: ['hero KPI band', 'workflow ribbon', 'alert tiles', 'recent activity strip'],
    actions: ['open queue', 'jump to module', 'review breaches'],
    dbTables: ['service_requests', 'notifications', 'status_history', 'audit_logs', 'invoices'],
    apiEndpoints: ['GET /api/service-requests'],
    apiMode: 'Shared aggregate read model',
    notes: ['Dashboard cards are powered from the request aggregate until dedicated reporting endpoints are added.'],
  },
  'service-requests': {
    moduleSummary: 'Core intake and lifecycle workbench for every service request.',
    widgets: ['request form', 'status board', 'search table', 'request detail drawer'],
    actions: ['create request', 'search request', 'open request detail', 'change status'],
    dbTables: ['service_requests', 'customers', 'devices', 'tenants', 'status_history'],
    apiEndpoints: ['POST /api/service-requests', 'GET /api/service-requests', 'GET /api/service-requests/{id}', 'POST /api/service-requests/{id}/status'],
    apiMode: 'Dedicated request APIs',
    notes: ['This module is the main working screen and the anchor for downstream pickup, estimate, billing, and audit flows.'],
  },
  'pickup-management': {
    moduleSummary: 'Pickup assignment, field collection, and doorstep exception handling.',
    widgets: ['assignment queue', 'pickup card list', 'image capture preview', 'failure reason panel'],
    actions: ['assign pickup', 'upload evidence', 'mark pickup status'],
    dbTables: ['pickups', 'service_requests', 'attachments', 'customers', 'devices'],
    apiEndpoints: ['GET /api/service-requests', 'GET /api/service-requests/{id}', 'POST /api/service-requests/{id}/pickup', 'POST /api/service-requests/{id}/attachments'],
    apiMode: 'Shared request aggregate plus pickup subresource',
    notes: ['Pickup images and doorstep evidence are currently stored as request attachments.'],
  },
  'hub-operations': {
    moduleSummary: 'Hub inward, IMEI and QR verification, and inventory handoff control.',
    widgets: ['scan station', 'verification queue', 'hub inward table', 'inventory cards'],
    actions: ['scan QR', 'validate IMEI', 'mark received at hub', 'send to service center'],
    dbTables: ['service_requests', 'devices', 'attachments', 'status_history', 'tenants'],
    apiEndpoints: ['GET /api/service-requests', 'GET /api/service-requests/{id}', 'POST /api/devices/scan-qr', 'POST /api/service-requests/{id}/status', 'POST /api/service-requests/{id}/attachments'],
    apiMode: 'Shared request aggregate plus device utility endpoint',
    notes: ['Hub inventory is derived from request status and device validation state.'],
  },
  'service-center': {
    moduleSummary: 'Inspection, repair progress, and total-loss handling.',
    widgets: ['inspection queue', 'estimate strip', 'repair tracker', 'exception summary'],
    actions: ['submit estimate', 'update repair status', 'flag total loss'],
    dbTables: ['estimates', 'repairs', 'service_requests', 'devices', 'status_history'],
    apiEndpoints: ['GET /api/service-requests', 'GET /api/service-requests/{id}', 'POST /api/service-requests/{id}/estimate', 'POST /api/service-requests/{id}/status'],
    apiMode: 'Shared request aggregate plus estimate/status mutation',
    notes: ['Repair and inspection state are surfaced through the request aggregate today.'],
  },
  estimates: {
    moduleSummary: 'Estimate decision point for approval, rejection, and history review.',
    widgets: ['approval queue', 'cost summary', 'customer response card', 'estimate timeline'],
    actions: ['create estimate', 'approve estimate', 'reject estimate'],
    dbTables: ['estimates', 'service_requests', 'notifications', 'status_history', 'audit_logs'],
    apiEndpoints: ['GET /api/service-requests', 'GET /api/service-requests/{id}', 'POST /api/service-requests/{id}/estimate', 'POST /api/service-requests/{id}/estimate/approve'],
    apiMode: 'Estimate-specific mutations over request aggregate',
    notes: ['Customer approval state is represented through estimate and request timeline data.'],
  },
  'quality-check': {
    moduleSummary: 'Post-repair validation and rework routing.',
    widgets: ['qc queue', 'pass-fail counters', 'defect checklist', 'rework rail'],
    actions: ['mark QC outcome', 'send for rework', 'clear for dispatch'],
    dbTables: ['repairs', 'service_requests', 'status_history', 'audit_logs'],
    apiEndpoints: ['GET /api/service-requests', 'GET /api/service-requests/{id}', 'POST /api/service-requests/{id}/status'],
    apiMode: 'Status-driven workflow on the request aggregate',
    notes: ['QC currently uses status transitions rather than a dedicated qc_results table.'],
  },
  delivery: {
    moduleSummary: 'Dispatch, final-mile execution, and delivery closure.',
    widgets: ['dispatch queue', 'delivery rider board', 'otp/signature status', 'delivery history table'],
    actions: ['assign delivery', 'start delivery', 'mark delivered', 'mark failed'],
    dbTables: ['deliveries', 'service_requests', 'attachments', 'notifications', 'status_history'],
    apiEndpoints: ['GET /api/service-requests', 'GET /api/service-requests/{id}', 'POST /api/service-requests/{id}/delivery', 'POST /api/service-requests/{id}/status'],
    apiMode: 'Shared request aggregate plus delivery subresource',
    notes: ['Delivery proof is currently represented through status, attachments, and notification context.'],
  },
  billing: {
    moduleSummary: 'GST-compliant invoicing, payments, and refund handling.',
    widgets: ['invoice composer', 'payment ledger', 'refund queue', 'billing report cards'],
    actions: ['generate invoice', 'record payment', 'issue refund'],
    dbTables: ['invoices', 'invoice_items', 'payments', 'service_requests', 'audit_logs'],
    apiEndpoints: ['GET /api/service-requests', 'GET /api/service-requests/{id}', 'POST /api/service-requests/{id}/invoice', 'POST /api/service-requests/{id}/payments', 'POST /api/service-requests/{id}/refunds'],
    apiMode: 'Billing subresources attached to service requests',
    notes: ['Invoice, payment, and refund state is embedded into the request response for the UI.'],
  },
  notifications: {
    moduleSummary: 'Channel logs, retry visibility, and template governance.',
    widgets: ['channel tabs', 'retry queue', 'delivery log table', 'template preview'],
    actions: ['review failed notification', 'inspect payload', 'manage templates'],
    dbTables: ['notifications', 'service_requests', 'audit_logs', 'tenants'],
    apiEndpoints: ['GET /api/service-requests', 'GET /api/service-requests/{id}'],
    apiMode: 'Embedded notification history inside request aggregate',
    notes: ['Dedicated notification admin endpoints are still a backlog item; current screens read from embedded notification payloads.'],
  },
  users: {
    moduleSummary: 'User directory, role slicing, and permission visibility.',
    widgets: ['directory table', 'role chips', 'assignment counters', 'profile summary'],
    actions: ['review users', 'review role coverage', 'inspect workload'],
    dbTables: ['users', 'roles', 'tenants', 'service_requests'],
    apiEndpoints: ['POST /api/auth/login'],
    apiMode: 'Auth endpoint live, admin CRUD pending',
    notes: ['User management screens are mapped in UI, but dedicated CRUD endpoints have not been exposed yet.'],
  },
  reports: {
    moduleSummary: 'Client-facing operational, SLA, and revenue reporting.',
    widgets: ['analytics cards', 'report grid', 'export summary', 'trend feed'],
    actions: ['open report', 'review trend', 'prepare export'],
    dbTables: ['service_requests', 'pickups', 'deliveries', 'invoices', 'payments', 'audit_logs', 'notifications'],
    apiEndpoints: ['GET /api/service-requests', 'GET /api/service-requests/{id}'],
    apiMode: 'Report views built from shared aggregates',
    notes: ['The report layer currently composes from service-request aggregates rather than dedicated reporting endpoints.'],
  },
  settings: {
    moduleSummary: 'System configuration, SLA policy, and storage controls.',
    widgets: ['settings form', 'config summary cards', 'impact panel', 'preview state'],
    actions: ['review config', 'validate config', 'plan config change'],
    dbTables: ['tenants', 'users', 'attachments', 'notifications', 'service_requests'],
    apiEndpoints: ['GET /api/service-requests', 'GET /api/files/access'],
    apiMode: 'Runtime settings are represented indirectly in current APIs',
    notes: ['Dedicated admin endpoints for settings remain a next implementation step.'],
  },
  audit: {
    moduleSummary: 'Enterprise history, before/after changes, and user accountability.',
    widgets: ['audit feed', 'status timeline', 'diff viewer', 'actor filters'],
    actions: ['review change', 'inspect before/after', 'trace status journey'],
    dbTables: ['audit_logs', 'status_history', 'service_requests', 'users'],
    apiEndpoints: ['GET /api/service-requests', 'GET /api/service-requests/{id}'],
    apiMode: 'Audit is surfaced through embedded timeline and audit payloads',
    notes: ['A dedicated audit query API would be the next backend optimization for this area.'],
  },
};

function classifyLayout(itemId: string) {
  if (/create|generate|assign/.test(itemId)) {
    return {
      layout: 'Split form workspace with action form on the left and live queue or validation context on the right.',
      primaryPanel: 'Action form with required inputs, validations, and confirmation state.',
      secondaryPanel: 'Supporting queue, SLA impact, and recent activity rail.',
    };
  }

  if (/search/.test(itemId)) {
    return {
      layout: 'Search-first screen with global search bar, saved filters, result grid, and detail side panel.',
      primaryPanel: 'Search and result grid for fast request lookup.',
      secondaryPanel: 'Result preview drawer with timeline, notifications, and billing snapshot.',
    };
  }

  if (/summary|overview|alerts|report/.test(itemId)) {
    return {
      layout: 'Executive analytics canvas with KPI strip, alert cards, trend table, and drill-down links.',
      primaryPanel: 'Summary cards and analytics table tuned to the selected menu lane.',
      secondaryPanel: 'Trend feed and escalation or export actions.',
    };
  }

  if (/history|logs/.test(itemId)) {
    return {
      layout: 'History and compliance grid with filters, event list, and detail inspector.',
      primaryPanel: 'Chronological event grid or log table.',
      secondaryPanel: 'Detail inspector for before/after, actor, and timestamps.',
    };
  }

  if (/settings|configuration|preferences|templates|roles/.test(itemId)) {
    return {
      layout: 'Configuration screen with editable settings sections, preview state, and impact summary cards.',
      primaryPanel: 'Configuration form or policy matrix.',
      secondaryPanel: 'Preview, validation notes, and downstream impact summary.',
    };
  }

  if (/users|customers|executives|operators/.test(itemId)) {
    return {
      layout: 'Directory workspace with roster table, workload chips, and profile summary drawer.',
      primaryPanel: 'Directory or workload roster for the selected actor group.',
      secondaryPanel: 'Profile summary, permissions, and assignment health.',
    };
  }

  return {
    layout: 'Operational queue screen with filter bar, KPI cards, worklist table, and action side rail.',
    primaryPanel: 'Queue or board view for the selected workflow stage.',
    secondaryPanel: 'Action shortcuts, SLA risk signals, and recent updates.',
  };
}

export function getMenuBlueprint(section: MenuSection, item: MenuLeaf): MenuBlueprint {
  const sectionBlueprint = sectionBlueprints[section.id];
  const layout = classifyLayout(item.id);

  return {
    screenTitle: `${section.label} · ${item.label}`,
    screenSummary: `${item.description} ${sectionBlueprint.moduleSummary}`,
    layout: layout.layout,
    primaryPanel: layout.primaryPanel,
    secondaryPanel: layout.secondaryPanel,
    widgets: sectionBlueprint.widgets,
    actions: sectionBlueprint.actions,
    dbTables: sectionBlueprint.dbTables,
    apiEndpoints: sectionBlueprint.apiEndpoints,
    apiMode: sectionBlueprint.apiMode,
    notes: sectionBlueprint.notes,
  };
}
