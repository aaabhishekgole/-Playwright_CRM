import { expect } from '@playwright/test';
import { test } from '@fixtures/index';
import {
  PICKUP_EVIDENCE_TYPES,
  acceptPickupByToken,
  assignDeliveryViaApi,
  completePickupByToken,
  createAdminSession,
  createAssignedPickupRequest,
  createEstimateViaApi,
  createInvoiceViaApi,
  extractRunnerToken,
  findActiveUserByRole,
  getRequestById,
  recordPaymentViaApi,
  reconcilePaymentViaApi,
  transitionRequestStatus,
  uploadPickupAttachmentByToken,
} from './regression.helpers';

test.describe('@DetailedRegression @Regression Full Workflow', () => {
  test('should persist a request from pickup through billing closure with real API-backed transitions', async ({ request }) => {
    const session = await createAdminSession(request);
    const seeded = await createAssignedPickupRequest(request, session.accessToken);
    const runnerToken = extractRunnerToken(seeded.requestRecord.pickup?.runnerPortalLink ?? '');

    await acceptPickupByToken(request, runnerToken);
    for (const attachmentType of PICKUP_EVIDENCE_TYPES) {
      await uploadPickupAttachmentByToken(request, runnerToken, attachmentType, `Full workflow ${attachmentType}`);
    }
    await completePickupByToken(request, runnerToken);

    await transitionRequestStatus(request, session.accessToken, seeded.requestRecord.id, 'RECEIVED_AT_HUB', 'Received at hub from full workflow regression');
    await transitionRequestStatus(request, session.accessToken, seeded.requestRecord.id, 'DIAGNOSIS_IN_PROGRESS', 'Moved to diagnosis from full workflow regression');
    await createEstimateViaApi(request, session.accessToken, seeded.requestRecord.id, 'End-to-end full workflow diagnosis', 1600, 800, 432);
    await transitionRequestStatus(request, session.accessToken, seeded.requestRecord.id, 'ESTIMATE_APPROVED', 'Estimate approved from full workflow regression');
    await transitionRequestStatus(request, session.accessToken, seeded.requestRecord.id, 'REPAIR_IN_PROGRESS', 'Repair started from full workflow regression');
    await transitionRequestStatus(request, session.accessToken, seeded.requestRecord.id, 'REPAIR_COMPLETED', 'Repair completed from full workflow regression');
    await transitionRequestStatus(request, session.accessToken, seeded.requestRecord.id, 'READY_FOR_DISPATCH', 'QC passed from full workflow regression');

    const deliveryAgent = await findActiveUserByRole(request, session.accessToken, 'DELIVERY_AGENT');
    await assignDeliveryViaApi(request, session.accessToken, seeded.requestRecord.id, deliveryAgent.id);
    await transitionRequestStatus(request, session.accessToken, seeded.requestRecord.id, 'OUT_FOR_DELIVERY', 'Out for delivery from full workflow regression');
    await transitionRequestStatus(request, session.accessToken, seeded.requestRecord.id, 'DELIVERED', 'Delivered from full workflow regression');

    const invoiced = await createInvoiceViaApi(request, session.accessToken, seeded.requestRecord.id);
    const paid = await recordPaymentViaApi(request, session.accessToken, seeded.requestRecord.id, Number(invoiced.invoice?.amountDue ?? 1000), `PAY-FULL-${Date.now()}`);
    const paymentId = paid.payments.at(-1)?.id;
    if (!paymentId) {
      throw new Error('Payment was not created for the full workflow regression.');
    }
    await reconcilePaymentViaApi(request, session.accessToken, seeded.requestRecord.id, paymentId, 'RECONCILED', 'Fully reconciled from end-to-end regression');
    await transitionRequestStatus(request, session.accessToken, seeded.requestRecord.id, 'CLOSED', 'Closed after full workflow regression');

    const finalRequest = await getRequestById(request, session.accessToken, seeded.requestRecord.id);
    expect(finalRequest.status).toBe('CLOSED');
    expect(finalRequest.attachments.filter((attachment) => attachment.attachmentType.startsWith('PICKUP_IMAGE_')).length).toBe(10);
    expect(finalRequest.invoice?.invoiceNumber).toBeTruthy();
    expect(finalRequest.payments.length).toBeGreaterThan(0);
    expect(finalRequest.timeline.some((entry) => entry.toStatus === 'DELIVERED')).toBeTruthy();
    expect(finalRequest.timeline.some((entry) => entry.toStatus === 'CLOSED')).toBeTruthy();
  });
});
