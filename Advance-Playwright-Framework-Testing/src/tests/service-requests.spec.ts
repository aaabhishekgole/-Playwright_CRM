import { ServiceRequestApi } from '@api/ServiceRequestApi';
import { config } from '@config/index';
import { authenticatedTest as test, expect } from '@fixtures/index';

test.describe('@P1 @Smoke @Regression Service Request Queue', () => {
  test('should open the claims queue from an authenticated admin session', async ({ authenticatedPage }) => {
    await test.step('Verify the dashboard is already available', async () => {
      await expect(authenticatedPage.getByText(/SIGNED IN AS/i)).toBeVisible();
      await expect(authenticatedPage.getByRole('link', { name: /Create Request/i })).toBeVisible();
    });

    await test.step('Open the open claims queue directly', async () => {
      await authenticatedPage.goto(config.routes.openClaims);
      await expect(authenticatedPage.getByRole('heading', { name: 'Open Claims' })).toBeVisible();
      await expect(authenticatedPage.getByRole('heading', { name: 'Claims Queue' })).toBeVisible();
    });
  });

  test('should fetch service requests through the API layer', async ({ request }) => {
    const serviceRequestApi = new ServiceRequestApi(request);

    await test.step('Authenticate as admin by API', async () => {
      const authResponse = await request.post(`${config.apiBaseUrl}/auth/login`, {
        data: {
          username: config.users.admin.username,
          password: config.users.admin.password,
        },
      });
      expect(authResponse.ok()).toBeTruthy();
      const login = await authResponse.json();

      await test.step('Fetch service requests with bearer token', async () => {
        const requests = await serviceRequestApi.list(login.accessToken);
        expect(Array.isArray(requests)).toBeTruthy();
      });
    });
  });
});
