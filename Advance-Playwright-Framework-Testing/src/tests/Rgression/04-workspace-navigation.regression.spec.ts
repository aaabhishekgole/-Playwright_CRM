import { authenticatedTest as test, expect } from '@fixtures/index';
import { AppLayoutPage } from '@pages/index';
import { NavigationModule } from '@modules/index';
import { adminMenuRoutes } from '@testdata/adminMenuRoutes';

const groupedRoutes = adminMenuRoutes.reduce<Record<string, typeof adminMenuRoutes>>((sections, route) => {
  sections[route.sectionLabel] ??= [];
  sections[route.sectionLabel].push(route);
  return sections;
}, {});

test.describe('@DetailedRegression @Regression Workspace Navigation Mapping', () => {
  for (const [sectionLabel, routes] of Object.entries(groupedRoutes)) {
    test(`should browse every mapped admin route in ${sectionLabel} and keep the shell authenticated`, async ({ authenticatedPage }) => {
      const navigationModule = new NavigationModule(authenticatedPage);
      const appLayoutPage = new AppLayoutPage(authenticatedPage);

      await test.step(`Open all mapped submenu routes in ${sectionLabel}`, async () => {
        for (const route of routes) {
          await navigationModule.openAdminMenuRoute(route);
          await appLayoutPage.expectCurrentContext(route.sectionLabel, route.itemLabel);
          await appLayoutPage.expectPrimaryHeadingVisible();
        }
      });

      await test.step(`Remain signed in after browsing ${sectionLabel}`, async () => {
        await expect(authenticatedPage.getByText(/SIGNED IN AS/i)).toBeVisible();
        await expect(authenticatedPage).not.toHaveURL(/\/login$/);
      });
    });
  }
});
