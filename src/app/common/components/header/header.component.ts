import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Top navigation header. */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="header">
      <a class="header__brand" routerLink="/pokedex">Mini Pokédex</a>
      <nav class="header__nav">
        <a routerLink="/pokedex" routerLinkActive="active">Pokédex</a>
        <a routerLink="/teams" routerLinkActive="active">Teams</a>
      </nav>
    </header>
  `,
  styles: [
    `
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 20px;
        background: var(--color-surface-2);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        position: sticky;
        top: 0;
        z-index: 30;
      }
      .header__brand {
        font-weight: 800;
        font-size: 16px;
        color: #fff;
        text-decoration: none;
      }
      .header__nav {
        display: flex;
        gap: 6px;
      }
      .header__nav a {
        padding: 6px 12px;
        border-radius: 8px;
        color: var(--color-secondary);
        text-decoration: none;
        font-size: 14px;
        font-weight: 600;
      }
      .header__nav a:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.06);
      }
      .header__nav a.active {
        color: #fff;
        background: var(--color-primary);
      }
    `,
  ],
})
export class HeaderComponent {}
