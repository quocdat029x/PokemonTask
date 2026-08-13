import { Injectable } from '@angular/core';

/**
 * Minimal application logger. Wraps console so call-sites have a single
 * logging seam (swappable for a remote sink later) and structured context.
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  error(message: string, context?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${message}`, context ?? '');
  }

  warn(message: string, context?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.warn(`[WARN] ${message}`, context ?? '');
  }

  info(message: string, context?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.info(`[INFO] ${message}`, context ?? '');
  }
}
