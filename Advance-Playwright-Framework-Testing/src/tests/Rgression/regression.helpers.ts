import type { APIRequestContext } from '@playwright/test';
import { AuthApi, ServiceRequestApi, UserApi } from '@api/index';
import { config } from '@config/index';
import {
  buildClaimRegistrationFormData,
  buildPickupRunnerFormData,
  toCreatePickupRunnerPayload,
  toCreateServiceRequestPayload,
} from '@testdata/factories';
import type { ClaimRegistrationFormData, LoginResponse, PickupRunnerFormData, ServiceRequestRecord, UserSummary } from '@testdata/types';

export async function createAdminSession(request: APIRequestContext): Promise<LoginResponse> {
  const authApi = new AuthApi(request);
  return authApi.login(config.users.admin.username, config.users.admin.password);
}

export async function createClaimViaApi(
  request: APIRequestContext,
  accessToken: string,
  overrides: Partial<ClaimRegistrationFormData> = {},
) {
  const serviceRequestApi = new ServiceRequestApi(request);
  const claimData = buildClaimRegistrationFormData(overrides);
  const createdRequest = await serviceRequestApi.create(accessToken, toCreateServiceRequestPayload(claimData));
  return { claimData, createdRequest };
}

export async function onboardRunnerViaApi(
  request: APIRequestContext,
  accessToken: string,
  overrides: Partial<PickupRunnerFormData> = {},
) {
  const userApi = new UserApi(request);
  const runnerData = buildPickupRunnerFormData(overrides);
  const runner = await userApi.createPickupRunner(accessToken, toCreatePickupRunnerPayload(runnerData));
  return { runnerData, runner };
}

export async function findPickupRunnerByUsername(
  request: APIRequestContext,
  accessToken: string,
  username: string,
): Promise<UserSummary> {
  const userApi = new UserApi(request);
  const pickupRunners = await userApi.list(accessToken, 'PICKUP_AGENT', true);
  const runner = pickupRunners.find((candidate) => candidate.username === username);
  if (!runner) {
    throw new Error(`Pickup runner ${username} was not found in the active runner roster.`);
  }
  return runner;
}

export async function assignPickupViaApi(
  request: APIRequestContext,
  accessToken: string,
  serviceRequestId: number,
  agentId: number,
  scheduledAtIso: string,
  notes: string,
): Promise<ServiceRequestRecord> {
  const serviceRequestApi = new ServiceRequestApi(request);
  return serviceRequestApi.assignPickup(accessToken, serviceRequestId, {
    agentId,
    scheduledAt: scheduledAtIso,
    pickupOtp: '4826',
    notes,
  });
}

export function extractRunnerToken(runnerPortalLink: string) {
  return new URL(runnerPortalLink).pathname.split('/').pop() ?? '';
}
