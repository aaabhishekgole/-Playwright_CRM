import axios from 'axios';
import type { LoginResponse, ServiceRequest } from '../types/models';

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

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', { username, password });
  return response.data;
}

export async function fetchRequests(): Promise<ServiceRequest[]> {
  const response = await api.get<ServiceRequest[]>('/service-requests');
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
