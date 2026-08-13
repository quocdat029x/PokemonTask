import { Directive, effect, ElementRef, inject, input, Renderer2 } from '@angular/core';
import { effectivenessMultiplier } from '../constants/type-effectiveness';

/**
 * Highlights a host element (table row) as strong / weak / immune relative to
 * a selected attacking type, using the Pokémon type-effectiveness chart.
 *
 * Usage:
 * ```html
 * <tr [appTypeHighlight]="pokemon.types" [highlightType]="selectedType()">...</tr>
 * ```
 * Adds `row--strong` (super-effective), `row--weak` (resisted), or
 * `row--immune` (no effect) to the host.
 */
@Directive({
  selector: '[appTypeHighlight]',
  standalone: true,
})
export class TypeHighlightDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);

  /** Defender (row) Pokémon types. */
  readonly appTypeHighlight = input<readonly string[]>([]);

  /** Attacking type to compare against; `'all'` disables highlighting. */
  readonly highlightType = input<string>('all');

  private currentClass: string | null = null;

  constructor() {
    effect(() => {
      const types = this.appTypeHighlight();
      const attacker = this.highlightType();
      this.apply(null);
      if (!attacker || attacker === 'all') return;

      const multiplier = effectivenessMultiplier(attacker, types);
      if (multiplier === 0) this.apply('row--immune');
      else if (multiplier > 1) this.apply('row--strong');
      else if (multiplier < 1) this.apply('row--weak');
    });
  }

  private apply(cls: string | null): void {
    if (this.currentClass) {
      this.renderer.removeClass(this.host.nativeElement, this.currentClass);
    }
    if (cls) this.renderer.addClass(this.host.nativeElement, cls);
    this.currentClass = cls;
  }
}
