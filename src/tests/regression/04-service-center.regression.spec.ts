import { expect } from '@playwright/test';
import { authenticatedTest as test } from '@fixtures/index';
import {
  createAdminSession,
  createApprovedEstimateRequest,
  createDiagnosisRequest,
  createRepairCompletedRequest,
  createTotalLossRequest,
  expectRequestVisible,
  getSectionRoutes,
  openRouteAndAssert,
  requestCard,
  waitForRequest,
} from './regression.helpers';

test.describe('@DetailedRegression @Regression Service Center Module', () => {
  test('should load every service center tab', async ({ authenticatedPage }) => {
    for (const route of getSectionRoutes('Service Center')) {
      await openRouteAndAssert(authenticatedPage, route);
    }
  });

  test('should map diagnosis, estimate, repair, and total-loss requests into the correct service-center tabs', async ({ authenticatedPage, request }) => {
    const session = await createAdminSession(request);
    const diagnosisSeed = await createDiagnosisRequest(request, session.accessToken);
    const approvedSeed = await createApprovedEstimateRequest(request, session.accessToken);
    const repairCompletedSeed = await createRepairCompletedRequest(request, session.accessToken);
    const totalLossSeed = await createTotalLossRequest(request, session.accessToken);

    const devicesUnderInspectionRoute = getSectionRoutes('Service Center').find((route) => route.itemId === 'devices-under-inspection');
    const estimateSubmittedRoute = getSectionRoutes('Service Center').find((route) => route.itemId === 'estimate-submitted');
    const underRepairRoute = getSectionRoutes('Service Center').find((route) => route.itemId === 'under-repair');
    const repairCompletedRoute = getSectionRoutes('Service Center').find((route) => route.itemId === 'repair-completed');
    const totalLossRoute = getSectionRoutes('Service Center').find((route) => route.itemId === 'total-loss-cases');
    if (!devicesUnderInspectionRoute || !estimateSubmittedRoute || !underRepairRoute || !repairCompletedRoute || !totalLossRoute) {
      throw new Error('Service center routes are incomplete for regression coverage.');
    }

    await openRouteAndAssert(authenticatedPage, devicesUnderInspectionRoute);
    await expectRequestVisible(authenticatedPage, diagnosisSeed.requestRecord.requestNumber);
    const diagnosisCard = requestCard(authenticatedPage, diagnosisSeed.requestRecord.requestNumber);
    await diagnosisCard.locator('textarea').first().fill('Detailed regression diagnosis for estimate submission.');
    await diagnosisCard.locator('input[type="number"]').nth(0).fill('1450');
    await diagnosisCard.locator('input[type="number"]').nth(1).fill('650');
    await diagnosisCard.locator('input[type="number"]').nth(2).fill('378');
    await diagnosisCard.getByRole('button', { name: 'Submit Estimate' }).click();

    const diagnosisUpdated = await waitForRequest(
      request,
      session.accessToken,
      diagnosisSeed.requestRecord.id,
      (record) => record.status === 'ESTIMATE_PREPARED',
      'service-center estimate submission to complete',
    );
    expect(diagnosisUpdated.status).toBe('ESTIMATE_PREPARED');

    await openRouteAndAssert(authenticatedPage, estimateSubmittedRoute);
    await expectRequestVisible(authenticatedPage, diagnosisSeed.requestRecord.requestNumber);

    await openRouteAndAssert(authenticatedPage, underRepairRoute);
    await expectRequestVisible(authenticatedPage, approvedSeed.requestRecord.requestNumber);

    await openRouteAndAssert(authenticatedPage, repairCompletedRoute);
    await expectRequestVisible(authenticatedPage, repairCompletedSeed.requestRecord.requestNumber);

    await openRouteAndAssert(authenticatedPage, totalLossRoute);
    await expectRequestVisible(authenticatedPage, totalLossSeed.requestRecord.requestNumber);
  });
});
