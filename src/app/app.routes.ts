import { Routes } from '@angular/router';

/** Lazy-loaded top-level routes. */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'pokedex' },
  {
    path: 'pokedex',
    title: 'Pokédex · Mini Pokédex',
    loadComponent: () =>
      import('./pokedex/components/pokedex-page.component').then((m) => m.PokedexPageComponent),
  },
  {
    path: 'teams',
    title: 'Teams · Mini Pokédex',
    loadComponent: () =>
      import('./teams/components/teams-page.component').then((m) => m.TeamsPageComponent),
  },
  { path: '**', redirectTo: 'pokedex' },
];
