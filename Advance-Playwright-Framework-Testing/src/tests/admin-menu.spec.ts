import { authenticatedTest as test, expect } from '@fixtures/index';
import { NavigationModule } from '@modules/index';
import { adminMenuRoutes } from '@testdata/adminMenuRoutes';

const groupedRoutes = adminMenuRoutes.reduce<Record<string, typeof adminMenuRoutes>>((sections, route) => {
  sections[route.sectionLabel] ??= [];
  sections[route.sectionLabel].push(route);
  return sections;
}, {});

test.describe('@P1 @Smoke @Regression Admin Menu Mapping', () => {
  for (const [sectionLabel, routes] of Object.entries(groupedRoutes)) {
    test(`should load every admin submenu in ${sectionLabel}`, async ({ authenticatedPage }) => {
      const navigationModule = new NavigationModule(authenticatedPage);

      await test.step(`Open all mapped submenu routes in ${sectionLabel}`, async () => {
        for (const route of routes) {
          await navigationModule.openAdminMenuRoute(route);
        }
      });

      await test.step(`Remain authenticated after browsing ${sectionLabel}`, async () => {
        await expect(authenticatedPage.getByText(/SIGNED IN AS/i)).toBeVisible();
      });
    });
  }
});
