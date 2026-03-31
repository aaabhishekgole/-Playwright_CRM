import type { APIRequestContext } from '@playwright/test';
import { config } from '@config/index';
import type { AssignPickupPayload, CreateServiceRequestPayload, ServiceRequestRecord } from '@testdata/types';
import { ApiHelper } from '@utils/ApiHelper';

export class ServiceRequestApi {
  private readonly api: ApiHelper;

  constructor(request: APIRequestContext) {
    this.api = new ApiHelper(request, config.apiBaseUrl);
  }

  async list(accessToken: string) {
    return this.api.get<ServiceRequestRecord[]>('/service-requests', {
      Authorization: `Bearer ${accessToken}`,
    });
  }

  async create(accessToken: string, payload: CreateServiceRequestPayload) {
    return this.api.post<ServiceRequestRecord>('/service-requests', payload, {
      Authorization: `Bearer ${accessToken}`,
    });
  }

  async get(accessToken: string, id: number) {
    return this.api.get<ServiceRequestRecord>(`/service-requests/${id}`, {
      Authorization: `Bearer ${accessToken}`,
    });
  }

  async assignPickup(accessToken: string, id: number, payload: AssignPickupPayload) {
    return this.api.post<ServiceRequestRecord>(`/service-requests/${id}/pickup`, payload, {
      Authorization: `Bearer ${accessToken}`,
    });
  }

  async updateRunnerPickupStatus(token: string, targetStatus: string, remarks?: string) {
    return this.api.post<ServiceRequestRecord>(`/public/pickups/${token}/status`, {
      targetStatus,
      remarks,
    });
  }
}
