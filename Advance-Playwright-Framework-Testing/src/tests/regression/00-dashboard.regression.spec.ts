import { config } from '@config/index';
import { expect, authenticatedTest as test } from '@fixtures/index';
import { verifySectionTabs } from './regression.helpers';

test.describe('@DetailedRegression @Regression Dashboard Module', () => {
  test('should load every dashboard tab in the admin shell', async ({ authenticatedPage }) => {
    await verifySectionTabs(authenticatedPage, 'Dashboard');
  });

  test('should allow admin login and move from dashboard to claims queue without losing session context', async ({ dashboardPage, loginModule, serviceRequestListPage, serviceRequestModule }) => {
    await loginModule.openLogin();
    await loginModule.doLogin(config.users.admin.username, config.users.admin.password);
    await dashboardPage.expectLoaded();

    await serviceRequestModule.openClaimsQueue();
    await expect(serviceRequestListPage.claimsQueueHeading()).toBeVisible();
    await expect(serviceRequestListPage.registerClaimLink()).toBeVisible();
  });

  test('should reject invalid credentials and preserve the sign-in form', async ({ loginModule, loginPage }) => {
    await loginModule.openLogin();
    await loginPage.login('invalid-user', 'wrong-password');
    await loginModule.expectLoginError();

    await expect(loginPage.submitButton()).toBeVisible();
    await expect(loginPage.usernameInput()).toBeVisible();
    await expect(loginPage.passwordInput()).toBeVisible();
  });
});
