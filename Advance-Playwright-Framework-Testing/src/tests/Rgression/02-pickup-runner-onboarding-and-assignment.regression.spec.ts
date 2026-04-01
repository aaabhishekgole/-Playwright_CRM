import { AuthApi, ServiceRequestApi, UserApi } from '@api/index';
import { authenticatedTest as test, expect } from '@fixtures/index';
import { PickupAssignmentModule, PickupRunnerOnboardingModule } from '@modules/index';
import { buildClaimRegistrationFormData, buildPickupRunnerFormData, toCreateServiceRequestPayload } from '@testdata/factories';
import { DataGenerator } from '@utils/index';

test.describe('@DetailedRegression @Regression Pickup Runner Onboarding And Assignment', () => {
  test('should onboard a pickup runner, use the runner in assignment, and persist pickup notifications', async ({ authenticatedPage, request }) => {
    const authApi = new AuthApi(request);
    const serviceRequestApi = new ServiceRequestApi(request);
    const userApi = new UserApi(request);
    const pickupRunnerOnboardingModule = new PickupRunnerOnboardingModule(authenticatedPage);
    const pickupAssignmentModule = new PickupAssignmentModule(authenticatedPage);
    const runnerData = buildPickupRunnerFormData();

    let accessToken = '';
    let requestId = 0;
    let requestNumber = '';

    await test.step('Onboard a new pickup runner through the admin portal', async () => {
      await pickupRunnerOnboardingModule.openRunnerOnboarding();
      await pickupRunnerOnboardingModule.onboardRunner(runnerData);
    });

    await test.step('Confirm the runner appears in the pickup runner roster API and seed a new request', async () => {
      const session = await authApi.login('admin', 'Admin@123');
      accessToken = session.accessToken;

      const pickupRunners = await userApi.list(accessToken, 'PICKUP_AGENT', true);
      expect(pickupRunners.some((runner) => runner.phone === runnerData.phone && runner.fullName === runnerData.fullName)).toBeTruthy();

      const createdRequest = await serviceRequestApi.create(
        accessToken,
        toCreateServiceRequestPayload(buildClaimRegistrationFormData({ issueSummary: 'Runner onboarding detailed regression request' })),
      );
      requestId = createdRequest.id;
      requestNumber = createdRequest.requestNumber;
    });

    await test.step('Assign the new request to the newly onboarded runner from the live board', async () => {
      await pickupAssignmentModule.openAssignPickup();
      await pickupAssignmentModule.expectRequestReadyForAssignment(requestNumber, runnerData.fullName);
      await pickupAssignmentModule.assignPickup(
        requestNumber,
        runnerData.fullName,
        DataGenerator.futureDateTimeLocal(28),
        'Detailed regression pickup assignment for a newly onboarded runner.',
      );
      await pickupAssignmentModule.expectRequestRemoved(requestNumber);
    });

    await test.step('Verify pickup assignment persistence and notification fan-out through the API', async () => {
      const updatedRequest = await serviceRequestApi.get(accessToken, requestId);
      expect(updatedRequest.status).toBe('PICKUP_ASSIGNED');
      expect(updatedRequest.pickup?.runnerName).toBe(runnerData.fullName);
      expect(updatedRequest.pickup?.runnerPortalLink).toBeTruthy();
      expect(updatedRequest.notifications.some((notification) => notification.channel === 'SMS')).toBeTruthy();
      expect(updatedRequest.notifications.some((notification) => notification.channel === 'WHATSAPP')).toBeTruthy();
      expect(updatedRequest.notifications.some((notification) => notification.channel === 'APP')).toBeTruthy();
    });
  });
});
