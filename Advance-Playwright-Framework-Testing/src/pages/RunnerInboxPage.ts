import { expect, type Page } from '@playwright/test';
import { config } from '@config/index';

export class RunnerInboxPage {
  constructor(private readonly page: Page) {}

  heroHeading = () => this.page.getByRole('heading', { name: /Hybrid Runner Flow In Browser|Vishal Babar|Runner Web Inbox/i });
  loginIdentifierInput = () => this.page.getByLabel('Mobile Number Or Username');
  passwordInput = () => this.page.getByLabel('Password');
  submitButton = () => this.page.getByRole('button', { name: /Open Runner Inbox|Signing In/ });
  refreshButton = () => this.page.getByRole('button', { name: /Refresh Runner Inbox|Refreshing/ });
  signOutButton = () => this.page.getByRole('button', { name: 'Sign Out' });
  signInHeading = () => this.page.getByRole('heading', { name: 'Sign In To Runner Inbox' });
  noAssignmentsCard = () => this.page.getByText(/No assignments yet/i);

  async navigate() {
    await this.page.goto(config.routes.runnerInbox);
  }

  async enterLoginIdentifier(value: string) {
    await this.loginIdentifierInput().fill(value);
  }

  async enterPassword(password: string) {
    await this.passwordInput().fill(password);
  }

  async clickOpenInbox() {
    await this.submitButton().click();
  }

  async signIn(identifier: string, password: string) {
    await this.enterLoginIdentifier(identifier);
    await this.enterPassword(password);
    await this.clickOpenInbox();
  }

  async expectLoaded() {
    await expect(this.heroHeading()).toBeVisible();
  }

  async expectSignInForm() {
    await expect(this.signInHeading()).toBeVisible();
  }

  async expectSignedIn() {
    await expect(this.refreshButton()).toBeVisible();
    await expect(this.signOutButton()).toBeVisible();
  }
}
