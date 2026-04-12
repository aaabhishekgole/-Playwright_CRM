import type { APIRequestContext } from '@playwright/test';
import { config } from '@config/index';
import type { RunnerNotification } from '@testdata/types';
import { ApiHelper } from '@utils/ApiHelper';

export class RunnerApi {
  private readonly api: ApiHelper;

  constructor(request: APIRequestContext) {
    this.api = new ApiHelper(request, config.apiBaseUrl);
  }

  async notifications(accessToken: string) {
    return this.api.get<RunnerNotification[]>('/mobile/runner/notifications', {
      Authorization: `Bearer ${accessToken}`,
    });
  }
}
