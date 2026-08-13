/**
 * Pokémon domain + raw API models.
 * Raw models mirror the PokéAPI GraphQL response; domain models are the
 * normalized shapes the UI consumes.
 */

// ── Raw PokéAPI GraphQL shapes ──────────────────────────────────────────────

export interface PokemonApiStat {
  base_stat: number;
  pokemon_v2_stat: { name: string };
}

export interface PokemonApiType {
  pokemon_v2_type: { name: string };
}

export interface PokemonApiSprites {
  /** JSON-encoded sprite map, e.g. {"front_default":"https://..."} */
  sprites: string;
}

export interface PokemonApi {
  id: number;
  name: string;
  height: number;
  weight: number;
  pokemon_v2_pokemontypes: PokemonApiType[];
  pokemon_v2_pokemonstats: PokemonApiStat[];
  pokemon_v2_pokemonsprites: PokemonApiSprites[];
}

export interface AbilityApiEffectText {
  short_effect: string;
}

export interface AbilityApi {
  is_hidden: boolean;
  pokemon_v2_ability: {
    name: string;
    pokemon_v2_abilityeffecttexts: AbilityApiEffectText[];
  };
}

// ── Domain models ───────────────────────────────────────────────────────────

export interface PokemonStat {
  name: string;
  value: number;
}

export interface Pokemon {
  id: number;
  name: string;
  /** decimetres */
  height: number;
  /** hectograms */
  weight: number;
  types: string[];
  stats: PokemonStat[];
  spriteUrl: string | null;
  /** sum of all base stats */
  total: number;
}

export interface Ability {
  name: string;
  shortEffect: string;
  isHidden: boolean;
}

// ── Mappers ─────────────────────────────────────────────────────────────────

/**
 * Normalize a raw PokéAPI record into the domain `Pokemon` model.
 * Parses the JSON sprite string and derives the stat total.
 */
export function mapPokemon(api: PokemonApi): Pokemon {
  const stats: PokemonStat[] = api.pokemon_v2_pokemonstats.map((s) => ({
    name: s.pokemon_v2_stat.name,
    value: s.base_stat,
  }));
  const spriteUrl = parseSpriteUrl(api.pokemon_v2_pokemonsprites?.[0]?.sprites);
  return {
    id: api.id,
    name: api.name,
    height: api.height,
    weight: api.weight,
    types: api.pokemon_v2_pokemontypes.map((t) => t.pokemon_v2_type.name),
    stats,
    spriteUrl,
    total: stats.reduce((sum, s) => sum + s.value, 0),
  };
}

/** Extract the front_default sprite URL from the JSON sprite blob. */
export function parseSpriteUrl(spritesJson: string | undefined): string | null {
  if (!spritesJson) return null;
  try {
    const parsed = JSON.parse(spritesJson) as Record<string, unknown>;
    const front = parsed['front_default'];
    return typeof front === 'string' ? front : null;
  } catch {
    return null;
  }
}

/**
 * Normalize raw ability records into the domain `Ability` model.
 */
export function mapAbilities(records: AbilityApi[]): Ability[] {
  return records.map((a) => ({
    name: a.pokemon_v2_ability.name,
    shortEffect: a.pokemon_v2_ability.pokemon_v2_abilityeffecttexts?.[0]?.short_effect ?? '',
    isHidden: a.is_hidden,
  }));
}

/** Canonical order of the 6 base stats shown in the table + radar chart. */
export const STAT_NAMES = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
] as const;

/** Read a stat value by canonical name, defaulting to 0. */
export function statValue(pokemon: Pokemon, name: string): number {
  return pokemon.stats.find((s) => s.name === name)?.value ?? 0;
}
