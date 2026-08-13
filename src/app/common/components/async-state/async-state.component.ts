import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { AsyncStatus } from '../../../common/models/async.model';

/**
 * Uniform Loading / Empty / Error / Success wrapper.
 *
 * Consumes an `AsyncStatus` and renders the matching state, projecting the
 * host's content for Success (when not empty). The Error state exposes a
 * Retry button via the `retry` output.
 *
 * Usage:
 * ```html
 * <app-async-state [status]="status()" [error]="error()" [isEmpty]="!list().length"
 *                  emptyMessage="No Pokémon match your search."
 *                  (retry)="reload()">
 *   <app-pokedex-table [pokemon]="list()" />
 * </app-async-state>
 * ```
 */
@Component({
  selector: 'app-async-state',
  standalone: true,
  imports: [SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (status()) {
      @case ('loading') {
        <div class="async-state__skeletons" aria-busy="true" aria-live="polite">
          @for (row of rows(); track $index) {
            <app-skeleton [height]="rowHeight()" />
          }
        </div>
      }
      @case ('error') {
        <div class="async-state__error" role="alert">
          <p class="async-state__error-msg">{{ error() || 'Something went wrong.' }}</p>
          <button type="button" class="btn btn--ghost async-state__retry" (click)="retry.emit()">
            Retry
          </button>
        </div>
      }
      @default {
        @if (isEmpty()) {
          <p class="async-state__empty">{{ emptyMessage() }}</p>
        } @else {
          <ng-content />
        }
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .async-state__skeletons {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .async-state__error {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        padding: 24px;
        border: 1px solid rgba(220, 53, 69, 0.4);
        border-radius: 12px;
        background: rgba(220, 53, 69, 0.08);
      }
      .async-state__error-msg {
        margin: 0;
        color: #ffd5da;
      }
      .async-state__empty {
        padding: 32px 16px;
        text-align: center;
        color: var(--color-secondary);
        margin: 0;
      }
    `,
  ],
})
export class AsyncStateComponent {
  /** Async lifecycle status. */
  readonly status = input.required<AsyncStatus>();
  /** User-friendly error message (Error state). */
  readonly error = input<string | null>(null);
  /** Whether the Success data is empty (Empty state). */
  readonly isEmpty = input<boolean>(false);
  /** Message shown in the Empty state. */
  readonly emptyMessage = input<string>('No data found.');
  /** Number of skeleton rows in the Loading state. */
  readonly skeletonRows = input<number>(8);
  /** Skeleton row height (px). */
  readonly rowHeight = input<number>(44);

  /** Emitted when the user clicks Retry. */
  readonly retry = output<void>();

  protected readonly rows = computed(() =>
    Array.from({ length: this.skeletonRows() }),
  );
}
