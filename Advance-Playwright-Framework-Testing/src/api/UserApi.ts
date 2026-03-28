import type { APIRequestContext } from '@playwright/test';
import { config } from '@config/index';
import type { CreatePickupRunnerPayload, UserSummary } from '@testdata/types';
import { ApiHelper } from '@utils/ApiHelper';

export class UserApi {
  private readonly api: ApiHelper;

  constructor(request: APIRequestContext) {
    this.api = new ApiHelper(request, config.apiBaseUrl);
  }

  async list(accessToken: string, role?: string, activeOnly = false) {
    const params = new URLSearchParams();
    if (role) {
      params.set('role', role);
    }
    if (activeOnly) {
      params.set('activeOnly', 'true');
    }

    const path = params.toString() ? `/users?${params.toString()}` : '/users';
    return this.api.get<UserSummary[]>(path, {
      Authorization: `Bearer ${accessToken}`,
    });
  }

  async createPickupRunner(accessToken: string, payload: CreatePickupRunnerPayload) {
    return this.api.post<UserSummary>('/users/pickup-runners', payload, {
      Authorization: `Bearer ${accessToken}`,
    });
  }
}
