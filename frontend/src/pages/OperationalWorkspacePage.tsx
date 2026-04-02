import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage, fetchUsers } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import type { MenuLeaf, MenuSection } from '../utils/menuHierarchy';
import type { ServiceRequest, UserSummary } from '../types/models';
import { useRequests } from './useRequests';
import { formatDeviceCategory } from '../utils/deviceCatalog';
import { formatCurrencyInr, formatDateTimeIn } from '../utils/formatters';
import { isPickupCustomerUpdateStatus, isPickupRunnerPendingStatus } from '../utils/pickupStatuses';
import { getWorkflowStageMeta } from '../utils/workflowStages';

const supportedItems = new Set([
  'assign-pickup',
  'pending-pickup',
  'pickup-failed-cases',
  'pickup-history',
  'picked-up-devices',
  'device-received-at-hub',
  'pending-verification',
  'send-to-service-center',
  'inward-register',
  'hub-inventory',
  'devices-under-inspection',
  'estimate-pending',
  'estimate-submitted',
  'new-estimates',
  'approved-estimates',
  'rejected-estimates',
  'estimate-history',
  'under-repair',
  'repair-completed',
  'total-loss-cases',
  'pending-qc',
  'qc-passed',
  'qc-failed',
  'rework-required',
  'assign-delivery',
  'ready-for-dispatch',
  'delivered',
  'delivery-failed',
  'delivery-history',
  'generate-invoice',
  'pending-invoices',
  'paid-invoices',
  'refund-cases',
  'invoice-reports',
  'pending-photos',
  'approved-cases',
]);

const pickupCompletedOrLater = [
  'PICKUP_COMPLETED',
  'RECEIVED_AT_HUB',
  'DIAGNOSIS_IN_PROGRESS',
  'ESTIMATE_PREPARED',
  'ESTIMATE_APPROVED',
  'CASHLESS_PENDING_APPROVAL',
  'CASHLESS_REVISION_REQUIRED',
  'CASHLESS_REJECTED',
  'CASHLESS_APPROVED',
  'REPAIR_IN_PROGRESS',
  'REPAIR_COMPLETED',
  'TOTAL_LOSS',
  'READY_FOR_DISPATCH',
  'DELIVERY_ASSIGNED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'INVOICED',
  'CLOSED',
];

const hubInventoryStatuses = [
  'RECEIVED_AT_HUB',
  'DIAGNOSIS_IN_PROGRESS',
  'ESTIMATE_PREPARED',
  'ESTIMATE_APPROVED',
  'CASHLESS_PENDING_APPROVAL',
  'CASHLESS_REVISION_REQUIRED',
  'CASHLESS_APPROVED',
  'REPAIR_IN_PROGRESS',
  'REPAIR_COMPLETED',
  'TOTAL_LOSS',
  'READY_FOR_DISPATCH',
];

const estimateHistoryStatuses = [
  'ESTIMATE_PREPARED',
  'ESTIMATE_APPROVED',
  'CASHLESS_PENDING_APPROVAL',
  'CASHLESS_REVISION_REQUIRED',
  'CASHLESS_REJECTED',
  'CASHLESS_APPROVED',
  'REPAIR_IN_PROGRESS',
  'REPAIR_COMPLETED',
  'TOTAL_LOSS',
  'READY_FOR_DISPATCH',
  'DELIVERY_ASSIGNED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'INVOICED',
  'CLOSED',
];

function countByPrefix(request: ServiceRequest, prefix: string) {
  return request.attachments.filter((attachment) => attachment.attachmentType.startsWith(prefix)).length;
}

function defaultScheduleValue(offsetDays = 1) {
  const value = new Date();
  value.setDate(value.getDate() + offsetDays);
  value.setHours(10, 0, 0, 0);
  const timezoneOffset = value.getTimezoneOffset();
  const localDate = new Date(value.getTime() - timezoneOffset * 60000);
  return localDate.toISOString().slice(0, 16);
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : new Date().toISOString();
}

function hasReachedStatus(request: ServiceRequest, statuses: string[]) {
  return statuses.includes(request.status) || request.timeline.some((entry) => statuses.includes(entry.toStatus));
}

function timelineContains(request: ServiceRequest, patterns: string[]) {
  return request.timeline.some((entry) => {
    const haystack = `${entry.toStatus} ${entry.remarks}`.toLowerCase();
    return patterns.some((pattern) => haystack.includes(pattern));
  });
}

