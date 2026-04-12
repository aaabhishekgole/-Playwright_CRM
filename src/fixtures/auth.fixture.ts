import { access } from 'node:fs/promises';
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
import { AppLayoutPage, DashboardPage, LoginPage, RunnerInboxPage, ServiceRequestListPage } from '@pages/index';
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
  adminSession: LoginResponse;
  pickupRunnerSession: LoginResponse;
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

const SESSION_TTL_MS = 4 * 60 * 1000;
const TEARDOWN_TIMEOUT_MS = 15_000;
const sessionCache = new Map<FrameworkUserKey, { session: Promise<LoginResponse>; createdAt: number }>();

async function getCachedSession(request: APIRequestContext, userKey: FrameworkUserKey) {
  const cached = sessionCache.get(userKey);
  if (cached && Date.now() - cached.createdAt < SESSION_TTL_MS) {
    return cached.session;
  }

  const authApi = new AuthApi(request);
  const credentials = config.users[userKey];
  const session = authApi.login(credentials.username, credentials.password).catch((error) => {
    sessionCache.delete(userKey);
    throw error;
  });
  sessionCache.set(userKey, {
    session,
    createdAt: Date.now(),
  });
  return session;
}

async function createAuthenticatedContext(
  browser: Browser,
  contextOptions: BrowserContextOptions,
) {
  return browser.newContext(contextOptions);
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

async function withTeardownTimeout(task: Promise<void>, label: string) {
  let timeoutHandle: NodeJS.Timeout | undefined;

  try {
    await Promise.race([
      task,
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(`${label} exceeded ${TEARDOWN_TIMEOUT_MS}ms`)), TEARDOWN_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    console.warn(`[auth.fixture] ${label} skipped during teardown: ${String(error)}`);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

async function closePageSafely(page: Page) {
  if (page.isClosed()) {
    return;
  }

  try {
    await withTeardownTimeout(page.close(), 'page.close');
  } catch {
    // Ignore teardown-time close failures so the original test result remains intact.
  }
}

async function attachRecordedVideo(recordedVideo: ReturnType<Page['video']>, testInfo: TestInfo, attachmentName: string) {
  if (!recordedVideo) {
    return;
  }

  const savedVideoPath = testInfo.outputPath(`${attachmentName}.webm`);
  await withTeardownTimeout(recordedVideo.saveAs(savedVideoPath), 'video.saveAs');

  const videoWasSaved = await access(savedVideoPath).then(() => true).catch(() => false);
  if (videoWasSaved) {
    await testInfo.attach(attachmentName, {
      contentType: 'video/webm',
      path: savedVideoPath,
    });
  }

  await withTeardownTimeout(recordedVideo.delete(), 'video.delete');
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

  adminSession: async ({ request }, use) => {
    await use(await getCachedSession(request, 'admin'));
  },

  pickupRunnerSession: async ({ request }, use) => {
    await use(await getCachedSession(request, 'pickupRunner'));
  },

  authenticatedContext: async ({ browser, contextOptions, video }, use, testInfo) => {
    const context = await createAuthenticatedContext(
      browser,
      buildAuthenticatedContextOptions(contextOptions, video as VideoOption, testInfo),
    );
    const adminSession = await getCachedSession(context.request, 'admin');
    await context.addInitScript((session) => {
      window.localStorage.setItem('gsh_token', session.accessToken);
      window.localStorage.setItem('gsh_user', JSON.stringify(session));
    }, adminSession);
    await use(context);
    await withTeardownTimeout(context.close(), 'context.close');
  },

  authenticatedPage: async ({ authenticatedContext, video }, use, testInfo) => {
    const page = await authenticatedContext.newPage();
    await page.goto('about:blank');

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
