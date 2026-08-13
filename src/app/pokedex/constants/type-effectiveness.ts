/**
 * Pokémon type-effectiveness chart (Gen VI+, 18 types).
 * For an attacking type, lists defending types it hits super-effectively (2×),
 * not-very-effectively (0.5×), or not at all (0×).
 */
interface Effectiveness {
  super: readonly string[];
  weak: readonly string[];
  immune: readonly string[];
}

export const TYPE_EFFECTIVENESS: Readonly<Record<string, Effectiveness>> = {
  normal: { super: [], weak: ['rock', 'steel'], immune: ['ghost'] },
  fire: { super: ['grass', 'ice', 'bug', 'steel'], weak: ['fire', 'water', 'rock', 'dragon'], immune: [] },
  water: { super: ['fire', 'ground', 'rock'], weak: ['water', 'grass', 'dragon'], immune: [] },
  electric: { super: ['water', 'flying'], weak: ['electric', 'grass', 'dragon'], immune: ['ground'] },
  grass: {
    super: ['water', 'ground', 'rock'],
    weak: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'],
    immune: [],
  },
  ice: { super: ['grass', 'ground', 'flying', 'dragon'], weak: ['fire', 'water', 'ice', 'steel'], immune: [] },
  fighting: {
    super: ['normal', 'ice', 'rock', 'dark', 'steel'],
    weak: ['poison', 'flying', 'psychic', 'bug', 'fairy'],
    immune: ['ghost'],
  },
  poison: { super: ['grass', 'fairy'], weak: ['poison', 'ground', 'rock', 'ghost'], immune: ['steel'] },
  ground: { super: ['fire', 'electric', 'poison', 'rock', 'steel'], weak: ['grass', 'bug'], immune: ['flying'] },
  flying: { super: ['grass', 'fighting', 'bug'], weak: ['electric', 'rock', 'steel'], immune: [] },
  psychic: { super: ['fighting', 'poison'], weak: ['psychic', 'steel'], immune: ['dark'] },
  bug: {
    super: ['grass', 'psychic', 'dark'],
    weak: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'],
    immune: [],
  },
  rock: { super: ['fire', 'ice', 'flying', 'bug'], weak: ['fighting', 'ground', 'steel'], immune: [] },
  ghost: { super: ['psychic', 'ghost'], weak: ['dark'], immune: ['normal'] },
  dragon: { super: ['dragon'], weak: ['steel'], immune: ['fairy'] },
  dark: { super: ['psychic', 'ghost'], weak: ['fighting', 'dark', 'fairy'], immune: [] },
  steel: { super: ['ice', 'rock', 'fairy'], weak: ['fire', 'water', 'electric', 'steel'], immune: [] },
  fairy: { super: ['fighting', 'dragon', 'dark'], weak: ['fire', 'poison', 'steel'], immune: [] },
};

/**
 * Combined effectiveness multiplier of `attacker` against a Pokémon whose
 * types are `defenderTypes` (multiplied across types). Returns 0 (immune),
 * a value < 1 (resisted), 1 (neutral), or > 1 (super-effective).
 */
export function effectivenessMultiplier(
  attacker: string,
  defenderTypes: readonly string[],
): number {
  const chart = TYPE_EFFECTIVENESS[attacker];
  if (!chart) return 1;
  return defenderTypes.reduce((product, defender) => {
    if (chart.immune.includes(defender)) return 0;
    if (chart.super.includes(defender)) return product * 2;
    if (chart.weak.includes(defender)) return product * 0.5;
    return product;
  }, 1);
}
