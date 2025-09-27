import type { ReactElement } from 'react';
import { z } from 'zod';

import { LyricSearchBase, type FilterFieldConfig } from './LyricSearchBase.tsx';

const LyricPronunciationQuerySchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, { message: 'cantoLyr.errors.pron.missingQuery' })
    .max(4, { message: 'cantoLyr.errors.lexicon.tooLong' })
    .regex(/^[023459]+$/, { message: 'cantoLyr.errors.lexicon.invalidDigits' }),
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
    key: 'position',
    labelKey: 'cantoLyr.lyricSearch.filters.position.label',
    placeholderKey: 'cantoLyr.lyricSearch.filters.position.placeholder',
    descriptionKey: 'cantoLyr.lyricSearch.filters.position.description',
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

export function LyricPronunciationSearch(): ReactElement {
  return (
    <LyricSearchBase
      kind="lyrics-pron"
      querySchema={LyricPronunciationQuerySchema}
      placeholderKey="cantoLyr.lyricSearch.pron.placeholder"
      resultsLabelKey="cantoLyr.lyricSearch.pron.resultsRegionLabel"
      filterFields={filterFields}
      inputProps={{
        inputMode: 'numeric',
        pattern: '[023459]*',
        autoCapitalize: 'off',
        autoCorrect: 'off',
      }}
    />
  );
}

export default LyricPronunciationSearch;