function resolveRequests(itemId: string, requests: ServiceRequest[]) {
  switch (itemId) {
    case 'assign-pickup':
      return requests.filter((request) => request.status === 'REQUEST_CREATED' || isPickupCustomerUpdateStatus(request.status));
    case 'pending-pickup':
      return requests.filter((request) => isPickupRunnerPendingStatus(request.status));
    case 'pickup-failed-cases':
      return requests.filter((request) => isPickupCustomerUpdateStatus(request.status) || timelineContains(request, ['pickup failed', 'failed pickup', 'pickup rescheduled']));
    case 'pickup-history':
      return requests.filter((request) => hasReachedStatus(request, pickupCompletedOrLater));
    case 'picked-up-devices':
      return requests.filter((request) => countByPrefix(request, 'PICKUP_IMAGE_') > 0);
    case 'device-received-at-hub':
      return requests.filter((request) => request.status === 'PICKUP_COMPLETED');
    case 'pending-verification':
      return requests.filter((request) => request.status === 'RECEIVED_AT_HUB');
    case 'send-to-service-center':
      return requests.filter((request) => request.status === 'RECEIVED_AT_HUB');
    case 'inward-register':
      return requests.filter((request) => hasReachedStatus(request, ['RECEIVED_AT_HUB']));
    case 'hub-inventory':
      return requests.filter((request) => hubInventoryStatuses.includes(request.status));
    case 'devices-under-inspection':
    case 'estimate-pending':
      return requests.filter((request) => request.status === 'DIAGNOSIS_IN_PROGRESS');
    case 'estimate-submitted':
    case 'new-estimates':
      return requests.filter((request) => request.status === 'ESTIMATE_PREPARED');
    case 'approved-estimates':
      return requests.filter((request) => ['ESTIMATE_APPROVED', 'CASHLESS_APPROVED', 'REPAIR_IN_PROGRESS', 'REPAIR_COMPLETED'].includes(request.status));
    case 'rejected-estimates':
      return requests.filter((request) => ['TOTAL_LOSS', 'CASHLESS_REJECTED'].includes(request.status) || timelineContains(request, ['estimate rejected', 'cashless rejected']));
    case 'estimate-history':
      return requests.filter((request) => hasReachedStatus(request, estimateHistoryStatuses));
    case 'under-repair':
      return requests.filter((request) => ['ESTIMATE_APPROVED', 'CASHLESS_APPROVED', 'REPAIR_IN_PROGRESS'].includes(request.status));
    case 'repair-completed':
      return requests.filter((request) => request.status === 'REPAIR_COMPLETED');
    case 'total-loss-cases':
      return requests.filter((request) => request.status === 'TOTAL_LOSS');
    case 'pending-qc':
      return requests.filter((request) => request.status === 'REPAIR_COMPLETED');
    case 'qc-passed':
      return requests.filter((request) => ['READY_FOR_DISPATCH', 'DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'INVOICED', 'CLOSED'].includes(request.status));
    case 'qc-failed':
      return requests.filter((request) => timelineContains(request, ['qc failed', 'quality check failed']));
    case 'rework-required':
      return requests.filter((request) => request.status === 'REPAIR_IN_PROGRESS' && timelineContains(request, ['qc failed', 'rework']));
    case 'assign-delivery':
    case 'ready-for-dispatch':
      return requests.filter((request) => request.status === 'READY_FOR_DISPATCH');
    case 'delivered':
      return requests.filter((request) => ['DELIVERED', 'INVOICED', 'CLOSED'].includes(request.status));
    case 'delivery-failed':
      return requests.filter((request) =>
        request.status === 'READY_FOR_DISPATCH'
        && timelineContains(request, ['delivery failed', 'customer unavailable', 'return to hub', 'reassign delivery']),
      );
    case 'delivery-history':
      return requests.filter((request) => hasReachedStatus(request, ['DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'INVOICED', 'CLOSED']));
    case 'generate-invoice':
      return requests.filter((request) => !request.invoice && ['DELIVERED', 'TOTAL_LOSS'].includes(request.status));
    case 'pending-invoices':
      return requests.filter((request) => Boolean(request.invoice) && (request.invoice?.amountDue ?? 0) > 0);
    case 'paid-invoices':
      return requests.filter((request) => Boolean(request.invoice) && (request.invoice?.amountDue ?? 0) <= 0);
    case 'refund-cases':
      return requests.filter((request) => Boolean(request.invoice) && (request.payments.length > 0 || (request.invoice?.refundAmount ?? 0) > 0));
    case 'invoice-reports':
      return requests.filter((request) => Boolean(request.invoice));
    case 'pending-photos':
      return requests.filter((request) =>
        ['ESTIMATE_PREPARED', 'CASHLESS_PENDING_APPROVAL', 'CASHLESS_REVISION_REQUIRED'].includes(request.status)
        || countByPrefix(request, 'CASHLESS_DEVICE_IMAGE_') < 6
        || countByPrefix(request, 'CASHLESS_DAMAGE_IMAGE_') < 4,
      );
    case 'approved-cases':
      return requests.filter((request) => request.status === 'CASHLESS_APPROVED');
    default:
      return null;
  }
}

function getSummaryLabel(itemId: string) {
  switch (itemId) {
    case 'new-estimates':
      return 'Submission queue';
    case 'approved-estimates':
      return 'Approved queue';
    case 'rejected-estimates':
      return 'Rejected queue';
    case 'estimate-history':
      return 'History queue';
    case 'pending-qc':
      return 'Validation queue';
    case 'qc-passed':
      return 'Dispatch-ready queue';
    case 'qc-failed':
      return 'Failure queue';
    case 'rework-required':
      return 'Rework queue';
    case 'assign-delivery':
      return 'Assignment queue';
    case 'ready-for-dispatch':
      return 'Dispatch queue';
    case 'delivered':
      return 'Delivered queue';
    case 'delivery-failed':
      return 'Exception queue';
    case 'delivery-history':
      return 'History queue';
    case 'pending-pickup':
      return 'Runner queue';
    case 'assign-pickup':
      return 'Assignment queue';
    case 'generate-invoice':
      return 'Invoice-ready queue';
    case 'pending-invoices':
      return 'Collections queue';
    case 'paid-invoices':
      return 'Closure queue';
    case 'refund-cases':
      return 'Refund queue';
    default:
      return 'Live queue';
  }
}

function getEmptyStageCopy(itemId: string) {
  switch (itemId) {
    case 'new-estimates':
      return 'Fresh estimate submissions will appear here once the service center completes diagnosis and sends the costing forward for review.';
    case 'approved-estimates':
      return 'Approved estimates will appear here after customer or operations consent is captured and the case is authorized for repair.';
    case 'rejected-estimates':
      return 'Rejected, declined, or total-loss estimate outcomes will appear here for closure, revision, or billing follow-up.';
    case 'estimate-history':
      return 'Historical estimate activity will appear here once estimate decisions begin moving through approval, rejection, or downstream repair states.';
    case 'pending-qc':
      return 'Completed repairs will appear here once they are ready for quality validation before dispatch clearance.';
    case 'qc-passed':
      return 'QC-passed repairs will appear here after validation is completed and the case is cleared for dispatch handoff.';
    case 'qc-failed':
      return 'QC failures will appear here when validation finds unresolved repair issues, cosmetic gaps, or missing evidence.';
    case 'rework-required':
      return 'Rework cases will appear here after a QC failure sends the request back to the technician for correction and re-validation.';
    case 'assign-delivery':
      return 'Assign Delivery will show dispatch-ready cases that need final-mile owner allocation, schedule locking, and route notes.';
    case 'ready-for-dispatch':
      return 'Dispatch-cleared cases will appear here after repair and QC are complete and the device is ready for delivery planning.';
    case 'delivered':
      return 'Delivered handovers will appear here once the final-mile outcome is completed and the request is ready for billing or closure follow-up.';
    case 'delivery-failed':
      return 'Failed delivery attempts will appear here when the customer is unavailable, the drop cannot be completed, or re-assignment is needed.';
    case 'delivery-history':
      return 'Historical delivery movement will appear here after delivery jobs begin flowing through dispatch, in-transit, completed, and failed outcomes.';
    case 'assign-pickup':
      return 'Assign Pickup shows fresh REQUEST_CREATED claims and customer-update pickup cases that need a reschedule or another runner attempt.';
    case 'pending-pickup':
      return 'Assigned pickup jobs will appear here for runner acceptance, customer/admin notifications, and 10-photo evidence upload.';
    case 'device-received-at-hub':
    case 'pending-verification':
    case 'send-to-service-center':
      return 'Hub-stage requests will appear here once pickup is completed and the device is inwarded.';
    case 'devices-under-inspection':
    case 'estimate-pending':
      return 'Diagnosis and estimate work begins here after the hub sends devices to the service center.';
    case 'generate-invoice':
    case 'pending-invoices':
    case 'paid-invoices':
      return 'Billing records will appear here after delivery and invoice generation.';
    default:
      return 'The live workflow board is active. Requests will appear here automatically when they reach this step.';
  }
}

function getStagePlaybook(itemId: string) {
  switch (itemId) {
    case 'new-estimates':
      return {
        title: 'New Estimate Intake',
        steps: [
          'Repair partners submit diagnosis, parts, labour, and tax values for review.',
          'Operations validates estimate completeness, evidence, and commercial correctness.',
          'Qualified submissions move to customer or internal approval without leaving the request trail.',
        ],
      };
    case 'approved-estimates':
      return {
        title: 'Approved Estimate Execution',
        steps: [
          'Approved estimates represent authorized commercial scope for the request.',
          'The approved amount becomes the working basis for repair, billing, and customer communication.',
          'Authorized cases should move quickly into repair execution to avoid unnecessary TAT slippage.',
        ],
      };
    case 'rejected-estimates':
      return {
        title: 'Rejected Or Declined Outcome',
        steps: [
          'Rejected estimates capture customer decline, commercial mismatch, or total-loss routing.',
          'Operations should review the reason, supporting notes, and downstream closure requirement.',
          'These cases typically move into revision, closure, or billing resolution rather than active repair.',
        ],
      };
    case 'estimate-history':
      return {
        title: 'Estimate Decision Timeline',
        steps: [
          'This view tracks how estimate decisions move across submission, approval, rejection, and downstream execution.',
          'Every action remains tied to the same request, timeline, billing, and attachment record.',
          'Use this queue to review estimate throughput, decision quality, and audit continuity.',
        ],
      };
    case 'pending-qc':
      return {
        title: 'Pending Quality Validation',
        steps: [
          'Repairs completed by technicians enter this queue for post-repair validation.',
          'Quality reviewers should confirm functional readiness, cosmetic closure, and evidence completeness.',
          'Only validated cases should move forward to dispatch so downstream delivery remains clean.',
        ],
      };
    case 'qc-passed':
      return {
        title: 'QC Passed And Ready For Dispatch',
        steps: [
          'Validated repairs represent cases that have passed post-repair quality checks.',
          'These requests are operationally ready for dispatch planning, final customer communication, and delivery assignment.',
          'Use this board to monitor dispatch readiness and avoid approved devices sitting idle after QC clearance.',
        ],
      };
    case 'qc-failed':
      return {
        title: 'QC Failure Review',
        steps: [
          'QC failures capture cases where the repair outcome did not meet validation expectations.',
          'Operations should review the failure reason, remarks, and technician handback requirements immediately.',
          'These cases should not move to dispatch until the underlying repair or evidence issue is corrected.',
        ],
      };
    case 'rework-required':
      return {
        title: 'Rework Recovery Flow',
        steps: [
          'Rework cases are failed QC outcomes that have been sent back for corrective technician action.',
          'The repair team should resolve the flagged issues and return the case to quality validation quickly.',
          'Use this board to control repeat failures and prevent repair loops from extending TAT unnecessarily.',
        ],
      };
    case 'assign-delivery':
      return {
        title: 'Final-Mile Allocation',
        steps: [
          'Dispatch-ready cases are assigned to a delivery owner with route timing, handover notes, and customer context.',
          'The assigned delivery agent becomes responsible for the final-mile outcome and communication trail.',
          'Only correctly assigned cases should move into active delivery execution to avoid failed handoffs.',
        ],
      };
    case 'ready-for-dispatch':
      return {
        title: 'Dispatch Preparation Board',
        steps: [
          'Completed and QC-cleared devices enter this queue before they are handed to delivery.',
          'Operations should confirm readiness, documents, customer contact details, and final dispatch planning.',
          'This board is the final control point before last-mile execution begins.',
        ],
      };
    case 'delivered':
      return {
        title: 'Completed Handover Board',
        steps: [
          'Delivered cases represent successful last-mile completion and customer handover.',
          'These requests should flow quickly into billing, reconciliation, and closure activities without losing proof of completion.',
          'Use this queue to watch post-delivery throughput and prevent delivered jobs from stalling downstream.',
        ],
      };
    case 'delivery-failed':
      return {
        title: 'Delivery Exception Handling',
        steps: [
          'Failed deliveries capture customer unavailability, route issues, or incomplete last-mile handover attempts.',
          'Operations should review the reason, reschedule need, and reassignment requirement as early as possible.',
          'These cases should remain visible until a clean re-attempt or alternate resolution is confirmed.',
        ],
      };
    case 'delivery-history':
      return {
        title: 'Delivery Movement History',
        steps: [
          'This board tracks delivery execution from dispatch assignment through in-transit, delivered, and failed outcomes.',
          'Every delivery action remains tied to the same request, customer communication, and billing trail.',
          'Use it to review delivery throughput, exception rates, and operational follow-through over time.',
        ],
      };
    case 'assign-pickup':
      return {
        title: 'New Case Request To Pickup Assignment',
        steps: [
          'New Case Request is created and the request enters system status REQUEST_CREATED.',
          'Back-end operations assigns a pickup runner with schedule, OTP, and notes, then sends the runner link over SMS and WhatsApp.',
          'Runner receives the link, opens the runner portal, and the case moves into Pending Pickup for field execution.',
        ],
      };
    case 'pending-pickup':
      return {
        title: 'Pickup Execution Flow',
        steps: [
          'Runner accepts the assigned pickup job from the live queue or runner portal link.',
          'If pickup cannot continue, the runner can mark Customer Not Available, Customer Reschedule, or Customer Not Contactable from the same shared portal flow.',
          'Field pickup is completed with 10 required device photos plus optional supporting images.',
          'Completed pickup automatically feeds hub receiving, history, and evidence views.',
        ],
      };
    case 'device-received-at-hub':
    case 'pending-verification':
    case 'send-to-service-center':
      return {
        title: 'Hub Inward Flow',
        steps: [
          'Picked-up device is inwarded at the hub with serial and IMEI verification.',
          'Back-end team validates intake details, branch ownership, and partner mapping.',
          'Verified cases are routed to the service center for diagnosis and estimate creation.',
        ],
      };
    case 'devices-under-inspection':
    case 'estimate-pending':
    case 'estimate-submitted':
      return {
        title: 'Estimate And Approval Flow',
        steps: [
          'Service center diagnoses the device and prepares parts, labour, and tax values.',
          'Cashless or standard approval is reviewed by the operations team.',
          'Approved cases move to repair, while rejected or total-loss cases are diverted for closure or billing.',
        ],
      };
    case 'under-repair':
    case 'repair-completed':
      return {
        title: 'Repair And QC Flow',
        steps: [
          'Approved estimates move into active repair with technician ownership.',
          'Completed repairs are validated through quality check before dispatch.',
          'QC failures return to rework, while passed cases move to dispatch and delivery.',
        ],
      };
    case 'generate-invoice':
    case 'pending-invoices':
    case 'paid-invoices':
    case 'refund-cases':
    case 'invoice-reports':
      return {
        title: 'Billing And Payment Flow',
        steps: [
          'Delivered or total-loss cases generate GST-ready invoices in INR.',
          'Collections teams capture payment references, UTRs, and reconciliation updates.',
          'Paid, refunded, and report-ready cases remain linked to the same request record.',
        ],
      };
    case 'pending-photos':
    case 'approved-cases':
      return {
        title: 'Cashless Review Flow',
        steps: [
          'Cashless cases require 6 device photos and 4 damage photos before approval.',
          'Back-end reviewers can approve, reject, or send the case back for revision.',
          'Approved cashless cases flow directly into the repair queue without losing evidence history.',
        ],
      };
    default:
      return {
        title: 'Operational Stage Flow',
        steps: [
          'Each submenu is mapped to a live service-request stage instead of placeholder data.',
          'Actions on this board update the same request, timeline, billing, and attachment records.',
          'Once a case moves forward, the next submenu queue updates automatically from the API.',
        ],
      };
  }
}

function prioritizePreferredUsers(users: UserSummary[], preferredName: string) {
  return [...users].sort((left, right) => {
    if (left.fullName === preferredName && right.fullName !== preferredName) {
      return -1;
    }
    if (right.fullName === preferredName && left.fullName !== preferredName) {
      return 1;
    }
    return left.fullName.localeCompare(right.fullName);
  });
}

export function isOperationalWorkspaceItem(itemId?: string) {
  return Boolean(itemId && supportedItems.has(itemId));
}

export function OperationalWorkspacePage({
  section,
  item,
}: {
  section: MenuSection;
  item: MenuLeaf;
}) {
  const { role } = useAuth();
  const { showError, showSuccess } = useToast();
  const {
    requests,
    loading,
    error,
    assignPickup,
    assignDelivery,
    createEstimate,
    createInvoice,
    recordPayment,
    refundPayment,
    transitionStatus,
  } = useRequests();
  const preferredPickupRunner = 'Vishal Babar';

  const [pickupAgents, setPickupAgents] = useState<UserSummary[]>([]);
  const [deliveryAgents, setDeliveryAgents] = useState<UserSummary[]>([]);
  const [userError, setUserError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [messageById, setMessageById] = useState<Record<number, string>>({});
  const [selectedPickupAgentById, setSelectedPickupAgentById] = useState<Record<number, string>>({});
  const [pickupScheduleById, setPickupScheduleById] = useState<Record<number, string>>({});
  const [pickupNotesById, setPickupNotesById] = useState<Record<number, string>>({});
  const [selectedDeliveryAgentById, setSelectedDeliveryAgentById] = useState<Record<number, string>>({});
  const [deliveryScheduleById, setDeliveryScheduleById] = useState<Record<number, string>>({});
  const [deliveryNotesById, setDeliveryNotesById] = useState<Record<number, string>>({});
  const [diagnosisById, setDiagnosisById] = useState<Record<number, string>>({});
  const [partsCostById, setPartsCostById] = useState<Record<number, string>>({});
  const [laborCostById, setLaborCostById] = useState<Record<number, string>>({});
  const [taxById, setTaxById] = useState<Record<number, string>>({});
  const [invoiceGstinById, setInvoiceGstinById] = useState<Record<number, string>>({});
  const [invoiceBillingStateById, setInvoiceBillingStateById] = useState<Record<number, string>>({});
  const [invoicePlaceOfSupplyById, setInvoicePlaceOfSupplyById] = useState<Record<number, string>>({});
  const [invoiceGstRateById, setInvoiceGstRateById] = useState<Record<number, string>>({});
  const [invoiceLaborDescriptionById, setInvoiceLaborDescriptionById] = useState<Record<number, string>>({});
  const [invoicePartsDescriptionById, setInvoicePartsDescriptionById] = useState<Record<number, string>>({});
  const [paymentReferenceById, setPaymentReferenceById] = useState<Record<number, string>>({});
  const [paymentAmountById, setPaymentAmountById] = useState<Record<number, string>>({});
  const [paymentMethodById, setPaymentMethodById] = useState<Record<number, string>>({});
  const [paymentUtrById, setPaymentUtrById] = useState<Record<number, string>>({});
  const [refundPaymentIdById, setRefundPaymentIdById] = useState<Record<number, string>>({});
  const [refundAmountById, setRefundAmountById] = useState<Record<number, string>>({});
  const [refundReasonById, setRefundReasonById] = useState<Record<number, string>>({});

  function setModuleMessage(requestId: number, message: string) {
    setMessageById((current) => ({ ...current, [requestId]: message }));
  }

  function reportSuccess(requestId: number, message: string) {
    setModuleMessage(requestId, message);
    showSuccess(message, item.label);
  }

  function reportError(requestId: number, message: string) {
    setModuleMessage(requestId, message);
    showError(message, item.label);
  }

  const stageRequests = useMemo(() => resolveRequests(item.id, requests) ?? [], [item.id, requests]);
  const isAssignmentPage = item.id === 'assign-pickup';
  const isDeliveryAssignmentPage = item.id === 'assign-delivery' || item.id === 'ready-for-dispatch' || item.id === 'delivery-failed';
  const stagePlaybook = useMemo(() => getStagePlaybook(item.id), [item.id]);
  const visibleRequests = useMemo(() => {
    if (item.id === 'pending-pickup' && role === 'PICKUP_AGENT') {
      return stageRequests.filter((request) => request.pickupAgent);
    }
    return stageRequests;
  }, [item.id, role, stageRequests]);

  useEffect(() => {
    let active = true;

    async function loadAssignableUsers() {
      try {
        setUserError(null);
        if (isAssignmentPage) {
          const agents = await fetchUsers('PICKUP_AGENT', true);
          if (active) {
            setPickupAgents(prioritizePreferredUsers(agents, preferredPickupRunner));
          }
        }
        if (isDeliveryAssignmentPage) {
          const agents = await fetchUsers('DELIVERY_AGENT', true);
          if (active) {
            setDeliveryAgents(agents);
          }
        }
      } catch (nextError) {
        if (active) {
          const nextMessage = getApiErrorMessage(nextError);
          setUserError(nextMessage);
          showError(nextMessage, `${item.label} setup failed`);
        }
      }
    }

    if (isAssignmentPage || isDeliveryAssignmentPage) {
      loadAssignableUsers();
    }

    return () => {
      active = false;
    };
  }, [isAssignmentPage, isDeliveryAssignmentPage]);

  async function handleTransition(requestId: number, targetStatus: string, remarks: string, successMessage: string) {
    try {
      setBusyId(requestId);
      await transitionStatus(requestId, targetStatus, remarks);
      reportSuccess(requestId, successMessage);
    } catch (nextError) {
      reportError(requestId, getApiErrorMessage(nextError));
    } finally {
      setBusyId(null);
    }
  }

  async function handleAssignPickup(requestId: number) {
    const agentId = Number(selectedPickupAgentById[requestId] ?? pickupAgents[0]?.id ?? 0);
    if (!agentId) {
      reportError(requestId, 'Select a pickup runner before assigning.');
      return;
    }

    try {
      setBusyId(requestId);
      const updated = await assignPickup(requestId, {
        agentId,
        scheduledAt: toIso(pickupScheduleById[requestId] ?? defaultScheduleValue()),
        pickupOtp: '4826',
        notes: pickupNotesById[requestId] || 'Assigned from pickup management board',
      });
      reportSuccess(requestId, `Pickup assigned to ${updated.pickup?.runnerName ?? 'runner'}. Runner link sent over SMS and WhatsApp.`);
    } catch (nextError) {
      reportError(requestId, getApiErrorMessage(nextError));
    } finally {
      setBusyId(null);
    }
  }

  async function handleAssignDelivery(requestId: number) {
    const agentId = Number(selectedDeliveryAgentById[requestId] ?? deliveryAgents[0]?.id ?? 0);
    if (!agentId) {
      reportError(requestId, 'Select a delivery runner before assigning.');
      return;
    }

    try {
      setBusyId(requestId);
      await assignDelivery(requestId, {
        agentId,
        scheduledAt: toIso(deliveryScheduleById[requestId] ?? defaultScheduleValue()),
        otpCode: '9032',
        notes: deliveryNotesById[requestId] || 'Assigned from dispatch board',
      });
      reportSuccess(requestId, 'Delivery assigned to runner.');
    } catch (nextError) {
      reportError(requestId, getApiErrorMessage(nextError));
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateEstimate(requestId: number) {
    try {
      setBusyId(requestId);
      await createEstimate(requestId, {
        diagnosisSummary: diagnosisById[requestId] || 'Diagnosis summary captured from service center workbench',
        partsCost: Number(partsCostById[requestId] ?? 0),
        laborCost: Number(laborCostById[requestId] ?? 0),
        taxAmount: Number(taxById[requestId] ?? 0),
      });
      reportSuccess(requestId, 'Estimate submitted to approval queue.');
    } catch (nextError) {
      reportError(requestId, getApiErrorMessage(nextError));
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateInvoice(request: ServiceRequest) {
    const laborDescription = invoiceLaborDescriptionById[request.id] ?? 'Repair labour and diagnostics';
    if (!laborDescription.trim()) {
      reportError(request.id, 'Enter the labor description before generating the invoice.');
      return;
    }

    try {
      setBusyId(request.id);
      await createInvoice(request.id, {
        customerGstin: invoiceGstinById[request.id] || undefined,
        billingStateCode: invoiceBillingStateById[request.id] ?? request.customerState ?? 'Maharashtra',
        placeOfSupply: invoicePlaceOfSupplyById[request.id] ?? request.customerState ?? 'Maharashtra',
        gstRate: Number(invoiceGstRateById[request.id] ?? 18),
        laborDescription,
        partsDescription: invoicePartsDescriptionById[request.id] || undefined,
      });
      reportSuccess(request.id, 'Invoice generated and moved to billing.');
    } catch (nextError) {
      reportError(request.id, getApiErrorMessage(nextError));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRecordPayment(request: ServiceRequest) {
    const paymentReference = paymentReferenceById[request.id]?.trim();
    if (!paymentReference) {
      reportError(request.id, 'Enter a payment reference before recording the payment.');
      return;
    }

    const amount = Number(paymentAmountById[request.id] ?? request.invoice?.amountDue ?? 0);
    if (!amount || amount <= 0) {
      reportError(request.id, 'Enter a valid payment amount greater than zero.');
      return;
    }

    try {
      setBusyId(request.id);
      await recordPayment(request.id, {
        paymentReference,
        amount,
        paymentMethod: paymentMethodById[request.id] || 'UPI',
        utrNumber: paymentUtrById[request.id] || undefined,
      });
      reportSuccess(request.id, 'Payment recorded successfully.');
    } catch (nextError) {
      reportError(request.id, getApiErrorMessage(nextError));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRefund(request: ServiceRequest) {
    const paymentId = Number(refundPaymentIdById[request.id] ?? request.payments[0]?.id ?? 0);
    const amount = Number(refundAmountById[request.id] ?? 0);
    const reason = refundReasonById[request.id]?.trim();

    if (!paymentId) {
      reportError(request.id, 'Select a payment entry before processing a refund.');
      return;
    }

    if (!amount || amount <= 0) {
      reportError(request.id, 'Enter a refund amount greater than zero.');
      return;
    }

    if (!reason) {
      reportError(request.id, 'Enter a refund reason before submitting.');
      return;
    }

    try {
      setBusyId(request.id);
      await refundPayment(request.id, { paymentId, amount, reason });
      reportSuccess(request.id, 'Refund processed successfully.');
    } catch (nextError) {
      reportError(request.id, getApiErrorMessage(nextError));
    } finally {
      setBusyId(null);
    }
  }

  function renderAssignmentBlock(request: ServiceRequest) {
    return (
      <>
        <div className="workspace-chip-row">
          <span className="workspace-chip">Dispatch status: {request.status.replaceAll('_', ' ')}</span>
          <span className="workspace-chip">Amount due: {formatCurrencyInr(request.invoice?.amountDue ?? 0)}</span>
        </div>
        <div className="action-form-grid">
          <label className="action-field">
            <span>Delivery Runner</span>
            <select
              value={selectedDeliveryAgentById[request.id] ?? ''}
              onChange={(event) => setSelectedDeliveryAgentById((current) => ({ ...current, [request.id]: event.target.value }))}
            >
              <option value="">Select runner</option>
              {deliveryAgents.map((agent) => <option key={agent.id} value={agent.id}>{agent.fullName}</option>)}
            </select>
          </label>
          <label className="action-field">
            <span>Scheduled Drop</span>
            <input
              type="datetime-local"
              value={deliveryScheduleById[request.id] ?? defaultScheduleValue()}
              onChange={(event) => setDeliveryScheduleById((current) => ({ ...current, [request.id]: event.target.value }))}
            />
          </label>
        </div>
        <label className="action-field">
          <span>Drop Notes</span>
          <textarea
            value={deliveryNotesById[request.id] ?? ''}
            onChange={(event) => setDeliveryNotesById((current) => ({ ...current, [request.id]: event.target.value }))}
            placeholder="Dispatch, payment, or handoff notes"
          />
        </label>
        <div className="action-row action-row-wrap">
          <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
          <button className="primary-button" disabled={busyId === request.id} onClick={() => handleAssignDelivery(request.id)}>
            {busyId === request.id ? 'Assigning...' : 'Assign Drop'}
          </button>
        </div>
      </>
    );
  }

  function renderActionBlock(request: ServiceRequest) {
    const pickupPhotoCount = countByPrefix(request, 'PICKUP_IMAGE_');
    const cashlessDeviceCount = countByPrefix(request, 'CASHLESS_DEVICE_IMAGE_');
    const cashlessDamageCount = countByPrefix(request, 'CASHLESS_DAMAGE_IMAGE_');

    switch (item.id) {
      case 'assign-pickup':
        return (
          <>
            <div className="request-stage-flow request-stage-flow-pickup">
              <article className="request-stage-node active">
                <span>Business Stage</span>
                <strong>New Case Request</strong>
                <small>Pickup intake begins here.</small>
              </article>
              <article className="request-stage-node active">
                <span>System Status</span>
                <strong>REQUEST CREATED</strong>
                <small>Waiting for runner assignment.</small>
              </article>
              <article className="request-stage-node">
                <span>Next Action</span>
                <strong>Assign Pickup Runner</strong>
                <small>Schedule doorstep visit and notes.</small>
              </article>
            </div>
            <div className="workspace-chip-row">
              <span className="workspace-chip">Inner flow required: assign runner, pickup slot, and notes</span>
              <span className="workspace-chip">Preferred runner: {preferredPickupRunner}</span>
            </div>
            <div className="action-form-grid">
              <label className="action-field">
                <span>Pickup Runner</span>
                <select
                  value={selectedPickupAgentById[request.id] ?? String(pickupAgents[0]?.id ?? '')}
                  onChange={(event) => setSelectedPickupAgentById((current) => ({ ...current, [request.id]: event.target.value }))}
                >
                  <option value="">Select runner</option>
                  {pickupAgents.map((agent) => <option key={agent.id} value={agent.id}>{agent.fullName}</option>)}
                </select>
              </label>
              <label className="action-field">
                <span>Scheduled Pickup</span>
                <input
                  type="datetime-local"
                  value={pickupScheduleById[request.id] ?? defaultScheduleValue()}
                  onChange={(event) => setPickupScheduleById((current) => ({ ...current, [request.id]: event.target.value }))}
                />
              </label>
            </div>
            <label className="action-field">
              <span>Notes</span>
              <textarea
                value={pickupNotesById[request.id] ?? ''}
                onChange={(event) => setPickupNotesById((current) => ({ ...current, [request.id]: event.target.value }))}
                placeholder="Runner instructions, landmark, zone, or special handling"
              />
            </label>
            <div className="action-row action-row-wrap">
              <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
              <Link className="secondary-button" to="/workspace/pickup-management/runner-onboarding">Onboard Runner</Link>
              <button className="primary-button" disabled={busyId === request.id} onClick={() => handleAssignPickup(request.id)}>
                {busyId === request.id ? 'Assigning...' : 'Assign Pickup'}
              </button>
            </div>
          </>
        );
      case 'pending-pickup':
        return (
          <>
            <div className="workspace-chip-row">
              <span className="workspace-chip">Pickup photos: {pickupPhotoCount}/10</span>
              <span className="workspace-chip">Runner: {request.pickupAgent ?? 'Awaiting assignment'}</span>
              {request.pickup?.runnerPortalLink ? <span className="workspace-chip">Runner portal live</span> : null}
            </div>
            <div className="action-row action-row-wrap">
              <Link className="secondary-button" to={`/requests/${request.id}`}>Open capture screen</Link>
              {request.pickup?.runnerPortalLink ? <a className="secondary-button" href={request.pickup.runnerPortalLink} target="_blank" rel="noreferrer">Open Runner Portal</a> : null}
              {request.status === 'PICKUP_ASSIGNED' ? (
                <button className="secondary-button" disabled={busyId === request.id} onClick={() => handleTransition(request.id, 'PICKUP_IN_PROGRESS', 'Runner accepted pickup assignment', 'Pickup accepted by runner.')}>
                  {busyId === request.id ? 'Saving...' : 'Accept Pickup'}
                </button>
              ) : null}
              <button className="primary-button" disabled={busyId === request.id} onClick={() => handleTransition(request.id, 'PICKUP_COMPLETED', 'Pickup completed with evidence upload', 'Pickup marked complete.')}>
                {busyId === request.id ? 'Saving...' : 'Mark Pickup Complete'}
              </button>
            </div>
          </>
        );
      case 'pickup-failed-cases':
        return (
          <>
            <div className="workspace-chip-row">
              <span className="workspace-chip">Doorstep update: {request.status.replaceAll('_', ' ')}</span>
              <span className="workspace-chip">Runner: {request.pickupAgent ?? 'Awaiting follow-up'}</span>
            </div>
            <div className="action-row action-row-wrap">
              <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
              <Link className="secondary-button" to="/workspace/pickup-management/assign-pickup">Reschedule Pickup</Link>
            </div>
          </>
        );
      case 'pickup-history':
        return (
          <>
            <div className="workspace-chip-row">
              <span className="workspace-chip">Pickup photos: {pickupPhotoCount}/10</span>
              <span className="workspace-chip">Current status: {request.status.replaceAll('_', ' ')}</span>
            </div>
            <div className="action-row action-row-wrap">
              <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
              <Link className="secondary-button" to="/pickup-images">Pickup evidence</Link>
            </div>
          </>
        );
      case 'picked-up-devices':
        return (
          <div className="action-row action-row-wrap">
            <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
            <Link className="secondary-button" to="/pickup-images">View evidence gallery</Link>
          </div>
        );
      case 'device-received-at-hub':
        return (
          <div className="action-row action-row-wrap">
            <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
            <button className="primary-button" disabled={busyId === request.id} onClick={() => handleTransition(request.id, 'RECEIVED_AT_HUB', 'Device inward completed at hub', 'Marked as received at hub.')}>
              {busyId === request.id ? 'Saving...' : 'Mark Received At Hub'}
            </button>
          </div>
        );
      case 'pending-verification':
        return (
          <div className="action-row action-row-wrap">
            <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
            <span className="workspace-chip">IMEI validation: {request.imeiValidationStatus}</span>
          </div>
        );
      case 'send-to-service-center':
        return (
          <div className="action-row action-row-wrap">
            <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
            <button className="primary-button" disabled={busyId === request.id} onClick={() => handleTransition(request.id, 'DIAGNOSIS_IN_PROGRESS', 'Sent to service center for estimation', 'Moved to service center diagnosis.')}>
              {busyId === request.id ? 'Saving...' : 'Send To Service Center'}
            </button>
          </div>
        );
      case 'inward-register':
        return (
          <>
            <div className="workspace-chip-row">
              <span className="workspace-chip">Pickup evidence: {pickupPhotoCount}/10</span>
              <span className="workspace-chip">Inward stage active</span>
            </div>
            <div className="action-row action-row-wrap">
              <Link className="secondary-button" to={`/requests/${request.id}`}>Open inward record</Link>
            </div>
          </>
        );
      case 'hub-inventory':
        return (
          <div className="action-row action-row-wrap">
            <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
            {request.status === 'RECEIVED_AT_HUB' ? (
              <button className="primary-button" disabled={busyId === request.id} onClick={() => handleTransition(request.id, 'DIAGNOSIS_IN_PROGRESS', 'Moved from hub inventory to service center', 'Sent from hub inventory to service center.')}>
                {busyId === request.id ? 'Saving...' : 'Dispatch To Service Center'}
              </button>
            ) : null}
          </div>
        );
      case 'devices-under-inspection':
      case 'estimate-pending':
        return (
          <>
            <div className="action-form-grid">
              <label className="action-field">
                <span>Diagnosis Summary</span>
                <textarea
                  value={diagnosisById[request.id] ?? request.issueSummary}
                  onChange={(event) => setDiagnosisById((current) => ({ ...current, [request.id]: event.target.value }))}
                />
              </label>
              <div className="stack-grid">
                <label className="action-field">
                  <span>Parts Cost</span>
                  <input
                    type="number"
                    min="0"
                    value={partsCostById[request.id] ?? ''}
                    onChange={(event) => setPartsCostById((current) => ({ ...current, [request.id]: event.target.value }))}
                  />
                </label>
                <label className="action-field">
                  <span>Labor Cost</span>
                  <input
                    type="number"
                    min="0"
                    value={laborCostById[request.id] ?? ''}
                    onChange={(event) => setLaborCostById((current) => ({ ...current, [request.id]: event.target.value }))}
                  />
                </label>
                <label className="action-field">
                  <span>Tax Amount</span>
                  <input
                    type="number"
                    min="0"
                    value={taxById[request.id] ?? ''}
                    onChange={(event) => setTaxById((current) => ({ ...current, [request.id]: event.target.value }))}
                  />
                </label>
              </div>
            </div>
            <div className="action-row action-row-wrap">
              <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
              <button className="primary-button" disabled={busyId === request.id} onClick={() => handleCreateEstimate(request.id)}>
                {busyId === request.id ? 'Saving...' : 'Submit Estimate'}
              </button>
            </div>
          </>
        );
      case 'estimate-submitted':
      case 'new-estimates':
        return (
          <div className="action-row action-row-wrap">
            <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
            <Link className="primary-button" to="/estimate-approval">Open approval queue</Link>
          </div>
        );
      case 'approved-estimates':
      case 'under-repair':
        return (
          <div className="action-row action-row-wrap">
            <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
            {request.status !== 'REPAIR_IN_PROGRESS' ? (
              <button className="secondary-button" disabled={busyId === request.id} onClick={() => handleTransition(request.id, 'REPAIR_IN_PROGRESS', 'Repair started from service center workbench', 'Repair started.')}>
                {busyId === request.id ? 'Saving...' : 'Start Repair'}
              </button>
            ) : null}
            <button className="primary-button" disabled={busyId === request.id} onClick={() => handleTransition(request.id, 'REPAIR_COMPLETED', 'Repair completed by service center', 'Repair marked complete.')}>
              {busyId === request.id ? 'Saving...' : 'Mark Repair Complete'}
            </button>
          </div>
        );
      case 'rejected-estimates':
        return (
          <div className="action-row action-row-wrap">
            <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
            {request.status === 'CASHLESS_REJECTED' ? (
              <button className="primary-button" disabled={busyId === request.id} onClick={() => handleTransition(request.id, 'CLOSED', 'Closed after cashless rejection', 'Rejected case closed.')}>
                {busyId === request.id ? 'Saving...' : 'Close Case'}
              </button>
            ) : null}
          </div>
        );
      case 'estimate-history':
        return (
          <div className="action-row action-row-wrap">
            <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
            <Link className="secondary-button" to="/estimate-approval">Approval desk</Link>
          </div>
        );
      case 'repair-completed':
        return (
          <div className="action-row action-row-wrap">
            <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
            <button className="primary-button" disabled={busyId === request.id} onClick={() => handleTransition(request.id, 'READY_FOR_DISPATCH', 'Device ready for dispatch after repair completion', 'Moved to ready for dispatch.')}>
              {busyId === request.id ? 'Saving...' : 'Move To Dispatch'}
            </button>
          </div>
        );
      case 'total-loss-cases':
        return (
          <div className="action-row action-row-wrap">
            <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
            {!request.invoice ? <Link className="secondary-button" to="/workspace/billing/generate-invoice">Generate invoice</Link> : null}
            <button className="primary-button" disabled={busyId === request.id} onClick={() => handleTransition(request.id, 'CLOSED', 'Closed after total loss processing', 'Total loss case closed.')}>
              {busyId === request.id ? 'Saving...' : 'Close Total Loss'}
            </button>
          </div>
        );
      case 'pending-qc':
        return (
          <div className="action-row action-row-wrap">
            <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
            <button className="secondary-button" disabled={busyId === request.id} onClick={() => handleTransition(request.id, 'REPAIR_IN_PROGRESS', 'QC failed and device sent for rework', 'Returned for rework.')}>
              {busyId === request.id ? 'Saving...' : 'QC Failed'}
            </button>
            <button className="primary-button" disabled={busyId === request.id} onClick={() => handleTransition(request.id, 'READY_FOR_DISPATCH', 'QC passed and device is ready for dispatch', 'QC passed.')}>
              {busyId === request.id ? 'Saving...' : 'QC Passed'}
            </button>
          </div>
        );
      case 'qc-passed':
        return (
          <div className="action-row action-row-wrap">
            <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
            <Link className="secondary-button" to="/workspace/delivery/assign-delivery">Go to dispatch</Link>
          </div>
        );
      case 'qc-failed':
      case 'rework-required':
        return (
          <div className="action-row action-row-wrap">
            <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
            {request.status === 'REPAIR_IN_PROGRESS' ? (
              <button className="primary-button" disabled={busyId === request.id} onClick={() => handleTransition(request.id, 'REPAIR_COMPLETED', 'Rework completed after QC failure', 'Rework completed and ready for QC.')}>
                {busyId === request.id ? 'Saving...' : 'Finish Rework'}
              </button>
            ) : null}
          </div>
        );
      case 'assign-delivery':
      case 'ready-for-dispatch':
        return renderAssignmentBlock(request);
      case 'delivered':
      case 'delivery-history':
        return (
          <div className="action-row action-row-wrap">
            <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
            {!request.invoice ? <Link className="secondary-button" to="/workspace/billing/generate-invoice">Generate invoice</Link> : null}
            <Link className="secondary-button" to="/payment-reconciliation">Billing follow-up</Link>
          </div>
        );
      case 'delivery-failed':
        return renderAssignmentBlock(request);
      case 'generate-invoice':
        return (
          <>
            <div className="workspace-chip-row">
              <span className="workspace-chip">Invoice eligible</span>
              <span className="workspace-chip">Estimate-backed billing</span>
            </div>
            <div className="action-form-grid">
              <label className="action-field">
                <span>Customer GSTIN</span>
                <input
                  value={invoiceGstinById[request.id] ?? ''}
                  onChange={(event) => setInvoiceGstinById((current) => ({ ...current, [request.id]: event.target.value }))}
                />
              </label>
              <label className="action-field">
                <span>Billing State</span>
                <input
                  value={invoiceBillingStateById[request.id] ?? request.customerState ?? 'Maharashtra'}
                  onChange={(event) => setInvoiceBillingStateById((current) => ({ ...current, [request.id]: event.target.value }))}
                />
              </label>
              <label className="action-field">
                <span>Place of Supply</span>
                <input
                  value={invoicePlaceOfSupplyById[request.id] ?? request.customerState ?? 'Maharashtra'}
                  onChange={(event) => setInvoicePlaceOfSupplyById((current) => ({ ...current, [request.id]: event.target.value }))}
                />
              </label>
              <label className="action-field">
                <span>GST Rate</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={invoiceGstRateById[request.id] ?? '18'}
                  onChange={(event) => setInvoiceGstRateById((current) => ({ ...current, [request.id]: event.target.value }))}
                />
              </label>
              <label className="action-field">
                <span>Labour Description</span>
                <input
                  value={invoiceLaborDescriptionById[request.id] ?? 'Repair labour and diagnostics'}
                  onChange={(event) => setInvoiceLaborDescriptionById((current) => ({ ...current, [request.id]: event.target.value }))}
                />
              </label>
              <label className="action-field">
                <span>Parts Description</span>
                <input
                  value={invoicePartsDescriptionById[request.id] ?? 'Spare parts and consumables'}
                  onChange={(event) => setInvoicePartsDescriptionById((current) => ({ ...current, [request.id]: event.target.value }))}
                />
              </label>
            </div>
            <div className="action-row action-row-wrap">
              <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
              <button className="primary-button" disabled={busyId === request.id} onClick={() => handleCreateInvoice(request)}>
                {busyId === request.id ? 'Saving...' : 'Generate Invoice'}
              </button>
            </div>
          </>
        );
      case 'pending-invoices':
        return (
          <>
            <div className="workspace-chip-row">
              <span className="workspace-chip">Invoice: {request.invoice?.invoiceNumber ?? 'Pending'}</span>
              <span className="workspace-chip">Amount due: {formatCurrencyInr(request.invoice?.amountDue ?? 0)}</span>
            </div>
            <div className="action-form-grid">
              <label className="action-field">
                <span>Payment Reference</span>
                <input
                  value={paymentReferenceById[request.id] ?? ''}
                  onChange={(event) => setPaymentReferenceById((current) => ({ ...current, [request.id]: event.target.value }))}
                  placeholder="UPI / NEFT / Cash reference"
                />
              </label>
              <label className="action-field">
                <span>Amount Received</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmountById[request.id] ?? String(request.invoice?.amountDue ?? 0)}
                  onChange={(event) => setPaymentAmountById((current) => ({ ...current, [request.id]: event.target.value }))}
                />
              </label>
              <label className="action-field">
                <span>Payment Method</span>
                <select
                  value={paymentMethodById[request.id] ?? 'UPI'}
                  onChange={(event) => setPaymentMethodById((current) => ({ ...current, [request.id]: event.target.value }))}
                >
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                  <option value="CASH">Cash</option>
                </select>
              </label>
              <label className="action-field">
                <span>UTR / Transaction No.</span>
                <input
                  value={paymentUtrById[request.id] ?? ''}
                  onChange={(event) => setPaymentUtrById((current) => ({ ...current, [request.id]: event.target.value }))}
                />
              </label>
            </div>
            <div className="action-row action-row-wrap">
              <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
              <Link className="secondary-button" to="/payment-reconciliation">Payment Reconciliation</Link>
              <button className="primary-button" disabled={busyId === request.id} onClick={() => handleRecordPayment(request)}>
                {busyId === request.id ? 'Saving...' : 'Record Payment'}
              </button>
            </div>
          </>
        );
      case 'paid-invoices':
        return (
          <div className="action-row action-row-wrap">
            <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
            <Link className="secondary-button" to="/payment-reconciliation">View reconciliation</Link>
            {request.status === 'INVOICED' ? (
              <button className="primary-button" disabled={busyId === request.id} onClick={() => handleTransition(request.id, 'CLOSED', 'Closed after full payment received', 'Request closed after payment receipt.')}>
                {busyId === request.id ? 'Saving...' : 'Close Request'}
              </button>
            ) : (
              <span className="workspace-chip">Closed and archived</span>
            )}
          </div>
        );
      case 'refund-cases':
        return (
          <>
            <div className="workspace-chip-row">
              <span className="workspace-chip">Paid: {formatCurrencyInr(request.invoice?.amountPaid ?? 0)}</span>
              <span className="workspace-chip">Refunded: {formatCurrencyInr(request.invoice?.refundAmount ?? 0)}</span>
            </div>
            <div className="action-form-grid">
              <label className="action-field">
                <span>Payment Entry</span>
                <select
                  value={refundPaymentIdById[request.id] ?? String(request.payments[0]?.id ?? '')}
                  onChange={(event) => setRefundPaymentIdById((current) => ({ ...current, [request.id]: event.target.value }))}
                >
                  {request.payments.map((payment) => (
                    <option key={payment.id} value={payment.id}>
                      {payment.paymentReference} | {formatCurrencyInr(payment.amount)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="action-field">
                <span>Refund Amount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={refundAmountById[request.id] ?? ''}
                  onChange={(event) => setRefundAmountById((current) => ({ ...current, [request.id]: event.target.value }))}
                />
              </label>
            </div>
            <label className="action-field">
              <span>Refund Reason</span>
              <textarea
                value={refundReasonById[request.id] ?? ''}
                onChange={(event) => setRefundReasonById((current) => ({ ...current, [request.id]: event.target.value }))}
                placeholder="Reason for refund, excess payment, or commercial adjustment"
              />
            </label>
            <div className="action-row action-row-wrap">
              <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
              <button className="primary-button" disabled={busyId === request.id} onClick={() => handleRefund(request)}>
                {busyId === request.id ? 'Saving...' : 'Process Refund'}
              </button>
            </div>
          </>
        );
      case 'invoice-reports':
        return (
          <>
            <div className="workspace-chip-row">
              <span className="workspace-chip">Invoice total: {formatCurrencyInr(request.invoice?.totalAmount ?? 0)}</span>
              <span className="workspace-chip">Due: {formatCurrencyInr(request.invoice?.amountDue ?? 0)}</span>
              <span className="workspace-chip">Payment status: {request.invoice?.paymentStatus ?? 'PENDING'}</span>
            </div>
            <div className="action-row action-row-wrap">
              <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
              <Link className="secondary-button" to="/payment-reconciliation">Open reconciliation</Link>
            </div>
          </>
        );
      case 'pending-photos':
        return (
          <>
            <div className="workspace-chip-row">
              <span className="workspace-chip">Device photos: {cashlessDeviceCount}/6</span>
              <span className="workspace-chip">Damage photos: {cashlessDamageCount}/4</span>
            </div>
            <div className="action-row action-row-wrap">
              <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
              <Link className="primary-button" to="/cashless-approval">Open cashless queue</Link>
            </div>
          </>
        );
      case 'approved-cases':
        return (
          <div className="action-row action-row-wrap">
            <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
            <button className="primary-button" disabled={busyId === request.id} onClick={() => handleTransition(request.id, 'REPAIR_IN_PROGRESS', 'Cashless approved and repair started', 'Cashless case moved to repair.')}>
              {busyId === request.id ? 'Saving...' : 'Start Repair'}
            </button>
          </div>
        );
      default:
        return (
          <div className="action-row">
            <Link className="secondary-button" to={`/requests/${request.id}`}>Open request</Link>
          </div>
        );
    }
  }

  return (
    <section className="workspace-page dense-ops-page ops-workspace-page">
      <div className="page-header merchant-page-header">
        <div>
          <p className="eyebrow">{section.label}</p>
          <h2>{item.label}</h2>
          <p>{item.description}</p>
        </div>
        <div className="workspace-chip-row">
          <span className="workspace-chip">Role: {role ?? 'Unknown'}</span>
          <span className="workspace-chip">{getSummaryLabel(item.id)}: {visibleRequests.length}</span>
        </div>
      </div>

      <article className="card workflow-playbook ops-workspace-playbook">
        <div className="split-row">
          <div>
            <p className="eyebrow">Inner Flow</p>
            <h3>{stagePlaybook.title}</h3>
          </div>
          <span className="workspace-chip">API + DB linked</span>
        </div>
        <div className="workflow-step-list">
          {stagePlaybook.steps.map((step, index) => (
            <div className="workflow-step" key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </article>

      <div className="summary-grid ops-workspace-summary-grid">
        <article className="summary-stat compact-stat">
          <span>Visible requests</span>
          <strong>{visibleRequests.length}</strong>
          <small>Live requests mapped to this stage.</small>
        </article>
        <article className="summary-stat compact-stat">
          <span>Open requests</span>
          <strong>{visibleRequests.filter((request) => !['CLOSED', 'CANCELLED'].includes(request.status)).length}</strong>
          <small>Requests still needing action in this workflow.</small>
        </article>
        <article className="summary-stat compact-stat">
          <span>Outstanding value</span>
          <strong>{formatCurrencyInr(visibleRequests.reduce((sum, request) => sum + (request.invoice?.amountDue ?? 0), 0))}</strong>
          <small>Visible financial exposure for this stage.</small>
        </article>
      </div>

      {error ? <div className="workspace-empty"><strong>Unable to load requests</strong><p>{error}</p></div> : null}
      {userError ? <div className="workspace-empty"><strong>Unable to load users</strong><p>{userError}</p></div> : null}
      {loading && visibleRequests.length === 0 ? <div className="workspace-empty"><strong>Loading workflow queue</strong><p>Please wait while requests are fetched.</p></div> : null}

      <div className="stack-grid">
        {visibleRequests.length > 0 ? visibleRequests.map((request) => {
          const workflowMeta = getWorkflowStageMeta(request);
          return (
            <article className="card action-card ops-work-card" key={request.id}>
              <div className="split-row">
                <div>
                  <h3>{request.requestNumber}</h3>
                  <p>{request.customerName} | {formatDeviceCategory(request.deviceCategory)} | {request.deviceLabel}</p>
                </div>
                <div className="workspace-chip-row">
                  <span className="workspace-chip">{workflowMeta.label}</span>
                  <span className="workspace-chip">{request.status.replaceAll('_', ' ')}</span>
                </div>
              </div>

              <div className="data-grid">
                <span>Owner</span><strong>{workflowMeta.owner}</strong>
                <span>Customer Update</span><strong>{workflowMeta.customerComms}</strong>
                <span>Phone</span><strong>{request.customerPhone}</strong>
                <span>Alternate / WhatsApp</span><strong>{request.alternatePhone ?? request.whatsappNumber ?? 'N/A'}</strong>
                <span>Loan / COI</span><strong>{request.loanNumber ?? 'N/A'} / {request.certificateOfInsuranceNumber ?? 'N/A'}</strong>
                <span>Partner Ref</span><strong>{request.partnerReference ?? 'Direct Intake'}</strong>
                <span>Current Owner</span><strong>{request.pickupAgent ?? request.technician ?? request.deliveryAgent ?? workflowMeta.owner}</strong>
                <span>Updated</span><strong>{formatDateTimeIn(request.updatedAt)}</strong>
              </div>

              {renderActionBlock(request)}
              <small className="action-message">{messageById[request.id] ?? 'This inner workflow page is now tied to the live request and billing data.'}</small>
            </article>
          );
        }) : (!loading && !error ? (
          <div className="workspace-empty">
            <strong>No requests in this stage</strong>
            <p>{getEmptyStageCopy(item.id)}</p>
            <div className="action-card-cta">
              <strong>{item.id === 'assign-pickup' ? 'Pickup recovery actions' : 'Quick next steps'}</strong>
              <p>{item.id === 'assign-pickup'
                ? 'This queue refills when a new claim is created or a fresh local demo REQUEST_CREATED case is available after restart.'
                : 'Use these live pages to move a claim into this submenu without leaving the workflow.'}</p>
              <div className="action-row action-row-wrap">
                <Link className="secondary-button" to="/workspace/service-requests/create-request">Register New Claim</Link>
                <Link className="secondary-button" to={item.id === 'assign-pickup' ? '/workspace/pickup-management/pending-pickup' : '/workspace/service-requests/open-requests'}>
                  {item.id === 'assign-pickup' ? 'Pending Pickup' : 'Open Claims'}
                </Link>
                <Link className="secondary-button" to={item.id === 'assign-pickup' ? '/workspace/pickup-management/pickup-history' : '/workspace/service-requests/search-request'}>
                  {item.id === 'assign-pickup' ? 'Pickup History' : 'Search Claims'}
                </Link>
              </div>
            </div>
          </div>
        ) : null)}
      </div>
    </section>
  );
}
