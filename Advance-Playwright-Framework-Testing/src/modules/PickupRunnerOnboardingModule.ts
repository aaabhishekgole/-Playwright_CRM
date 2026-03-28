import type { Page } from '@playwright/test';
import { AppLayoutPage, PickupRunnerOnboardingPage } from '@pages/index';
import type { PickupRunnerFormData } from '@testdata/types';
import { Logger } from '@utils/index';

export class PickupRunnerOnboardingModule {
  private readonly appLayoutPage: AppLayoutPage;
  private readonly pickupRunnerOnboardingPage: PickupRunnerOnboardingPage;
  private readonly logger = Logger.create('PickupRunnerOnboardingModule');

  constructor(private readonly page: Page) {
    this.appLayoutPage = new AppLayoutPage(page);
    this.pickupRunnerOnboardingPage = new PickupRunnerOnboardingPage(page);
  }

  async openRunnerOnboarding() {
    this.logger.step(1, 'Open pickup runner onboarding page');
    await this.pickupRunnerOnboardingPage.navigate();
    await this.pickupRunnerOnboardingPage.expectLoaded();
    await this.appLayoutPage.expectCurrentContext('Pickup Management', 'Runner Onboarding');
  }

  async onboardRunner(data: PickupRunnerFormData) {
    this.logger.step(2, `Onboard pickup runner ${data.fullName}`);
    await this.pickupRunnerOnboardingPage.fillForm(data);
    await this.pickupRunnerOnboardingPage.submit();
    await this.appLayoutPage.expectToast('Runner onboarded');
    await this.pickupRunnerOnboardingPage.expectRunnerInRoster(data.fullName, data.phone);
  }
}
