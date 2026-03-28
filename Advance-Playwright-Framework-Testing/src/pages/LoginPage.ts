import { expect, type Locator, type Page } from '@playwright/test';
import { config } from '@config/index';

export class LoginPage {
  constructor(private readonly page: Page) {}

  heading = () => this.page.getByRole('heading', { name: 'Sign in' });
  usernameInput = () => this.page.getByLabel('Username');
  passwordInput = () => this.page.getByLabel('Password');
  submitButton = () => this.page.getByRole('button', { name: /Enter Console|Authorizing/ });
  errorAlert = () => this.page.locator('.login-alert-error');

  async navigate() {
    await this.page.goto(config.routes.login);
  }

  async enterUsername(username: string) {
    await this.usernameInput().fill(username);
  }

  async enterPassword(password: string) {
    await this.passwordInput().fill(password);
  }

  async clickSubmit() {
    await this.submitButton().click();
  }

  async login(username: string, password: string) {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickSubmit();
  }

  async expectLoaded() {
    await expect(this.heading()).toBeVisible();
  }

  async expectError() {
    await expect(this.errorAlert()).toBeVisible();
  }
}
