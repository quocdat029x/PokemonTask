import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { PokemonStat } from '../models/pokemon.model';
import { STAT_LABELS } from '../constants/pokemon.constants';

const STAT_AXES = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'] as const;
const CENTER = 100;
const RADIUS = 76;

/**
 * Animated SVG radar chart of the 6 base stats.
 *
 * Zero external dependencies. The data polygon is scaled via a CSS transform
 * transition that re-triggers whenever the stats input changes — satisfying the
 * "chart must animate when a different Pokémon is selected" requirement.
 */
@Component({
  selector: 'app-radar-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 200 200" class="radar" role="img" aria-label="Base stats radar chart">
      @for (f of gridFractions; track f) {
        <polygon [attr.points]="ringPoints(f)" class="radar__grid" />
      }
      @for (name of axes; track name; let i = $index) {
        <line
          [attr.x1]="cx"
          [attr.y1]="cy"
          [attr.x2]="axisEnd(i).x"
          [attr.y2]="axisEnd(i).y"
          class="radar__axis"
        />
      }
      <polygon
        [attr.points]="points()"
        class="radar__data"
        [style.transform]="'scale(' + scale() + ')'"
      />
      @for (name of axes; track name; let i = $index) {
        <text
          [attr.x]="labelPos(i).x"
          [attr.y]="labelPos(i).y"
          [attr.text-anchor]="labelPos(i).anchor"
          class="radar__label"
        >
          {{ statLabel(name) }}
        </text>
      }
    </svg>
  `,
  styles: [
    `
      .radar {
        width: 100%;
        max-width: 260px;
        height: auto;
        display: block;
        margin: 0 auto;
      }
      .radar__grid {
        fill: none;
        stroke: rgba(255, 255, 255, 0.08);
        stroke-width: 1;
      }
      .radar__axis {
        stroke: rgba(255, 255, 255, 0.1);
        stroke-width: 1;
      }
      .radar__data {
        fill: rgba(0, 122, 204, 0.35);
        stroke: var(--color-primary);
        stroke-width: 2;
        transform-origin: 100px 100px;
        transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .radar__label {
        fill: var(--color-secondary);
        font-size: 11px;
        font-weight: 600;
      }
    `,
  ],
})
export class RadarChartComponent {
  /** The 6 base stats to plot. */
  readonly stats = input<PokemonStat[]>([]);
  /** Maximum value used to scale radii (base stats cap at this). */
  readonly max = input<number>(200);

  protected readonly cx = CENTER;
  protected readonly cy = CENTER;
  protected readonly axes = STAT_AXES;
  protected readonly gridFractions = [0.25, 0.5, 0.75, 1];

  /** Scale factor animated 0.6 → 1 on each stats change. */
  protected readonly scale = signal(1);

  /** Data polygon points (scaled by value/max). */
  protected readonly points = computed(() =>
    STAT_AXES.map((_, i) => {
      const value = this.stats().find((s) => s.name === STAT_AXES[i])?.value ?? 0;
      const r = (value / this.max()) * RADIUS;
      return pointAt(i, r);
    }).join(' '),
  );

  constructor() {
    // Re-trigger the grow animation whenever stats change.
    effect(() => {
      this.stats();
      this.scale.set(0.6);
      requestAnimationFrame(() => requestAnimationFrame(() => this.scale.set(1)));
    });
  }

  /** Hexagon grid ring at a fraction of the full radius. */
  protected ringPoints(fraction: number): string {
    return STAT_AXES.map((_, i) => pointAt(i, RADIUS * fraction)).join(' ');
  }

  /** Outer end of axis i (full radius). */
  protected axisEnd(i: number): { x: number; y: number } {
    return vertexAt(i, RADIUS);
  }

  /** Label position just outside axis i, with a sensible text-anchor. */
  protected labelPos(i: number): { x: number; y: number; anchor: string } {
    const v = vertexAt(i, RADIUS + 16);
    const anchor = Math.abs(v.x - CENTER) < 8 ? 'middle' : v.x < CENTER ? 'end' : 'start';
    return { x: v.x, y: v.y + 4, anchor };
  }

  protected statLabel(name: string): string {
    return STAT_LABELS[name] ?? name;
  }
}

/** Vertex coordinates at axis i for a given radius. */
function vertexAt(i: number, radius: number): { x: number; y: number } {
  const angle = (-90 + i * 60) * (Math.PI / 180);
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}

/** "x,y" string at axis i for a given radius. */
function pointAt(i: number, radius: number): string {
  const v = vertexAt(i, radius);
  return `${v.x.toFixed(1)},${v.y.toFixed(1)}`;
}
