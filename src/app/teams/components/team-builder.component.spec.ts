import { FormControl, ValidationErrors } from '@angular/forms';
import { firstValueFrom, Observable } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { uniqueTeamNameValidator } from './team-builder.component';
import { TeamStore } from '../state/team.store';

type ValidationResult = ValidationErrors | null;

/**
 * The async unique-name validator is debounced via `timer`. To keep the test
 * fast and deterministic without fighting fake-timer/scheduler interop, we pass
 * a tiny debounce and await the first emission with `firstValueFrom`.
 */
describe('uniqueTeamNameValidator', () => {
  const store = { existingNames: ['kanto starters', 'johto squad'] } as unknown as TeamStore;

  async function validate(value: string): Promise<ValidationResult> {
    const validator = uniqueTeamNameValidator(store, 5);
    return firstValueFrom(validator(new FormControl(value)) as Observable<ValidationResult>);
  }

  it('returns { nameTaken: true } for an existing name', async () => {
    expect(await validate('Kanto Starters')).toEqual({ nameTaken: true });
  });

  it('is case-insensitive', async () => {
    expect(await validate('KANTO STARTERS')).toEqual({ nameTaken: true });
  });

  it('returns null for a unique name', async () => {
    expect(await validate('Brand New Team')).toBeNull();
  });

  it('skips the uniqueness check while the name is too short', async () => {
    expect(await validate('ab')).toBeNull(); // < MIN_TEAM_NAME (3)
  });
});
