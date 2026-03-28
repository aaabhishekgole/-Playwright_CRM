import type {
  ClaimRegistrationFormData,
  CreatePickupRunnerPayload,
  CreateServiceRequestPayload,
  PickupRunnerFormData,
} from './types';
import { DataGenerator } from '@utils/DataGenerator';

export function buildClaimRegistrationFormData(overrides: Partial<ClaimRegistrationFormData> = {}): ClaimRegistrationFormData {
  const suffix = DataGenerator.uniqueSuffix();
  const phone = overrides.phone ?? DataGenerator.phone();
  const deviceCategory = overrides.deviceCategory ?? 'MOBILE';
  const expectsImei = ['MOBILE', 'TABLET', 'SMARTWATCH'].includes(deviceCategory);

  return {
    customerName: `Auto Claim ${suffix}`,
    contactPerson: `Agent ${suffix}`,
    phone,
    alternatePhone: overrides.alternatePhone ?? DataGenerator.phone('8'),
    whatsappNumber: overrides.whatsappNumber ?? phone,
    email: overrides.email ?? DataGenerator.email('claim'),
    secondaryEmail: overrides.secondaryEmail,
    addressLine1: overrides.addressLine1 ?? `Auto address ${suffix}, Andheri East`,
    addressLine2: overrides.addressLine2,
    landmark: overrides.landmark ?? 'Near Metro Station',
    googleMapLink: overrides.googleMapLink,
    city: overrides.city ?? 'Mumbai',
    state: overrides.state ?? 'Maharashtra',
    postalCode: overrides.postalCode ?? DataGenerator.postalCode(),
    loanNumber: overrides.loanNumber ?? `LN-${suffix}`,
    certificateOfInsuranceNumber: overrides.certificateOfInsuranceNumber ?? `COI-${suffix}`,
    previousTicketNumber: overrides.previousTicketNumber,
    projectName: overrides.projectName ?? 'FG - Mobile All Risk IDFC',
    branchName: overrides.branchName ?? 'Central',
    employeeCode: overrides.employeeCode ?? `EMP-${suffix.slice(-4)}`,
    employeeName: overrides.employeeName ?? 'Automation User',
    deviceCategory,
    brand: overrides.brand ?? 'Samsung',
    model: overrides.model ?? 'Galaxy A54',
    serialNumber: overrides.serialNumber ?? `SN-${suffix}`,
    imeiNumber: overrides.imeiNumber ?? (expectsImei ? DataGenerator.imei() : undefined),
    warrantyStatus: overrides.warrantyStatus ?? 'IN_WARRANTY',
    deviceCondition: overrides.deviceCondition ?? 'Screen cracked, powers on',
    qrCodePayload: overrides.qrCodePayload,
    issueSummary: overrides.issueSummary ?? `Display issue ${suffix}`,
    issueDescription: overrides.issueDescription ?? 'Customer reports flicker and touch lag.',
    priority: overrides.priority ?? 'MEDIUM',
    sourceChannel: overrides.sourceChannel ?? 'PORTAL',
    partnerReference: overrides.partnerReference ?? `AUTO-PARTNER-${suffix}`,
    promisedSlaHours: overrides.promisedSlaHours ?? '48',
    ...overrides,
  };
}

export function toCreateServiceRequestPayload(data: ClaimRegistrationFormData): CreateServiceRequestPayload {
  return {
    customer: {
      fullName: data.customerName,
      contactPerson: data.contactPerson,
      email: data.email,
      secondaryEmail: data.secondaryEmail,
      phone: data.phone,
      alternatePhone: data.alternatePhone,
      whatsappNumber: data.whatsappNumber,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      landmark: data.landmark,
      googleMapLink: data.googleMapLink,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
    },
    device: {
      brand: data.brand,
      model: data.model,
      deviceCategory: data.deviceCategory,
      serialNumber: data.serialNumber,
      imeiNumber: data.imeiNumber,
      warrantyStatus: data.warrantyStatus,
      deviceCondition: data.deviceCondition,
      qrCodePayload: data.qrCodePayload,
    },
    issueSummary: data.issueSummary,
    issueDescription: data.issueDescription,
    priority: data.priority,
    sourceChannel: data.sourceChannel,
    tenantCode: 'GSH-CORE',
    loanNumber: data.loanNumber,
    certificateOfInsuranceNumber: data.certificateOfInsuranceNumber,
    previousTicketNumber: data.previousTicketNumber,
    partnerReference: data.partnerReference,
    projectName: data.projectName,
    branchName: data.branchName,
    employeeCode: data.employeeCode,
    employeeName: data.employeeName,
    promisedSlaHours: data.promisedSlaHours ? Number(data.promisedSlaHours) : undefined,
  };
}

export function buildPickupRunnerFormData(overrides: Partial<PickupRunnerFormData> = {}): PickupRunnerFormData {
  const suffix = DataGenerator.uniqueSuffix();
  const phone = overrides.phone ?? DataGenerator.phone();

  return {
    fullName: overrides.fullName ?? `Runner ${suffix}`,
    phone,
    whatsappNumber: overrides.whatsappNumber ?? phone,
    email: overrides.email ?? DataGenerator.email('runner'),
    username: overrides.username ?? `runner.${suffix.replace(/[^0-9]/g, '').slice(-8)}`,
    active: overrides.active ?? true,
    ...overrides,
  };
}

export function toCreatePickupRunnerPayload(data: PickupRunnerFormData): CreatePickupRunnerPayload {
  return {
    fullName: data.fullName,
    phone: data.phone,
    whatsappNumber: data.whatsappNumber,
    email: data.email,
    username: data.username,
    active: data.active,
  };
}
