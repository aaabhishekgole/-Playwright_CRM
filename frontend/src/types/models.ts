export type UserRole = 'ADMIN' | 'CUSTOMER_SUPPORT' | 'BACKEND_TEAM' | 'PICKUP_AGENT' | 'TECHNICIAN' | 'DELIVERY_AGENT' | 'FINANCE' | 'MSE_TEAM';
export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type CreateCustomerPayload = {
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

export type CreateDevicePayload = {
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
  customer: CreateCustomerPayload;
  device: CreateDevicePayload;
  issueSummary: string;
  issueDescription?: string;
  priority: RequestPriority;
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

export type AssignPickupPayload = {
  agentId: number;
  scheduledAt: string;
  pickupOtp?: string;
  notes?: string;
};

export type AssignDeliveryPayload = {
  agentId: number;
  scheduledAt: string;
  otpCode?: string;
  notes?: string;
};

export type CreateEstimatePayload = {
  diagnosisSummary: string;
  partsCost: number;
  laborCost: number;
  taxAmount: number;
};

export type CreateInvoicePayload = {
  customerGstin?: string;
  billingStateCode: string;
  placeOfSupply: string;
  gstRate: number;
  laborDescription: string;
  partsDescription?: string;
};

export type RecordPaymentPayload = {
  paymentReference: string;
  amount: number;
  paymentMethod: string;
  utrNumber?: string;
  metadataJson?: string;
};

export type RefundPaymentPayload = {
  paymentId: number;
  amount: number;
  reason: string;
};

export type UserSummary = {
  id: number;
  fullName: string;
  username: string;
  role: string;
  tenantCode?: string | null;
  active: boolean;
};

export type TimelineItem = {
  fromStatus: string | null;
  toStatus: string;
  remarks: string;
  changedBy: string;
  beforeValueJson?: string | null;
  afterValueJson?: string | null;
  changedAt: string;
};

export type AttachmentItem = {
  id: number;
  attachmentType: string;
  fileName: string;
  contentType: string;
  objectKey: string;
  checksum: string;
  signedUrl: string;
  signedUrlExpiresAt: string;
  uploadedAt: string;
};

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxableValue: number;
  gstRate: number;
  lineTotal: number;
};

export type InvoiceSummary = {
  invoiceNumber: string;
  paymentStatus: string;
  gstType: string;
  customerGstin: string | null;
  billingStateCode: string;
  placeOfSupply: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  amountPaid: number;
  amountDue: number;
  refundAmount: number;
  issuedAt: string;
  items: InvoiceLineItem[];
};

export type PaymentItem = {
  id: number;
  paymentReference: string;
  utrNumber?: string | null;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  reconciliationStatus?: string | null;
  reconciliationRemarks?: string | null;
  refundStatus: string;
  refundAmount: number;
  refundReason?: string | null;
  paidAt?: string | null;
  reconciledAt?: string | null;
  refundedAt?: string | null;
};

export type NotificationItem = {
  channel: string;
  recipient: string;
  subject: string;
  deliveryStatus: string;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
};

export type AuditItem = {
  entityName: string;
  action: string;
  beforeJson?: string | null;
  afterJson?: string | null;
  changedBy: string;
  changedAt: string;
};

export type ServiceRequest = {
  id: number;
  requestNumber: string;
  tenantCode: string;
  tenantName: string;
  loanNumber?: string | null;
  certificateOfInsuranceNumber?: string | null;
  previousTicketNumber?: string | null;
  partnerReference?: string | null;
  projectName?: string | null;
  branchName?: string | null;
  employeeCode?: string | null;
  employeeName?: string | null;
  customerName: string;
  contactPerson?: string | null;
  customerPhone: string;
  alternatePhone?: string | null;
  whatsappNumber?: string | null;
  customerGstin?: string | null;
  customerEmail?: string | null;
  secondaryEmail?: string | null;
  customerAddress?: string | null;
  landmark?: string | null;
  googleMapLink?: string | null;
  customerCity?: string | null;
  customerState?: string | null;
  customerPostalCode?: string | null;
  deviceLabel: string;
  deviceCategory: string;
  serialNumber: string;
  imeiNumber?: string | null;
  imeiValidationStatus: string;
  qrCodePayload?: string | null;
  issueSummary: string;
  issueDescription: string;
  priority: RequestPriority;
  status: string;
  sourceChannel: string;
  pickupAgent?: string | null;
  technician?: string | null;
  deliveryAgent?: string | null;
  committedAt: string;
  expectedCompletionAt: string;
  slaDeadlineAt: string;
  actualResolutionAt?: string | null;
  tatMinutes?: number | null;
  slaBreached: boolean;
  breachReason?: string | null;
  invoice?: InvoiceSummary | null;
  payments: PaymentItem[];
  notifications: NotificationItem[];
  auditTrail: AuditItem[];
  timeline: TimelineItem[];
  attachments: AttachmentItem[];
  createdAt: string;
  updatedAt: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  username: string;
  role: UserRole;
};
