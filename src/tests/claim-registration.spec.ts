import { authenticatedTest as test, expect } from '@fixtures/index';
import { ClaimRegistrationModule } from '@modules/index';
import { buildClaimRegistrationFormData } from '@testdata/factories';
import { config } from '@config/index';

test.describe('@P1 @Regression Claim Registration', () => {
  test('should register a new claim from the admin portal and surface it in the claims queue', async ({ authenticatedPage }) => {
    const claimRegistrationModule = new ClaimRegistrationModule(authenticatedPage);
    const claimData = buildClaimRegistrationFormData();

    await test.step('Open the registration page and submit a fresh claim', async () => {
      await claimRegistrationModule.openClaimRegistration();
      const requestNumber = await claimRegistrationModule.registerClaim(claimData);
      expect(requestNumber).toBeTruthy();
    });

    await test.step('Open the claims queue and verify the created customer phone is searchable', async () => {
      await authenticatedPage.goto(config.routes.allRequests);
      await expect(authenticatedPage.getByRole('heading', { name: 'Open Claims' })).toBeVisible();
      await authenticatedPage.getByLabel('Mobile No.').fill(claimData.phone);
      await authenticatedPage.getByRole('button', { name: 'Search' }).click();
      await expect(authenticatedPage.locator('.portal-table-row.portal-table-body').filter({ hasText: claimData.phone }).first()).toBeVisible({ timeout: 60000 });
    });
  });
});
