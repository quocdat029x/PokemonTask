import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { TeamStore } from '../../../teams/state/team.store';

/**
 * Toast notifications for mutation outcomes.
 *
 * Reads the team store's `toast` signal. Success toasts auto-dismiss after a
 * short delay; error toasts remain until clicked.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (toast(); as t) {
      <div
        class="toast"
        [class.toast--error]="t.kind === 'error'"
        [class.toast--success]="t.kind === 'success'"
        role="status"
        aria-live="polite"
        (click)="dismiss()"
      >
        {{ t.message }}
      </div>
    }
  `,
  styles: [
    `
      :host {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
      }
      .toast {
        min-width: 240px;
        max-width: 360px;
        padding: 12px 16px;
        border-radius: 10px;
        color: #fff;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        animation: toast-in 0.2s ease;
      }
      .toast--success {
        background: var(--color-success);
      }
      .toast--error {
        background: var(--color-danger);
      }
      @keyframes toast-in {
        from {
          transform: translateY(8px);
          opacity: 0;
        }
      }
    `,
  ],
})
export class ToastComponent {
  private readonly store = inject(TeamStore);

  protected readonly toast = this.store.toast;

  constructor() {
    // Auto-dismiss success toasts after 3s.
    effect(() => {
      const t = this.toast();
      if (t && t.kind === 'success') {
        setTimeout(() => this.store.dismissToast(), 3000);
      }
    });
  }

  protected dismiss(): void {
    this.store.dismissToast();
  }
}
