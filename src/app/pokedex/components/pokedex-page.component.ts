import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AsyncStateComponent } from '../../common/components/async-state/async-state.component';
import { PokedexTableComponent } from './pokedex-table.component';
import { PokemonDetailPanelComponent } from './pokemon-detail-panel.component';
import { PokemonStore } from '../state/pokemon.store';
import { PokemonSelectors } from '../state/pokemon.selectors';
import { Pokemon } from '../models/pokemon.model';

/**
 * Pokédex page: wires the store + selectors to the table, search/type filters,
 * and the detail panel. Bridges RxJS streams into signals via `toSignal`.
 */
@Component({
  selector: 'app-pokedex-page',
  standalone: true,
  imports: [AsyncStateComponent, PokedexTableComponent, PokemonDetailPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pokedex-page.component.html',
})
export class PokedexPageComponent implements OnInit {
  private readonly store = inject(PokemonStore);
  private readonly selectors = inject(PokemonSelectors);

  protected readonly filtered = toSignal(this.selectors.filtered$, { initialValue: [] as Pokemon[] });
  protected readonly status = toSignal(this.store.status$, { initialValue: 'idle' as const });
  protected readonly error = toSignal(this.store.error$, { initialValue: null });
  protected readonly types = toSignal(this.selectors.types$, { initialValue: [] as string[] });
  protected readonly typeFilter = toSignal(this.selectors.typeFilter, { initialValue: 'all' });
  private readonly searchTerm = toSignal(this.selectors.searchTerm, { initialValue: '' });

  protected readonly selected = signal<Pokemon | null>(null);

  /** Empty only when loaded, no matches, and the user actually filtered. */
  protected readonly isEmpty = computed(() => {
    if (this.status() !== 'success') return false;
    if (this.filtered().length > 0) return false;
    return this.searchTerm().trim() !== '' || this.typeFilter() !== 'all';
  });

  ngOnInit(): void {
    if (this.store.snapshot.status === 'idle') {
      this.store.load();
    }
  }

  protected onSearch(event: Event): void {
    this.selectors.setSearch((event.target as HTMLInputElement).value);
  }

  protected onType(event: Event): void {
    this.selectors.setType((event.target as HTMLSelectElement).value);
  }

  protected onSelect(pokemon: Pokemon): void {
    this.selected.set(pokemon);
  }

  protected closePanel(): void {
    this.selected.set(null);
  }

  protected retry(): void {
    this.store.retry();
  }
}
