/** Global application constants. */

/** Public PokéAPI GraphQL endpoint (queries, no auth). */
export const POKEMON_API_URL = 'https://beta.pokeapi.co/graphql/v1beta';

/** Local mock GraphQL endpoint (json-graphql-server on :4000). */
export const MOCK_API_URL = 'http://localhost:4000/graphql';

/** Default trainer id used when creating teams (single-user assessment app). */
export const DEFAULT_TRAINER_ID = 1;

/** HTTP resilience for PokéAPI calls. */
export const API_RETRY_COUNT = 2;
export const API_RETRY_DELAY_MS = 400;

/** Default Pokédex page size (also offered: 10 / 25 / 50). */
export const DEFAULT_PAGE_SIZE = 25;

/** Search input debounce window. */
export const SEARCH_DEBOUNCE_MS = 300;
