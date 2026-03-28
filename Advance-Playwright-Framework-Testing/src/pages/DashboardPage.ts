import { expect, type Page } from '@playwright/test';

export class DashboardPage {
  constructor(private readonly page: Page) {}

  heroHeading = () => this.page.getByRole('heading', { name: /Track service requests, field activity/i });
  createRequestTile = () => this.page.getByRole('link', { name: /Create Request/i });
  signedInPanel = () => this.page.getByText(/SIGNED IN AS/i);

  async expectLoaded() {
    await expect(this.heroHeading()).toBeVisible();
    await expect(this.createRequestTile()).toBeVisible();
    await expect(this.signedInPanel()).toBeVisible();
  }
}
