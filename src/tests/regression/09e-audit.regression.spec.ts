import { authenticatedTest as test } from '@fixtures/index';
import { openRouteAndAssert, getSectionRoutes } from './regression.helpers';

test.describe('@DetailedRegression @Regression Audit Module', () => {
  for (const route of getSectionRoutes('Audit')) {
    test(`should load Audit > ${route.itemLabel} tab`, async ({ authenticatedPage }) => {
      await openRouteAndAssert(authenticatedPage, route);
    });
  }
});
