export type UserRole = 'ADMIN' | 'CUSTOMER_SUPPORT' | 'BACKEND_TEAM' | 'PICKUP_AGENT' | 'TECHNICIAN' | 'DELIVERY_AGENT' | 'FINANCE' | 'MSE_TEAM';

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
  partnerReference?: string | null;
  customerName: string;
  customerPhone: string;
  customerGstin?: string | null;
  deviceLabel: string;
  imeiNumber?: string | null;
  imeiValidationStatus: string;
  qrCodePayload?: string | null;
  issueSummary: string;
  issueDescription: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
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
