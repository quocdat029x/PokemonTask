import { HttpErrorResponse } from '@angular/common/http';

/**
 * Map a thrown error to a user-friendly message for the Error UI state.
 * Never leaks raw stack traces or internal details.
 */
export function friendlyErrorMessage(error: unknown): string {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'You appear to be offline. Check your connection and retry.';
  }
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Unable to reach the server. Please retry.';
    }
    return `Request failed (status ${error.status}). Please retry.`;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Something went wrong. Please retry.';
}
