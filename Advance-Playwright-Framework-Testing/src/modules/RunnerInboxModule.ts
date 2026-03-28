import type { Page } from '@playwright/test';
import { RunnerInboxPage } from '@pages/index';
import { Logger, WaitHelper } from '@utils/index';

export class RunnerInboxModule {
  private readonly runnerInboxPage: RunnerInboxPage;
  private readonly logger = Logger.create('RunnerInboxModule');

  constructor(private readonly page: Page) {
    this.runnerInboxPage = new RunnerInboxPage(page);
  }

  async openRunnerInbox() {
    this.logger.step(1, 'Navigate to runner browser inbox');
    await this.runnerInboxPage.navigate();
    await this.runnerInboxPage.expectLoaded();
    await this.runnerInboxPage.expectSignInForm();
  }

  async signIn(identifier: string, password: string) {
    this.logger.step(2, 'Sign in as pickup runner');
    await this.runnerInboxPage.signIn(identifier, password);
    await WaitHelper.forVisible(this.runnerInboxPage.refreshButton());
    await this.runnerInboxPage.expectSignedIn();
  }
}
