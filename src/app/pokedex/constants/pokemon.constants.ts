/** Pokémon feature constants: type colors + stat display labels. */

/** Canonical Pokémon types → badge color. */
export const TYPE_COLORS: Readonly<Record<string, string>> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};

/** Stat API name → short column/chart label. */
export const STAT_LABELS: Readonly<Record<string, string>> = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'Sp.Atk',
  'special-defense': 'Sp.Def',
  speed: 'Spd',
};

/** Color per stat for the radar chart series. */
export function typeColor(type: string | undefined | null): string {
  if (!type) return '#6c757d';
  return TYPE_COLORS[type] ?? '#6c757d';
}
