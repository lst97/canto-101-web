import { z } from 'zod';

const entryModeSchema = z.enum(['all', 'vocab', 'char']);

export const SearchPronunciationQuerySchema = z.object({
  p: z.string().trim().min(1, { message: 'cantoLyr.errors.pron.missingQuery' }),
  mode: entryModeSchema.optional(),
  prefix: z.coerce.boolean().optional(),
  pageSize: z.coerce.number().int().min(1).max(20480).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const SearchRhymeQuerySchema = z.object({
  r: z
    .string()
    .trim()
    .min(1, { message: 'cantoLyr.errors.rhyme.missingQuery' }),
  mode: entryModeSchema.optional(),
  pageSize: z.coerce.number().int().min(1).max(20480).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const LyricsPronunciationQuerySchema = z.object({
  tone: z
    .string()
    .trim()
    .min(1, { message: 'cantoLyr.errors.pron.missingQuery' }),
  tonePosition: z.coerce.number().int().positive().optional(),
  themes: z.string().optional(),
  keywords: z.string().optional(),
  lyricist: z.string().optional(),
  artist: z.string().optional(),
  id: z.string().optional(),
  sentiment: z.string().optional(),
  year: z.coerce.number().int().optional(),
  pageSize: z.coerce.number().int().min(1).max(20480).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const LyricsRhymeQuerySchema = z.object({
  rhyme: z
    .string()
    .trim()
    .min(1, { message: 'cantoLyr.errors.rhyme.missingQuery' }),
  rhymePosition: z.coerce.number().int().positive().optional(),
  themes: z.string().optional(),
  keywords: z.string().optional(),
  lyricist: z.string().optional(),
  artist: z.string().optional(),
  id: z.string().optional(),
  sentiment: z.string().optional(),
  year: z.coerce.number().int().optional(),
  pageSize: z.coerce.number().int().min(1).max(20480).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const ReadingItemSchema = z.object({
  id: z.string(),
  entryId: z.string().optional(),
  surface: z.string(),
  type: z.enum(['vocab', 'char']),
  lang: z.string(),
  jyutping: z.array(z.string()),
  tone: z.string(),
  pronunciation: z.string(),
  consonants: z.array(z.string()),
  rhymes: z.array(z.string()),
  syllables: z.number(),
  freq: z.number(),
  pos: z.string(),
  register: z.string(),
  gloss: z.string(),
  source: z.string(),
});

export const SearchResponseSchema = z.object({
  query: z.string(),
  count: z.number().int().nonnegative(),
  items: z.array(ReadingItemSchema),
  fromCache: z.boolean(),
  processingTimeMs: z.number().int().nonnegative(),
});

export const AiLexiconSearchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, { message: 'cantoLyr.errors.lexicon.missingQuery' }),
  pronunciation: z
    .string()
    .trim()
    .min(1, { message: 'cantoLyr.errors.lexicon.missingPronunciation' })
    .max(4, { message: 'cantoLyr.errors.lexicon.tooLong' })
    .regex(/^[023459]+$/, { message: 'cantoLyr.errors.lexicon.invalidDigits' }),
  // UI restricts limit to 1-25; align schema to avoid inconsistent validation.
  limit: z.coerce.number().int().min(1).max(25).optional(),
});

export const AiLexiconSearchItemSchema = z.object({
  id: z.string(),
  surface: z.string(),
  type: z.enum(['vocab', 'char']),
  lang: z.string(),
  jyutping: z.array(z.string()),
  pronunciation: z.string(),
  tone: z.string(),
  consonants: z.array(z.string()),
  rhymes: z.array(z.string()),
  syllables: z.number().int().nonnegative(),
  freq: z.number().optional(),
  pos: z.string().optional(),
  register: z.string().optional(),
  gloss: z.string().optional(),
  source: z.string().optional(),
  similarity: z.number().min(0).max(1),
});

export const AiLexiconSearchResponseSchema = z.object({
  query: z.string(),
  pronunciation: z.string(),
  count: z.number().int().nonnegative(),
  items: z.array(AiLexiconSearchItemSchema),
  fromCache: z.boolean(),
  processingTimeMs: z.number().int().nonnegative(),
});

const LyricPronunciationBigramSchema = z.object({
  value: z.string(),
  position: z.number().int().nonnegative(),
});

const MatchedSyllableSchema = z.object({
  position: z.number().int().nonnegative(),
  jyutping: z.string(),
  jyutpingNormalized: z.string().min(1).nullable().optional(),
  consonant: z.string().min(1).nullable().optional(),
  rhyme: z.string().min(1).nullable().optional(),
  toneRaw: z.number().int().nullable().optional(),
  toneDigit: z.number().int().nullable().optional(),
});

export const LyricSongSchema = z.object({
  id: z.string(),
  docId: z.string(),
  title: z.string(),
  year: z.number().int().nullable(),
  artists: z.array(z.string()).optional(),
  lyricists: z.array(z.string()).optional(),
});

const LyricTokenSchema = z.object({
  position: z.number().int().nonnegative(),
  text: z.string(),
  pos: z.string().nullable().optional(),
  syllables: z.array(MatchedSyllableSchema).optional(),
});

export const LyricLineSchema = z.object({
  id: z.string(),
  lyricId: z.string(),
  song: LyricSongSchema,
  text: z.string(),
  lineIndex: z.number().int().nonnegative(),
  charCount: z.number().int().nonnegative(),
  syllableCount: z.number().int().nonnegative(),
  tokenCount: z.number().int().nonnegative(),
  tonePatternText: z.string(),
  pronunciationBigrams: z.array(LyricPronunciationBigramSchema).optional(),
  matchedSyllables: z.array(MatchedSyllableSchema).optional(),
  tokens: z.array(LyricTokenSchema).optional(),
  syntaxNotes: z.string().nullable().optional(),
  sentiment: z.string().nullable().optional(),
  themes: z.array(z.string()).optional().nullable(),
  keywords: z.array(z.string()).optional().nullable(),
});

export const LyricSearchResponseSchema = z.object({
  query: z.string(),
  count: z.number().int().nonnegative(),
  items: z.array(LyricLineSchema),
  fromCache: z.boolean(),
  processingTimeMs: z.number().int().nonnegative(),
});

export const LyricFilterOptionsSchema = z.object({
  themes: z.array(z.string()),
  keywords: z.array(z.string()),
  lyricists: z.array(z.string()),
  artists: z.array(z.string()),
  years: z.array(z.number().int()),
  sentiments: z.array(z.string()),
});

export const LyricFilterOptionsResponseSchema = z.object({
  options: LyricFilterOptionsSchema,
  fromCache: z.boolean(),
  fetchedAt: z.string(),
});

export const querySchemaByKind = {
  pron: SearchPronunciationQuerySchema,
  rhyme: SearchRhymeQuerySchema,
  'lyrics-pron': LyricsPronunciationQuerySchema,
  'lyrics-rhyme': LyricsRhymeQuerySchema,
} as const;

export const responseSchemaByKind = {
  pron: SearchResponseSchema,
  rhyme: SearchResponseSchema,
  'lyrics-pron': LyricSearchResponseSchema,
  'lyrics-rhyme': LyricSearchResponseSchema,
} as const;

export type SearchPronunciationQuery = z.infer<
  typeof SearchPronunciationQuerySchema
>;
export type SearchRhymeQuery = z.infer<typeof SearchRhymeQuerySchema>;
export type LyricsPronunciationQuery = z.infer<
  typeof LyricsPronunciationQuerySchema
>;
export type LyricsRhymeQuery = z.infer<typeof LyricsRhymeQuerySchema>;
export type ReadingItem = z.infer<typeof ReadingItemSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type AiLexiconSearchQuery = z.infer<typeof AiLexiconSearchQuerySchema>;
export type AiLexiconSearchItem = z.infer<typeof AiLexiconSearchItemSchema>;
export type AiLexiconSearchResponse = z.infer<
  typeof AiLexiconSearchResponseSchema
>;
export type LyricLine = z.infer<typeof LyricLineSchema>;
export type LyricSearchResponse = z.infer<typeof LyricSearchResponseSchema>;
export type MatchedSyllable = z.infer<typeof MatchedSyllableSchema>;
export type LyricFilterOptions = z.infer<typeof LyricFilterOptionsSchema>;
export type LyricFilterOptionsResponse = z.infer<
  typeof LyricFilterOptionsResponseSchema
>;

export type LyricToken = z.infer<typeof LyricTokenSchema>;
