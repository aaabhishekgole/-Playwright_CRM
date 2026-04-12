import { authenticatedTest as test } from '@fixtures/index';
import { openRouteAndAssert, getSectionRoutes } from './regression.helpers';

test.describe('@DetailedRegression @Regression Users Module', () => {
  for (const route of getSectionRoutes('Users')) {
    test(`should load Users > ${route.itemLabel} tab`, async ({ authenticatedPage }) => {
      await openRouteAndAssert(authenticatedPage, route);
    });
  }
});
