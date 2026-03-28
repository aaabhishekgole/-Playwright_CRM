import { test as base, expect, type APIRequestContext, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { AuthApi } from '@api/AuthApi';
import { DashboardPage, LoginPage, RunnerInboxPage, ServiceRequestListPage } from '@pages/index';
import { LoginModule, RunnerInboxModule, ServiceRequestModule } from '@modules/index';
import { config } from '@config/index';
import type { FrameworkUserKey, LoginResponse } from '@testdata/types';

type FrameworkFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  serviceRequestListPage: ServiceRequestListPage;
  runnerInboxPage: RunnerInboxPage;
  loginModule: LoginModule;
  serviceRequestModule: ServiceRequestModule;
  runnerInboxModule: RunnerInboxModule;
  authenticatedPage: Page;
  authenticatedContext: BrowserContext;
};

function toStoredUser(session: LoginResponse) {
  return JSON.stringify({
    accessToken: session.accessToken,
    tokenType: session.tokenType,
    username: session.username,
    role: session.role,
    fullName: session.fullName,
    phone: session.phone,
  });
}

async function createAuthenticatedContext(browser: Browser, request: APIRequestContext, userKey: FrameworkUserKey) {
  const authApi = new AuthApi(request);
  const credentials = config.users[userKey];
  const session = await authApi.login(credentials.username, credentials.password);
  const context = await browser.newContext({ baseURL: config.baseUrl });

  await context.addInitScript(
    ({ accessToken, storedUser }) => {
      window.localStorage.setItem('gsh_token', accessToken);
      window.localStorage.setItem('gsh_user', storedUser);
    },
    {
      accessToken: session.accessToken,
      storedUser: toStoredUser(session),
    },
  );

  return context;
}

export const test = base.extend<FrameworkFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  serviceRequestListPage: async ({ page }, use) => {
    await use(new ServiceRequestListPage(page));
  },

  runnerInboxPage: async ({ page }, use) => {
    await use(new RunnerInboxPage(page));
  },

  loginModule: async ({ page }, use) => {
    await use(new LoginModule(page));
  },

  serviceRequestModule: async ({ page }, use) => {
    await use(new ServiceRequestModule(page));
  },

  runnerInboxModule: async ({ page }, use) => {
    await use(new RunnerInboxModule(page));
  },

  authenticatedContext: async ({ browser, request }, use) => {
    const context = await createAuthenticatedContext(browser, request, 'admin');
    await use(context);
    await context.close();
  },

  authenticatedPage: async ({ authenticatedContext }, use) => {
    const page = await authenticatedContext.newPage();
    await page.goto(config.routes.dashboard);
    await use(page);
    await page.close();
  },
});

export const authTest = test;
export const authenticatedTest = test;
export { expect };
