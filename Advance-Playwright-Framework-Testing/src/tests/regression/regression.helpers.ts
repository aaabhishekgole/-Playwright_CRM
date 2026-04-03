import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { AuthApi } from '@api/AuthApi';
import { ServiceRequestApi } from '@api/ServiceRequestApi';
import { UserApi } from '@api/UserApi';
import { config } from '@config/index';
import { NavigationModule } from '@modules/NavigationModule';
import { AppLayoutPage } from '@pages/AppLayoutPage';
import { adminMenuRoutes } from '@testdata/adminMenuRoutes';
import {
  buildClaimRegistrationFormData,
  buildPickupRunnerFormData,
  toCreatePickupRunnerPayload,
  toCreateServiceRequestPayload,
} from '@testdata/factories';
import type {
  AdminMenuRoute,
  ClaimRegistrationFormData,
  FrameworkUserKey,
  LoginResponse,
  PickupRunnerFormData,
  ServiceRequestRecord,
  UserSummary,
} from '@testdata/types';

export type WorkflowPayment = {
  id: number;
  paymentReference: string;
  amount: number;
  paymentMethod: string;
  reconciliationStatus?: string | null;
  reconciliationRemarks?: string | null;
  paymentStatus?: string;
  refundStatus?: string;
  utrNumber?: string | null;
};

export type WorkflowInvoice = {
  invoiceNumber: string;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  refundAmount: number;
  paymentStatus: string;
};

export type WorkflowAttachment = {
  id: number;
  attachmentType: string;
  fileName: string;
};

export type WorkflowTimelineItem = {
  toStatus: string;
  remarks: string;
};

export type WorkflowRequest = ServiceRequestRecord & {
  status: string;
  attachments: WorkflowAttachment[];
  timeline: WorkflowTimelineItem[];
  payments: WorkflowPayment[];
  invoice?: WorkflowInvoice | null;
  deliveryAgent?: string | null;
  technician?: string | null;
  updatedAt?: string;
};

type PaymentReconciliationStatus = 'PENDING' | 'RECONCILED' | 'MISMATCHED';

export const PICKUP_EVIDENCE_TYPES = [
  'PICKUP_IMAGE_FRONT',
  'PICKUP_IMAGE_BACK',
  'PICKUP_IMAGE_LEFT',
  'PICKUP_IMAGE_RIGHT',
  'PICKUP_IMAGE_TOP',
  'PICKUP_IMAGE_BOTTOM',
  'PICKUP_IMAGE_DISPLAY_ON',
  'PICKUP_IMAGE_SERIAL_LABEL',
  'PICKUP_IMAGE_DAMAGE_CLOSEUP',
  'PICKUP_IMAGE_ACCESSORIES',
] as const;

export const CASHLESS_DEVICE_EVIDENCE_TYPES = [
  'CASHLESS_DEVICE_IMAGE_FRONT',
  'CASHLESS_DEVICE_IMAGE_BACK',
  'CASHLESS_DEVICE_IMAGE_LEFT',
  'CASHLESS_DEVICE_IMAGE_RIGHT',
  'CASHLESS_DEVICE_IMAGE_TOP',
  'CASHLESS_DEVICE_IMAGE_BOTTOM',
] as const;

