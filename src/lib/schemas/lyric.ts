import { z } from 'zod';
import {
  createPaginatedResponseSchema,
  createSearchResponseSchema,
  createVariantsResponseSchema,
} from './api-response';

// ============================================================================
// Query Schemas
// ============================================================================

export const LyricsPronunciationQuerySchema = z.object({
  tone: z
    .string()
    .trim()
    .min(1, { error: 'cantoLyr.errors.pron.missingQuery' }),
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
    .min(1, { error: 'cantoLyr.errors.rhyme.missingQuery' }),
  rhymePosition: z.coerce.number().int().positive().optional(),
  mode: z.enum(['sequence', 'inclusive']).optional(),
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

// ============================================================================
// Domain Schemas
// ============================================================================

export const MatchedSyllableSchema = z.object({
  position: z.number().int().nonnegative(),
  jyutping: z.string(),
  jyutpingNormalized: z.string().min(1).nullable().optional(),
  consonant: z.string().min(1).nullable().optional(),
  rhyme: z.string().min(1).nullable().optional(),
  toneRaw: z.number().int().nullable().optional(),
  toneDigit: z.number().int().nullable().optional(),
  char: z.string().min(1).nullable().optional(),
});

export const LyricPronunciationBigramSchema = z.object({
  value: z.string(),
  position: z.number().int().nonnegative(),
  length: z.number().int().positive(),
  characters: z.string().optional(),
});

export const LyricSongSchema = z.object({
  id: z.string(),
  docId: z.string(),
  title: z.string(),
  year: z.number().int().nullable(),
  artists: z.array(z.string()).optional(),
  lyricists: z.array(z.string()).optional(),
});

export const LyricTokenSchema = z.object({
  position: z.number().int().nonnegative(),
  text: z.string(),
  pos: z.string().nullable().optional(),
  syllables: z.array(MatchedSyllableSchema).optional(),
});

export const LyricRhymeMatchSchema = z.object({
  value: z.string(),
  position: z.number().int().nonnegative(),
  length: z.number().int().positive(),
  characters: z.string().optional(),
});

export const LyricNormalizationSchema = z.object({
  isValid: z.boolean(),
  originalText: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
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
  rhymeMatches: z.array(LyricRhymeMatchSchema).optional(),
  matchedSyllables: z.array(MatchedSyllableSchema).optional(),
  tokens: z.array(LyricTokenSchema).optional(),
  syntaxNotes: z.string().nullable().optional(),
  sentiment: z.string().nullable().optional(),
  themes: z.array(z.string()).optional().nullable(),
  keywords: z.array(z.string()).optional().nullable(),
  normalization: LyricNormalizationSchema.optional(),
});

export const LyricFilterOptionsSchema = z.object({
  themes: z.array(z.string()),
  keywords: z.array(z.string()),
  lyricists: z.array(z.string()),
  artists: z.array(z.string()),
  years: z.array(z.number().int()),
  sentiments: z.array(z.string()),
});

export const LyricSearchListSchema =
  createPaginatedResponseSchema(LyricLineSchema);

export const LyricPronunciationSearchResponseSchema =
  createSearchResponseSchema(LyricLineSchema);

export const LyricRhymeSearchVariantsResponseSchema =
  createVariantsResponseSchema(LyricSearchListSchema);

export const LyricFilterOptionsResponseSchema = z.object({
  options: LyricFilterOptionsSchema,
  fromCache: z.boolean(),
  fetchedAt: z.string(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type LyricsPronunciationQuery = z.infer<
  typeof LyricsPronunciationQuerySchema
>;
export type LyricsRhymeQuery = z.infer<typeof LyricsRhymeQuerySchema>;
export type MatchedSyllable = z.infer<typeof MatchedSyllableSchema>;
export type LyricPronunciationBigram = z.infer<
  typeof LyricPronunciationBigramSchema
>;
export type LyricSong = z.infer<typeof LyricSongSchema>;
export type LyricToken = z.infer<typeof LyricTokenSchema>;
export type LyricRhymeMatch = z.infer<typeof LyricRhymeMatchSchema>;
export type LyricNormalization = z.infer<typeof LyricNormalizationSchema>;
export type LyricLine = z.infer<typeof LyricLineSchema>;
export type LyricFilterOptions = z.infer<typeof LyricFilterOptionsSchema>;
export type LyricSearchList = z.infer<typeof LyricSearchListSchema>;
export type LyricSearchResponse = z.infer<
  typeof LyricPronunciationSearchResponseSchema
>;
export type LyricRhymeSearchVariantsResponse = z.infer<
  typeof LyricRhymeSearchVariantsResponseSchema
>;
export type LyricFilterOptionsResponse = z.infer<
  typeof LyricFilterOptionsResponseSchema
>;
