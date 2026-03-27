import type { ServiceRequest } from '../types/models';

type WorkflowStageMeta = {
  label: string;
  owner: string;
  customerComms: string;
};

const statusMeta: Record<string, WorkflowStageMeta> = {
  REQUEST_CREATED: { label: 'New Case Request', owner: 'Back End Team', customerComms: 'SMS / WhatsApp to 2 numbers' },
  PICKUP_ASSIGNED: { label: 'Pick Up Assign', owner: 'Back End Team', customerComms: 'SMS / WhatsApp to 2 numbers' },
  PICKUP_IN_PROGRESS: { label: 'Runner Accepted', owner: 'Runner', customerComms: 'SMS / WhatsApp to 2 numbers' },
  PICKUP_COMPLETED: { label: 'Pick Up Done', owner: 'Runner', customerComms: 'SMS / WhatsApp to 2 numbers' },
  RECEIVED_AT_HUB: { label: 'Received At Hub', owner: 'Back End Team', customerComms: 'SMS / WhatsApp to 2 numbers' },
  DIAGNOSIS_IN_PROGRESS: { label: 'Send For Estimation', owner: 'Back End Team', customerComms: 'SMS / WhatsApp to 2 numbers' },
  ESTIMATE_PREPARED: { label: 'Estimate Submitted', owner: 'Back End Team', customerComms: 'SMS / WhatsApp to 2 numbers' },
  ESTIMATE_APPROVED: { label: 'Under Repair', owner: 'Repair', customerComms: 'SMS / WhatsApp to 2 numbers' },
  CASHLESS_PENDING_APPROVAL: { label: 'Cashless Approval Pending', owner: 'Back End Team', customerComms: 'WhatsApp update to cashless contacts' },
  CASHLESS_REVISION_REQUIRED: { label: 'Cashless Revision Required', owner: 'Back End Team', customerComms: 'WhatsApp update to cashless contacts' },
  CASHLESS_REJECTED: { label: 'Cashless Rejected', owner: 'Back End Team', customerComms: 'WhatsApp update to cashless contacts' },
  CASHLESS_APPROVED: { label: 'Cashless Approved', owner: 'Back End Team', customerComms: 'WhatsApp update to cashless contacts' },
  REPAIR_IN_PROGRESS: { label: 'Under Repair', owner: 'Repair', customerComms: 'SMS / WhatsApp to 2 numbers' },
  REPAIR_COMPLETED: { label: 'Ready For Dispatch', owner: 'MSE For Excess Payment', customerComms: 'SMS / WhatsApp to 2 numbers' },
  TOTAL_LOSS: { label: 'Total Loss', owner: 'MSE', customerComms: 'SMS / WhatsApp to 2 numbers' },
  READY_FOR_DISPATCH: { label: 'Ready For Dispatch', owner: 'MSE For Excess Payment', customerComms: 'SMS / WhatsApp to 2 numbers' },
  DELIVERY_ASSIGNED: { label: 'Drop Assign', owner: 'Back End Team', customerComms: 'SMS / WhatsApp to 2 numbers' },
  OUT_FOR_DELIVERY: { label: 'Drop Assign', owner: 'Runner', customerComms: 'SMS / WhatsApp to 2 numbers' },
  DELIVERED: { label: 'Drop Done', owner: 'Runner', customerComms: 'SMS / WhatsApp to 2 numbers' },
  INVOICED: { label: 'Invoice Upload', owner: 'Back End Team', customerComms: 'Billing update shared with customer' },
  CLOSED: { label: 'Closed', owner: 'Back End Team', customerComms: 'Closure shared with customer' },
};

export function getWorkflowStageMeta(request: Pick<ServiceRequest, 'status' | 'invoice' | 'payments'>): WorkflowStageMeta {
  if (request.status === 'INVOICED') {
    if ((request.invoice?.amountDue ?? 0) > 0) {
      return { label: 'Payment Pending', owner: 'Back End Team', customerComms: 'Payment link / UTR reminder to customer' };
    }

    if (request.payments.length > 0) {
      return { label: 'Payment Received', owner: 'Back End Team', customerComms: 'Payment confirmation shared with customer' };
    }
  }

  return statusMeta[request.status] ?? {
    label: request.status.replaceAll('_', ' '),
    owner: 'Back End Team',
    customerComms: 'Customer update pending configuration',
  };
}
