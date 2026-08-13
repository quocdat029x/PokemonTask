import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, shareReplay, switchMap } from 'rxjs/operators';
import { PokemonStore } from './pokemon.store';
import { SEARCH_DEBOUNCE_MS } from '../../common/constants/app.constants';
import { Pokemon } from '../models/pokemon.model';

/**
 * Derived Pokédex streams.
 *
 * Search uses the canonical typeahead pipeline —
 * `debounceTime(300) → distinctUntilChanged → switchMap` — so a faster-typed
 * term cancels the previous in-flight projection. The list+type are combined
 * inside switchMap via `combineLatest`, and the result is shared with
 * `shareReplay(1)` so multiple subscribers don't recompute.
 */
@Injectable({ providedIn: 'root' })
export class PokemonSelectors {
  private readonly store = inject(PokemonStore);

  private readonly searchTerm$ = new BehaviorSubject<string>('');
  private readonly typeFilter$ = new BehaviorSubject<string>('all');

  /** Current search term (un-debounced) — used to drive the Empty state. */
  readonly searchTerm = this.searchTerm$.asObservable();
  /** Current type filter. */
  readonly typeFilter = this.typeFilter$.asObservable();

  /** Push a new search term into the typeahead pipeline. */
  setSearch(term: string): void {
    this.searchTerm$.next(term);
  }

  /** Push a new type filter. */
  setType(type: string): void {
    this.typeFilter$.next(type);
  }

  /** Distinct Pokémon types present in the cache — powers the filter dropdown. */
  readonly types$: Observable<string[]> = this.store.pokemon$.pipe(
    map((list) => Array.from(new Set(list.flatMap((p) => p.types))).sort()),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** Search- and type-filtered Pokémon list. */
  readonly filtered$: Observable<Pokemon[]> = this.searchTerm$.pipe(
    debounceTime(SEARCH_DEBOUNCE_MS),
    distinctUntilChanged(),
    switchMap((term) =>
      combineLatest([this.store.pokemon$, this.typeFilter$]).pipe(
        map(([list, type]) => filterPokemon(list, term, type)),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}

/** Filter Pokémon by name substring (case-insensitive) and/or exact type. */
export function filterPokemon(list: Pokemon[], term: string, type: string): Pokemon[] {
  const needle = term.trim().toLowerCase();
  return list.filter((p) => {
    const nameMatch = !needle || p.name.toLowerCase().includes(needle);
    const typeMatch = type === 'all' || p.types.includes(type);
    return nameMatch && typeMatch;
  });
}
