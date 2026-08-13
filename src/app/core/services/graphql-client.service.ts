import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, timer } from 'rxjs';
import { mergeMap, retry } from 'rxjs/operators';
import { API_RETRY_COUNT, API_RETRY_DELAY_MS } from '../../common/constants/app.constants';

interface GraphqlResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

/** Error thrown when the server returns GraphQL-level errors. */
export class GraphqlRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GraphqlRequestError';
  }
}

/**
 * Thin GraphQL-over-HTTP client.
 *
 * POSTs `{ query, variables }` to an endpoint and unwraps `data`. Applies
 * **retry-with-delay** on transient transport errors only (not on
 * GraphQL-level errors, which would just fail again).
 */
@Injectable({ providedIn: 'root' })
export class GraphqlClientService {
  private readonly http = inject(HttpClient);

  /**
   * Execute a GraphQL operation.
   * @param endpoint Absolute GraphQL URL.
   * @param query    GraphQL query/mutation string.
   * @param variables Operation variables.
   * @returns Observable of the unwrapped `data` payload typed as `T`.
   */
  request<T>(
    endpoint: string,
    query: string,
    variables: Record<string, unknown> = {},
  ): Observable<T> {
    return this.http.post<GraphqlResponse<T>>(endpoint, { query, variables }).pipe(
      mergeMap((res) => {
        const firstError = res.errors?.[0];
        if (firstError) {
          return throwError(() => new GraphqlRequestError(firstError.message));
        }
        return of(res.data);
      }),
      retry({
        count: API_RETRY_COUNT,
        delay: (error: unknown) =>
          // Only retry transport-level failures; surface GraphQL errors immediately.
          error instanceof HttpErrorResponse
            ? timer(API_RETRY_DELAY_MS)
            : throwError(() => error),
      }),
    );
  }
}
