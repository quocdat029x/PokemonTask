import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { DEFAULT_TRAINER_ID } from '../../common/constants/app.constants';
import { TeamStore } from '../state/team.store';
import { PokemonStore } from '../../pokedex/state/pokemon.store';
import { Pokemon } from '../../pokedex/models/pokemon.model';
import {
  AUTOCOMPLETE_DEBOUNCE_MS,
  MAX_TEAM_NAME,
  MAX_TEAM_POKEMON,
  MIN_TEAM_NAME,
  MIN_TEAM_POKEMON,
  TEAM_NAME_DEBOUNCE_MS,
} from '../constants/team.constants';

/**
 * Async validator: a team name must be unique among existing teams.
 *
 * Debounced via `timer` — Angular cancels the previous pending async
 * validation on each keystroke, so only the final value (after typing pauses)
 * is checked. Exported so it can be unit-tested in isolation.
 */
export function uniqueTeamNameValidator(store: TeamStore, debounceMs = TEAM_NAME_DEBOUNCE_MS): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = ((control.value ?? '') as string).trim();
    if (value.length < MIN_TEAM_NAME) {
      return of(null); // let sync validators handle short input
    }
    // Debounced uniqueness check: `debounceTime` holds the check until typing
    // pauses, and Angular cancels the previous pending async validation on each
    // keystroke — so only the final value is compared against existing names.
    return of(value).pipe(
      debounceTime(debounceMs),
      map(() => (store.existingNames.includes(value.toLowerCase()) ? { nameTaken: true } : null)),
    );
  };
}

/**
 * Team builder (Reactive Forms).
 *
 * - Name: required, 3–30 chars, async unique-validator (debounced).
 * - Pokémon picker: typeahead autocomplete against the cached list;
 *   selected Pokémon shown as removable chips (min 1, max 6).
 * - Inline validation errors respecting dirty/touched state.
 * - On submit: optimistic create via the team store.
 */
@Component({
  selector: 'app-team-builder',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './team-builder.component.html',
  styleUrl: './team-builder.component.scss',
})
export class TeamBuilderComponent {
  private readonly store = inject(TeamStore);
  private readonly pokemonStore = inject(PokemonStore);
  private readonly fb = inject(FormBuilder);

  protected readonly MIN_NAME = MIN_TEAM_NAME;
  protected readonly MAX_NAME = MAX_TEAM_NAME;
  protected readonly MAX_POKEMON = MAX_TEAM_POKEMON;
  protected readonly MIN_POKEMON = MIN_TEAM_POKEMON;

  readonly form = this.fb.nonNullable.group({
    name: [
      '',
      {
        validators: [
          Validators.required,
          Validators.minLength(MIN_TEAM_NAME),
          Validators.maxLength(MAX_TEAM_NAME),
        ],
        asyncValidators: [uniqueTeamNameValidator(this.store)],
      },
    ],
  });

  /** Typeahead input (separate from the submitted form). */
  readonly searchControl = new FormControl('');

  private readonly suggestions$ = this.searchControl.valueChanges.pipe(
    startWith(''),
    debounceTime(AUTOCOMPLETE_DEBOUNCE_MS),
    distinctUntilChanged(),
    map((term) => this.searchPokemon((term ?? '').toString())),
  );
  protected readonly suggestions = toSignal(this.suggestions$, { initialValue: [] as Pokemon[] });

  /** Current typeahead term (drives the autocomplete Empty state). */
  protected readonly searchTerm = toSignal(
    this.searchControl.valueChanges.pipe(
      startWith(''),
      map((v) => (v ?? '').toString()),
    ),
    { initialValue: '' },
  );

  /** Selected Pokémon shown as chips. */
  protected readonly selected = signal<Pokemon[]>([]);

  /** Form status as a signal (for a reactive submit button). */
  private readonly formStatus = toSignal(
    this.form.statusChanges.pipe(startWith(this.form.status)),
    { initialValue: this.form.status },
  );

  protected readonly canSubmit = computed(() => {
    const count = this.selected().length;
    return this.formStatus() === 'VALID' && count >= MIN_TEAM_POKEMON && count <= MAX_TEAM_POKEMON;
  });

  protected get nameCtrl() {
    return this.form.controls.name;
  }

  protected addSelected(pokemon: Pokemon): void {
    if (this.selected().length >= MAX_TEAM_POKEMON) return;
    if (this.selected().some((s) => s.id === pokemon.id)) return;
    this.selected.update((list) => [...list, pokemon]);
    this.searchControl.setValue('');
  }

  protected removeSelected(id: number): void {
    this.selected.update((list) => list.filter((p) => p.id !== id));
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.selected().length < MIN_TEAM_POKEMON) {
      this.form.markAllAsTouched();
      return;
    }
    this.store.createTeam({
      trainer_id: DEFAULT_TRAINER_ID,
      name: this.form.controls.name.value.trim(),
      pokemon_ids: this.selected().map((p) => p.id),
    });
    this.selected.set([]);
    this.form.reset();
  }

  private searchPokemon(term: string): Pokemon[] {
    const needle = term.trim().toLowerCase();
    if (!needle) return [];
    return this.pokemonStore.snapshot.pokemon
      .filter((p) => p.name.toLowerCase().includes(needle) || String(p.id) === needle)
      .slice(0, 8);
  }
}
