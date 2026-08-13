import { describe, expect, it } from 'vitest';
import { effectivenessMultiplier } from './type-effectiveness';

describe('effectivenessMultiplier', () => {
  it('is super-effective (×2) and compounds across types', () => {
    expect(effectivenessMultiplier('fire', ['grass'])).toBe(2);
    expect(effectivenessMultiplier('fire', ['grass', 'steel'])).toBe(4); // 2 × 2
  });

  it('is resisted (×0.5) and compounds across types', () => {
    expect(effectivenessMultiplier('fire', ['water'])).toBe(0.5);
    expect(effectivenessMultiplier('fire', ['fire', 'dragon'])).toBe(0.25); // 0.5 × 0.5
  });

  it('is immune (×0) when any defender type is immune', () => {
    expect(effectivenessMultiplier('normal', ['ghost'])).toBe(0);
    expect(effectivenessMultiplier('ground', ['flying'])).toBe(0);
  });

  it('is neutral (×1) otherwise', () => {
    expect(effectivenessMultiplier('normal', ['normal'])).toBe(1);
  });
});
