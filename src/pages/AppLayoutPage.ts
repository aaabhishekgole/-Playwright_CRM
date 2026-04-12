import { expect, type Page } from '@playwright/test';
import { WaitHelper } from '@utils/index';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class AppLayoutPage {
  constructor(private readonly page: Page) {}

  signedInPanel = () => this.page.getByText(/SIGNED IN AS/i);
  currentPageContext = () => this.page.getByLabel('Current page');
  primaryHeading = () => this.page.locator('main h1, main h2').first();
  toastCard = (title: string | RegExp) => this.page.locator('.toast-card').filter({ hasText: title }).last();
  sectionToggle = (sectionLabel: string) => this.page
    .locator('.sidebar-section-toggle')
    .filter({ hasText: sectionLabel })
    .first();
  sectionContainer = (sectionLabel: string) => this.page
    .locator('.sidebar-section')
    .filter({ hasText: sectionLabel })
    .first();
  menuLink = (_sectionLabel: string, itemLabel: string) => this.page
    .locator('.sidebar-link')
    .filter({ hasText: itemLabel })
    .first();

  async expectShellLoaded() {
    await expect(this.signedInPanel()).toBeVisible();
    await expect(this.currentPageContext()).toBeVisible();
  }

  async openSection(sectionLabel: string) {
    const toggle = this.sectionToggle(sectionLabel);
    await toggle.scrollIntoViewIfNeeded();
    const expanded = await toggle.getAttribute('aria-expanded');
    expanded !== 'true' ? await toggle.click() : undefined;
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  }

  async openMenuItem(sectionLabel: string, itemLabel: string, expectedPath?: string) {
    await this.openSection(sectionLabel);
    const link = this.menuLink(sectionLabel, itemLabel);
    await link.scrollIntoViewIfNeeded();
    await link.click();
    expectedPath ? await WaitHelper.forUrl(this.page, new RegExp(`${escapeRegExp(expectedPath)}(?:/.*)?$`)) : undefined;
  }

  async expectCurrentContext(sectionLabel: string, itemLabel: string) {
    await expect(this.currentPageContext()).toContainText(sectionLabel);
    await expect(this.currentPageContext()).toContainText(itemLabel);
  }

  async expectPrimaryHeadingVisible() {
    await expect(this.primaryHeading()).toBeVisible();
  }

  async expectToast(title: string | RegExp, message?: string | RegExp) {
    const toast = this.toastCard(title);
    await expect(toast).toBeVisible();
    message ? await expect(toast).toContainText(message) : undefined;
  }
}
