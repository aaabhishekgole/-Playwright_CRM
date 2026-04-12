import { expect } from '@playwright/test';
import { authenticatedTest as test } from '@fixtures/index';
import { PickupAssignmentModule } from '@modules/PickupAssignmentModule';
import { PickupRunnerOnboardingModule } from '@modules/PickupRunnerOnboardingModule';
import { buildPickupRunnerFormData } from '@testdata/factories';
import {
  acceptPickupByToken,
  assignPickupViaApi,
  completePickupByToken,
  createAdminSession,
  createClaimViaApi,
  expectRequestVisible,
  extractRunnerToken,
  findPickupRunnerByUsername,
  futureIso,
  getRequestById,
  getSectionRoutes,
  openRouteAndAssert,
  updatePickupStatusByToken,
  uploadPickupAttachmentByToken,
  PICKUP_EVIDENCE_TYPES,
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
    if (!runnerData.username) {
      throw new Error('Runner onboarding test data must include a username.');
    }
    const runner = await findPickupRunnerByUsername(request, session.accessToken, runnerData.username);

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
    const pickedUpDevicesRoute = getSectionRoutes('Pickup Management').find((route) => route.itemId === 'picked-up-devices');
    const failedPickupRoute = getSectionRoutes('Pickup Management').find((route) => route.itemId === 'pickup-failed-cases');
    const pickupHistoryRoute = getSectionRoutes('Pickup Management').find((route) => route.itemId === 'pickup-history');
    if (!pendingPickupRoute || !pickedUpDevicesRoute || !failedPickupRoute || !pickupHistoryRoute) {
      throw new Error('Pickup management routes are incomplete for regression coverage.');
    }

    await openRouteAndAssert(authenticatedPage, pendingPickupRoute);
    await expectRequestVisible(authenticatedPage, assignedRequest.requestNumber);

    const runnerToken = extractRunnerToken(assignedRequest.pickup?.runnerPortalLink ?? '');
    await acceptPickupByToken(request, runnerToken);
    await updatePickupStatusByToken(request, runnerToken, 'CUSTOMER_RESCHEDULED', 'Customer asked for a later slot from regression coverage.');

    await openRouteAndAssert(authenticatedPage, failedPickupRoute);
    await expectRequestVisible(authenticatedPage, assignedRequest.requestNumber);

    const reassignedRequest = await assignPickupViaApi(
      request,
      session.accessToken,
      createdRequest.id,
      runner.id,
      futureIso(50),
      'Regression pickup reassignment after customer reschedule.',
    );
    const reassignedRunnerToken = extractRunnerToken(reassignedRequest.pickup?.runnerPortalLink ?? '');
    await acceptPickupByToken(request, reassignedRunnerToken);
    for (const attachmentType of PICKUP_EVIDENCE_TYPES) {
      await uploadPickupAttachmentByToken(request, reassignedRunnerToken, attachmentType, `Pickup management ${attachmentType}`);
    }
    await completePickupByToken(request, reassignedRunnerToken);

    await openRouteAndAssert(authenticatedPage, pickedUpDevicesRoute);
    await expectRequestVisible(authenticatedPage, assignedRequest.requestNumber);

    await openRouteAndAssert(authenticatedPage, pickupHistoryRoute);
    await expectRequestVisible(authenticatedPage, assignedRequest.requestNumber);
  });
});
