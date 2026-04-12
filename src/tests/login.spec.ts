import { config } from '@config/index';
import { test, expect } from '@fixtures/index';

test.describe('@P0 @Smoke @Regression Login Feature', () => {
  test('should login successfully with valid admin credentials', async ({ loginModule, page }) => {
    await test.step('Open login page', async () => {
      await loginModule.openLogin();
    });

    await test.step('Login and verify dashboard redirect', async () => {
      await loginModule.doLogin(config.users.admin.username, config.users.admin.password);
      await expect(page).toHaveURL(/\/$/);
    });
  });

  test('should show an error for invalid credentials', async ({ loginModule, page }) => {
    await test.step('Open login page', async () => {
      await loginModule.openLogin();
    });

    await test.step('Submit invalid credentials', async () => {
      await page.getByLabel('Username').fill('wrong-user');
      await page.getByLabel('Password').fill('wrong-pass');
      await page.getByRole('button', { name: /Enter Console|Authorizing/ }).click();
    });

    await test.step('Validate login error feedback', async () => {
      await loginModule.expectLoginError();
    });
  });
});
