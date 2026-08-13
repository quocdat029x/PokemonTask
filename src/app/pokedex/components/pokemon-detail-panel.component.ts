import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncStatus } from '../../common/models/async.model';
import { friendlyErrorMessage } from '../../common/utils/error.util';
import { PokemonApiService } from '../services/pokemon-api.service';
import { Ability, Pokemon } from '../models/pokemon.model';
import { RadarChartComponent } from './radar-chart.component';
import { TypeBadgeComponent } from '../../common/components/type-badge/type-badge.component';
import { SkeletonComponent } from '../../common/components/skeleton/skeleton.component';

/**
 * Slide-in Pokémon detail panel.
 *
 * Owns its abilities fetch (Loading/Empty/Error/Success) and discards stale
 * responses when a different Pokémon is selected mid-flight. The radar chart
 * animates on each new selection.
 */
@Component({
  selector: 'app-pokemon-detail-panel',
  standalone: true,
  imports: [RadarChartComponent, TypeBadgeComponent, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pokemon-detail-panel.component.html',
  styleUrl: './pokemon-detail-panel.component.scss',
})
export class PokemonDetailPanelComponent {
  private readonly api = inject(PokemonApiService);
  private readonly destroyRef = inject(DestroyRef);

  /** Selected Pokémon (null = hidden). */
  readonly pokemon = input<Pokemon | null>(null);
  /** Emitted when the user closes the panel. */
  readonly close = output<void>();

  readonly abilities = signal<Ability[]>([]);
  readonly status = signal<AsyncStatus>('idle');
  readonly error = signal<string | null>(null);

  private requestId = 0;

  constructor() {
    // Load abilities whenever the selection changes.
    effect(() => {
      const p = this.pokemon();
      if (!p) {
        this.reset();
        return;
      }
      this.loadAbilities(p.id);
    });
  }

  /** Retry the last abilities fetch. */
  retry(): void {
    const p = this.pokemon();
    if (p) this.loadAbilities(p.id);
  }

  private loadAbilities(id: number): void {
    const current = ++this.requestId;
    this.status.set('loading');
    this.error.set(null);
    this.api
      .getPokemonDetails$(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (current !== this.requestId) return; // stale
          this.abilities.set(res.abilities);
          this.status.set('success');
        },
        error: (err) => {
          if (current !== this.requestId) return; // stale
          this.error.set(friendlyErrorMessage(err));
          this.status.set('error');
        },
      });
  }

  private reset(): void {
    this.abilities.set([]);
    this.status.set('idle');
    this.error.set(null);
  }
}
