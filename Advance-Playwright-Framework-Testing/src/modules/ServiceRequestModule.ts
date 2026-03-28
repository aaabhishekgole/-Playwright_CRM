import type { Page } from '@playwright/test';
import { ServiceRequestListPage } from '@pages/index';
import { Logger } from '@utils/index';

export class ServiceRequestModule {
  private readonly serviceRequestListPage: ServiceRequestListPage;
  private readonly logger = Logger.create('ServiceRequestModule');

  constructor(private readonly page: Page) {
    this.serviceRequestListPage = new ServiceRequestListPage(page);
  }

  async openClaimsQueue() {
    this.logger.step(1, 'Navigate to open claims queue');
    await this.serviceRequestListPage.navigate();
    await this.serviceRequestListPage.expectLoaded();
  }

  async searchByMobile(mobileNumber: string) {
    this.logger.step(2, `Search claims by mobile ${mobileNumber}`);
    await this.serviceRequestListPage.searchByMobile(mobileNumber);
  }
}
