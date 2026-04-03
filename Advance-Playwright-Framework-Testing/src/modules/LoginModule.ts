import type { Page } from '@playwright/test';
import { DashboardPage, LoginPage } from '@pages/index';
import { Logger } from '@utils/index';

export class LoginModule {
  private readonly loginPage: LoginPage;
  private readonly dashboardPage: DashboardPage;
  private readonly logger = Logger.create('LoginModule');

  constructor(private readonly page: Page) {
    this.loginPage = new LoginPage(page);
    this.dashboardPage = new DashboardPage(page);
  }

  async openLogin() {
    this.logger.step(1, 'Navigate to login page');
    await this.loginPage.navigate();
    await this.loginPage.expectLoaded();
  }

  async doLogin(username: string, password: string) {
    this.logger.step(2, 'Submit login credentials');
    await this.loginPage.login(username, password);
    await this.dashboardPage.expectLoaded();
    this.logger.success('Login completed successfully');
  }

  async expectLoginError() {
    this.logger.step(3, 'Validate login error feedback');
    await this.loginPage.expectError();
  }
}
