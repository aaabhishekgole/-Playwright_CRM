import axios from 'axios';
import type {
  AssignDeliveryPayload,
  AssignPickupPayload,
  CreateInvoicePayload,
  CreateEstimatePayload,
  CreateServiceRequestPayload,
  LoginResponse,
  RecordPaymentPayload,
  RefundPaymentPayload,
  ServiceRequest,
  UserSummary,
} from '../types/models';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gsh_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data;
    const payloadMessage =
      typeof payload === 'string'
        ? payload
        : payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
          ? payload.message
          : null;

    if (!error.response) {
      return 'Unable to reach the service API. Confirm the backend is running and the browser origin is allowed.';
    }

    if (error.response.status === 401 || error.response.status === 403) {
      return payloadMessage ?? 'Invalid username or password.';
    }

    return payloadMessage ?? `Request failed with status ${error.response.status}.`;
  }

  return error instanceof Error ? error.message : 'Request failed.';
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', { username, password });
  return response.data;
}

export async function fetchRequests(): Promise<ServiceRequest[]> {
  const response = await api.get<ServiceRequest[]>('/service-requests');
  return response.data;
}

export async function createServiceRequest(payload: CreateServiceRequestPayload): Promise<ServiceRequest> {
  const response = await api.post<ServiceRequest>('/service-requests', payload);
  return response.data;
}

export async function fetchUsers(role?: string): Promise<UserSummary[]> {
  const response = await api.get<UserSummary[]>('/users', {
    params: role ? { role } : undefined,
  });
  return response.data;
}

export async function assignPickup(requestId: number, payload: AssignPickupPayload): Promise<ServiceRequest> {
  const response = await api.post<ServiceRequest>(`/service-requests/${requestId}/pickup`, payload);
  return response.data;
}

export async function assignDelivery(requestId: number, payload: AssignDeliveryPayload): Promise<ServiceRequest> {
  const response = await api.post<ServiceRequest>(`/service-requests/${requestId}/delivery`, payload);
  return response.data;
}

export async function createEstimate(requestId: number, payload: CreateEstimatePayload): Promise<ServiceRequest> {
  const response = await api.post<ServiceRequest>(`/service-requests/${requestId}/estimate`, payload);
  return response.data;
}

export async function createInvoice(requestId: number, payload: CreateInvoicePayload): Promise<ServiceRequest> {
  const response = await api.post<ServiceRequest>(`/service-requests/${requestId}/invoice`, payload);
  return response.data;
}

export async function recordPayment(requestId: number, payload: RecordPaymentPayload): Promise<ServiceRequest> {
  const response = await api.post<ServiceRequest>(`/service-requests/${requestId}/payments`, payload);
  return response.data;
}

export async function refundPayment(requestId: number, payload: RefundPaymentPayload): Promise<ServiceRequest> {
  const response = await api.post<ServiceRequest>(`/service-requests/${requestId}/refunds`, payload);
  return response.data;
}

export async function fetchRequestById(id: string): Promise<ServiceRequest | undefined> {
  const requests = await fetchRequests();
  return requests.find((request) => String(request.id) === id);
}

export async function approveEstimate(requestId: number, remarks: string): Promise<ServiceRequest> {
  const response = await api.post<ServiceRequest>(`/service-requests/${requestId}/estimate/approve`, { remarks });
  return response.data;
}

export async function transitionRequestStatus(requestId: number, targetStatus: string, remarks: string): Promise<ServiceRequest> {
  const response = await api.post<ServiceRequest>(`/service-requests/${requestId}/status`, { targetStatus, remarks });
  return response.data;
}

export async function reconcilePayment(requestId: number, paymentId: number, reconciliationStatus: string, remarks: string): Promise<ServiceRequest> {
  const response = await api.post<ServiceRequest>(`/service-requests/${requestId}/payments/${paymentId}/reconcile`, {
    reconciliationStatus,
    remarks,
  });
  return response.data;
}

export async function uploadRequestAttachment(requestId: number, attachmentType: string, file: File): Promise<ServiceRequest> {
  const formData = new FormData();
  formData.append('attachmentType', attachmentType);
  formData.append('file', file);
  const response = await api.post<ServiceRequest>(`/service-requests/${requestId}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function deleteRequestAttachment(requestId: number, attachmentId: number): Promise<ServiceRequest> {
  const response = await api.delete<ServiceRequest>(`/service-requests/${requestId}/attachments/${attachmentId}`);
  return response.data;
}
