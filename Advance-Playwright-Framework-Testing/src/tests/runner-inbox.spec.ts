import { config } from '@config/index';
import { test, expect } from '@fixtures/index';

test.describe('@P1 @Regression Runner Inbox', () => {
  test('should sign in to the browser runner inbox with the seeded pickup runner', async ({ runnerInboxModule, page }) => {
    await test.step('Open the runner inbox browser flow', async () => {
      await runnerInboxModule.openRunnerInbox();
    });

    await test.step('Sign in using runner mobile number', async () => {
      await runnerInboxModule.signIn(
        config.users.pickupRunner.phone ?? config.users.pickupRunner.username,
        config.users.pickupRunner.password,
      );
    });

    await test.step('Verify runner-specific inbox controls appear', async () => {
      await expect(page.getByRole('button', { name: /Refresh Runner Inbox|Refreshing/ })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
    });
  });
});
