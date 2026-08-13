import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Shimmer skeleton placeholder for the Loading UI state.
 * Renders a `.skeleton` block sized by inputs (falls back to CSS defaults).
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="skeleton" [style.height.px]="height()" [style.width.px]="width()"></div>`,
})
export class SkeletonComponent {
  /** Height in CSS pixels (null = CSS default). */
  readonly height = input<number | null>(null);
  /** Width in CSS pixels (null = fill container). */
  readonly width = input<number | null>(null);
}
