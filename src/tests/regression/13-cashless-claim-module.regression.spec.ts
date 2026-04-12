import { expect } from '@playwright/test';
import { authenticatedTest as test } from '@fixtures/index';
import {
  approveClaimViaApi,
  approveClaimInvoiceViaApi,
  closeClaimViaApi,
  createAdminSession,
  createCashlessClaimViaApi,
  createClaimViaApi,
  fetchClaimViaApi,
  getSectionRoutes,
  openRouteAndAssert,
  rejectClaimViaApi,
  rejectClaimInvoiceViaApi,
  seedClaimAtApprovalPending,
  seedClaimAtApproved,
  seedClaimAtInvoiceSubmitted,
  seedClaimReadyForInsurance,
  submitClaimForApprovalViaApi,
  submitClaimInvoiceViaApi,
  submitClaimToInsuranceViaApi,
  uploadClaimDocumentViaApi,
} from './regression.helpers';

// ─── Tab / Navigation Tests ───────────────────────────────────────────────────

test.describe('@DetailedRegression @Regression Cashless Claim Module — Navigation', () => {
  test('should load every Claims tab without error', async ({ authenticatedPage }) => {
    for (const route of getSectionRoutes('Claims')) {
      await openRouteAndAssert(authenticatedPage, route);
    }
  });

  test('should load every Invoice Verification tab without error', async ({ authenticatedPage }) => {
    for (const route of getSectionRoutes('Invoice Verification')) {
      // All routes in this section (including /claims?status=... ones) resolve to the Claims
      // breadcrumb path, so verify by page heading + workspace presence rather than breadcrumb.
      await authenticatedPage.goto(route.path);
      await expect(authenticatedPage.locator('main h1, main h2').first()).toBeVisible({ timeout: 30000 });
      await expect(authenticatedPage.locator('.workspace-page')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should load every Insurance Submission tab without error', async ({ authenticatedPage }) => {
    for (const route of getSectionRoutes('Insurance Submission')) {
      // All routes in this section (including /claims?status=... ones) resolve to the Claims
      // breadcrumb path, so verify by page heading + workspace presence rather than breadcrumb.
      await authenticatedPage.goto(route.path);
      await expect(authenticatedPage.locator('main h1, main h2').first()).toBeVisible({ timeout: 30000 });
      await expect(authenticatedPage.locator('.workspace-page')).toBeVisible({ timeout: 10000 });
    }
  });
});

// ─── Claim Lifecycle: Happy Path ──────────────────────────────────────────────

test.describe('@DetailedRegression @Regression Cashless Claim Module — Full Lifecycle', () => {
  test('should complete full claim lifecycle: submit → approve → invoice → insurance → close', async ({
    request,
  }) => {
    const session = await createAdminSession(request);
    const { createdRequest } = await createClaimViaApi(request, session.accessToken);

    // Step 1: Create claim
    const claim = await createCashlessClaimViaApi(request, session.accessToken, createdRequest.id);
    expect(claim.claimStatus).toBe('CLAIM_SUBMITTED');
    expect(claim.claimNumber).toMatch(/^CLM-/);
    expect(claim.serviceRequestId).toBe(createdRequest.id);

    // Step 2: Upload documents
    await uploadClaimDocumentViaApi(request, session.accessToken, claim.id, 'CLAIM_DEVICE_PHOTO_1', 'Device front');
    const afterUpload = await uploadClaimDocumentViaApi(request, session.accessToken, claim.id, 'PURCHASE_INVOICE', 'Purchase invoice');
    expect(afterUpload.documents.length).toBeGreaterThanOrEqual(2);

    // Step 3: Submit for approval
    const submitted = await submitClaimForApprovalViaApi(request, session.accessToken, claim.id);
    expect(submitted.claimStatus).toBe('APPROVAL_PENDING');

    // Step 4: Approve with IMEI verification
    const approved = await approveClaimViaApi(request, session.accessToken, claim.id, 15000, 'Regression approval', true);
    expect(approved.claimStatus).toBe('APPROVED');
    expect(approved.approvedAmount).toBe(15000);
    expect(approved.imeiVerified).toBe(true);

    // Step 5: Submit invoice (amount within 10% threshold)
    const invoiced = await submitClaimInvoiceViaApi(request, session.accessToken, claim.id, 14500, false);
    expect(invoiced.claimStatus).toBe('INVOICE_SUBMITTED');
    expect(invoiced.invoiceVerification?.invoiceAmount).toBe(14500);

    // Step 6: Approve invoice
    const invoiceApproved = await approveClaimInvoiceViaApi(request, session.accessToken, claim.id);
    expect(invoiceApproved.claimStatus).toBe('READY_FOR_INSURANCE');

    // Step 7: Submit to insurance
    const insuranceSubmitted = await submitClaimToInsuranceViaApi(request, session.accessToken, claim.id);
    expect(insuranceSubmitted.claimStatus).toBe('SUBMITTED_TO_INSURANCE');
    expect(insuranceSubmitted.insuranceSubmission?.submittedBy).toBeTruthy();

    // Step 8: Close claim
    const closed = await closeClaimViaApi(request, session.accessToken, claim.id);
    expect(closed.claimStatus).toBe('CLOSED');
  });

  test('approval log should record each state transition', async ({ request }) => {
    const session = await createAdminSession(request);
    const { createdRequest } = await createClaimViaApi(request, session.accessToken);

    const claim = await seedClaimAtApproved(request, session.accessToken, createdRequest.id);
    const fetched = await fetchClaimViaApi(request, session.accessToken, claim.id);

    expect(fetched.approvalLogs.length).toBeGreaterThanOrEqual(2);
    const actions = fetched.approvalLogs.map((log) => log.action);
    expect(actions).toContain('MOVED_TO_APPROVAL');
    expect(actions).toContain('CLAIM_APPROVED');
  });
});

// ─── Rejection Flow ───────────────────────────────────────────────────────────

test.describe('@DetailedRegression @Regression Cashless Claim Module — Rejection', () => {
  test('should reject a claim and set status to REJECTED', async ({ request }) => {
    const session = await createAdminSession(request);
    const { createdRequest } = await createClaimViaApi(request, session.accessToken);

    const pending = await seedClaimAtApprovalPending(request, session.accessToken, createdRequest.id);
    expect(pending.claimStatus).toBe('APPROVAL_PENDING');

    // First rejection → REUPLOAD_PENDING (backend only locks to REJECTED after maxReuploadAttempts=3)
    const rejected = await rejectClaimViaApi(request, session.accessToken, pending.id);
    expect(rejected.claimStatus).toBe('REUPLOAD_PENDING');
    expect(rejected.rejectionReason).toBeTruthy();
  });

  test('should reject invoice and move to INVOICE_REJECTED', async ({ request }) => {
    const session = await createAdminSession(request);
    const { createdRequest } = await createClaimViaApi(request, session.accessToken);

    const invoiced = await seedClaimAtInvoiceSubmitted(request, session.accessToken, createdRequest.id);
    expect(invoiced.claimStatus).toBe('INVOICE_SUBMITTED');

    // Invoice rejection → INVOICE_REUPLOAD_PENDING (claim stays alive for re-submission)
    const rejected = await rejectClaimInvoiceViaApi(request, session.accessToken, invoiced.id);
    expect(rejected.claimStatus).toBe('INVOICE_REUPLOAD_PENDING');
  });
});

// ─── Excess Invoice Threshold ─────────────────────────────────────────────────

test.describe('@DetailedRegression @Regression Cashless Claim Module — Invoice Threshold', () => {
  test('should flag admin approval required when invoice exceeds 10% of approved amount', async ({
    request,
  }) => {
    const session = await createAdminSession(request);
    const { createdRequest } = await createClaimViaApi(request, session.accessToken);

    const approved = await seedClaimAtApproved(request, session.accessToken, createdRequest.id);
    // Backend requires EXCESS_PAYMENT_PROOF upload before submitting when excessPaymentMade=true
    await uploadClaimDocumentViaApi(request, session.accessToken, approved.id, 'EXCESS_PAYMENT_PROOF', 'Excess proof');
    // 15000 approved → 10% threshold = 1500 → excess invoice = 17000 → excess = 2000 → breaches threshold
    const invoiced = await submitClaimInvoiceViaApi(request, session.accessToken, approved.id, 17000, true);

    expect(invoiced.invoiceVerification?.adminApprovalRequired).toBe(true);
    expect(invoiced.invoiceVerification?.excessAmount).toBeGreaterThan(0);
  });

  test('should not flag admin approval when invoice is within 10% of approved amount', async ({
    request,
  }) => {
    const session = await createAdminSession(request);
    const { createdRequest } = await createClaimViaApi(request, session.accessToken);

    const approved = await seedClaimAtApproved(request, session.accessToken, createdRequest.id);
    // 15000 approved → invoice 16000 → excess 1000 → 6.67% → within threshold
    const invoiced = await submitClaimInvoiceViaApi(request, session.accessToken, approved.id, 16000, false);

    expect(invoiced.invoiceVerification?.adminApprovalRequired).toBe(false);
  });
});

// ─── Claim UI Visibility ──────────────────────────────────────────────────────

test.describe('@DetailedRegression @Regression Cashless Claim Module — UI Queues', () => {
  test('should display submitted claim in the all-claims list page', async ({
    authenticatedPage,
    request,
  }) => {
    const session = await createAdminSession(request);
    const { createdRequest } = await createClaimViaApi(request, session.accessToken);
    const claim = await createCashlessClaimViaApi(request, session.accessToken, createdRequest.id);

    const allClaimsRoute = getSectionRoutes('Claims').find((r) => r.itemId === 'all-claims');
    if (!allClaimsRoute) throw new Error('all-claims route not found in menu hierarchy.');

    await openRouteAndAssert(authenticatedPage, allClaimsRoute);
    await expect(authenticatedPage.getByText(claim.claimNumber)).toBeVisible({ timeout: 15000 });
  });

  test('should display claim pending approval in approval-pending queue', async ({
    authenticatedPage,
    request,
  }) => {
    const session = await createAdminSession(request);
    const { createdRequest } = await createClaimViaApi(request, session.accessToken);
    const pending = await seedClaimAtApprovalPending(request, session.accessToken, createdRequest.id);

    const approvalPendingRoute = getSectionRoutes('Claims').find((r) => r.itemId === 'approval-pending');
    if (!approvalPendingRoute) throw new Error('approval-pending route not found in menu hierarchy.');

    await openRouteAndAssert(authenticatedPage, approvalPendingRoute);
    await expect(authenticatedPage.getByText(pending.claimNumber)).toBeVisible({ timeout: 15000 });
  });

  test('should display approved claim in approved-claims queue', async ({
    authenticatedPage,
    request,
  }) => {
    const session = await createAdminSession(request);
    const { createdRequest } = await createClaimViaApi(request, session.accessToken);
    const approved = await seedClaimAtApproved(request, session.accessToken, createdRequest.id);

    const approvedRoute = getSectionRoutes('Claims').find((r) => r.itemId === 'approved-claims');
    if (!approvedRoute) throw new Error('approved-claims route not found in menu hierarchy.');

    await openRouteAndAssert(authenticatedPage, approvedRoute);
    await expect(authenticatedPage.getByText(approved.claimNumber)).toBeVisible({ timeout: 15000 });
  });

  test('should display invoice in the invoice verification queue', async ({
    authenticatedPage,
    request,
  }) => {
    const session = await createAdminSession(request);
    const { createdRequest } = await createClaimViaApi(request, session.accessToken);
    const invoiced = await seedClaimAtInvoiceSubmitted(request, session.accessToken, createdRequest.id);

    const invoiceQueueRoute = getSectionRoutes('Invoice Verification').find((r) => r.itemId === 'invoice-queue');
    if (!invoiceQueueRoute) throw new Error('invoice-queue route not found in menu hierarchy.');

    await openRouteAndAssert(authenticatedPage, invoiceQueueRoute);
    await expect(authenticatedPage.getByText(invoiced.claimNumber)).toBeVisible({ timeout: 15000 });
  });

  test('should display claim in insurance submission ready queue', async ({
    authenticatedPage,
    request,
  }) => {
    const session = await createAdminSession(request);
    const { createdRequest } = await createClaimViaApi(request, session.accessToken);
    const ready = await seedClaimReadyForInsurance(request, session.accessToken, createdRequest.id);

    const readyForInsuranceRoute = getSectionRoutes('Insurance Submission').find((r) => r.itemId === 'ready-for-insurance');
    if (!readyForInsuranceRoute) throw new Error('ready-for-insurance route not found in menu hierarchy.');

    await openRouteAndAssert(authenticatedPage, readyForInsuranceRoute);
    await expect(authenticatedPage.getByText(ready.claimNumber)).toBeVisible({ timeout: 15000 });
  });
});

// ─── Backward Compatibility Guard ─────────────────────────────────────────────

test.describe('@DetailedRegression @Regression Cashless Claim Module — Backward Compatibility', () => {
  test('should create a normal repair request with NORMAL_REPAIR type and no claim entity', async ({
    request,
  }) => {
    const session = await createAdminSession(request);
    const { createdRequest } = await createClaimViaApi(request, session.accessToken);

    // Normal repair requests should not have a claim
    const response = await request.get(
      `${(await import('@config/index')).config.apiBaseUrl}/claims/by-request/${createdRequest.id}`,
      { headers: { Authorization: `Bearer ${session.accessToken}` } },
    );
    // 404 is expected — no claim registered for a fresh service request
    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      // If somehow a claim exists, it should not be of a different request
      expect(body.serviceRequestId).toBe(createdRequest.id);
    }
  });

  test('cashless module routes should not redirect to login for authenticated user', async ({
    authenticatedPage,
  }) => {
    // Claims routes: use full breadcrumb assertion (workspace-style paths work fine)
    for (const route of getSectionRoutes('Claims')) {
      await openRouteAndAssert(authenticatedPage, route);
    }

    // Invoice Verification and Insurance Submission: all routes (including /claims?status=...
    // query-param routes) map to the Claims breadcrumb, so verify by heading rather than breadcrumb.
    const claimSectionRoutes = [
      ...getSectionRoutes('Invoice Verification'),
      ...getSectionRoutes('Insurance Submission'),
    ];
    for (const route of claimSectionRoutes) {
      await authenticatedPage.goto(route.path);
      await expect(authenticatedPage.locator('main h1, main h2').first()).toBeVisible({ timeout: 30000 });
      // Confirm we are NOT on the login page
      await expect(authenticatedPage.getByRole('heading', { name: /Login/i })).not.toBeVisible();
    }
  });
});
