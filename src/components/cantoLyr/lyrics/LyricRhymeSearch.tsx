import type { ReactElement } from 'react';
import { z } from 'zod';

import { type FilterFieldConfig, LyricSearchBase } from './LyricSearchBase.tsx';

const LyricRhymeQuerySchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, { message: 'cantoLyr.errors.rhyme.missingQuery' }),
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
  },
  {
    key: 'rhymePosition',
    labelKey: 'cantoLyr.lyricSearch.filters.rhymePosition.label',
    placeholderKey: 'cantoLyr.lyricSearch.filters.rhymePosition.placeholder',
    descriptionKey: 'cantoLyr.lyricSearch.filters.rhymePosition.description',
    inputProps: { type: 'number', inputMode: 'numeric', min: 1, step: 1 },
  },
  {
    key: 'themes',
    labelKey: 'cantoLyr.lyricSearch.filters.themes.label',
    placeholderKey: 'cantoLyr.lyricSearch.filters.themes.placeholder',
  },
  {
    key: 'keywords',
    labelKey: 'cantoLyr.lyricSearch.filters.keywords.label',
    placeholderKey: 'cantoLyr.lyricSearch.filters.keywords.placeholder',
  },
  {
    key: 'lyricist',
    labelKey: 'cantoLyr.lyricSearch.filters.lyricist.label',
    placeholderKey: 'cantoLyr.lyricSearch.filters.lyricist.placeholder',
  },
  {
    key: 'artist',
    labelKey: 'cantoLyr.lyricSearch.filters.artist.label',
    placeholderKey: 'cantoLyr.lyricSearch.filters.artist.placeholder',
  },
  {
    key: 'sentiment',
    labelKey: 'cantoLyr.lyricSearch.filters.sentiment.label',
    placeholderKey: 'cantoLyr.lyricSearch.filters.sentiment.placeholder',
  },
  {
    key: 'year',
    labelKey: 'cantoLyr.lyricSearch.filters.year.label',
    placeholderKey: 'cantoLyr.lyricSearch.filters.year.placeholder',
    inputProps: {
      type: 'number',
      inputMode: 'numeric',
      min: 1900,
      max: 2100,
      step: 1,
    },
  },
];

export function LyricRhymeSearch(): ReactElement {
  return (
    <LyricSearchBase
      kind="lyrics-rhyme"
      querySchema={LyricRhymeQuerySchema}
      placeholderKey="cantoLyr.lyricSearch.rhyme.placeholder"
      resultsLabelKey="cantoLyr.lyricSearch.rhyme.resultsRegionLabel"
      filterFields={filterFields}
      inputProps={{ autoCapitalize: 'off', autoCorrect: 'off' }}
    />
  );
}

export default LyricRhymeSearch;
