export class DataGenerator {
  static uniqueSuffix() {
    return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  static email(prefix = 'user') {
    return `${prefix}.${this.uniqueSuffix()}@example.test`;
  }

  static phone(prefix = '9') {
    const tail = String(Date.now()).slice(-9);
    return `${prefix}${tail}`.slice(0, 10);
  }

  static postalCode() {
    const tail = String(Date.now()).slice(-5);
    return `4${tail}`.slice(0, 6);
  }

  static imei() {
    const base = String(Date.now()).padStart(14, '8').slice(0, 14);
    const digits = base.split('').map(Number);
    const sum = digits.reduce((total, digit, index) => {
      const position = index + 1;
      if (position % 2 === 0) {
        const doubled = digit * 2;
        return total + Math.floor(doubled / 10) + (doubled % 10);
      }
      return total + digit;
    }, 0);
    const checkDigit = (10 - (sum % 10)) % 10;
    return `${base}${checkDigit}`;
  }

  static futureDateTimeLocal(hoursAhead = 24) {
    const date = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  static shortText(prefix = 'auto') {
    return `${prefix}-${this.uniqueSuffix()}`;
  }
}
