import { expect } from '@playwright/test';
import { authenticatedTest as test } from '@fixtures/index';
import {
  createAdminSession,
  createCashlessPendingRequest,
  createEstimatePreparedRequest,
  expectRequestVisible,
  getSectionRoutes,
  openRouteAndAssert,
  requestCard,
  waitForRequest,
} from './regression.helpers';

test.describe('@DetailedRegression @Regression Estimates And Cashless Modules', () => {
  test('should load every estimate and cashless tab', async ({ authenticatedPage }) => {
    for (const route of [...getSectionRoutes('Estimates'), ...getSectionRoutes('Cashless')]) {
      await openRouteAndAssert(authenticatedPage, route);
    }
  });

  test('should approve and revise estimates from the approval desk', async ({ authenticatedPage, request }) => {
    const session = await createAdminSession(request);
    const approvalSeed = await createEstimatePreparedRequest(request, session.accessToken);
    const revisionSeed = await createEstimatePreparedRequest(request, session.accessToken);

    const newEstimatesRoute = getSectionRoutes('Estimates').find((route) => route.itemId === 'new-estimates');
    const approvedEstimatesRoute = getSectionRoutes('Estimates').find((route) => route.itemId === 'approved-estimates');
    const awaitingApprovalRoute = getSectionRoutes('Estimates').find((route) => route.itemId === 'awaiting-customer-approval');
    if (!newEstimatesRoute || !approvedEstimatesRoute || !awaitingApprovalRoute) {
      throw new Error('Estimate routes are incomplete for regression coverage.');
    }

    await openRouteAndAssert(authenticatedPage, newEstimatesRoute);
    await expectRequestVisible(authenticatedPage, approvalSeed.requestRecord.requestNumber);
    await expectRequestVisible(authenticatedPage, revisionSeed.requestRecord.requestNumber);

    await openRouteAndAssert(authenticatedPage, awaitingApprovalRoute);
    await requestCard(authenticatedPage, revisionSeed.requestRecord.requestNumber).getByRole('button', { name: 'Request Revision' }).click();
    await requestCard(authenticatedPage, approvalSeed.requestRecord.requestNumber).getByRole('button', { name: 'Approve Estimate' }).click();

    const revisedRequest = await waitForRequest(
      request,
      session.accessToken,
      revisionSeed.requestRecord.id,
      (record) => record.status === 'DIAGNOSIS_IN_PROGRESS',
      'estimate revision to move back to diagnosis',
    );
    const approvedRequest = await waitForRequest(
      request,
      session.accessToken,
      approvalSeed.requestRecord.id,
      (record) => record.status === 'ESTIMATE_APPROVED',
      'estimate approval to complete',
    );
    expect(revisedRequest.status).toBe('DIAGNOSIS_IN_PROGRESS');
    expect(approvedRequest.status).toBe('ESTIMATE_APPROVED');

    await openRouteAndAssert(authenticatedPage, approvedEstimatesRoute);
    await expectRequestVisible(authenticatedPage, approvalSeed.requestRecord.requestNumber);
  });

  test('should map cashless evidence and approval into pending and approved queues', async ({ authenticatedPage, request }) => {
    const session = await createAdminSession(request);
    const pendingEvidenceSeed = await createEstimatePreparedRequest(request, session.accessToken);
    const cashlessReviewSeed = await createCashlessPendingRequest(request, session.accessToken);

    const pendingPhotosRoute = getSectionRoutes('Cashless').find((route) => route.itemId === 'pending-photos');
    const approvalQueueRoute = getSectionRoutes('Cashless').find((route) => route.itemId === 'approval-queue');
    const approvedCasesRoute = getSectionRoutes('Cashless').find((route) => route.itemId === 'approved-cases');
    if (!pendingPhotosRoute || !approvalQueueRoute || !approvedCasesRoute) {
      throw new Error('Cashless routes are incomplete for regression coverage.');
    }

    await openRouteAndAssert(authenticatedPage, pendingPhotosRoute);
    await expectRequestVisible(authenticatedPage, pendingEvidenceSeed.requestRecord.requestNumber);

    await openRouteAndAssert(authenticatedPage, approvalQueueRoute);
    await expectRequestVisible(authenticatedPage, cashlessReviewSeed.requestRecord.requestNumber);
    await requestCard(authenticatedPage, cashlessReviewSeed.requestRecord.requestNumber).getByRole('button', { name: 'Approve Cashless' }).click();

    const cashlessApproved = await waitForRequest(
      request,
      session.accessToken,
      cashlessReviewSeed.requestRecord.id,
      (record) => record.status === 'CASHLESS_APPROVED',
      'cashless approval to complete',
    );
    expect(cashlessApproved.status).toBe('CASHLESS_APPROVED');

    await openRouteAndAssert(authenticatedPage, approvedCasesRoute);
    await expectRequestVisible(authenticatedPage, cashlessReviewSeed.requestRecord.requestNumber);
  });
});
