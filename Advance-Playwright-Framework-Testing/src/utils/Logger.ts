export class Logger {
  private constructor(private readonly scope: string) {}

  static create(scope: string) {
    return new Logger(scope);
  }

  info(message: string) {
    console.log(`[${this.scope}] ${message}`);
  }

  success(message: string) {
    console.log(`[${this.scope}] SUCCESS: ${message}`);
  }

  warn(message: string) {
    console.warn(`[${this.scope}] WARN: ${message}`);
  }

  step(number: number, message: string) {
    console.log(`[${this.scope}] Step ${number}: ${message}`);
  }
}
