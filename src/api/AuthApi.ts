import type { APIRequestContext } from '@playwright/test';
import { config } from '@config/index';
import type { LoginResponse } from '@testdata/types';
import { ApiHelper } from '@utils/ApiHelper';

export class AuthApi {
  private readonly api: ApiHelper;

  constructor(request: APIRequestContext) {
    this.api = new ApiHelper(request, config.apiBaseUrl);
  }

  async login(username: string, password: string) {
    return this.api.post<LoginResponse>('/auth/login', { username, password });
  }
}
