import type { Page } from '@playwright/test';
import { AppLayoutPage, AssignPickupPage } from '@pages/index';
import { Logger } from '@utils/index';

export class PickupAssignmentModule {
  private readonly appLayoutPage: AppLayoutPage;
  private readonly assignPickupPage: AssignPickupPage;
  private readonly logger = Logger.create('PickupAssignmentModule');

  constructor(private readonly page: Page) {
    this.appLayoutPage = new AppLayoutPage(page);
    this.assignPickupPage = new AssignPickupPage(page);
  }

  async openAssignPickup() {
    this.logger.step(1, 'Open assign pickup board');
    await this.assignPickupPage.navigate();
    await this.assignPickupPage.expectLoaded();
    await this.appLayoutPage.expectCurrentContext('Pickup Management', 'Assign Pickup');
  }

  async expectRequestReadyForAssignment(requestNumber: string, runnerName: string) {
    this.logger.step(2, `Verify request ${requestNumber} is ready for pickup assignment`);
    await this.assignPickupPage.expectRequestVisible(requestNumber);
    await this.assignPickupPage.expectRunnerAvailable(requestNumber, runnerName);
  }

  async assignPickup(requestNumber: string, runnerName: string, scheduledAt: string, notes: string) {
    this.logger.step(3, `Assign ${requestNumber} to ${runnerName}`);
    await this.assignPickupPage.assignPickup(requestNumber, runnerName, scheduledAt, notes);
    await this.appLayoutPage.expectToast('Assign Pickup', /Runner link sent over SMS and WhatsApp/i);
  }

  async expectRequestRemoved(requestNumber: string) {
    await this.assignPickupPage.expectRequestRemoved(requestNumber);
  }
}
