import { expect, type Page } from '@playwright/test';
import { config } from '@config/index';

export class AssignPickupPage {
  constructor(private readonly page: Page) {}

  heading = () => this.page.getByRole('heading', { name: 'Assign Pickup' });
  emptyState = () => this.page.getByText(/No requests in this stage/i);
  requestCard = (requestNumber: string) => this.page.locator('.action-card').filter({ hasText: requestNumber }).first();
  runnerSelect = (requestNumber: string) => this.requestCard(requestNumber).getByLabel(/Pickup Runner/i);
  scheduleInput = (requestNumber: string) => this.requestCard(requestNumber).getByLabel(/Scheduled Pickup/i);
  notesInput = (requestNumber: string) => this.requestCard(requestNumber).getByLabel(/^Notes$/i);
  assignButton = (requestNumber: string) => this.requestCard(requestNumber).getByRole('button', { name: /Assign Pickup|Assigning/ });

  async navigate() {
    await this.page.goto(config.routes.assignPickup);
  }

  async expectLoaded() {
    await expect(this.heading()).toBeVisible();
  }

  async expectRequestVisible(requestNumber: string) {
    await expect(this.requestCard(requestNumber)).toBeVisible();
  }

  async expectRunnerAvailable(requestNumber: string, runnerName: string) {
    const options = await this.runnerSelect(requestNumber).locator('option').allTextContents();
    expect(options.some((option) => option.includes(runnerName))).toBeTruthy();
  }

  async assignPickup(requestNumber: string, runnerName: string, scheduledAt: string, notes: string) {
    await this.runnerSelect(requestNumber).selectOption({ label: runnerName });
    await this.scheduleInput(requestNumber).fill(scheduledAt);
    await this.notesInput(requestNumber).fill(notes);
    await this.assignButton(requestNumber).click();
  }

  async expectRequestRemoved(requestNumber: string) {
    await expect(this.requestCard(requestNumber)).toHaveCount(0);
  }
}
