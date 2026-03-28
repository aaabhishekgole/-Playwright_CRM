import fs from 'fs';
import path from 'path';
import routes from '../testdata/routes.json';
import users from '../testdata/users.json';
import type { FrameworkUserKey, RouteMap, UserCredentials } from '../testdata/types';

type FrameworkConfig = {
  baseUrl: string;
  apiBaseUrl: string;
  headless: boolean;
  defaultTimeoutMs: number;
  expectTimeoutMs: number;
  apiTimeoutMs: number;
  users: Record<FrameworkUserKey, UserCredentials>;
  routes: RouteMap;
};

function readBoolean(value: string | undefined, fallback: boolean) {
  if (value == null || value === '') {
    return fallback;
  }
  return value.toLowerCase() === 'true';
}

function readNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const defaultUsers = users as Record<FrameworkUserKey, UserCredentials>;

export const config: FrameworkConfig = {
  baseUrl: process.env.BASE_URL ?? 'http://127.0.0.1:5173',
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://127.0.0.1:8081/api',
  headless: readBoolean(process.env.HEADLESS, true),
  defaultTimeoutMs: readNumber(process.env.DEFAULT_TIMEOUT_MS, 30000),
  expectTimeoutMs: readNumber(process.env.EXPECT_TIMEOUT_MS, 10000),
  apiTimeoutMs: readNumber(process.env.API_TIMEOUT_MS, 15000),
  routes: routes as RouteMap,
  users: {
    admin: {
      ...defaultUsers.admin,
      username: process.env.ADMIN_USERNAME ?? defaultUsers.admin.username,
      password: process.env.ADMIN_PASSWORD ?? defaultUsers.admin.password,
    },
    pickupRunner: {
      ...defaultUsers.pickupRunner,
      username: process.env.PICKUP_USERNAME ?? defaultUsers.pickupRunner.username,
      password: process.env.PICKUP_PASSWORD ?? defaultUsers.pickupRunner.password,
    },
  },
};

export type { FrameworkUserKey, FrameworkConfig };
