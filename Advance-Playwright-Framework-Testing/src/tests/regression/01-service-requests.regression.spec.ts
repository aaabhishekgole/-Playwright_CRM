import { expect } from '@playwright/test';
import { config } from '@config/index';
import { authenticatedTest as test } from '@fixtures/index';
import { ClaimRegistrationModule } from '@modules/ClaimRegistrationModule';
import { buildClaimRegistrationFormData } from '@testdata/factories';
import { openRouteAndAssert, expectRequestVisible, getSectionRoutes } from './regression.helpers';

test.describe('@DetailedRegression @Regression Service Requests Module', () => {
  test('should load every service request tab', async ({ authenticatedPage }) => {
    for (const route of getSectionRoutes('Service Requests')) {
      await openRouteAndAssert(authenticatedPage, route);
    }
  });

  test('should register a new claim and surface it in the admin queues', async ({ authenticatedPage }) => {
    const claimRegistrationModule = new ClaimRegistrationModule(authenticatedPage);
    const claimData = buildClaimRegistrationFormData();

    await claimRegistrationModule.openClaimRegistration();
    const requestNumber = await claimRegistrationModule.registerClaim(claimData);
    expect(requestNumber).toBeTruthy();

    await authenticatedPage.goto(config.routes.allRequests);
    await expect(authenticatedPage.getByRole('heading', { name: 'Open Claims' })).toBeVisible();
    await authenticatedPage.getByLabel('Mobile No.').fill(claimData.phone);
    await authenticatedPage.getByRole('button', { name: 'Search' }).click();
    await expect(authenticatedPage.locator('.portal-table-row.portal-table-body').filter({ hasText: claimData.phone }).first()).toBeVisible();

    const openRequestsRoute = getSectionRoutes('Service Requests').find((route) => route.itemId === 'open-requests');
    if (!openRequestsRoute) {
      throw new Error('Open Requests route is not available for service request regression.');
    }

    await openRouteAndAssert(authenticatedPage, openRequestsRoute);
    await expectRequestVisible(authenticatedPage, requestNumber as string);
  });
});
