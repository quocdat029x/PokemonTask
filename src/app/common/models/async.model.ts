/** Shared async lifecycle status for the four UI states (loading/empty/error/success). */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/** Generic async envelope: status + data + user-friendly error. */
export interface AsyncState<T> {
  data: T | null;
  status: AsyncStatus;
  error: string | null;
}
