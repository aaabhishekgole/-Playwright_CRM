export type FrameworkUserKey = 'admin' | 'pickupRunner';

export type UserCredentials = {
  username: string;
  password: string;
  phone?: string;
  fullName?: string;
  role?: string;
};

export type RouteMap = {
  login: string;
  dashboard: string;
  allRequests: string;
  openClaims: string;
  createRequest: string;
  pickupDashboard: string;
  runnerOnboarding: string;
  assignPickup: string;
  runnerInbox: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  username: string;
  role: string;
  fullName?: string | null;
  phone?: string | null;
};

export type CustomerPayload = {
  fullName: string;
  contactPerson?: string;
  email?: string;
  secondaryEmail?: string;
  phone: string;
  alternatePhone?: string;
  whatsappNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  googleMapLink?: string;
  city: string;
  state: string;
  postalCode: string;
};

export type DevicePayload = {
  brand: string;
  model: string;
  deviceCategory: string;
  serialNumber: string;
  imeiNumber?: string;
  warrantyStatus: string;
  deviceCondition?: string;
  qrCodePayload?: string;
};

export type CreateServiceRequestPayload = {
  customer: CustomerPayload;
  device: DevicePayload;
  issueSummary: string;
  issueDescription?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sourceChannel: string;
  tenantCode?: string;
  loanNumber?: string;
  certificateOfInsuranceNumber?: string;
  previousTicketNumber?: string;
  partnerReference?: string;
  projectName?: string;
  branchName?: string;
  employeeCode?: string;
  employeeName?: string;
  promisedSlaHours?: number;
};

export type CreatePickupRunnerPayload = {
  fullName: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  username?: string;
  active?: boolean;
};

export type AssignPickupPayload = {
  agentId: number;
  scheduledAt: string;
  pickupOtp?: string;
  notes?: string;
};

export type ClaimRegistrationFormData = {
  customerName: string;
  contactPerson?: string;
  phone: string;
  alternatePhone?: string;
  whatsappNumber?: string;
  email?: string;
  secondaryEmail?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  googleMapLink?: string;
  city: string;
  state: string;
  postalCode: string;
  loanNumber?: string;
  certificateOfInsuranceNumber?: string;
  previousTicketNumber?: string;
  projectName?: string;
  branchName?: string;
  employeeCode?: string;
  employeeName?: string;
  deviceCategory: string;
  brand: string;
  model: string;
  serialNumber: string;
  imeiNumber?: string;
  warrantyStatus: string;
  deviceCondition?: string;
  qrCodePayload?: string;
  issueSummary: string;
  issueDescription?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sourceChannel: string;
  partnerReference?: string;
  promisedSlaHours?: string;
};

export type PickupRunnerFormData = {
  fullName: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  username?: string;
  active?: boolean;
};

export type UserSummary = {
  id: number;
  fullName: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  role: string;
  tenantCode?: string | null;
  active: boolean;
};

export type NotificationRecord = {
  channel: string;
  recipient: string;
  subject: string;
  message: string;
  deliveryStatus: string;
};

export type PickupRecord = {
  runnerName?: string | null;
  runnerPhone?: string | null;
  scheduledAt?: string | null;
  pickupOtp?: string | null;
  notes?: string | null;
  acceptedAt?: string | null;
  completedAt?: string | null;
  runnerLinkSentAt?: string | null;
  runnerPortalLink?: string | null;
  requiredPhotoCount: number;
  uploadedRequiredPhotoCount: number;
  uploadedOptionalPhotoCount: number;
};

export type ServiceRequestRecord = {
  id: number;
  requestNumber: string;
  status: string;
  customerName: string;
  deviceLabel: string;
  customerPhone: string;
  pickupAgent?: string | null;
  pickup?: PickupRecord | null;
  notifications: NotificationRecord[];
};

export type RunnerNotification = {
  id: number;
  channel: string;
  subject: string;
  message: string;
  deliveryStatus: string;
  requestNumber?: string | null;
  requestStatus?: string | null;
  runnerPortalToken?: string | null;
};

export type AdminMenuRoute = {
  sectionId: string;
  sectionLabel: string;
  itemId: string;
  itemLabel: string;
  description: string;
  path: string;
};
