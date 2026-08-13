/** Team builder validation constraints (per spec). */

export const MIN_TEAM_NAME = 3;
export const MAX_TEAM_NAME = 30;

export const MIN_TEAM_POKEMON = 1;
export const MAX_TEAM_POKEMON = 6;

/** Debounce for the async unique-name validator + autocomplete typeahead. */
export const TEAM_NAME_DEBOUNCE_MS = 300;
export const AUTOCOMPLETE_DEBOUNCE_MS = 250;

/** localStorage key for the persisted selected team (effect() demo). */
export const SELECTED_TEAM_KEY = 'pokedex.selectedTeamId';
