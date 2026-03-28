import { useEffect, useState } from 'react';
import {
  approveEstimate as approveEstimateRequest,
  assignDelivery as assignDeliveryRequest,
  assignPickup as assignPickupRequest,
  createInvoice as createInvoiceRequest,
  createEstimate as createEstimateRequest,
  createServiceRequest as createServiceRequestApi,
  deleteRequestAttachment as deleteRequestAttachmentRequest,
  fetchRequests,
  getApiErrorMessage,
  recordPayment as recordPaymentRequest,
  reconcilePayment as reconcilePaymentRequest,
  refundPayment as refundPaymentRequest,
  transitionRequestStatus as transitionStatusRequest,
  uploadRequestAttachment as uploadRequestAttachmentRequest,
} from '../services/api';
import type {
  AssignDeliveryPayload,
  AssignPickupPayload,
  CreateInvoicePayload,
  CreateEstimatePayload,
  CreateServiceRequestPayload,
  RecordPaymentPayload,
  RefundPaymentPayload,
  ServiceRequest,
} from '../types/models';

function replaceRequest(items: ServiceRequest[], updated: ServiceRequest) {
  const existing = items.some((request) => request.id === updated.id);
  if (!existing) {
    return [updated, ...items];
  }
  return items.map((request) => (request.id === updated.id ? updated : request));
}

export function useRequests() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRequests();
      setRequests(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function approveEstimate(requestId: number, remarks: string) {
    const updated = await approveEstimateRequest(requestId, remarks);
    setRequests((current) => replaceRequest(current, updated));
    return updated;
  }

  async function createRequest(payload: CreateServiceRequestPayload) {
    const created = await createServiceRequestApi(payload);
    setRequests((current) => [created, ...current]);
    return created;
  }

  async function assignPickup(requestId: number, payload: AssignPickupPayload) {
    const updated = await assignPickupRequest(requestId, payload);
    setRequests((current) => replaceRequest(current, updated));
    return updated;
  }

  async function assignDelivery(requestId: number, payload: AssignDeliveryPayload) {
    const updated = await assignDeliveryRequest(requestId, payload);
    setRequests((current) => replaceRequest(current, updated));
    return updated;
  }

  async function createEstimate(requestId: number, payload: CreateEstimatePayload) {
    const updated = await createEstimateRequest(requestId, payload);
    setRequests((current) => replaceRequest(current, updated));
    return updated;
  }

  async function createInvoice(requestId: number, payload: CreateInvoicePayload) {
    const updated = await createInvoiceRequest(requestId, payload);
    setRequests((current) => replaceRequest(current, updated));
    return updated;
  }

  async function transitionStatus(requestId: number, targetStatus: string, remarks: string) {
    const updated = await transitionStatusRequest(requestId, targetStatus, remarks);
    setRequests((current) => replaceRequest(current, updated));
    return updated;
  }

  async function recordPayment(requestId: number, payload: RecordPaymentPayload) {
    const updated = await recordPaymentRequest(requestId, payload);
    setRequests((current) => replaceRequest(current, updated));
    return updated;
  }

  async function reconcilePayment(requestId: number, paymentId: number, reconciliationStatus: string, remarks: string) {
    const updated = await reconcilePaymentRequest(requestId, paymentId, reconciliationStatus, remarks);
    setRequests((current) => replaceRequest(current, updated));
    return updated;
  }

  async function refundPayment(requestId: number, payload: RefundPaymentPayload) {
    const updated = await refundPaymentRequest(requestId, payload);
    setRequests((current) => replaceRequest(current, updated));
    return updated;
  }

  async function uploadAttachment(requestId: number, attachmentType: string, file: File) {
    const updated = await uploadRequestAttachmentRequest(requestId, attachmentType, file);
    setRequests((current) => replaceRequest(current, updated));
    return updated;
  }

  async function deleteAttachment(requestId: number, attachmentId: number) {
    const updated = await deleteRequestAttachmentRequest(requestId, attachmentId);
    setRequests((current) => replaceRequest(current, updated));
    return updated;
  }

  return {
    requests,
    loading,
    error,
    refresh,
    createRequest,
    assignPickup,
    assignDelivery,
    createEstimate,
    createInvoice,
    approveEstimate,
    transitionStatus,
    recordPayment,
    reconcilePayment,
    refundPayment,
    uploadAttachment,
    deleteAttachment,
  };
}
