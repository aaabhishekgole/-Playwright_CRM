import { authenticatedTest as test } from '@fixtures/index';
import { openRouteAndAssert, getSectionRoutes } from './regression.helpers';

test.describe('@DetailedRegression @Regression Notifications Module', () => {
  for (const route of getSectionRoutes('Notifications')) {
    test(`should load Notifications > ${route.itemLabel} tab`, async ({ authenticatedPage }) => {
      await openRouteAndAssert(authenticatedPage, route);
    });
  }
});
