import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { AsyncStateComponent } from '../../common/components/async-state/async-state.component';
import { TeamStore } from '../state/team.store';
import { PokemonStore } from '../../pokedex/state/pokemon.store';

/**
 * Read-only team list with optimistic delete.
 * Loading/empty/error states are delegated to `app-async-state`.
 */
@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [AsyncStateComponent, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './team-list.component.html',
  styleUrl: './team-list.component.scss',
})
export class TeamListComponent {
  private readonly store = inject(TeamStore);
  private readonly pokemonStore = inject(PokemonStore);

  protected readonly teams = toSignal(this.store.teams$, { initialValue: [] as TeamStore['snapshot']['teams'] });
  protected readonly status = toSignal(this.store.status$, { initialValue: 'idle' });
  protected readonly error = toSignal(this.store.error$, { initialValue: null });
  /** Persisted selected team id (highlight + localStorage effect live in the store). */
  protected readonly selectedId = this.store.selectedTeamId;
  /** Tracked so pokemon-name resolution re-renders when the cache loads. */
  private readonly pokemonCache = toSignal(this.pokemonStore.pokemon$, { initialValue: [] });

  select(id: number): void {
    this.store.selectTeam(id);
  }

  remove(id: number): void {
    this.store.deleteTeam(id);
  }

  retry(): void {
    this.store.retry();
  }

  /** Resolve a Pokémon name from the cache, falling back to `#id`. */
  pokemonName(id: number): string {
    this.pokemonCache(); // track for reactivity
    const found = this.pokemonStore.getCached(id);
    return found ? found.name : `#${id}`;
  }
}
