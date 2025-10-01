import type { ReactElement } from 'react';
import { z } from 'zod';

import { cantonesePinyinTable } from '../../../data/cantonesePinyinTable.ts';
import { LexiconSearchBase } from './LexiconSearchBase.tsx';

const RhymeQuerySchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, { message: 'cantoLyr.errors.rhyme.missingQuery' })
    .refine(
      val => {
        const rhymes = val
          .split(',')
          .map(r => r.trim())
          .filter(r => r.length > 0);
        return rhymes.every(rhyme =>
          cantonesePinyinTable.rhymes.includes(
            rhyme as (typeof cantonesePinyinTable.rhymes)[number]
          )
        );
      },
      { message: 'cantoLyr.errors.rhyme.invalidRhyme' }
    ),
});

export function LexiconRhymeSearch(): ReactElement {
  return (
    <LexiconSearchBase
      kind="rhyme"
      querySchema={RhymeQuerySchema}
      groupSize={50}
      inputProps={{ autoCapitalize: 'off', autoCorrect: 'off' }}
    />
  );
}

export default LexiconRhymeSearch;
