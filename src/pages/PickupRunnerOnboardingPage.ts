import { expect, type Page } from '@playwright/test';
import { config } from '@config/index';
import type { PickupRunnerFormData } from '@testdata/types';

export class PickupRunnerOnboardingPage {
  constructor(private readonly page: Page) {}

  heading = () => this.page.getByRole('heading', { name: 'Runner Onboarding', exact: true });
  fullNameInput = () => this.page.getByLabel(/Runner Full Name/i);
  mobileNumberInput = () => this.page.getByLabel(/Mobile Number/i);
  whatsappNumberInput = () => this.page.getByLabel(/WhatsApp Number/i);
  emailInput = () => this.page.getByLabel(/^Email$/i);
  usernameInput = () => this.page.getByLabel(/Username/i);
  sameAsMobileCheckbox = () => this.page.getByRole('checkbox');
  submitButton = () => this.page.getByRole('button', { name: /Onboard Runner|Onboarding/ });
  goToAssignPickupLink = () => this.page.getByRole('link', { name: 'Go To Assign Pickup' });
  rosterRow = (runnerName: string) => this.page.locator('.portal-table-row.portal-table-body').filter({ hasText: runnerName }).first();

  async navigate() {
    await this.page.goto(config.routes.runnerOnboarding);
  }

  async expectLoaded() {
    await expect(this.heading()).toBeVisible();
    await expect(this.submitButton()).toBeVisible();
  }

  async fillForm(data: PickupRunnerFormData) {
    await this.fullNameInput().fill(data.fullName);
    await this.mobileNumberInput().fill(data.phone);

    const useSameNumber = !data.whatsappNumber || data.whatsappNumber === data.phone;
    (await this.sameAsMobileCheckbox().isChecked()) !== useSameNumber ? await this.sameAsMobileCheckbox().click() : undefined;
    !useSameNumber && data.whatsappNumber ? await this.whatsappNumberInput().fill(data.whatsappNumber) : undefined;
    data.email ? await this.emailInput().fill(data.email) : undefined;
    data.username ? await this.usernameInput().fill(data.username) : undefined;
  }

  async submit() {
    await this.submitButton().click();
  }

  async expectRunnerInRoster(runnerName: string, phone: string) {
    const row = this.rosterRow(runnerName);
    await expect(row).toBeVisible();
    await expect(row).toContainText(phone);
  }
}
