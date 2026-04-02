import { expect } from '@playwright/test';
import { authenticatedTest as test } from '@fixtures/index';
import {
  createAdminSession,
  createReadyForDispatchRequest,
  expectRequestVisible,
  getRequestById,
  getSectionRoutes,
  openRouteAndAssert,
  requestCard,
} from './regression.helpers';

test.describe('@DetailedRegression @Regression Delivery Module', () => {
  test('should load every delivery tab', async ({ authenticatedPage }) => {
    for (const route of getSectionRoutes('Delivery')) {
      await openRouteAndAssert(authenticatedPage, route);
    }
  });

  test('should assign, fail, reassign, and complete delivery across the delivery tabs', async ({ authenticatedPage, request }) => {
    const session = await createAdminSession(request);
    const dispatchSeed = await createReadyForDispatchRequest(request, session.accessToken);

    const assignDeliveryRoute = getSectionRoutes('Delivery').find((route) => route.itemId === 'assign-delivery');
    const outForDeliveryRoute = getSectionRoutes('Delivery').find((route) => route.itemId === 'out-for-delivery');
    const deliveryFailedRoute = getSectionRoutes('Delivery').find((route) => route.itemId === 'delivery-failed');
    const deliveredRoute = getSectionRoutes('Delivery').find((route) => route.itemId === 'delivered');
    const deliveryHistoryRoute = getSectionRoutes('Delivery').find((route) => route.itemId === 'delivery-history');
    if (!assignDeliveryRoute || !outForDeliveryRoute || !deliveryFailedRoute || !deliveredRoute || !deliveryHistoryRoute) {
      throw new Error('Delivery routes are incomplete for regression coverage.');
    }

    await openRouteAndAssert(authenticatedPage, assignDeliveryRoute);
    await expectRequestVisible(authenticatedPage, dispatchSeed.requestRecord.requestNumber);
    const assignCard = requestCard(authenticatedPage, dispatchSeed.requestRecord.requestNumber);
    await assignCard.locator('select').first().selectOption({ index: 1 });
    await assignCard.locator('input[type="datetime-local"]').fill('2026-04-06T11:30');
    await assignCard.locator('textarea').fill('Regression delivery assignment notes.');
    await assignCard.getByRole('button', { name: 'Assign Drop' }).click();

    const assigned = await getRequestById(request, session.accessToken, dispatchSeed.requestRecord.id);
    expect(assigned.status).toBe('DELIVERY_ASSIGNED');

    await openRouteAndAssert(authenticatedPage, outForDeliveryRoute);
    await expectRequestVisible(authenticatedPage, dispatchSeed.requestRecord.requestNumber);
    let trackingCard = requestCard(authenticatedPage, dispatchSeed.requestRecord.requestNumber);
    await trackingCard.getByRole('button', { name: 'Mark Out For Delivery' }).click();

    let outForDelivery = await getRequestById(request, session.accessToken, dispatchSeed.requestRecord.id);
    expect(outForDelivery.status).toBe('OUT_FOR_DELIVERY');

    await openRouteAndAssert(authenticatedPage, outForDeliveryRoute);
    trackingCard = requestCard(authenticatedPage, dispatchSeed.requestRecord.requestNumber);
    await trackingCard.getByRole('button', { name: 'Mark Delivery Failed' }).click();

    const deliveryFailed = await getRequestById(request, session.accessToken, dispatchSeed.requestRecord.id);
    expect(deliveryFailed.status).toBe('READY_FOR_DISPATCH');

    await openRouteAndAssert(authenticatedPage, deliveryFailedRoute);
    await expectRequestVisible(authenticatedPage, dispatchSeed.requestRecord.requestNumber);
    const failedCard = requestCard(authenticatedPage, dispatchSeed.requestRecord.requestNumber);
    await failedCard.locator('select').first().selectOption({ index: 1 });
    await failedCard.locator('input[type="datetime-local"]').fill('2026-04-07T12:00');
    await failedCard.locator('textarea').fill('Reassigned after delivery failure regression.');
    await failedCard.getByRole('button', { name: 'Assign Drop' }).click();

    const reassigned = await getRequestById(request, session.accessToken, dispatchSeed.requestRecord.id);
    expect(reassigned.status).toBe('DELIVERY_ASSIGNED');

    await openRouteAndAssert(authenticatedPage, outForDeliveryRoute);
    trackingCard = requestCard(authenticatedPage, dispatchSeed.requestRecord.requestNumber);
    await trackingCard.getByRole('button', { name: 'Mark Out For Delivery' }).click();

    outForDelivery = await getRequestById(request, session.accessToken, dispatchSeed.requestRecord.id);
    expect(outForDelivery.status).toBe('OUT_FOR_DELIVERY');

    await openRouteAndAssert(authenticatedPage, outForDeliveryRoute);
    trackingCard = requestCard(authenticatedPage, dispatchSeed.requestRecord.requestNumber);
    await trackingCard.getByRole('button', { name: 'Mark Delivered' }).click();

    const delivered = await getRequestById(request, session.accessToken, dispatchSeed.requestRecord.id);
    expect(delivered.status).toBe('DELIVERED');

    await openRouteAndAssert(authenticatedPage, deliveredRoute);
    await expectRequestVisible(authenticatedPage, dispatchSeed.requestRecord.requestNumber);

    await openRouteAndAssert(authenticatedPage, deliveryHistoryRoute);
    await expectRequestVisible(authenticatedPage, dispatchSeed.requestRecord.requestNumber);
  });
});

