import { expect } from '@playwright/test';
import { authenticatedTest as test } from '@fixtures/index';
import {
  createAdminSession,
  createDeliveredRequest,
  createInvoiceViaApi,
  createInvoicedRequest,
  expectRequestVisible,
  getRequestById,
  getSectionRoutes,
  openRouteAndAssert,
  recordPaymentViaApi,
  requestCard,
} from './regression.helpers';

test.describe('@DetailedRegression @Regression Billing Module', () => {
  test('should load every billing tab', async ({ authenticatedPage }) => {
    for (const route of getSectionRoutes('Billing')) {
      await openRouteAndAssert(authenticatedPage, route);
    }
  });

  test('should generate invoice, record payment, reconcile it, and close the request', async ({ authenticatedPage, request }) => {
    const session = await createAdminSession(request);
    const deliveredSeed = await createDeliveredRequest(request, session.accessToken);

    const generateInvoiceRoute = getSectionRoutes('Billing').find((route) => route.itemId === 'generate-invoice');
    const pendingInvoicesRoute = getSectionRoutes('Billing').find((route) => route.itemId === 'pending-invoices');
    const paidInvoicesRoute = getSectionRoutes('Billing').find((route) => route.itemId === 'paid-invoices');
    if (!generateInvoiceRoute || !pendingInvoicesRoute || !paidInvoicesRoute) {
      throw new Error('Billing routes are incomplete for regression coverage.');
    }

    await openRouteAndAssert(authenticatedPage, generateInvoiceRoute);
    await expectRequestVisible(authenticatedPage, deliveredSeed.requestRecord.requestNumber);
    await requestCard(authenticatedPage, deliveredSeed.requestRecord.requestNumber).getByRole('button', { name: 'Generate Invoice' }).click();

    const invoiced = await getRequestById(request, session.accessToken, deliveredSeed.requestRecord.id);
    expect(invoiced.status).toBe('INVOICED');
    expect(invoiced.invoice?.invoiceNumber).toBeTruthy();

    await openRouteAndAssert(authenticatedPage, pendingInvoicesRoute);
    await expectRequestVisible(authenticatedPage, deliveredSeed.requestRecord.requestNumber);
    const pendingCard = requestCard(authenticatedPage, deliveredSeed.requestRecord.requestNumber);
    await pendingCard.locator('input').nth(0).fill(`PAY-REG-${Date.now()}`);
    await pendingCard.locator('input').nth(1).fill(String(invoiced.invoice?.amountDue ?? 0));
    await pendingCard.locator('select').first().selectOption('UPI');
    await pendingCard.locator('input').nth(2).fill(`UTR-REG-${Date.now()}`);
    await pendingCard.getByRole('button', { name: 'Record Payment' }).click();

    const paidRequest = await getRequestById(request, session.accessToken, deliveredSeed.requestRecord.id);
    const paymentId = paidRequest.payments.at(-1)?.id;
    expect(paymentId).toBeTruthy();

    await authenticatedPage.goto('/payment-reconciliation');
    await expect(authenticatedPage.getByRole('heading', { name: 'Payment Reconciliation' })).toBeVisible();
    const reconciliationCard = requestCard(authenticatedPage, paidRequest.invoice?.invoiceNumber ?? deliveredSeed.requestRecord.requestNumber);
    await reconciliationCard.locator('select').first().selectOption('RECONCILED');
    await reconciliationCard.locator('textarea').fill('Reconciled from detailed billing regression.');
    await reconciliationCard.getByRole('button', { name: 'Save Reconciliation' }).click();

    const reconciledRequest = await getRequestById(request, session.accessToken, deliveredSeed.requestRecord.id);
    expect(reconciledRequest.payments.at(-1)?.reconciliationStatus).toBe('RECONCILED');

    await openRouteAndAssert(authenticatedPage, paidInvoicesRoute);
    await expectRequestVisible(authenticatedPage, deliveredSeed.requestRecord.requestNumber);
    await requestCard(authenticatedPage, deliveredSeed.requestRecord.requestNumber).getByRole('button', { name: 'Close Request' }).click();

    const closedRequest = await getRequestById(request, session.accessToken, deliveredSeed.requestRecord.id);
    expect(closedRequest.status).toBe('CLOSED');
  });

  test('should process a refund from the refund cases board and retain the invoice in reports', async ({ authenticatedPage, request }) => {
    const session = await createAdminSession(request);
    const invoicedSeed = await createInvoicedRequest(request, session.accessToken);
    const paidRequest = await recordPaymentViaApi(
      request,
      session.accessToken,
      invoicedSeed.requestRecord.id,
      Number(invoicedSeed.requestRecord.invoice?.amountDue ?? 500),
      `PAY-REFUND-${Date.now()}`,
    );

    const refundCasesRoute = getSectionRoutes('Billing').find((route) => route.itemId === 'refund-cases');
    const invoiceReportsRoute = getSectionRoutes('Billing').find((route) => route.itemId === 'invoice-reports');
    if (!refundCasesRoute || !invoiceReportsRoute) {
      throw new Error('Billing refund/report routes are incomplete for regression coverage.');
    }

    await openRouteAndAssert(authenticatedPage, refundCasesRoute);
    await expectRequestVisible(authenticatedPage, invoicedSeed.requestRecord.requestNumber);
    const refundCard = requestCard(authenticatedPage, invoicedSeed.requestRecord.requestNumber);
    await refundCard.locator('select').first().selectOption(String(paidRequest.payments.at(-1)?.id ?? ''));
    await refundCard.locator('input[type="number"]').fill('250');
    await refundCard.locator('textarea').fill('Partial refund from detailed billing regression.');
    await refundCard.getByRole('button', { name: 'Process Refund' }).click();

    const refundedRequest = await getRequestById(request, session.accessToken, invoicedSeed.requestRecord.id);
    expect((refundedRequest.invoice?.refundAmount ?? 0) > 0).toBeTruthy();

    await openRouteAndAssert(authenticatedPage, invoiceReportsRoute);
    await expectRequestVisible(authenticatedPage, invoicedSeed.requestRecord.requestNumber);
  });
});

