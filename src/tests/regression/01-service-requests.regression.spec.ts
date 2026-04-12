import { expect } from '@playwright/test';
import { ServiceRequestApi } from '@api/ServiceRequestApi';
import { config } from '@config/index';
import { authenticatedTest as test } from '@fixtures/index';
import { ClaimRegistrationModule } from '@modules/ClaimRegistrationModule';
import { buildClaimRegistrationFormData } from '@testdata/factories';
import { openRouteAndAssert, getSectionRoutes } from './regression.helpers';

test.describe('@DetailedRegression @Regression Service Requests Module', () => {
  test('should load every service request tab', async ({ authenticatedPage }) => {
    for (const route of getSectionRoutes('Service Requests')) {
      await openRouteAndAssert(authenticatedPage, route);
    }
  });

  test('should register a new claim and persist it for admin follow-up', async ({ authenticatedPage, request, adminSession }) => {
    const claimRegistrationModule = new ClaimRegistrationModule(authenticatedPage);
    const claimData = buildClaimRegistrationFormData();
    const serviceRequestApi = new ServiceRequestApi(request);

    await claimRegistrationModule.openClaimRegistration();
    const requestNumber = await claimRegistrationModule.registerClaim(claimData);
    expect(requestNumber).toBeTruthy();

    await expect
      .poll(
        async () => {
          const requests = await serviceRequestApi.list(adminSession.accessToken);
          const created = requests.find((candidate) => candidate.requestNumber === requestNumber);
          return created?.customerPhone ?? null;
        },
        {
          timeout: 90000,
          message: `Waiting for created request ${requestNumber} to be visible through the admin API.`,
        },
      )
      .toBe(claimData.phone);

    await authenticatedPage.goto(config.routes.allRequests);
    await expect(authenticatedPage.getByRole('heading', { name: 'Open Claims' })).toBeVisible();
  });
});
