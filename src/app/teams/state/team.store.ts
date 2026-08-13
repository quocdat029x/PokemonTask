import { DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeamApiService } from '../services/team-api.service';
import { LoggerService } from '../../core/services/logger.service';
import { friendlyErrorMessage } from '../../common/utils/error.util';
import { AsyncStatus } from '../../common/models/async.model';
import { CreateTeamInput, Team } from '../models/team.model';
import { SELECTED_TEAM_KEY } from '../constants/team.constants';

interface TeamState {
  teams: Team[];
  status: AsyncStatus;
  error: string | null;
}

const INITIAL_STATE: TeamState = { teams: [], status: 'idle', error: null };

/** Transient mutation notification shown by the toast component. */
export interface Toast {
  kind: 'success' | 'error';
  message: string;
}

/** Monotonic negative id for optimistically-inserted teams. */
let tempIdSeq = -1;
function nextTempId(): number {
  return tempIdSeq--;
}

/**
 * Team store with optimistic create/delete + rollback.
 *
 * Mutations update the list immediately; on server failure the previous
 * snapshot is restored and an error toast is emitted. The selected-team id is
 * persisted to localStorage via an `effect()` (Signals requirement). No
 * subscription leaks: every API call is tied to the store's `DestroyRef`.
 */
@Injectable({ providedIn: 'root' })
export class TeamStore {
  private readonly api = inject(TeamApiService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly state$ = new BehaviorSubject<TeamState>(INITIAL_STATE);

  readonly teams$ = this.state$.pipe(
    map((s) => s.teams),
    distinctUntilChanged(),
  );
  readonly status$ = this.state$.pipe(
    map((s) => s.status),
    distinctUntilChanged(),
  );
  readonly error$ = this.state$.pipe(
    map((s) => s.error),
    distinctUntilChanged(),
  );

  /** Toast notifications for mutation outcomes. */
  readonly toast = signal<Toast | null>(null);

  /** Currently selected team id (persisted to localStorage). */
  readonly selectedTeamId = signal<number | null>(this.readSelectedTeam());

  get snapshot(): TeamState {
    return this.state$.value;
  }

  /** Existing team names — used by the async unique-name validator. */
  get existingNames(): string[] {
    return this.state$.value.teams
      .filter((t) => t.id >= 0) // exclude optimistic temp teams
      .map((t) => t.name.toLowerCase());
  }

  constructor() {
    // Persist the selected team id whenever it changes.
    effect(() => {
      const id = this.selectedTeamId();
      this.writeSelectedTeam(id);
    });
  }

  /** Select (or clear) the highlighted team. */
  selectTeam(id: number | null): void {
    this.selectedTeamId.set(id);
  }

  /** Load all teams for the default trainer. */
  load(): void {
    this.patch({ status: 'loading', error: null });
    this.api
      .getTeams$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (teams) => this.patch({ teams, status: 'success', error: null }),
        error: (err) => {
          this.logger.error('TeamStore.load failed', { error: err });
          this.patch({ status: 'error', error: friendlyErrorMessage(err) });
        },
      });
  }

  /** Retry the last load. */
  retry(): void {
    this.load();
  }

  /**
   * Optimistically create a team.
   * Inserts a temporary entry immediately, then swaps in the server record on
   * success or rolls back + toasts on failure.
   */
  createTeam(input: CreateTeamInput): void {
    const previous = this.snapshot.teams;
    const tempId = nextTempId();
    const optimistic: Team = {
      id: tempId,
      trainer_id: input.trainer_id,
      name: input.name,
      pokemon_ids: [...input.pokemon_ids],
      created_at: new Date().toISOString(),
    };
    this.patch({ teams: [optimistic, ...previous] });

    this.api
      .createTeam$(input)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => {
          this.patch({
            teams: this.snapshot.teams.map((t) => (t.id === tempId ? created : t)),
          });
          this.emitToast('success', `Team "${input.name}" created.`);
        },
        error: (err) => {
          this.logger.error('createTeam failed', { error: err });
          this.patch({ teams: previous }); // rollback
          this.emitToast('error', `Failed to create "${input.name}". ${friendlyErrorMessage(err)}`);
        },
      });
  }

  /**
   * Optimistically delete a team.
   * Removes the entry immediately, restores + toasts on failure.
   */
  deleteTeam(id: number): void {
    const previous = this.snapshot.teams;
    const removed = previous.find((t) => t.id === id);
    if (!removed) return;
    this.patch({ teams: previous.filter((t) => t.id !== id) });
    if (this.selectedTeamId() === id) this.selectedTeamId.set(null);

    this.api
      .deleteTeam$(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.emitToast('success', `Team "${removed.name}" deleted.`),
        error: (err) => {
          this.logger.error('deleteTeam failed', { error: err });
          this.patch({ teams: previous }); // rollback
          this.emitToast('error', `Failed to delete "${removed.name}". ${friendlyErrorMessage(err)}`);
        },
      });
  }

  /** Clear the current toast (called by the toast component on dismiss). */
  dismissToast(): void {
    this.toast.set(null);
  }

  private emitToast(kind: Toast['kind'], message: string): void {
    this.toast.set({ kind, message });
  }

  private patch(partial: Partial<TeamState>): void {
    this.state$.next({ ...this.state$.value, ...partial });
  }

  private readSelectedTeam(): number | null {
    try {
      const raw = localStorage.getItem(SELECTED_TEAM_KEY);
      const parsed = raw ? Number(raw) : null;
      return parsed == null || Number.isNaN(parsed) ? null : parsed;
    } catch {
      return null;
    }
  }

  private writeSelectedTeam(id: number | null): void {
    try {
      if (id == null) localStorage.removeItem(SELECTED_TEAM_KEY);
      else localStorage.setItem(SELECTED_TEAM_KEY, String(id));
    } catch {
      /* ignore storage failures (private mode, quota) */
    }
  }
}
