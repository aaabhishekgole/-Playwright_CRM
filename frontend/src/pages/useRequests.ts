import { useEffect, useState } from 'react';
import {
  approveEstimate as approveEstimateRequest,
  deleteRequestAttachment as deleteRequestAttachmentRequest,
  fetchRequests,
  reconcilePayment as reconcilePaymentRequest,
  transitionRequestStatus as transitionStatusRequest,
  uploadRequestAttachment as uploadRequestAttachmentRequest,
} from '../services/api';
import type { ServiceRequest } from '../types/models';

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
      setError(err instanceof Error ? err.message : 'Failed to load requests');
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

  async function transitionStatus(requestId: number, targetStatus: string, remarks: string) {
    const updated = await transitionStatusRequest(requestId, targetStatus, remarks);
    setRequests((current) => replaceRequest(current, updated));
    return updated;
  }

  async function reconcilePayment(requestId: number, paymentId: number, reconciliationStatus: string, remarks: string) {
    const updated = await reconcilePaymentRequest(requestId, paymentId, reconciliationStatus, remarks);
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
    approveEstimate,
    transitionStatus,
    reconcilePayment,
    uploadAttachment,
    deleteAttachment,
  };
}
