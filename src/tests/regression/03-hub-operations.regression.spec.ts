import { expect } from '@playwright/test';
import { authenticatedTest as test } from '@fixtures/index';
import {
  completePickupExecutionByToken,
  createAdminSession,
  createAssignedPickupRequest,
  expectRequestVisible,
  extractRunnerToken,
  getSectionRoutes,
  waitForRequest,
  openRouteAndAssert,
  requestCard,
  transitionRequestStatus,
} from './regression.helpers';

test.describe('@DetailedRegression @Regression Hub Operations Module', () => {
  test('should load every hub operations tab', async ({ authenticatedPage }) => {
    for (const route of getSectionRoutes('Hub Operations')) {
      await openRouteAndAssert(authenticatedPage, route);
    }
  });

  test('should move requests through hub boards and service-center dispatch', async ({ authenticatedPage, request }) => {
    const session = await createAdminSession(request);
    const pickupCompletedSeed = await createAssignedPickupRequest(request, session.accessToken);
    await completePickupExecutionByToken(request, extractRunnerToken(pickupCompletedSeed.requestRecord.pickup?.runnerPortalLink ?? ''));

    const receivedAtHubSeed = await createAssignedPickupRequest(request, session.accessToken);
    await completePickupExecutionByToken(request, extractRunnerToken(receivedAtHubSeed.requestRecord.pickup?.runnerPortalLink ?? ''));
    await transitionRequestStatus(request, session.accessToken, receivedAtHubSeed.requestRecord.id, 'RECEIVED_AT_HUB', 'Received at hub for inward register');

    const receivedAtHubRoute = getSectionRoutes('Hub Operations').find((route) => route.itemId === 'device-received-at-hub');
    const pendingVerificationRoute = getSectionRoutes('Hub Operations').find((route) => route.itemId === 'pending-verification');
    const sendToServiceCenterRoute = getSectionRoutes('Hub Operations').find((route) => route.itemId === 'send-to-service-center');
    const inwardRegisterRoute = getSectionRoutes('Hub Operations').find((route) => route.itemId === 'inward-register');
    const hubInventoryRoute = getSectionRoutes('Hub Operations').find((route) => route.itemId === 'hub-inventory');
    if (!receivedAtHubRoute || !pendingVerificationRoute || !sendToServiceCenterRoute || !inwardRegisterRoute || !hubInventoryRoute) {
      throw new Error('Hub operations routes are incomplete for regression coverage.');
    }

    await openRouteAndAssert(authenticatedPage, receivedAtHubRoute);
    await expectRequestVisible(authenticatedPage, pickupCompletedSeed.requestRecord.requestNumber);
    await requestCard(authenticatedPage, pickupCompletedSeed.requestRecord.requestNumber).getByRole('button', { name: 'Mark Received At Hub' }).click();
    await waitForRequest(
      request,
      session.accessToken,
      pickupCompletedSeed.requestRecord.id,
      (record) => record.status === 'RECEIVED_AT_HUB',
      'hub receive action to complete',
    );

    await openRouteAndAssert(authenticatedPage, pendingVerificationRoute);
    await expectRequestVisible(authenticatedPage, pickupCompletedSeed.requestRecord.requestNumber);
    await expectRequestVisible(authenticatedPage, receivedAtHubSeed.requestRecord.requestNumber);

    await openRouteAndAssert(authenticatedPage, inwardRegisterRoute);
    await expectRequestVisible(authenticatedPage, receivedAtHubSeed.requestRecord.requestNumber);

    await openRouteAndAssert(authenticatedPage, hubInventoryRoute);
    await expectRequestVisible(authenticatedPage, receivedAtHubSeed.requestRecord.requestNumber);

    await openRouteAndAssert(authenticatedPage, sendToServiceCenterRoute);
    const inventoryCard = requestCard(authenticatedPage, receivedAtHubSeed.requestRecord.requestNumber);
    await inventoryCard.getByRole('button', { name: 'Send To Service Center' }).click();
    await waitForRequest(
      request,
      session.accessToken,
      receivedAtHubSeed.requestRecord.id,
      (record) => record.status === 'DIAGNOSIS_IN_PROGRESS',
      'service center dispatch to complete',
    );

    await expect(authenticatedPage).toHaveURL(/workspace\/hub-operations\/send-to-service-center/);
  });
});
