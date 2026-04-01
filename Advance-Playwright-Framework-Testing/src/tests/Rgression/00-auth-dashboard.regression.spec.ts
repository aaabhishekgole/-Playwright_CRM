import { config } from '@config/index';
import { expect, test } from '@fixtures/index';

test.describe('@DetailedRegression @Regression Authentication And Dashboard', () => {
  test('should allow admin login, load dashboard widgets, and keep claims queue accessible', async ({ dashboardPage, loginModule, serviceRequestListPage, serviceRequestModule }) => {
    await test.step('Sign in with valid admin credentials', async () => {
      await loginModule.openLogin();
      await loginModule.doLogin(config.users.admin.username, config.users.admin.password);
      await dashboardPage.expectLoaded();
    });

    await test.step('Move from the dashboard into the open claims queue without losing session context', async () => {
      await serviceRequestModule.openClaimsQueue();
      await expect(serviceRequestListPage.claimsQueueHeading()).toBeVisible();
      await expect(serviceRequestListPage.registerClaimLink()).toBeVisible();
    });
  });

  test('should keep the authenticated shell stable while moving between dashboard and queue routes', async ({ authenticatedPage, dashboardPage, serviceRequestModule }) => {
    await test.step('Confirm the pre-authenticated dashboard shell is loaded', async () => {
      await dashboardPage.expectLoaded();
    });

    await test.step('Navigate to the claims queue and back to the dashboard', async () => {
      await serviceRequestModule.openClaimsQueue();
      await expect(authenticatedPage.getByText(/SIGNED IN AS/i)).toBeVisible();
      await authenticatedPage.goto(config.routes.dashboard);
      await dashboardPage.expectLoaded();
    });
  });

  test('should reject invalid credentials and preserve the sign-in form', async ({ loginModule, loginPage }) => {
    await test.step('Open the login page and submit invalid credentials', async () => {
      await loginModule.openLogin();
      await loginPage.login('invalid-user', 'wrong-password');
      await loginModule.expectLoginError();
    });

    await test.step('Verify the login form is still ready for a retry', async () => {
      await expect(loginPage.submitButton()).toBeVisible();
      await expect(loginPage.usernameInput()).toBeVisible();
      await expect(loginPage.passwordInput()).toBeVisible();
    });
  });
});
