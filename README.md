# Mini Pokédex

A single-page Angular 21 app to browse Pokémon and build teams, backed by GraphQL.
Built for the _Angular Frontend Developer Assessment_.

- **PokéAPI** (public GraphQL) for the Pokémon catalogue (queries + retry).
- **Local mock server** (`json-graphql-server`) for teams CRUD (mutations).
- Custom **RxJS** state stores (no NgRx/Akita) + **Angular Signals** in the view layer.
- Every async view handles **Loading / Empty / Error (+ Retry) / Success**.

---

## Prerequisites

- **Node** 20.19+, 22.12+, or 24
- **npm** 10+

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the mock GraphQL server (teams CRUD) on http://localhost:4000
npm run mock:server

# 3. In another terminal, start the Angular dev server on http://localhost:4200
npm start
```

Open <http://localhost:4200>. The Pokédex page loads first; the Teams page reads/writes
against the mock server on port 4000.

> The Pokémon catalogue comes from the public PokéAPI and needs no key. Only the Teams
> feature depends on the local mock server.

## Scripts

| Script              | Description                                             |
| ------------------- | ------------------------------------------------------- |
| `npm start`         | `ng serve` — dev server with live reload (:4200)        |
| `npm run build`     | Production build into `dist/`                           |
| `npm test`          | Unit tests (Vitest)                                     |
| `npm run mock:server` | `json-graphql-server db.js --port 4000`               |

## Architecture

```
src/app/
├── core/                 # Cross-cutting services
│   └── services/         #   graphql-client.service, logger.service
├── common/               # Shared building blocks
│   ├── components/       #   async-state, skeleton, type-badge, toast, header
│   ├── constants/        #   app.constants (API URLs, retry, page sizes)
│   ├── models/           #   async.model (AsyncStatus)
│   ├── styles/           #   _shared.scss (shimmer + scrollbar mixins)
│   └── utils/            #   error.util (friendly error mapping)
├── pokedex/              # Pokémon feature
│   ├── components/       #   pokedex-page, pokedex-table, pokemon-detail-panel, radar-chart
│   ├── services/         #   pokemon-api.service (PokéAPI)
│   ├── state/            #   pokemon.store + pokemon.selectors (RxJS)
│   ├── models/           #   pokemon.model
│   └── constants/        #   type colors, stat labels
└── teams/                # Team feature
    ├── components/       #   teams-page, team-builder, team-list
    ├── services/         #   team-api.service (mock server)
    ├── state/            #   team.store (optimistic + rollback)
    ├── models/           #   team.model
    └── constants/        #   validation constraints
```

### State management — RxJS stores + Signals

- **`PokemonStore`** / **`TeamStore`** are `BehaviorSubject`-based stores. State is a
  single immutable object; slices are exposed as derived streams with `map` +
  `distinctUntilChanged`.
- **`PokemonSelectors`** derives the filtered list with the canonical typeahead pipeline
  `debounceTime(300) → distinctUntilChanged → switchMap`, combining the list and active
  type filter via `combineLatest`, and shares the result with `shareReplay(1)`.
- **Team mutations are optimistic**: create/delete update the list immediately and roll
  back to the previous snapshot (with an error toast) if the server fails. All API calls
  use `takeUntilDestroyed(destroyRef)` — no subscription leaks.
- **Signals** own view-level state: `signal()` for selection/page/sort, `computed()` for
  derived rows, `effect()` to persist the selected team to `localStorage`, and
  `toSignal()` to bridge store streams into templates. Every component is `standalone`,
  `OnPush`, and uses `inject()` + `input()`/`output()`.

### GraphQL

A thin `GraphqlClientService` POSTs `{ query, variables }` over `HttpClient` and unwraps
`data`. It applies **retry-with-delay** on transport errors only (GraphQL-level errors
are surfaced immediately). Apollo was intentionally avoided to keep the RxJS pipeline —
operators, retry, error handling — explicit and dependency-light.

### UI states (Loading / Empty / Error / Success)

The `AsyncStateComponent` renders the matching state from an `AsyncStatus` input:
skeleton rows while loading, a friendly message + **Retry** button on error, an empty
message when there is no data, and the projected content on success. The Pokédex table,
team list, and detail panel's abilities all go through it.

### Radar chart

A dependency-free animated SVG radar (`RadarChartComponent`) plots the 6 base stats. The
data polygon scales via a CSS transform transition that re-triggers on each new
selection.

## Testing

`npm test` runs Vitest. Coverage includes:

- `team.store.spec` — optimistic create confirmation **and** rollback + error toast.
- `pokedex-table.component.spec` — computed pagination + sort.
- `team-builder.component.spec` — the async unique-name validator.

## Conventions

- Conventional Commits, enforced by **commitlint** + **husky** (`commit-msg` hook).
- Folder structure, naming (`*.component.ts` / `*.service.ts` / `*.model.ts`), BEM SCSS
  with CSS custom-property design tokens, per the project's developer guide.

## Bonus

The **`[appTypeHighlight]` directive** is implemented (one bonus, per the brief).
Pick an attacking type from the Pokédex "Highlight: vs …" dropdown and each row is tinted
by defensive effectiveness — green (super-effective), red (resisted), or dimmed (immune) —
using the full 18-type effectiveness chart in `pokedex/constants/type-effectiveness.ts`.

## What I'd improve with more time

- **PokéAPI pagination**: currently loads the first 151 in one batch for client-side
  filtering; switch to server-side cursor paging for the full catalogue.
- **Virtual scroll** the table (`@angular/cdk/scrolling`) instead of pagination, with
  skeleton rows during incremental loads.
- **Drag-and-drop** Pokémon from the table into team slots (`@angular/cdk/drag-drop`).
- A real GraphQL client (Apollo) with normalized cache + typed codegen, and replace the
  mock server with a persisted backend.
- Broader test coverage: selector streams, the detail-panel stale-response guard, and
  component-level DOM tests for the four UI states.
- Accessibility pass: focus trap + Esc-to-close on the detail panel, ARIA live regions
  for the toast, and keyboard navigation in the autocomplete.
