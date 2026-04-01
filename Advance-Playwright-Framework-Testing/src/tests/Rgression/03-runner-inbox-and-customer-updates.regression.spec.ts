import { AuthApi, RunnerApi, ServiceRequestApi } from '@api/index';
import { config } from '@config/index';
import { expect, test } from '@fixtures/index';
import { RunnerInboxModule } from '@modules/index';
import { createAdminSession, createClaimViaApi, extractRunnerToken, findPickupRunnerByUsername, assignPickupViaApi } from './regression.helpers';

test.describe('@DetailedRegression @Regression Runner Inbox And Customer Updates', () => {
  test('should deliver a pickup to the seeded runner inbox, allow a public customer update, and support reassignment', async ({ page, request }) => {
    const serviceRequestApi = new ServiceRequestApi(request);
    const runnerApi = new RunnerApi(request);
    const runnerInboxModule = new RunnerInboxModule(page);

    await test.step('Seed a request assigned to the framework pickup runner through the API layer', async () => {
      const adminSession = await createAdminSession(request);
      const seededRunner = await findPickupRunnerByUsername(request, adminSession.accessToken, config.users.pickupRunner.username);
      const { createdRequest } = await createClaimViaApi(request, adminSession.accessToken, {
        issueSummary: 'Detailed regression runner inbox request',
      });

      const assignedRequest = await assignPickupViaApi(
        request,
        adminSession.accessToken,
        createdRequest.id,
        seededRunner.id,
        new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString(),
        'Detailed regression runner assignment through API.',
      );

      const runnerPortalLink = assignedRequest.pickup?.runnerPortalLink;
      expect(runnerPortalLink).toBeTruthy();

      const runnerSession = await new AuthApi(request).login(config.users.pickupRunner.username, config.users.pickupRunner.password);
      const runnerNotifications = await runnerApi.notifications(runnerSession.accessToken);
      expect(runnerNotifications.some((notification) => notification.requestNumber === createdRequest.requestNumber)).toBeTruthy();

      await runnerInboxModule.openRunnerInbox();
      await runnerInboxModule.signIn(
        config.users.pickupRunner.phone ?? config.users.pickupRunner.username,
        config.users.pickupRunner.password,
      );
      await expect(page.getByText(createdRequest.requestNumber).first()).toBeVisible();

      const runnerToken = extractRunnerToken(runnerPortalLink as string);
      const customerUpdatedRequest = await serviceRequestApi.updateRunnerPickupStatus(
        runnerToken,
        'CUSTOMER_RESCHEDULED',
        'Customer requested a later pickup slot during detailed regression.',
      );

      expect(customerUpdatedRequest.status).toBe('CUSTOMER_RESCHEDULED');
      expect(customerUpdatedRequest.pickup?.acceptedAt).toBeTruthy();
      expect(customerUpdatedRequest.notifications.some((notification) => notification.subject.includes('Customer Reschedule'))).toBeTruthy();

      const reassignedRequest = await assignPickupViaApi(
        request,
        adminSession.accessToken,
        createdRequest.id,
        seededRunner.id,
        new Date(Date.now() + 52 * 60 * 60 * 1000).toISOString(),
        'Detailed regression reassignment after customer reschedule.',
      );

      expect(reassignedRequest.status).toBe('PICKUP_ASSIGNED');
      expect(reassignedRequest.pickup?.runnerPortalLink).toBeTruthy();
    });
  });
});
