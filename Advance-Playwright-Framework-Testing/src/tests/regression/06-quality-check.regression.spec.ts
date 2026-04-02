import { expect } from '@playwright/test';
import { authenticatedTest as test } from '@fixtures/index';
import {
  createAdminSession,
  createRepairCompletedRequest,
  expectRequestVisible,
  getRequestById,
  getSectionRoutes,
  openRouteAndAssert,
  requestCard,
} from './regression.helpers';

test.describe('@DetailedRegression @Regression Quality Check Module', () => {
  test('should load every quality-check tab', async ({ authenticatedPage }) => {
    for (const route of getSectionRoutes('Quality Check')) {
      await openRouteAndAssert(authenticatedPage, route);
    }
  });

  test('should drive qc failure, rework, and qc pass across the quality-check tabs', async ({ authenticatedPage, request }) => {
    const session = await createAdminSession(request);
    const qcSeed = await createRepairCompletedRequest(request, session.accessToken);

    const pendingQcRoute = getSectionRoutes('Quality Check').find((route) => route.itemId === 'pending-qc');
    const qcFailedRoute = getSectionRoutes('Quality Check').find((route) => route.itemId === 'qc-failed');
    const reworkRoute = getSectionRoutes('Quality Check').find((route) => route.itemId === 'rework-required');
    const qcPassedRoute = getSectionRoutes('Quality Check').find((route) => route.itemId === 'qc-passed');
    if (!pendingQcRoute || !qcFailedRoute || !reworkRoute || !qcPassedRoute) {
      throw new Error('Quality check routes are incomplete for regression coverage.');
    }

    await openRouteAndAssert(authenticatedPage, pendingQcRoute);
    await expectRequestVisible(authenticatedPage, qcSeed.requestRecord.requestNumber);
    await requestCard(authenticatedPage, qcSeed.requestRecord.requestNumber).getByRole('button', { name: 'QC Failed' }).click();

    const qcFailed = await getRequestById(request, session.accessToken, qcSeed.requestRecord.id);
    expect(qcFailed.status).toBe('REPAIR_IN_PROGRESS');

    await openRouteAndAssert(authenticatedPage, qcFailedRoute);
    await expectRequestVisible(authenticatedPage, qcSeed.requestRecord.requestNumber);

    await openRouteAndAssert(authenticatedPage, reworkRoute);
    await expectRequestVisible(authenticatedPage, qcSeed.requestRecord.requestNumber);
    await requestCard(authenticatedPage, qcSeed.requestRecord.requestNumber).getByRole('button', { name: 'Finish Rework' }).click();

    const reworked = await getRequestById(request, session.accessToken, qcSeed.requestRecord.id);
    expect(reworked.status).toBe('REPAIR_COMPLETED');

    await openRouteAndAssert(authenticatedPage, pendingQcRoute);
    await requestCard(authenticatedPage, qcSeed.requestRecord.requestNumber).getByRole('button', { name: 'QC Passed' }).click();

    const qcPassed = await getRequestById(request, session.accessToken, qcSeed.requestRecord.id);
    expect(qcPassed.status).toBe('READY_FOR_DISPATCH');

    await openRouteAndAssert(authenticatedPage, qcPassedRoute);
    await expectRequestVisible(authenticatedPage, qcSeed.requestRecord.requestNumber);
  });
});