export const CASHLESS_DAMAGE_EVIDENCE_TYPES = [
  'CASHLESS_DAMAGE_IMAGE_1',
  'CASHLESS_DAMAGE_IMAGE_2',
  'CASHLESS_DAMAGE_IMAGE_3',
  'CASHLESS_DAMAGE_IMAGE_4',
] as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function bearer(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function apiUrl(path: string) {
  return `${config.apiBaseUrl}${path}`;
}

function svgBuffer(label: string) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="100%" height="100%" fill="#f4f7fb"/><text x="20" y="120" font-size="18" fill="#0f172a">${label}</text></svg>`,
    'utf8',
  );
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

const SESSION_TTL_MS = 4 * 60 * 1000;
const sessionCache = new Map<FrameworkUserKey, { session: LoginResponse; createdAt: number }>();

async function createSessionWithRetry(request: APIRequestContext, userKey: FrameworkUserKey) {
  const authApi = new AuthApi(request);
  const credentials = config.users[userKey];
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await authApi.login(credentials.username, credentials.password);
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await delay(1000 * attempt);
      }
    }
  }

  throw lastError;
}

export function futureIso(hoursFromNow = 26) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

export function futureLocalInput(daysFromNow = 2) {
  const value = new Date();
  value.setDate(value.getDate() + daysFromNow);
  value.setHours(11, 0, 0, 0);
  const timezoneOffset = value.getTimezoneOffset();
  const localValue = new Date(value.getTime() - timezoneOffset * 60000);
  return localValue.toISOString().slice(0, 16);
}

export async function createAdminSession(request: APIRequestContext): Promise<LoginResponse> {
  const cached = sessionCache.get('admin');
  if (cached && Date.now() - cached.createdAt < SESSION_TTL_MS) {
    return cached.session;
  }

  const session = await createSessionWithRetry(request, 'admin');
  sessionCache.set('admin', {
    session,
    createdAt: Date.now(),
  });
  return session;
}

export async function createPickupRunnerSession(request: APIRequestContext): Promise<LoginResponse> {
  const cached = sessionCache.get('pickupRunner');
  if (cached && Date.now() - cached.createdAt < SESSION_TTL_MS) {
    return cached.session;
  }

  const session = await createSessionWithRetry(request, 'pickupRunner');
  sessionCache.set('pickupRunner', {
    session,
    createdAt: Date.now(),
  });
  return session;
}

export async function createClaimViaApi(
  request: APIRequestContext,
  accessToken: string,
  overrides: Partial<ClaimRegistrationFormData> = {},
) {
  const serviceRequestApi = new ServiceRequestApi(request);
  const claimData = buildClaimRegistrationFormData(overrides);
  const createdRequest = await serviceRequestApi.create(accessToken, toCreateServiceRequestPayload(claimData)) as WorkflowRequest;
  return { claimData, createdRequest };
}

export async function onboardRunnerViaApi(
  request: APIRequestContext,
  accessToken: string,
  overrides: Partial<PickupRunnerFormData> = {},
) {
  const userApi = new UserApi(request);
  const runnerData = buildPickupRunnerFormData(overrides);
  const runner = await userApi.createPickupRunner(accessToken, toCreatePickupRunnerPayload(runnerData));
  return { runnerData, runner };
}

export async function findActiveUserByRole(
  request: APIRequestContext,
  accessToken: string,
  role: string,
): Promise<UserSummary> {
  const userApi = new UserApi(request);
  const users = await userApi.list(accessToken, role, true);
  const activeUser = users.find((candidate) => candidate.active);
  if (!activeUser) {
    throw new Error(`No active ${role} user was found for regression setup.`);
  }
  return activeUser;
}

export async function findPickupRunnerByUsername(
  request: APIRequestContext,
  accessToken: string,
  username: string,
): Promise<UserSummary> {
  const userApi = new UserApi(request);
  const pickupRunners = await userApi.list(accessToken, 'PICKUP_AGENT', true);
  const runner = pickupRunners.find((candidate) => candidate.username === username);
  if (!runner) {
    throw new Error(`Pickup runner ${username} was not found in the active runner roster.`);
  }
  return runner;
}

export async function getRequestById(request: APIRequestContext, accessToken: string, requestId: number) {
  const serviceRequestApi = new ServiceRequestApi(request);
  return serviceRequestApi.get(accessToken, requestId) as Promise<WorkflowRequest>;
}

export async function waitForRequest(
  request: APIRequestContext,
  accessToken: string,
  requestId: number,
  predicate: (record: WorkflowRequest) => boolean,
  description: string,
  timeout = 60000,
): Promise<WorkflowRequest> {
  let latestRecord: WorkflowRequest | null = null;

  await expect
    .poll(
      async () => {
        latestRecord = await getRequestById(request, accessToken, requestId);
        return latestRecord ? predicate(latestRecord) : false;
      },
      {
        timeout,
        message: `Waiting for request ${requestId} to satisfy: ${description}`,
      },
    )
    .toBeTruthy();

  if (!latestRecord) {
    throw new Error(`Polling finished without loading request ${requestId}.`);
  }

  return latestRecord;
}

export async function assignPickupViaApi(
  request: APIRequestContext,
  accessToken: string,
  serviceRequestId: number,
  agentId: number,
  scheduledAtIso = futureIso(),
  notes = 'Automation scheduled pickup from regression suite.',
) {
  const serviceRequestApi = new ServiceRequestApi(request);
  return serviceRequestApi.assignPickup(accessToken, serviceRequestId, {
    agentId,
    scheduledAt: scheduledAtIso,
    pickupOtp: '4826',
    notes,
  }) as Promise<WorkflowRequest>;
}

export async function transitionRequestStatus(
  request: APIRequestContext,
  accessToken: string,
  serviceRequestId: number,
  targetStatus: string,
  remarks: string,
) {
  const response = await request.post(apiUrl(`/service-requests/${serviceRequestId}/status`), {
    headers: {
      'Content-Type': 'application/json',
      ...bearer(accessToken),
    },
    data: {
      targetStatus,
      remarks,
    },
  });

  const text = await response.text();
  if (!response.ok()) {
    throw new Error(text || `Unable to transition request ${serviceRequestId} to ${targetStatus}.`);
  }

  return JSON.parse(text) as WorkflowRequest;
}

export async function createEstimateViaApi(
  request: APIRequestContext,
  accessToken: string,
  serviceRequestId: number,
  diagnosisSummary = 'Regression diagnosis summary',
  partsCost = 1200,
  laborCost = 600,
  taxAmount = 324,
) {
  const response = await request.post(apiUrl(`/service-requests/${serviceRequestId}/estimate`), {
    headers: {
      'Content-Type': 'application/json',
      ...bearer(accessToken),
    },
    data: {
      diagnosisSummary,
      partsCost,
      laborCost,
      taxAmount,
    },
  });

  const text = await response.text();
  if (!response.ok()) {
    throw new Error(text || `Unable to create estimate for request ${serviceRequestId}.`);
  }

  return JSON.parse(text) as WorkflowRequest;
}

export async function approveEstimateViaApi(
  request: APIRequestContext,
  accessToken: string,
  serviceRequestId: number,
  remarks = 'Approved from regression suite',
) {
  const response = await request.post(apiUrl(`/service-requests/${serviceRequestId}/estimate/approve`), {
    headers: {
      'Content-Type': 'application/json',
      ...bearer(accessToken),
    },
    data: {
      remarks,
    },
  });

  const text = await response.text();
  if (!response.ok()) {
    throw new Error(text || `Unable to approve estimate for request ${serviceRequestId}.`);
  }

  return JSON.parse(text) as WorkflowRequest;
}

export async function assignDeliveryViaApi(
  request: APIRequestContext,
  accessToken: string,
  serviceRequestId: number,
  agentId: number,
  scheduledAtIso = futureIso(),
  notes = 'Regression suite delivery assignment',
) {
  const response = await request.post(apiUrl(`/service-requests/${serviceRequestId}/delivery`), {
    headers: {
      'Content-Type': 'application/json',
      ...bearer(accessToken),
    },
    data: {
      agentId,
      scheduledAt: scheduledAtIso,
      otpCode: '8246',
      notes,
    },
  });

  const text = await response.text();
  if (!response.ok()) {
    throw new Error(text || `Unable to assign delivery for request ${serviceRequestId}.`);
  }

  return JSON.parse(text) as WorkflowRequest;
}

export async function uploadServiceAttachmentViaApi(
  request: APIRequestContext,
  accessToken: string,
  serviceRequestId: number,
  attachmentType: string,
  label = attachmentType,
) {
  const response = await request.post(apiUrl(`/service-requests/${serviceRequestId}/attachments`), {
    headers: bearer(accessToken),
    multipart: {
      attachmentType,
      file: {
        name: `${attachmentType.toLowerCase()}.svg`,
        mimeType: 'image/svg+xml',
        buffer: svgBuffer(label),
      },
    },
  });

  const text = await response.text();
  if (!response.ok()) {
    throw new Error(text || `Unable to upload ${attachmentType} for request ${serviceRequestId}.`);
  }

  return JSON.parse(text) as WorkflowRequest;
}

export async function uploadPickupAttachmentByToken(
  request: APIRequestContext,
  pickupToken: string,
  attachmentType: string,
  label = attachmentType,
) {
  const response = await request.post(apiUrl(`/public/pickups/${pickupToken}/attachments`), {
    multipart: {
      attachmentType,
      file: {
        name: `${attachmentType.toLowerCase()}.svg`,
        mimeType: 'image/svg+xml',
        buffer: svgBuffer(label),
      },
    },
  });

  const text = await response.text();
  if (!response.ok()) {
    throw new Error(text || `Unable to upload pickup attachment ${attachmentType}.`);
  }

  return JSON.parse(text) as WorkflowRequest;
}

export async function acceptPickupByToken(request: APIRequestContext, pickupToken: string) {
  const response = await request.post(apiUrl(`/public/pickups/${pickupToken}/accept`));
  const text = await response.text();
  if (!response.ok()) {
    throw new Error(text || `Unable to accept pickup token ${pickupToken}.`);
  }
  return JSON.parse(text) as WorkflowRequest;
}

export async function completePickupByToken(request: APIRequestContext, pickupToken: string) {
  const response = await request.post(apiUrl(`/public/pickups/${pickupToken}/complete`));
  const text = await response.text();
  if (!response.ok()) {
    throw new Error(text || `Unable to complete pickup token ${pickupToken}.`);
  }
  return JSON.parse(text) as WorkflowRequest;
}

export async function updatePickupStatusByToken(
  request: APIRequestContext,
  pickupToken: string,
  targetStatus: string,
  remarks: string,
) {
  const response = await request.post(apiUrl(`/public/pickups/${pickupToken}/status`), {
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      targetStatus,
      remarks,
    },
    timeout: config.apiTimeoutMs,
  });

  const text = await response.text();
  if (!response.ok()) {
    throw new Error(text || `Unable to update pickup ${pickupToken} to ${targetStatus}.`);
  }

  return JSON.parse(text) as WorkflowRequest;
}

export async function completePickupExecutionByToken(request: APIRequestContext, pickupToken: string) {
  await acceptPickupByToken(request, pickupToken);
  for (const attachmentType of PICKUP_EVIDENCE_TYPES) {
    await uploadPickupAttachmentByToken(request, pickupToken, attachmentType, `Regression ${attachmentType}`);
  }
  return completePickupByToken(request, pickupToken);
}

export async function completeCashlessEvidenceSet(
  request: APIRequestContext,
  accessToken: string,
  serviceRequestId: number,
) {
  let currentRequest: WorkflowRequest | null = null;

  for (const attachmentType of CASHLESS_DEVICE_EVIDENCE_TYPES) {
    currentRequest = await uploadServiceAttachmentViaApi(request, accessToken, serviceRequestId, attachmentType, `Regression ${attachmentType}`);
  }

  for (const attachmentType of CASHLESS_DAMAGE_EVIDENCE_TYPES) {
    currentRequest = await uploadServiceAttachmentViaApi(request, accessToken, serviceRequestId, attachmentType, `Regression ${attachmentType}`);
  }

  return currentRequest as WorkflowRequest;
}

export async function createInvoiceViaApi(
  request: APIRequestContext,
  accessToken: string,
  serviceRequestId: number,
) {
  const response = await request.post(apiUrl(`/service-requests/${serviceRequestId}/invoice`), {
    headers: {
      'Content-Type': 'application/json',
      ...bearer(accessToken),
    },
    data: {
      billingStateCode: 'MH',
      placeOfSupply: 'MH',
      gstRate: 18,
      laborDescription: 'Repair labour and diagnostics',
      partsDescription: 'Spare parts and consumables',
    },
  });

  const text = await response.text();
  if (!response.ok()) {
    throw new Error(text || `Unable to create invoice for request ${serviceRequestId}. Status ${response.status()}.`);
  }

  return JSON.parse(text) as WorkflowRequest;
}

export async function recordPaymentViaApi(
  request: APIRequestContext,
  accessToken: string,
  serviceRequestId: number,
  amount: number,
  paymentReference = `PAY-${Date.now()}`,
) {
  const response = await request.post(apiUrl(`/service-requests/${serviceRequestId}/payments`), {
    headers: {
      'Content-Type': 'application/json',
      ...bearer(accessToken),
    },
    data: {
      paymentReference,
      amount,
      paymentMethod: 'UPI',
      utrNumber: `UTR-${Date.now()}`,
    },
  });

  const text = await response.text();
  if (!response.ok()) {
    throw new Error(text || `Unable to record payment for request ${serviceRequestId}.`);
  }

  return JSON.parse(text) as WorkflowRequest;
}

export async function reconcilePaymentViaApi(
  request: APIRequestContext,
  accessToken: string,
  serviceRequestId: number,
  paymentId: number,
  reconciliationStatus: PaymentReconciliationStatus,
  remarks = 'Saved from regression suite',
) {
  const response = await request.post(apiUrl(`/service-requests/${serviceRequestId}/payments/${paymentId}/reconcile`), {
    headers: {
      'Content-Type': 'application/json',
      ...bearer(accessToken),
    },
    data: {
      reconciliationStatus,
      remarks,
    },
  });

  const text = await response.text();
  if (!response.ok()) {
    throw new Error(text || `Unable to reconcile payment ${paymentId}.`);
  }

  return JSON.parse(text) as WorkflowRequest;
}

export async function refundPaymentViaApi(
  request: APIRequestContext,
  accessToken: string,
  serviceRequestId: number,
  paymentId: number,
  amount: number,
  reason = 'Regression refund',
) {
  const response = await request.post(apiUrl(`/service-requests/${serviceRequestId}/refunds`), {
    headers: {
      'Content-Type': 'application/json',
      ...bearer(accessToken),
    },
    data: {
      paymentId,
      amount,
      reason,
    },
  });

  const text = await response.text();
  if (!response.ok()) {
    throw new Error(text || `Unable to refund payment ${paymentId}.`);
  }

  return JSON.parse(text) as WorkflowRequest;
}

export async function createAssignedPickupRequest(request: APIRequestContext, accessToken: string) {
  const { runnerData, runner } = await onboardRunnerViaApi(request, accessToken);
  const { claimData, createdRequest } = await createClaimViaApi(request, accessToken);
  const requestRecord = await assignPickupViaApi(request, accessToken, createdRequest.id, runner.id);
  return { claimData, runnerData, runner, requestRecord };
}

export async function createDiagnosisRequest(request: APIRequestContext, accessToken: string) {
  const seeded = await createAssignedPickupRequest(request, accessToken);
  const runnerToken = extractRunnerToken(seeded.requestRecord.pickup?.runnerPortalLink ?? '');
  await completePickupExecutionByToken(request, runnerToken);
  await transitionRequestStatus(request, accessToken, seeded.requestRecord.id, 'RECEIVED_AT_HUB', 'Device inwarded at hub');
  const requestRecord = await transitionRequestStatus(request, accessToken, seeded.requestRecord.id, 'DIAGNOSIS_IN_PROGRESS', 'Sent to service center diagnosis');
  return { ...seeded, requestRecord };
}

export async function createEstimatePreparedRequest(request: APIRequestContext, accessToken: string) {
  const seeded = await createDiagnosisRequest(request, accessToken);
  const requestRecord = await createEstimateViaApi(request, accessToken, seeded.requestRecord.id);
  return { ...seeded, requestRecord };
}

export async function createApprovedEstimateRequest(request: APIRequestContext, accessToken: string) {
  const seeded = await createEstimatePreparedRequest(request, accessToken);
  const requestRecord = await approveEstimateViaApi(request, accessToken, seeded.requestRecord.id);
  return { ...seeded, requestRecord };
}

export async function createCashlessPendingRequest(request: APIRequestContext, accessToken: string) {
  const seeded = await createEstimatePreparedRequest(request, accessToken);
  const requestRecord = await completeCashlessEvidenceSet(request, accessToken, seeded.requestRecord.id);
  return { ...seeded, requestRecord };
}

export async function createRepairCompletedRequest(request: APIRequestContext, accessToken: string) {
  const seeded = await createApprovedEstimateRequest(request, accessToken);
  await transitionRequestStatus(request, accessToken, seeded.requestRecord.id, 'REPAIR_IN_PROGRESS', 'Repair started for regression setup');
  const requestRecord = await transitionRequestStatus(request, accessToken, seeded.requestRecord.id, 'REPAIR_COMPLETED', 'Repair completed for regression setup');
  return { ...seeded, requestRecord };
}

export async function createReadyForDispatchRequest(request: APIRequestContext, accessToken: string) {
  const seeded = await createRepairCompletedRequest(request, accessToken);
  const requestRecord = await transitionRequestStatus(request, accessToken, seeded.requestRecord.id, 'READY_FOR_DISPATCH', 'QC passed for regression setup');
  return { ...seeded, requestRecord };
}

export async function createDeliveredRequest(request: APIRequestContext, accessToken: string) {
  const seeded = await createReadyForDispatchRequest(request, accessToken);
  const deliveryAgent = await findActiveUserByRole(request, accessToken, 'DELIVERY_AGENT');
  await assignDeliveryViaApi(request, accessToken, seeded.requestRecord.id, deliveryAgent.id);
  await transitionRequestStatus(request, accessToken, seeded.requestRecord.id, 'OUT_FOR_DELIVERY', 'Delivery started for regression setup');
  const requestRecord = await transitionRequestStatus(request, accessToken, seeded.requestRecord.id, 'DELIVERED', 'Delivered for regression setup');
  return { ...seeded, deliveryAgent, requestRecord };
}

export async function createInvoicedRequest(request: APIRequestContext, accessToken: string) {
  const seeded = await createDeliveredRequest(request, accessToken);
  const requestRecord = await createInvoiceViaApi(request, accessToken, seeded.requestRecord.id);
  return { ...seeded, requestRecord };
}

export async function createTotalLossRequest(request: APIRequestContext, accessToken: string) {
  const seeded = await createDiagnosisRequest(request, accessToken);
  const requestRecord = await transitionRequestStatus(request, accessToken, seeded.requestRecord.id, 'TOTAL_LOSS', 'Marked as total loss for regression setup');
  return { ...seeded, requestRecord };
}

export function extractRunnerToken(runnerPortalLink: string) {
  return new URL(runnerPortalLink).pathname.split('/').pop() ?? '';
}

export function getSectionRoutes(sectionLabel: string) {
  return adminMenuRoutes.filter((route) => route.sectionLabel === sectionLabel);
}

export function requestCard(page: Page, requestNumber: string) {
  return page.locator('.card, .portal-table-row').filter({ hasText: requestNumber }).first();
}

const queueLoadingPattern = /Loading workflow queue|Loading delivery queue|Loading estimates|Loading claims|Loading pickup dashboard|Loading request/i;
const queueErrorPattern = /Unable to load requests|Unable to load delivery queue|Unable to load estimates|Unable to load claims|Problem loading page/i;
const queueEmptyPattern = /No requests in this stage|No delivery records available|No estimates awaiting approval|No pickup evidence available|No matching claim/i;

const sharedPathItemAliases: Record<string, string[]> = {
  '/timeline': ['Audit Logs', 'Status History'],
};

export async function expectRequestVisible(page: Page, requestNumber: string) {
  const card = requestCard(page, requestNumber);
  const loadingState = page.locator('.workspace-empty').filter({ hasText: queueLoadingPattern }).first();
  const errorState = page
    .locator('.workspace-empty, .portal-banner-error')
    .filter({ hasText: queueErrorPattern })
    .first();
  const emptyState = page.locator('.workspace-empty').filter({ hasText: queueEmptyPattern }).first();
  const loginHeading = page.getByRole('heading', { name: /Login to Gadget Seva Hub|Login/i }).first();

  await expect
    .poll(
      async () => {
        if (await card.isVisible().catch(() => false)) {
          return 'visible';
        }

        if (await loginHeading.isVisible().catch(() => false)) {
          return 'login';
        }
        const loadingVisible = await loadingState.isVisible().catch(() => false);
        const errorVisible = await errorState.isVisible().catch(() => false);
        const emptyVisible = await emptyState.isVisible().catch(() => false);

        if (await card.isVisible().catch(() => false)) {
          return 'visible';
        }

        if (loadingVisible) {
          return 'loading';
        }

        if (errorVisible) {
          return 'error';
        }

        if (emptyVisible) {
          return 'empty';
        }

        return 'waiting';
      },
      {
        timeout: 120000,
        intervals: [1000, 1500, 2000, 3000, 5000],
        message: `Waiting for request ${requestNumber} to appear in the current queue.`,
      },
    )
    .toBe('visible');
}

export async function openRouteAndAssert(page: Page, route: AdminMenuRoute) {
  const navigationModule = new NavigationModule(page);
  const appLayoutPage = new AppLayoutPage(page);
  await navigationModule.openAdminMenuRoute(route);
  const currentContext = appLayoutPage.currentPageContext();
  await expect(currentContext).toContainText(route.sectionLabel);
  const aliases = sharedPathItemAliases[route.path];
  if (aliases) {
    await expect(currentContext).toContainText(new RegExp(aliases.map((alias) => escapeRegExp(alias)).join('|')));
  } else {
    await expect(currentContext).toContainText(route.itemLabel);
  }
  await appLayoutPage.expectPrimaryHeadingVisible();
}

export async function verifySectionTabs(page: Page, sectionLabel: string) {
  for (const route of getSectionRoutes(sectionLabel)) {
    await openRouteAndAssert(page, route);
  }
}
