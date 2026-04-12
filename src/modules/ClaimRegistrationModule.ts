import type { Page } from '@playwright/test';
import { AppLayoutPage, ClaimRegistrationPage } from '@pages/index';
import type { ClaimRegistrationFormData } from '@testdata/types';
import { Logger } from '@utils/index';

export class ClaimRegistrationModule {
  private readonly appLayoutPage: AppLayoutPage;
  private readonly claimRegistrationPage: ClaimRegistrationPage;
  private readonly logger = Logger.create('ClaimRegistrationModule');

  constructor(private readonly page: Page) {
    this.appLayoutPage = new AppLayoutPage(page);
    this.claimRegistrationPage = new ClaimRegistrationPage(page);
  }

  async openClaimRegistration() {
    this.logger.step(1, 'Open claim registration page');
    await this.claimRegistrationPage.navigate();
    await this.claimRegistrationPage.expectLoaded();
    await this.appLayoutPage.expectCurrentContext('Service Requests', 'Create Request');
  }

  async registerClaim(data: ClaimRegistrationFormData) {
    this.logger.step(2, `Register a new claim for ${data.customerName}`);
    await this.claimRegistrationPage.switchToFreshRegistration();
    await this.claimRegistrationPage.fillForm(data);
    await this.claimRegistrationPage.submit();
    await this.claimRegistrationPage.expectRegistered();
    return this.claimRegistrationPage.readCreatedRequestNumber();
  }
}
