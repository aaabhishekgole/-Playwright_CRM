import { AuthApi, ServiceRequestApi, UserApi } from '@api/index';
import { test, expect } from '@fixtures/index';
import { buildClaimRegistrationFormData, buildPickupRunnerFormData, toCreatePickupRunnerPayload, toCreateServiceRequestPayload } from '@testdata/factories';

test.describe('@P1 @Regression Runner Pickup Customer Updates', () => {
  test('should persist customer reschedule from the public runner flow and allow reassignment', async ({ request }) => {
    const authApi = new AuthApi(request);
    const userApi = new UserApi(request);
    const serviceRequestApi = new ServiceRequestApi(request);

    const session = await authApi.login('admin', 'Admin@123');
    const runner = await userApi.createPickupRunner(session.accessToken, toCreatePickupRunnerPayload(buildPickupRunnerFormData()));
    const createdRequest = await serviceRequestApi.create(session.accessToken, toCreateServiceRequestPayload(buildClaimRegistrationFormData()));

    const scheduledAt = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString();
    const assignedRequest = await serviceRequestApi.assignPickup(session.accessToken, createdRequest.id, {
      agentId: runner.id,
      scheduledAt,
      pickupOtp: '4826',
      notes: 'Automation scheduled pickup for runner status update coverage.',
    });

    const runnerPortalLink = assignedRequest.pickup?.runnerPortalLink;
    expect(runnerPortalLink).toBeTruthy();

    const runnerToken = new URL(runnerPortalLink as string).pathname.split('/').pop();
    expect(runnerToken).toBeTruthy();

    const customerUpdatedRequest = await serviceRequestApi.updateRunnerPickupStatus(
      runnerToken as string,
      'CUSTOMER_RESCHEDULED',
      'Customer requested pickup on a later slot.',
    );

    expect(customerUpdatedRequest.status).toBe('CUSTOMER_RESCHEDULED');
    expect(customerUpdatedRequest.pickup?.acceptedAt).toBeTruthy();
    expect(customerUpdatedRequest.notifications.some((notification) => notification.subject.includes('Customer Reschedule'))).toBeTruthy();

    const reassignedRequest = await serviceRequestApi.assignPickup(session.accessToken, createdRequest.id, {
      agentId: runner.id,
      scheduledAt: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(),
      pickupOtp: '4826',
      notes: 'Automation reassignment after customer reschedule status.',
    });

    expect(reassignedRequest.status).toBe('PICKUP_ASSIGNED');
    expect(reassignedRequest.pickup?.runnerPortalLink).toBeTruthy();
  });
});
