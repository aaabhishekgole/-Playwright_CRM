import { expect, type Page } from '@playwright/test';
import { config } from '@config/index';
import type { ClaimRegistrationFormData } from '@testdata/types';

export class ClaimRegistrationPage {
  constructor(private readonly page: Page) {}

  heading = () => this.page.getByRole('heading', { name: 'Register New Claim' });
  searchButton = () => this.page.getByRole('button', { name: 'Search' });
  deviceNotInDatabaseButton = () => this.page.getByRole('button', { name: 'Device not in database' });
  customerNameInput = () => this.page.getByLabel(/Customer Name/i);
  contactPersonInput = () => this.page.getByLabel(/Contact Person/i);
  mobileNumberInput = () => this.page.getByLabel(/Mobile No\.\s*\*/i);
  alternateMobileInput = () => this.page.getByLabel(/Mobile No\. 2/i);
  whatsappNumberInput = () => this.page.getByLabel(/WhatsApp No\./i);
  emailInput = () => this.page.getByLabel(/Email ID - 1/i);
  secondaryEmailInput = () => this.page.getByLabel(/Email ID - 2/i);
  addressInput = () => this.page.getByLabel(/Address \*/i);
  cityInput = () => this.page.getByLabel(/City \*/i);
  stateInput = () => this.page.getByLabel(/State \*/i);
  postalCodeInput = () => this.page.getByLabel(/PIN Code \*/i);
  loanNumberInput = () => this.page.getByLabel(/^Loan No\.$/i).nth(1);
  coiInput = () => this.page.getByLabel(/Certificate of Insurance No\./i).nth(1);
  partnerReferenceInput = () => this.page.getByLabel(/Partner Reference/i);
  repairCategorySelect = () => this.page.getByLabel(/Repair Category \*/i);
  brandInput = () => this.page.getByLabel(/Brand \*/i);
  modelInput = () => this.page.getByLabel(/Model \*/i);
  serialNumberInput = () => this.page.getByLabel(/Product Serial No\.\s*\*/i);
  imeiInput = () => this.page.getByLabel(/IMEI/i).nth(1);
  warrantyStatusSelect = () => this.page.getByLabel(/Warranty Status \*/i);
  prioritySelect = () => this.page.getByLabel(/Priority \*/i);
  sourceChannelSelect = () => this.page.getByLabel(/Source Channel \*/i);
  issueSummaryInput = () => this.page.getByLabel(/Issue Summary \*/i);
  issueDescriptionInput = () => this.page.getByLabel(/Issue Description/i);
  registerButton = () => this.page.getByRole('button', { name: /Register Claim|Registering/ });
  claimRegisteredHeading = () => this.page.getByRole('heading', { name: 'Claim Registered' });
  openClaimDetailsLink = () => this.page.getByRole('link', { name: 'Open claim details' });
  viewClaimsQueueLink = () => this.page.getByRole('link', { name: 'View claims queue' });
  createdRequestPanel = () => this.page.locator('.portal-panel').filter({ hasText: 'Claim Registered' }).last();

  async navigate() {
    await this.page.goto(config.routes.createRequest);
  }

  async expectLoaded() {
    await expect(this.heading()).toBeVisible();
    await expect(this.searchButton()).toBeVisible();
    await expect(this.registerButton()).toBeVisible();
  }

  async switchToFreshRegistration() {
    await this.deviceNotInDatabaseButton().click();
  }

  async fillForm(data: ClaimRegistrationFormData) {
    await this.customerNameInput().fill(data.customerName);
    data.contactPerson ? await this.contactPersonInput().fill(data.contactPerson) : undefined;
    await this.mobileNumberInput().fill(data.phone);
    data.alternatePhone ? await this.alternateMobileInput().fill(data.alternatePhone) : undefined;
    data.whatsappNumber ? await this.whatsappNumberInput().fill(data.whatsappNumber) : undefined;
    data.email ? await this.emailInput().fill(data.email) : undefined;
    data.secondaryEmail ? await this.secondaryEmailInput().fill(data.secondaryEmail) : undefined;
    await this.addressInput().fill(data.addressLine1);
    await this.cityInput().fill(data.city);
    await this.stateInput().fill(data.state);
    await this.postalCodeInput().fill(data.postalCode);
    data.loanNumber ? await this.loanNumberInput().fill(data.loanNumber) : undefined;
    data.certificateOfInsuranceNumber ? await this.coiInput().fill(data.certificateOfInsuranceNumber) : undefined;
    data.partnerReference ? await this.partnerReferenceInput().fill(data.partnerReference) : undefined;
    await this.repairCategorySelect().selectOption(data.deviceCategory);
    await this.brandInput().fill(data.brand);
    await this.modelInput().fill(data.model);
    await this.serialNumberInput().fill(data.serialNumber);
    data.imeiNumber ? await this.imeiInput().fill(data.imeiNumber) : undefined;
    await this.warrantyStatusSelect().selectOption(data.warrantyStatus);
    await this.prioritySelect().selectOption(data.priority);
    await this.sourceChannelSelect().selectOption(data.sourceChannel);
    await this.issueSummaryInput().fill(data.issueSummary);
    data.issueDescription ? await this.issueDescriptionInput().fill(data.issueDescription) : undefined;
  }

  async submit() {
    await this.registerButton().click();
  }

  async expectRegistered() {
    await expect(this.claimRegisteredHeading()).toBeVisible();
    await expect(this.openClaimDetailsLink()).toBeVisible();
    await expect(this.viewClaimsQueueLink()).toBeVisible();
  }

  async readCreatedRequestNumber() {
    const text = await this.createdRequestPanel().textContent();
    const match = text?.match(/GSH-\d{8}-\d+/i);
    return match?.[0] ?? null;
  }
}
