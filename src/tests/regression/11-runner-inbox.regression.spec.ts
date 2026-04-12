import { AuthApi, RunnerApi } from '@api/index';
import { config } from '@config/index';
import { expect, test } from '@fixtures/index';
import { RunnerInboxModule } from '@modules/index';
import {
  assignPickupViaApi,
  createAdminSession,
  createClaimViaApi,
  extractRunnerToken,
  findPickupRunnerByUsername,
  futureIso,
} from './regression.helpers';

test.describe('@DetailedRegression @Regression Runner Inbox Module', () => {
  test('should deliver a pickup to the runner inbox, support a customer update, and allow reassignment', async ({ page, request }) => {
    const serviceRequestApi = new (await import('@api/ServiceRequestApi')).ServiceRequestApi(request);
    const runnerApi = new RunnerApi(request);
    const runnerInboxModule = new RunnerInboxModule(page);

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
      futureIso(30),
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
      futureIso(52),
      'Detailed regression reassignment after customer reschedule.',
    );

    expect(reassignedRequest.status).toBe('PICKUP_ASSIGNED');
    expect(reassignedRequest.pickup?.runnerPortalLink).toBeTruthy();
  });
});

