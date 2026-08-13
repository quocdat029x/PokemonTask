import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TeamStore } from './team.store';
import { TeamApiService } from '../services/team-api.service';
import { LoggerService } from '../../core/services/logger.service';
import { CreateTeamInput, Team } from '../models/team.model';

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: 1,
    trainer_id: 1,
    name: 'Test',
    pokemon_ids: [25],
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('TeamStore — optimistic create', () => {
  function setup(createFails: boolean): TeamStore {
    const api = {
      getTeams$: () => of([makeTeam({ id: 1, name: 'Existing' })]),
      createTeam$: (input: CreateTeamInput) =>
        createFails
          ? throwError(() => new Error('server down'))
          : of(makeTeam({ id: 99, name: input.name, pokemon_ids: input.pokemon_ids })),
      deleteTeam$: (id: number) => of(id),
    };
    TestBed.configureTestingModule({
      providers: [LoggerService, { provide: TeamApiService, useValue: api }],
    });
    return TestBed.inject(TeamStore);
  }

  it('optimistically adds then confirms a created team', () => {
    const store = setup(false);
    store.createTeam({ trainer_id: 1, name: 'New Squad', pokemon_ids: [6, 9] });

    const teams = store.snapshot.teams;
    expect(teams.length).toBe(1);
    expect(teams[0].id).toBe(99); // server id replaces the optimistic temp id
    expect(teams[0].name).toBe('New Squad');
    expect(store.toast()?.kind).toBe('success');
  });

  it('rolls back and shows an error toast when create fails', () => {
    const store = setup(true);
    store.createTeam({ trainer_id: 1, name: 'Doomed', pokemon_ids: [25] });

    expect(store.snapshot.teams).toEqual([]); // optimistic entry rolled back
    expect(store.toast()?.kind).toBe('error');
  });
});
