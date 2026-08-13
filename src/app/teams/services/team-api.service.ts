import { inject, Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { GraphqlClientService } from '../../core/services/graphql-client.service';
import { LoggerService } from '../../core/services/logger.service';
import { DEFAULT_TRAINER_ID, MOCK_API_URL } from '../../common/constants/app.constants';
import { CreateTeamInput, Team } from '../models/team.model';

const GET_TEAMS_QUERY = /* GraphQL */ `
  query GetTeams {
    allTeams {
      id
      trainer_id
      name
      pokemon_ids
      created_at
    }
  }
`;

// json-graphql-server takes create fields as individual arguments (all required),
// not an `input` object. `created_at` is required by the generated schema.
const CREATE_TEAM_MUTATION = /* GraphQL */ `
  mutation CreateTeam(
    $trainer_id: ID!
    $name: String!
    $pokemon_ids: [Int]!
    $created_at: String!
  ) {
    createTeam(
      trainer_id: $trainer_id
      name: $name
      pokemon_ids: $pokemon_ids
      created_at: $created_at
    ) {
      id
      trainer_id
      name
      pokemon_ids
      created_at
    }
  }
`;

const DELETE_TEAM_MUTATION = /* GraphQL */ `
  mutation DeleteTeam($id: ID!) {
    deleteTeam(id: $id) {
      id
    }
  }
`;

/** Team CRUD against the local mock GraphQL server (json-graphql-server :4000). */
@Injectable({ providedIn: 'root' })
export class TeamApiService {
  private readonly gql = inject(GraphqlClientService);
  private readonly logger = inject(LoggerService);

  /** Fetch all teams for the default trainer. */
  getTeams$(): Observable<Team[]> {
    return this.gql
      .request<{ allTeams: Team[] }>(MOCK_API_URL, GET_TEAMS_QUERY)
      .pipe(
        map((data) => (data.allTeams ?? []).map(normalizeTeam).sort(byNewest)),
        catchError((error) => {
          this.logger.error('getTeams failed', { error });
          return throwError(() => error);
        }),
      );
  }

  /** Create a new team (server assigns the id). */
  createTeam$(input: CreateTeamInput): Observable<Team> {
    const variables = { ...input, created_at: new Date().toISOString() };
    return this.gql
      .request<{ createTeam: Team }>(MOCK_API_URL, CREATE_TEAM_MUTATION, variables)
      .pipe(
        map((data) => normalizeTeam(data.createTeam)),
        catchError((error) => {
          this.logger.error('createTeam failed', { error, input });
          return throwError(() => error);
        }),
      );
  }

  /** Delete a team by id. */
  deleteTeam$(id: number): Observable<number> {
    return this.gql
      .request<{ deleteTeam: { id: string } | null }>(MOCK_API_URL, DELETE_TEAM_MUTATION, { id })
      .pipe(
        map((data) => (data.deleteTeam ? id : -1)),
        catchError((error) => {
          this.logger.error('deleteTeam failed', { error, id });
          return throwError(() => error);
        }),
      );
  }
}

/**
 * json-graphql-server returns `id`/`trainer_id` as strings; coerce to numbers
 * to keep the domain model numeric.
 */
function normalizeTeam(team: Team): Team {
  return {
    ...team,
    id: Number(team.id),
    trainer_id: Number(team.trainer_id),
  };
}

/** Sort teams newest-first by created_at. */
function byNewest(a: Team, b: Team): number {
  return a.created_at < b.created_at ? 1 : -1;
}

export { DEFAULT_TRAINER_ID };
