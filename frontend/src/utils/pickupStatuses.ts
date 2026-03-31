export const pickupRunnerPendingStatuses = ['PICKUP_ASSIGNED', 'PICKUP_IN_PROGRESS'] as const;
export const pickupCustomerUpdateStatuses = ['CUSTOMER_NOT_AVAILABLE', 'CUSTOMER_RESCHEDULED', 'CUSTOMER_NOT_CONTACTABLE'] as const;

export type PickupCustomerUpdateStatus = typeof pickupCustomerUpdateStatuses[number];

export const pickupCustomerUpdateOptions: Array<{
  status: PickupCustomerUpdateStatus;
  label: string;
  helper: string;
}> = [
  {
    status: 'CUSTOMER_NOT_AVAILABLE',
    label: 'Customer Not Available',
    helper: 'Use this when the runner reaches the location but the customer is unavailable.',
  },
  {
    status: 'CUSTOMER_RESCHEDULED',
    label: 'Customer Reschedule',
    helper: 'Use this when the customer asks for a different pickup slot or later visit.',
  },
  {
    status: 'CUSTOMER_NOT_CONTACTABLE',
    label: 'Customer Not Contactable',
    helper: 'Use this when the runner cannot reach the customer on the available phone numbers.',
  },
];

export function isPickupRunnerPendingStatus(status: string) {
  return pickupRunnerPendingStatuses.includes(status as typeof pickupRunnerPendingStatuses[number]);
}

export function isPickupCustomerUpdateStatus(status: string) {
  return pickupCustomerUpdateStatuses.includes(status as PickupCustomerUpdateStatus);
}
