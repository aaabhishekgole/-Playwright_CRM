const currencyInr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const dateIn = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeIn = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatCurrencyInr(value?: number | null) {
  return currencyInr.format(value ?? 0);
}

export function formatDateIn(value?: string | number | Date | null) {
  if (!value) {
    return 'Awaiting update';
  }

  return dateIn.format(new Date(value));
}

export function formatDateTimeIn(value?: string | number | Date | null) {
  if (!value) {
    return 'Awaiting update';
  }

  return dateTimeIn.format(new Date(value));
}
