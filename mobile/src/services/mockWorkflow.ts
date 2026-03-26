export type FieldTask = {
  id: string;
  customer: string;
  address: string;
  device: string;
  status: string;
};

export const pickupTasks: FieldTask[] = [
  { id: 'P-101', customer: 'Nisha Verma', address: 'Al Nahda, Dubai', device: 'iPhone 14', status: 'Assigned' },
  { id: 'P-102', customer: 'Omar Khan', address: 'Bur Dubai, Dubai', device: 'Galaxy S23', status: 'Assigned' },
];

export const deliveryTasks: FieldTask[] = [
  { id: 'D-301', customer: 'Omar Khan', address: 'Bur Dubai, Dubai', device: 'Galaxy S23', status: 'Out for delivery' },
];
