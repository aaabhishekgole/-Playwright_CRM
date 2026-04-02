import { authenticatedTest as test } from '@fixtures/index';
import { openRouteAndAssert, getSectionRoutes } from './regression.helpers';

const backofficeSections = ['Notifications', 'Users', 'Reports', 'Settings', 'Audit'] as const;

test.describe('@DetailedRegression @Regression Backoffice Modules', () => {
  for (const sectionLabel of backofficeSections) {
    test(`should load every ${sectionLabel} tab`, async ({ authenticatedPage }) => {
      for (const route of getSectionRoutes(sectionLabel)) {
        await openRouteAndAssert(authenticatedPage, route);
      }
    });
  }
});

