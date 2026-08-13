import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { typeColor } from '../../../pokedex/constants/pokemon.constants';

/**
 * Colored Pokémon type badge. Color is derived from the type name.
 */
@Component({
  selector: 'app-type-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="type-badge" [style.background]="badgeColor()">{{ name() }}</span>`,
  styles: [
    `
      .type-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
        text-transform: capitalize;
        color: #fff;
        line-height: 1.4;
        white-space: nowrap;
      }
    `,
  ],
})
export class TypeBadgeComponent {
  /** Pokémon type name (e.g. "fire", "water"). */
  readonly name = input.required<string>();
  /** Resolved badge color. */
  readonly badgeColor = computed(() => typeColor(this.name()));
}
