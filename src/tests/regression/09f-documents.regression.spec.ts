import { expect } from '@playwright/test';
import { authenticatedTest as test } from '@fixtures/index';
import { config } from '@config/index';
import { openRouteAndAssert, getSectionRoutes, createAdminSession } from './regression.helpers';

// ─── helpers ───────────────────────────────────────────────────────────────

function apiUrl(path: string) {
  return `${config.apiBaseUrl}${path}`;
}

function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function svgBuffer(label: string) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="100%" height="100%" fill="#f0f4ff"/><text x="20" y="120" font-size="18" fill="#0f172a">${label}</text></svg>`,
    'utf8',
  );
}

// ─── API helpers ────────────────────────────────────────────────────────────

async function uploadDocumentViaApi(
  request: import('@playwright/test').APIRequestContext,
  accessToken: string,
  name = 'Regression Test SOP',
  category = 'SOP',
  description = 'Uploaded by regression suite',
) {
  const response = await request.post(apiUrl('/documents'), {
    headers: bearer(accessToken),
    multipart: {
      name,
      category,
      description,
      file: {
        name: 'regression-doc.svg',
        mimeType: 'image/svg+xml',
        buffer: svgBuffer(name),
      },
    },
  });

  const text = await response.text();
  if (!response.ok()) {
    throw new Error(`Upload failed (${response.status()}): ${text}`);
  }
  return JSON.parse(text) as {
    id: number;
    name: string;
    category: string;
    signedUrl: string;
    objectKey: string;
    uploadedBy: string;
  };
}

async function listDocumentsViaApi(
  request: import('@playwright/test').APIRequestContext,
  accessToken: string,
  category?: string,
) {
  const url = category ? `${apiUrl('/documents')}?category=${encodeURIComponent(category)}` : apiUrl('/documents');
  const response = await request.get(url, { headers: bearer(accessToken) });
  const text = await response.text();
  if (!response.ok()) {
    throw new Error(`List failed (${response.status()}): ${text}`);
  }
  return JSON.parse(text) as Array<{ id: number; name: string; category: string }>;
}

async function deleteDocumentViaApi(
  request: import('@playwright/test').APIRequestContext,
  accessToken: string,
  documentId: number,
) {
  const response = await request.delete(apiUrl(`/documents/${documentId}`), {
    headers: bearer(accessToken),
  });
  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`Delete failed (${response.status()}): ${text}`);
  }
}

// ─── spec ───────────────────────────────────────────────────────────────────

test.describe('@DetailedRegression @Regression Documents Module', () => {

  // ── Navigation ──────────────────────────────────────────────────────────

  for (const route of getSectionRoutes('Documents')) {
    test(`should load Documents > ${route.itemLabel} tab`, async ({ authenticatedPage }) => {
      await openRouteAndAssert(authenticatedPage, route);
    });
  }

  // ── Page structure ───────────────────────────────────────────────────────

  test('should display Document Library heading and upload section for ADMIN', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(`${config.baseUrl}/documents`);
    await expect(authenticatedPage.getByRole('heading', { name: /Document Library/i })).toBeVisible();
    await expect(authenticatedPage.getByText(/Upload Document/i)).toBeVisible();
    await expect(authenticatedPage.locator('input[type="file"]')).toBeVisible();
  });

  test('should show category filter select on Documents page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(`${config.baseUrl}/documents`);
    const categorySelects = authenticatedPage.locator('select');
    await expect(categorySelects.first()).toBeVisible();
  });

  // ── API — upload ──────────────────────────────────────────────────────────

  test('API: ADMIN should upload a document and receive a signed URL', async ({ request }) => {
    const { accessToken } = await createAdminSession(request);
    const doc = await uploadDocumentViaApi(request, accessToken, 'Regression SOP Upload', 'SOP');
    expect(doc.id).toBeGreaterThan(0);
    expect(doc.name).toBe('Regression SOP Upload');
    expect(doc.category).toBe('SOP');
    expect(doc.signedUrl).toMatch(/^https?:\/\//);
    expect(doc.uploadedBy).toBeTruthy();

    // cleanup
    await deleteDocumentViaApi(request, accessToken, doc.id);
  });

  // ── API — list all ────────────────────────────────────────────────────────

  test('API: should list documents and find the uploaded document', async ({ request }) => {
    const { accessToken } = await createAdminSession(request);
    const doc = await uploadDocumentViaApi(request, accessToken, 'Regression List Test', 'Report');

    const docs = await listDocumentsViaApi(request, accessToken);
    const found = docs.find((d) => d.id === doc.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Regression List Test');

    await deleteDocumentViaApi(request, accessToken, doc.id);
  });

  // ── API — list by category ────────────────────────────────────────────────

  test('API: should filter documents by category', async ({ request }) => {
    const { accessToken } = await createAdminSession(request);
    const doc = await uploadDocumentViaApi(request, accessToken, 'Regression Policy Doc', 'Policy');

    const docs = await listDocumentsViaApi(request, accessToken, 'Policy');
    const found = docs.find((d) => d.id === doc.id);
    expect(found).toBeDefined();

    const otherCategory = docs.some((d) => d.category.toLowerCase() !== 'policy');
    expect(otherCategory).toBe(false);

    await deleteDocumentViaApi(request, accessToken, doc.id);
  });

  // ── API — signed URL accessible ───────────────────────────────────────────

  test('API: signed URL should be accessible without auth', async ({ request }) => {
    const { accessToken } = await createAdminSession(request);
    const doc = await uploadDocumentViaApi(request, accessToken, 'Regression Signed URL Test', 'Template');

    const fileResponse = await request.get(doc.signedUrl);
    expect(fileResponse.ok()).toBe(true);
    expect(fileResponse.headers()['content-type']).toContain('image/svg');

    await deleteDocumentViaApi(request, accessToken, doc.id);
  });

  // ── API — delete ──────────────────────────────────────────────────────────

  test('API: ADMIN should delete a document successfully', async ({ request }) => {
    const { accessToken } = await createAdminSession(request);
    const doc = await uploadDocumentViaApi(request, accessToken, 'Regression Delete Test', 'Other');

    await deleteDocumentViaApi(request, accessToken, doc.id);

    const docs = await listDocumentsViaApi(request, accessToken);
    const stillExists = docs.some((d) => d.id === doc.id);
    expect(stillExists).toBe(false);
  });

  // ── UI — upload via form ──────────────────────────────────────────────────

  test('UI: should upload a document through the upload form and see it in the list', async ({ authenticatedPage, request }) => {
    const { accessToken } = await createAdminSession(request);

    await authenticatedPage.goto(`${config.baseUrl}/documents`);
    await expect(authenticatedPage.getByText(/Upload Document/i)).toBeVisible();

    await authenticatedPage.locator('input[placeholder*="Document name"]').fill('UI Regression Upload');

    const categorySelect = authenticatedPage.locator('select').first();
    await categorySelect.selectOption('Training');

    await authenticatedPage.locator('input[placeholder*="Brief description"]').fill('Uploaded via regression UI test');

    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'ui-regression-doc.svg',
      mimeType: 'image/svg+xml',
      buffer: svgBuffer('UI Regression Upload'),
    });

    await authenticatedPage.getByRole('button', { name: /Upload Document/i }).click();

    await expect(
      authenticatedPage.getByText(/Document uploaded successfully/i),
    ).toBeVisible({ timeout: 15000 });

    await expect(authenticatedPage.getByText('UI Regression Upload')).toBeVisible();

    // cleanup via API
    const docs = await listDocumentsViaApi(request, accessToken, 'Training');
    const uploaded = docs.find((d) => d.name === 'UI Regression Upload');
    if (uploaded) {
      await deleteDocumentViaApi(request, accessToken, uploaded.id);
    }
  });

  // ── UI — category filter ──────────────────────────────────────────────────

  test('UI: category filter should update document list', async ({ authenticatedPage, request }) => {
    const { accessToken } = await createAdminSession(request);
    const doc = await uploadDocumentViaApi(request, accessToken, 'Filter Regression Doc', 'SOP');

    await authenticatedPage.goto(`${config.baseUrl}/documents`);

    const filterSelect = authenticatedPage.locator('select').last();
    await filterSelect.selectOption('SOP');

    await expect(authenticatedPage.getByText('Filter Regression Doc')).toBeVisible({ timeout: 10000 });

    await filterSelect.selectOption('Policy');
    await expect(authenticatedPage.getByText('Filter Regression Doc')).not.toBeVisible({ timeout: 5000 });

    await deleteDocumentViaApi(request, accessToken, doc.id);
  });
});
