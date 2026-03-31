import {
  test as base,
  expect,
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
  type Page,
  type TestInfo,
} from '@playwright/test';
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

type VideoMode = 'off' | 'on' | 'retain-on-failure' | 'on-first-retry' | 'retry-with-video';
type VideoOption =
  | VideoMode
  | {
      mode: VideoMode;
      size?: {
        width: number;
        height: number;
      };
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

async function createAuthenticatedContext(
  browser: Browser,
  request: APIRequestContext,
  userKey: FrameworkUserKey,
  contextOptions: BrowserContextOptions,
) {
  const authApi = new AuthApi(request);
  const credentials = config.users[userKey];
  const session = await authApi.login(credentials.username, credentials.password);
  const context = await browser.newContext(contextOptions);

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

function normalizeVideoMode(video: VideoOption) {
  const mode = typeof video === 'string' ? video : video.mode;
  return mode === 'retry-with-video' ? 'on-first-retry' : mode;
}

function shouldCaptureVideo(videoMode: ReturnType<typeof normalizeVideoMode>, testInfo: TestInfo) {
  return videoMode === 'on' || videoMode === 'retain-on-failure' || (videoMode === 'on-first-retry' && testInfo.retry === 1);
}

function shouldPreserveVideo(videoMode: ReturnType<typeof normalizeVideoMode>, testInfo: TestInfo) {
  const testFailed = testInfo.status !== testInfo.expectedStatus;
  return videoMode === 'on' || (videoMode === 'retain-on-failure' && testFailed) || (videoMode === 'on-first-retry' && testInfo.retry === 1);
}

function buildAuthenticatedContextOptions(
  contextOptions: BrowserContextOptions,
  video: VideoOption,
  testInfo: TestInfo,
): BrowserContextOptions {
  const videoMode = normalizeVideoMode(video);

  return {
    ...contextOptions,
    baseURL: config.baseUrl,
    ...(shouldCaptureVideo(videoMode, testInfo)
      ? {
          recordVideo: {
            dir: testInfo.outputDir,
            size: typeof video === 'string' ? undefined : video.size,
          },
        }
      : {}),
  };
}

async function attachFinalScreenshot(page: Page, testInfo: TestInfo, attachmentName: string) {
  if (page.isClosed()) {
    return;
  }

  try {
    const screenshotPath = testInfo.outputPath(`${attachmentName}.png`);
    await page.screenshot({
      fullPage: true,
      path: screenshotPath,
    });
    await testInfo.attach(attachmentName, {
      contentType: 'image/png',
      path: screenshotPath,
    });
  } catch {
    // Some failure states close or detach the page before teardown; skip the screenshot silently in that case.
  }
}

async function closePageSafely(page: Page) {
  if (page.isClosed()) {
    return;
  }

  try {
    await page.close();
  } catch {
    // Ignore teardown-time close failures so the original test result remains intact.
  }
}

async function attachRecordedVideo(recordedVideo: ReturnType<Page['video']>, testInfo: TestInfo, attachmentName: string) {
  if (!recordedVideo) {
    return;
  }

  const savedVideoPath = testInfo.outputPath(`${attachmentName}.webm`);
  await recordedVideo.saveAs(savedVideoPath);
  await testInfo.attach(attachmentName, {
    contentType: 'video/webm',
    path: savedVideoPath,
  });
  await recordedVideo.delete();
}

export const test = base.extend<FrameworkFixtures>({
  page: async ({ page, video }, use, testInfo) => {
    const recordedVideo = page.video();
    await use(page);

    await attachFinalScreenshot(page, testInfo, 'flow-screenshot');

    const videoMode = normalizeVideoMode(video as VideoOption);
    const preserveVideo = shouldPreserveVideo(videoMode, testInfo);

    await closePageSafely(page);

    if (!preserveVideo) {
      if (recordedVideo) {
        await recordedVideo.delete();
      }
      return;
    }

    await attachRecordedVideo(recordedVideo, testInfo, 'flow-video');
  },

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

  authenticatedContext: async ({ browser, request, contextOptions, video }, use, testInfo) => {
    const context = await createAuthenticatedContext(
      browser,
      request,
      'admin',
      buildAuthenticatedContextOptions(contextOptions, video as VideoOption, testInfo),
    );
    await use(context);
    await context.close();
  },

  authenticatedPage: async ({ authenticatedContext, video }, use, testInfo) => {
    const page = await authenticatedContext.newPage();
    await page.goto(config.routes.dashboard);
    const recordedVideo = page.video();
    await use(page);
    await attachFinalScreenshot(page, testInfo, 'authenticated-flow-screenshot');
    await closePageSafely(page);

    if (!recordedVideo) {
      return;
    }

    const videoMode = normalizeVideoMode(video as VideoOption);
    if (!shouldPreserveVideo(videoMode, testInfo)) {
      await recordedVideo.delete();
      return;
    }

    await attachRecordedVideo(recordedVideo, testInfo, 'authenticated-flow-video');
  },
});

export const authTest = test;
export const authenticatedTest = test;
export { expect };
