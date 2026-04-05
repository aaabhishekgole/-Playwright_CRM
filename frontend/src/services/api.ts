import axios from 'axios';
import type {
  AssignDeliveryPayload,
  AssignPickupPayload,
  CreatePickupRunnerPayload,
  CreateInvoicePayload,
  CreateEstimatePayload,
  CreateServiceRequestPayload,
  DocumentItem,
  LoginResponse,
  RecordPaymentPayload,
  RunnerNotification,
  RefundPaymentPayload,
  ServiceRequest,
  UserSummary,
} from '../types/models';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

function clearStoredAuth() {
  localStorage.removeItem('gsh_token');
  localStorage.removeItem('gsh_user');
}

api.interceptors.request.use((config) => {
  const requestUrl = config.url ?? '';
  if (requestUrl.startsWith('/public/') || requestUrl === '/auth/login') {
    if (config.headers?.Authorization) {
      delete config.headers.Authorization;
    }
    return config;
  }

  const token = localStorage.getItem('gsh_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response && (error.response.status === 401 || error.response.status === 403)) {
      const requestUrl = error.config?.url ?? '';
      const currentPath = window.location.pathname;
      const isPublicRoute = requestUrl.startsWith('/public/') || currentPath.startsWith('/runner-portal/');
      const isLoginRoute = currentPath.startsWith('/login');

      if (!isPublicRoute) {
        clearStoredAuth();
        if (!isLoginRoute) {
          window.location.replace('/login');
        }
      }
    }
    return Promise.reject(error);
  },
);

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
      return payloadMessage ?? 'Your session expired or access is no longer valid. Please sign in again.';
    }

    return payloadMessage ?? `Request failed with status ${error.response.status}.`;
  }

  return error instanceof Error ? error.message : 'Request failed.';
}

async function readRunnerApiResponse<T>(response: Response): Promise<T> {
  const responseText = await response.text();
  if (!responseText) {
    return {} as T;
  }
  return JSON.parse(responseText) as T;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', { username, password });
  return response.data;
}

export async function loginRunnerApp(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  const payload = await readRunnerApiResponse<LoginResponse & { message?: string }>(response);
  if (!response.ok) {
    throw new Error(payload.message ?? `Request failed with status ${response.status}.`);
  }
  return payload;
}

export async function fetchRunnerAppNotifications(accessToken: string): Promise<RunnerNotification[]> {
  const response = await fetch(`${API_BASE_URL}/mobile/runner/notifications`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = await readRunnerApiResponse<RunnerNotification[] | { message?: string }>(response);
  if (!response.ok || !Array.isArray(payload)) {
    const message = !Array.isArray(payload) && payload.message
      ? payload.message
      : `Request failed with status ${response.status}.`;
    throw new Error(message);
  }
  return payload;
}

function sortRequestsByCreatedAtDesc(requests: ServiceRequest[]) {
  return [...requests].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt);
    const rightTime = Date.parse(right.createdAt);
    return rightTime - leftTime;
  });
}

export async function fetchRequests(statuses?: string[], signal?: AbortSignal): Promise<ServiceRequest[]> {
  const uniqueStatuses = Array.from(new Set((statuses ?? []).filter(Boolean)));

  if (uniqueStatuses.length === 0) {
    const response = await api.get<ServiceRequest[]>('/service-requests', { signal });
    return response.data;
  }

  const responses = await Promise.all(
    uniqueStatuses.map((status) =>
      api.get<ServiceRequest[]>('/service-requests', {
        params: { status },
        signal,
      })),
  );

  const deduped = new Map<number, ServiceRequest>();
  for (const response of responses) {
    for (const request of response.data) {
      deduped.set(request.id, request);
    }
  }

  return sortRequestsByCreatedAtDesc(Array.from(deduped.values()));
}

export async function createServiceRequest(payload: CreateServiceRequestPayload): Promise<ServiceRequest> {
  const response = await api.post<ServiceRequest>('/service-requests', payload);
  return response.data;
}

export async function fetchUsers(role?: string, activeOnly = false): Promise<UserSummary[]> {
  const response = await api.get<UserSummary[]>('/users', {
    params: {
      ...(role ? { role } : {}),
      ...(activeOnly ? { activeOnly: true } : {}),
    },
  });
  return response.data;
}

export async function createPickupRunner(payload: CreatePickupRunnerPayload): Promise<UserSummary> {
  const response = await api.post<UserSummary>('/users/pickup-runners', payload);
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

export async function fetchRunnerPickupPortal(token: string): Promise<ServiceRequest> {
  const response = await api.get<ServiceRequest>(`/public/pickups/${token}`);
  return response.data;
}

export async function acceptRunnerPickup(token: string): Promise<ServiceRequest> {
  const response = await api.post<ServiceRequest>(`/public/pickups/${token}/accept`);
  return response.data;
}

export async function updateRunnerPickupStatus(token: string, targetStatus: string, remarks?: string): Promise<ServiceRequest> {
  const response = await api.post<ServiceRequest>(`/public/pickups/${token}/status`, {
    targetStatus,
    remarks,
  });
  return response.data;
}

export async function uploadRunnerPickupAttachment(token: string, attachmentType: string, file: File): Promise<ServiceRequest> {
  const formData = new FormData();
  formData.append('attachmentType', attachmentType);
  formData.append('file', file);
  const response = await api.post<ServiceRequest>(`/public/pickups/${token}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function deleteRunnerPickupAttachment(token: string, attachmentId: number): Promise<ServiceRequest> {
  const response = await api.delete<ServiceRequest>(`/public/pickups/${token}/attachments/${attachmentId}`);
  return response.data;
}

export async function completeRunnerPickup(token: string): Promise<ServiceRequest> {
  const response = await api.post<ServiceRequest>(`/public/pickups/${token}/complete`);
  return response.data;
}

export async function fetchDocuments(category?: string): Promise<DocumentItem[]> {
  const response = await api.get<DocumentItem[]>('/documents', {
    params: category ? { category } : undefined,
  });
  return response.data;
}

export async function uploadDocument(name: string, description: string, category: string, file: File): Promise<DocumentItem> {
  const formData = new FormData();
  if (name) formData.append('name', name);
  if (description) formData.append('description', description);
  if (category) formData.append('category', category);
  formData.append('file', file);
  const response = await api.post<DocumentItem>('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function deleteDocument(id: number): Promise<void> {
  await api.delete(`/documents/${id}`);
}
