import { expect, type Page } from '@playwright/test';
import { config } from '@config/index';

export class ServiceRequestListPage {
  constructor(private readonly page: Page) {}

  pageHeading = () => this.page.getByRole('heading', { name: 'Open Claims' });
  loanNumberInput = () => this.page.getByLabel('Loan No.');
  mobileNumberInput = () => this.page.getByLabel('Mobile No.');
  searchButton = () => this.page.getByRole('button', { name: 'Search' });
  registerClaimLink = () => this.page.getByRole('link', { name: 'Register New Claim' });
  claimsQueueHeading = () => this.page.getByRole('heading', { name: 'Claims Queue' });

  async navigate() {
    await this.page.goto(config.routes.openClaims);
  }

  async searchByMobile(mobileNumber: string) {
    await this.mobileNumberInput().fill(mobileNumber);
    await this.searchButton().click();
  }

  async expectLoaded() {
    await expect(this.pageHeading()).toBeVisible();
    await expect(this.loanNumberInput()).toBeVisible();
    await expect(this.claimsQueueHeading()).toBeVisible();
    await expect(this.registerClaimLink()).toBeVisible();
  }
}
