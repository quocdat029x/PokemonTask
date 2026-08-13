import { TestBed } from '@angular/core/testing';
import { PokedexTableComponent } from './pokedex-table.component';
import { Pokemon } from '../models/pokemon.model';

function makePokemon(id: number, total = 300): Pokemon {
  return {
    id,
    name: `pokemon-${id}`,
    height: 10,
    weight: 100,
    types: ['normal'],
    spriteUrl: null,
    total,
    stats: [
      { name: 'hp', value: 50 },
      { name: 'attack', value: 50 },
      { name: 'defense', value: 50 },
      { name: 'special-attack', value: 50 },
      { name: 'special-defense', value: 50 },
      { name: 'speed', value: 50 },
    ],
  };
}

describe('PokedexTableComponent — computed pagination + sort', () => {
  it('paginates the list and reports page metadata', () => {
    const fixture = TestBed.configureTestingModule({ imports: [PokedexTableComponent] }).createComponent(
      PokedexTableComponent,
    );
    fixture.componentRef.setInput('pokemon', Array.from({ length: 30 }, (_, i) => makePokemon(i + 1)));
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    expect(comp.total()).toBe(30);
    expect(comp.pageCount()).toBe(2); // 30 / 25
    expect(comp.paged().length).toBe(25); // first page

    comp.next();
    expect(comp.paged().length).toBe(5); // second page
  });

  it('sorts by total asc then desc', () => {
    const fixture = TestBed.configureTestingModule({ imports: [PokedexTableComponent] }).createComponent(
      PokedexTableComponent,
    );
    fixture.componentRef.setInput('pokemon', [makePokemon(1, 300), makePokemon(2, 500), makePokemon(3, 100)]);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    comp.toggleSort('total'); // switch column → asc
    expect(comp.sorted().map((p) => p.total)).toEqual([100, 300, 500]);

    comp.toggleSort('total'); // same column → desc
    expect(comp.sorted().map((p) => p.total)).toEqual([500, 300, 100]);
  });
});
