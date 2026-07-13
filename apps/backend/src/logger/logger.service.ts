import { Injectable, LoggerService } from '@nestjs/common';

/**
 * SafeSignalLogger is a centralized logger that can be extended
 * to log to external services (e.g., Datadog, CloudWatch).
 */
@Injectable()
export class SafeSignalLogger implements LoggerService {
  private formatMessage(level: string, message: string, context?: string): string {
    const ts = new Date().toISOString();
    const ctx = context ? `[${context}] ` : '';
    return `${ts} ${level} ${ctx}${message}`;
  }

  log(message: string, context?: string) {
    console.log(this.formatMessage('LOG', message, context));
  }

  error(message: string, trace?: string, context?: string) {
    console.error(this.formatMessage('ERR', message, context));
    if (trace) console.error(trace);
  }

  warn(message: string, context?: string) {
    console.warn(this.formatMessage('WRN', message, context));
  }

  debug(message: string, context?: string) {
    console.debug(this.formatMessage('DBG', message, context));
  }
}
