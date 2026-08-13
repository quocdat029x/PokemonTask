import { DestroyRef, inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PokemonApiService } from '../services/pokemon-api.service';
import { LoggerService } from '../../core/services/logger.service';
import { friendlyErrorMessage } from '../../common/utils/error.util';
import { AsyncStatus } from '../../common/models/async.model';
import { Pokemon } from '../models/pokemon.model';

interface PokemonState {
  pokemon: Pokemon[];
  status: AsyncStatus;
  error: string | null;
}

const INITIAL_STATE: PokemonState = { pokemon: [], status: 'idle', error: null };

/**
 * BehaviorSubject-based Pokédex store.
 *
 * Single source of truth: the cached Pokémon list + load lifecycle
 * (loading/error/success). Derived streams expose slices via
 * `map` + `distinctUntilChanged`.
 */
@Injectable({ providedIn: 'root' })
export class PokemonStore {
  private readonly api = inject(PokemonApiService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly state$ = new BehaviorSubject<PokemonState>(INITIAL_STATE);

  /** Cached Pokémon list. */
  readonly pokemon$ = this.state$.pipe(
    map((s) => s.pokemon),
    distinctUntilChanged(),
  );
  /** Load lifecycle status — drives Loading/Error UI. */
  readonly status$ = this.state$.pipe(
    map((s) => s.status),
    distinctUntilChanged(),
  );
  /** User-friendly error message. */
  readonly error$ = this.state$.pipe(
    map((s) => s.error),
    distinctUntilChanged(),
  );

  get snapshot(): PokemonState {
    return this.state$.value;
  }

  /** Load (or reload) the Pokédex batch, replacing the cache on success. */
  load(limit = 151): void {
    this.patch({ status: 'loading', error: null });
    this.api
      .getPokemonList$(limit, 0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pokemon) => this.patch({ pokemon, status: 'success', error: null }),
        error: (err) => {
          this.logger.error('PokemonStore.load failed', { error: err });
          this.patch({ status: 'error', error: friendlyErrorMessage(err) });
        },
      });
  }

  /** Retry the last load (invoked by the Error-state Retry button). */
  retry(): void {
    this.load();
  }

  /** Cached Pokémon by id, or undefined. */
  getCached(id: number): Pokemon | undefined {
    return this.state$.value.pokemon.find((p) => p.id === id);
  }

  private patch(partial: Partial<PokemonState>): void {
    this.state$.next({ ...this.state$.value, ...partial });
  }
}
