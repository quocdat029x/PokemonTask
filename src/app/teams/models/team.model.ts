/**
 * Team + Trainer domain models.
 * Mirror the local mock server (json-graphql-server) seed in db.js.
 */

export interface Trainer {
  id: number;
  name: string;
  region: string;
  avatar_url: string;
}

export interface Team {
  id: number;
  trainer_id: number;
  name: string;
  pokemon_ids: number[];
  created_at: string;
}

/** Payload accepted by the mock server's `createTeam` mutation. */
export interface CreateTeamInput {
  trainer_id: number;
  name: string;
  pokemon_ids: number[];
}
