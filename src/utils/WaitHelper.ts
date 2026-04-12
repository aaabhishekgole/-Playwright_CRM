import type { Locator, Page } from '@playwright/test';

export class WaitHelper {
  static async forUrl(page: Page, pattern: string | RegExp) {
    await page.waitForURL(pattern);
  }

  static async forVisible(locator: Locator) {
    await locator.waitFor({ state: 'visible' });
  }

  static async forHidden(locator: Locator) {
    await locator.waitFor({ state: 'hidden' });
  }
}
