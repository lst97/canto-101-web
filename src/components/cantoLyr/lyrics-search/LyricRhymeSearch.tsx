import type { ReactElement } from 'react';
import { z } from 'zod';

import { cantonesePinyinTable } from '../../../data/cantonesePinyinTable';

import {
  type FilterFieldConfig,
  type LyricFilterOptionSets,
  LyricSearchBase,
} from './LyricSearchBase.tsx';

const LyricRhymeQuerySchema = z.object({
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
        return (
          rhymes.length > 0 &&
          rhymes.every(rhyme =>
            (cantonesePinyinTable.rhymes as readonly string[]).includes(rhyme)
          )
        );
      },
      {
        message: 'cantoLyr.errors.rhyme.invalidRhyme',
      }
    ),
});

const filterFields: FilterFieldConfig[] = [
  {
    key: 'pageSize',
    labelKey: 'cantoLyr.lyricSearch.filters.pageSize.label',
    descriptionKey: 'cantoLyr.lyricSearch.filters.pageSize.description',
    inputProps: {
      type: 'number',
      inputMode: 'numeric',
      min: 1,
      max: 50,
      step: 1,
    },
    fieldType: 'number',
  },
  {
    key: 'rhymePosition',
    labelKey: 'cantoLyr.lyricSearch.filters.rhymePosition.label',
    placeholderKey: 'cantoLyr.lyricSearch.filters.rhymePosition.placeholder',
    descriptionKey: 'cantoLyr.lyricSearch.filters.rhymePosition.description',
    inputProps: { type: 'number', inputMode: 'numeric', min: 1, step: 1 },
    fieldType: 'number',
  },
  {
    key: 'themes',
    labelKey: 'cantoLyr.lyricSearch.filters.themes.label',
    placeholderKey: 'cantoLyr.lyricSearch.filters.themes.placeholder',
    fieldType: 'multi-select',
  },
  {
    key: 'keywords',
    labelKey: 'cantoLyr.lyricSearch.filters.keywords.label',
    placeholderKey: 'cantoLyr.lyricSearch.filters.keywords.placeholder',
    fieldType: 'multi-select',
  },
  {
    key: 'lyricist',
    labelKey: 'cantoLyr.lyricSearch.filters.lyricist.label',
    placeholderKey: 'cantoLyr.lyricSearch.filters.lyricist.placeholder',
    fieldType: 'single-select',
  },
  {
    key: 'artist',
    labelKey: 'cantoLyr.lyricSearch.filters.artist.label',
    placeholderKey: 'cantoLyr.lyricSearch.filters.artist.placeholder',
    fieldType: 'single-select',
  },
  {
    key: 'sentiment',
    labelKey: 'cantoLyr.lyricSearch.filters.sentiment.label',
    placeholderKey: 'cantoLyr.lyricSearch.filters.sentiment.placeholder',
    fieldType: 'single-select',
  },
  {
    key: 'year',
    labelKey: 'cantoLyr.lyricSearch.filters.year.label',
    placeholderKey: 'cantoLyr.lyricSearch.filters.year.placeholder',
    fieldType: 'single-select',
  },
];

interface LyricRhymeSearchProps {
  filterOptions?: LyricFilterOptionSets;
  filterOptionsLoading?: boolean;
}

export function LyricRhymeSearch({
  filterOptions,
  filterOptionsLoading,
}: LyricRhymeSearchProps = {}): ReactElement {
  return (
    <LyricSearchBase
      kind="lyrics-rhyme"
      querySchema={LyricRhymeQuerySchema}
      placeholderKey="cantoLyr.lyricSearch.rhyme.placeholder"
      resultsLabelKey="cantoLyr.lyricSearch.rhyme.resultsRegionLabel"
      filterFields={filterFields}
      inputProps={{ autoCapitalize: 'off', autoCorrect: 'off' }}
      filterOptions={filterOptions}
      filterOptionsLoading={filterOptionsLoading}
    />
  );
}

export default LyricRhymeSearch;
