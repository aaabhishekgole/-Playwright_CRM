import { authenticatedTest as test } from '@fixtures/index';
import { openRouteAndAssert, getSectionRoutes } from './regression.helpers';

test.describe('@DetailedRegression @Regression Settings Module', () => {
  for (const route of getSectionRoutes('Settings')) {
    test(`should load Settings > ${route.itemLabel} tab`, async ({ authenticatedPage }) => {
      await openRouteAndAssert(authenticatedPage, route);
    });
  }
});
