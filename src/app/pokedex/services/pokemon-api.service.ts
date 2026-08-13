import { inject, Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { GraphqlClientService } from '../../core/services/graphql-client.service';
import { LoggerService } from '../../core/services/logger.service';
import { POKEMON_API_URL } from '../../common/constants/app.constants';
import {
  Ability,
  AbilityApi,
  mapAbilities,
  mapPokemon,
  Pokemon,
  PokemonApi,
} from '../models/pokemon.model';

const GET_POKEMON_LIST_QUERY = /* GraphQL */ `
  query GetPokemon($limit: Int, $offset: Int) {
    pokemon_v2_pokemon(limit: $limit, offset: $offset) {
      id
      name
      height
      weight
      pokemon_v2_pokemontypes {
        pokemon_v2_type {
          name
        }
      }
      pokemon_v2_pokemonstats {
        base_stat
        pokemon_v2_stat {
          name
        }
      }
      pokemon_v2_pokemonsprites {
        sprites
      }
    }
  }
`;

const GET_POKEMON_DETAILS_QUERY = /* GraphQL */ `
  query GetPokemonDetails($id: Int) {
    pokemon_v2_pokemon(where: { id: { _eq: $id } }) {
      id
      name
      height
      weight
      pokemon_v2_pokemontypes {
        pokemon_v2_type {
          name
        }
      }
      pokemon_v2_pokemonstats {
        base_stat
        pokemon_v2_stat {
          name
        }
      }
      pokemon_v2_pokemonsprites {
        sprites
      }
    }
    pokemon_v2_pokemonability(where: { pokemon_id: { _eq: $id } }) {
      is_hidden
      pokemon_v2_ability {
        name
        pokemon_v2_abilityeffecttexts(where: { language_id: { _eq: 9 } }) {
          short_effect
        }
      }
    }
  }
`;

interface PokemonDetailsResponse {
  pokemon_v2_pokemon: PokemonApi[];
  pokemon_v2_pokemonability: AbilityApi[];
}

/** Pokédex read API against the public PokéAPI GraphQL endpoint. */
@Injectable({ providedIn: 'root' })
export class PokemonApiService {
  private readonly gql = inject(GraphqlClientService);
  private readonly logger = inject(LoggerService);

  /** Fetch a page of Pokémon with types, stats, and sprites. */
  getPokemonList$(limit: number, offset: number): Observable<Pokemon[]> {
    return this.gql
      .request<{ pokemon_v2_pokemon: PokemonApi[] }>(POKEMON_API_URL, GET_POKEMON_LIST_QUERY, {
        limit,
        offset,
      })
      .pipe(
        map((data) => data.pokemon_v2_pokemon.map(mapPokemon)),
        catchError((error) => {
          this.logger.error('getPokemonList failed', { error });
          return throwError(() => error);
        }),
      );
  }

  /** Fetch a single Pokémon (stats + types) and its abilities by id. */
  getPokemonDetails$(id: number): Observable<{ pokemon: Pokemon; abilities: Ability[] }> {
    return this.gql
      .request<PokemonDetailsResponse>(POKEMON_API_URL, GET_POKEMON_DETAILS_QUERY, { id })
      .pipe(
        map((data) => {
          const api = data.pokemon_v2_pokemon[0];
          return {
            pokemon: api ? mapPokemon(api) : null,
            abilities: mapAbilities(data.pokemon_v2_pokemonability ?? []),
          } as { pokemon: Pokemon; abilities: Ability[] };
        }),
        catchError((error) => {
          this.logger.error('getPokemonDetails failed', { error, id });
          return throwError(() => error);
        }),
      );
  }
}
