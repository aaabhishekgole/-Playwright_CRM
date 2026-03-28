import { AuthApi, ServiceRequestApi, UserApi } from '@api/index';
import { authenticatedTest as test, expect } from '@fixtures/index';
import { PickupAssignmentModule } from '@modules/index';
import { buildClaimRegistrationFormData, buildPickupRunnerFormData, toCreatePickupRunnerPayload, toCreateServiceRequestPayload } from '@testdata/factories';
import { config } from '@config/index';
import { DataGenerator } from '@utils/index';

test.describe('@P1 @Regression Pickup Assignment', () => {
  test('should assign a REQUEST_CREATED claim to a live pickup runner and persist the workflow update', async ({ authenticatedPage, request }) => {
    const authApi = new AuthApi(request);
    const userApi = new UserApi(request);
    const serviceRequestApi = new ServiceRequestApi(request);
    const pickupAssignmentModule = new PickupAssignmentModule(authenticatedPage);

    let accessToken = '';
    let runnerName = '';
    let serviceRequestId = 0;
    let requestNumber = '';

    await test.step('Create an admin API session and seed a runner plus claim for assignment', async () => {
      const session = await authApi.login(config.users.admin.username, config.users.admin.password);
      accessToken = session.accessToken;

      const runner = await userApi.createPickupRunner(accessToken, toCreatePickupRunnerPayload(buildPickupRunnerFormData()));
      runnerName = runner.fullName;

      const createdRequest = await serviceRequestApi.create(accessToken, toCreateServiceRequestPayload(buildClaimRegistrationFormData()));
      serviceRequestId = createdRequest.id;
      requestNumber = createdRequest.requestNumber;
    });

    await test.step('Assign the created request from the live assign pickup board', async () => {
      await pickupAssignmentModule.openAssignPickup();
      await pickupAssignmentModule.expectRequestReadyForAssignment(requestNumber, runnerName);
      await pickupAssignmentModule.assignPickup(
        requestNumber,
        runnerName,
        DataGenerator.futureDateTimeLocal(26),
        'Automation scheduled pickup from advanced framework.',
      );
    });

    await test.step('Verify pickup assignment is persisted with runner notification channels', async () => {
      const updatedRequest = await serviceRequestApi.get(accessToken, serviceRequestId);
      expect(updatedRequest.status).toBe('PICKUP_ASSIGNED');
      expect(updatedRequest.pickup?.runnerName).toBe(runnerName);
      expect(updatedRequest.pickup?.runnerPortalLink).toBeTruthy();
      expect(updatedRequest.notifications.some((notification) => notification.channel === 'SMS')).toBeTruthy();
      expect(updatedRequest.notifications.some((notification) => notification.channel === 'WHATSAPP')).toBeTruthy();
      expect(updatedRequest.notifications.some((notification) => notification.channel === 'APP')).toBeTruthy();
    });
  });
});
