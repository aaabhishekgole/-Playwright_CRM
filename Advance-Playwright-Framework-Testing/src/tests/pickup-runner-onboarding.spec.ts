import { AuthApi, ServiceRequestApi } from '@api/index';
import { authenticatedTest as test } from '@fixtures/index';
import { PickupAssignmentModule, PickupRunnerOnboardingModule } from '@modules/index';
import { buildClaimRegistrationFormData, buildPickupRunnerFormData, toCreateServiceRequestPayload } from '@testdata/factories';
import { config } from '@config/index';

test.describe('@P1 @Regression Pickup Runner Onboarding', () => {
  test('should onboard a pickup runner and expose the runner in the assign pickup dropdown', async ({ authenticatedPage, request }) => {
    const authApi = new AuthApi(request);
    const serviceRequestApi = new ServiceRequestApi(request);
    const pickupRunnerOnboardingModule = new PickupRunnerOnboardingModule(authenticatedPage);
    const pickupAssignmentModule = new PickupAssignmentModule(authenticatedPage);
    const runnerData = buildPickupRunnerFormData();

    let accessToken = '';
    let requestNumber = '';

    await test.step('Onboard a new runner from the admin portal', async () => {
      await pickupRunnerOnboardingModule.openRunnerOnboarding();
      await pickupRunnerOnboardingModule.onboardRunner(runnerData);
    });

    await test.step('Seed a REQUEST_CREATED claim that should use the new runner in assign pickup', async () => {
      const session = await authApi.login(config.users.admin.username, config.users.admin.password);
      accessToken = session.accessToken;
      const createdRequest = await serviceRequestApi.create(accessToken, toCreateServiceRequestPayload(buildClaimRegistrationFormData()));
      requestNumber = createdRequest.requestNumber;
    });

    await test.step('Verify the onboarded runner is visible in the assign pickup dropdown', async () => {
      await pickupAssignmentModule.openAssignPickup();
      await pickupAssignmentModule.expectRequestReadyForAssignment(requestNumber, runnerData.fullName);
    });
  });
});
