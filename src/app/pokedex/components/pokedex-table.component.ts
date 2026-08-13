import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { TypeBadgeComponent } from '../../common/components/type-badge/type-badge.component';
import { TypeHighlightDirective } from '../directives/type-highlight.directive';
import { STAT_LABELS } from '../constants/pokemon.constants';
import { Pokemon, statValue } from '../models/pokemon.model';

export type SortField =
  | 'id'
  | 'name'
  | 'hp'
  | 'attack'
  | 'defense'
  | 'special-attack'
  | 'special-defense'
  | 'speed'
  | 'total';

type SortDir = 'asc' | 'desc';

/**
 * Pokédex data table.
 *
 * Self-contained: receives the filtered Pokémon list as an input and owns
 * sort + pagination state as signals, deriving the visible rows with
 * `computed`. Emits the selected Pokémon on row click.
 */
@Component({
  selector: 'app-pokedex-table',
  standalone: true,
  imports: [TypeBadgeComponent, TypeHighlightDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pokedex-table.component.html',
  styleUrl: './pokedex-table.component.scss',
})
export class PokedexTableComponent {
  /** Pre-filtered Pokémon list (search/type applied upstream). */
  readonly pokemon = input.required<Pokemon[]>();
  /** Emitted when a row is clicked. */
  readonly select = output<Pokemon>();

  readonly sortField = signal<SortField>('id');
  readonly sortDir = signal<SortDir>('asc');
  readonly page = signal(0);
  readonly pageSize = signal(25);

  /** Attacking type for the [appTypeHighlight] bonus ('all' = off). */
  readonly highlightType = input<string>('all');

  readonly pageSizes = [10, 25, 50];

  /** Sorted copy of the input list. */
  readonly sorted = computed(() => {
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    const field = this.sortField();
    return [...this.pokemon()].sort((a, b) => {
      const av = sortKey(a, field);
      const bv = sortKey(b, field);
      if (av === bv) return 0;
      return av > bv ? dir : -dir;
    });
  });

  readonly total = computed(() => this.sorted().length);
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly paged = computed(() => {
    const start = this.page() * this.pageSize();
    return this.sorted().slice(start, start + this.pageSize());
  });
  readonly rangeStart = computed(() => (this.total() === 0 ? 0 : this.page() * this.pageSize() + 1));
  readonly rangeEnd = computed(() => Math.min(this.total(), (this.page() + 1) * this.pageSize()));

  constructor() {
    // Keep the current page in range when the dataset/page size shrinks.
    effect(() => {
      const last = this.pageCount() - 1;
      if (this.page() > last) this.page.set(Math.max(0, last));
    });
  }

  /** Toggle sort direction, or switch columns; reset to first page. */
  toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
    this.page.set(0);
  }

  isSorted(field: SortField): boolean {
    return this.sortField() === field;
  }

  sortIndicator(field: SortField): string {
    return this.isSorted(field) ? (this.sortDir() === 'asc' ? '▲' : '▼') : '';
  }

  onPageSizeChange(event: Event): void {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value));
    this.page.set(0);
  }

  prev(): void {
    this.page.update((p) => Math.max(0, p - 1));
  }

  next(): void {
    this.page.update((p) => Math.min(this.pageCount() - 1, p + 1));
  }

  statOf(p: Pokemon, name: string): number {
    return statValue(p, name);
  }

  protected readonly labels = STAT_LABELS;
}

/** Sort key for a Pokémon by the given field. */
function sortKey(p: Pokemon, field: SortField): number | string {
  switch (field) {
    case 'name':
      return p.name;
    case 'total':
      return p.total;
    case 'hp':
    case 'attack':
    case 'defense':
    case 'special-attack':
    case 'special-defense':
    case 'speed':
      return statValue(p, field);
    default:
      return p.id;
  }
}
