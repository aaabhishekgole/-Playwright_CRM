import { config } from '@config/index';
import { authenticatedTest as test } from '@fixtures/index';
import { menuHierarchy } from '../../../../frontend/src/utils/menuHierarchy';
import { openRouteAndAssert } from './regression.helpers';
import type { AdminMenuRoute } from '@testdata/types';

// Build workspace routes accessible to PICKUP_AGENT role
const pickupAgentRoutes: AdminMenuRoute[] = menuHierarchy
  .filter((section) => section.roles?.includes('PICKUP_AGENT'))
  .flatMap((section) =>
    section.items
      .filter((item) => item.roles?.includes('PICKUP_AGENT'))
      .map((item) => ({
        sectionId: section.id,
        sectionLabel: section.label,
        itemId: item.id,
        itemLabel: item.label,
        description: item.description,
        path: item.path,
      })),
  );

test.describe('@DetailedRegression @Regression Pickup Agent Workspace Module', () => {
  test('should load all workspace tabs accessible to PICKUP_AGENT role', async ({ browser, pickupRunnerSession }) => {
    const context = await browser.newContext({ baseURL: config.baseUrl });
    await context.addInitScript((session) => {
      window.localStorage.setItem('gsh_token', session.accessToken);
      window.localStorage.setItem('gsh_user', JSON.stringify(session));
    }, pickupRunnerSession);

    const page = await context.newPage();
    await page.goto('about:blank');

    for (const route of pickupAgentRoutes) {
      await openRouteAndAssert(page, route);
    }

    await context.close();
  });
});
