import { expect } from '@playwright/test';
import { config } from '@config/index';
import { authenticatedTest as test } from '@fixtures/index';
import { PickupAssignmentModule } from '@modules/PickupAssignmentModule';
import { PickupRunnerOnboardingModule } from '@modules/PickupRunnerOnboardingModule';
import { buildPickupRunnerFormData } from '@testdata/factories';
import {
  createAdminSession,
  createClaimViaApi,
  expectRequestVisible,
  extractRunnerToken,
  getRequestById,
  getSectionRoutes,
  openRouteAndAssert,
} from './regression.helpers';

test.describe('@DetailedRegression @Regression Pickup Management Module', () => {
  test('should load every pickup management tab', async ({ authenticatedPage }) => {
    for (const route of getSectionRoutes('Pickup Management')) {
      await openRouteAndAssert(authenticatedPage, route);
    }
  });

  test('should onboard a pickup runner, assign a request, and expose the request across pickup tabs', async ({ authenticatedPage, request }) => {
    const session = await createAdminSession(request);
    const runnerData = buildPickupRunnerFormData();
    const pickupRunnerOnboardingModule = new PickupRunnerOnboardingModule(authenticatedPage);
    const pickupAssignmentModule = new PickupAssignmentModule(authenticatedPage);

    await pickupRunnerOnboardingModule.openRunnerOnboarding();
    await pickupRunnerOnboardingModule.onboardRunner(runnerData);

    const { createdRequest } = await createClaimViaApi(request, session.accessToken);

    await pickupAssignmentModule.openAssignPickup();
    await pickupAssignmentModule.expectRequestReadyForAssignment(createdRequest.requestNumber, runnerData.fullName);
    await pickupAssignmentModule.assignPickup(
      createdRequest.requestNumber,
      runnerData.fullName,
      '2026-04-05T11:00',
      'Regression pickup assignment from admin board.',
    );

    const assignedRequest = await getRequestById(request, session.accessToken, createdRequest.id);
    expect(assignedRequest.status).toBe('PICKUP_ASSIGNED');
    expect(assignedRequest.pickup?.runnerPortalLink).toBeTruthy();

    const pendingPickupRoute = getSectionRoutes('Pickup Management').find((route) => route.itemId === 'pending-pickup');
    const failedPickupRoute = getSectionRoutes('Pickup Management').find((route) => route.itemId === 'pickup-failed-cases');
    const pickupHistoryRoute = getSectionRoutes('Pickup Management').find((route) => route.itemId === 'pickup-history');
    if (!pendingPickupRoute || !failedPickupRoute || !pickupHistoryRoute) {
      throw new Error('Pickup management routes are incomplete for regression coverage.');
    }

    await openRouteAndAssert(authenticatedPage, pendingPickupRoute);
    await expectRequestVisible(authenticatedPage, assignedRequest.requestNumber);

    const runnerToken = extractRunnerToken(assignedRequest.pickup?.runnerPortalLink ?? '');
    await request.post(`${config.apiBaseUrl}/public/pickups/${runnerToken}/status`, {
      data: {
        targetStatus: 'CUSTOMER_RESCHEDULED',
        remarks: 'Customer asked for a later slot from regression coverage.',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    await openRouteAndAssert(authenticatedPage, failedPickupRoute);
    await expectRequestVisible(authenticatedPage, assignedRequest.requestNumber);

    await request.post(`${config.apiBaseUrl}/public/pickups/${runnerToken}/status`, {
      data: {
        targetStatus: 'PICKUP_COMPLETED',
        remarks: 'Pickup completed from regression coverage.',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    await openRouteAndAssert(authenticatedPage, pickupHistoryRoute);
    await expectRequestVisible(authenticatedPage, assignedRequest.requestNumber);
  });
});
