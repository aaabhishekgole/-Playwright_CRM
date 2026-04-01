import { AuthApi, ServiceRequestApi } from '@api/index';
import { authenticatedTest as test, expect } from '@fixtures/index';
import { ClaimRegistrationModule, ServiceRequestModule } from '@modules/index';
import { buildClaimRegistrationFormData } from '@testdata/factories';

test.describe('@DetailedRegression @Regression Claim Registration Flow', () => {
  test('should register a claim in the portal, surface it in the queue, and persist it through the API layer', async ({ authenticatedPage, request }) => {
    const authApi = new AuthApi(request);
    const serviceRequestApi = new ServiceRequestApi(request);
    const claimRegistrationModule = new ClaimRegistrationModule(authenticatedPage);
    const serviceRequestModule = new ServiceRequestModule(authenticatedPage);
    const claimData = buildClaimRegistrationFormData({
      issueSummary: 'Detailed regression claim registration verification',
    });

    let requestNumber: string | null = null;

    await test.step('Create a fresh request from the admin claim registration page', async () => {
      await claimRegistrationModule.openClaimRegistration();
      requestNumber = await claimRegistrationModule.registerClaim(claimData);
      expect(requestNumber).toBeTruthy();
      expect(requestNumber).toMatch(/^GSH-/);
    });

    await test.step('Search the claims queue by mobile number and confirm the newly created request is visible', async () => {
      expect(requestNumber).toBeTruthy();
      await serviceRequestModule.openClaimsQueue();
      await serviceRequestModule.searchByMobile(claimData.phone);
      await expect(
        authenticatedPage.locator('.portal-table-row.portal-table-body').filter({ hasText: claimData.phone }).first(),
      ).toContainText(requestNumber!);
    });

    await test.step('Confirm the request is persisted through the service request API', async () => {
      expect(requestNumber).toBeTruthy();
      const session = await authApi.login('admin', 'Admin@123');
      const requests = await serviceRequestApi.list(session.accessToken);
      const created = requests.find((candidate) => candidate.requestNumber === requestNumber);

      expect(created).toBeTruthy();
      expect(created?.status).toBe('REQUEST_CREATED');
      expect(created?.customerPhone).toBe(claimData.phone);
      expect(created?.customerName).toBe(claimData.customerName);
    });
  });
});