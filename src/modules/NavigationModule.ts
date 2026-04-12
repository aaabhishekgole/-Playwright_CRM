import type { Page } from '@playwright/test';
import { AppLayoutPage } from '@pages/index';
import type { AdminMenuRoute } from '@testdata/types';
import { Logger } from '@utils/index';

export class NavigationModule {
  private readonly appLayoutPage: AppLayoutPage;
  private readonly logger = Logger.create('NavigationModule');

  constructor(private readonly page: Page) {
    this.appLayoutPage = new AppLayoutPage(page);
  }

  async openAdminMenuRoute(route: AdminMenuRoute) {
    this.logger.step(1, `Open ${route.sectionLabel} > ${route.itemLabel}`);
    await this.page.goto(route.path);
    await this.appLayoutPage.expectShellLoaded();
    await this.appLayoutPage.expectPrimaryHeadingVisible();
  }
}
