import { z } from 'zod';
import {
	createPaginatedResponseSchema,
	createSearchResponseSchema,
	createVariantsResponseSchema,
} from './api-response.ts';

// ============================================================================
// Query Schemas - Lexicon
// ============================================================================

const entryModeSchema = z.enum(['all', 'vocab', 'char']);
const rhymePatternModeSchema = z.enum(['inclusive', 'sequence', 'both']);

export const SearchPronunciationQuerySchema = z.object({
	p: z.string().trim().min(1, { error: 'cantoLyr.errors.pron.missingQuery' }),
	entryType: entryModeSchema.optional(),
	mode: entryModeSchema.optional(),
	prefix: z.coerce.boolean().optional(),
	pageSize: z.coerce.number().int().min(1).max(20480).optional(),
	offset: z.coerce.number().int().min(0).optional(),
});

export const SearchRhymeQuerySchema = z.object({
	r: z.string().trim().min(1, { error: 'cantoLyr.errors.rhyme.missingQuery' }),
	entryType: entryModeSchema.optional(),
	mode: rhymePatternModeSchema.optional(),
	pageSize: z.coerce.number().int().min(1).max(20480).optional(),
	offset: z.coerce.number().int().min(0).optional(),
});

export const AiLexiconSearchQuerySchema = z.object({
	q: z
		.string()
		.trim()
		.min(1, { error: 'cantoLyr.errors.lexicon.missingQuery' }),
	pronunciation: z
		.string()
		.trim()
		.min(1, { error: 'cantoLyr.errors.lexicon.missingPronunciation' })
		.max(4, { error: 'cantoLyr.errors.lexicon.tooLong' })
		.regex(/^[023459]+$/, { error: 'cantoLyr.errors.lexicon.invalidDigits' }),
	// UI restricts limit to 1-25; align schema to avoid inconsistent validation.
	limit: z.coerce.number().int().min(1).max(25).optional(),
});

// ============================================================================
// Domain Schemas - Lexicon
// ============================================================================

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

// ============================================================================
// Response Schemas - Lexicon
// ============================================================================

export const LexiconSearchListSchema =
	createPaginatedResponseSchema(ReadingItemSchema);

export const SearchResponseSchema =
	createSearchResponseSchema(ReadingItemSchema);

export const LexiconRhymeSearchVariantsResponseSchema =
	createVariantsResponseSchema(LexiconSearchListSchema);

export const AiLexiconSearchResponseSchema = z
	.object({
		query: z.string(),
		pronunciation: z.string(),
		count: z.number().int().nonnegative(),
		items: z.array(AiLexiconSearchItemSchema),
	})
	.merge(
		z.object({
			fromCache: z.boolean(),
			processingTimeMs: z.number().int().nonnegative(),
		}),
	);

// ============================================================================
// Schema Maps for Runtime Dispatch
// ============================================================================

// Import lyric schemas for the schema map
import {
	LyricPronunciationSearchResponseSchema,
	LyricRhymeSearchVariantsResponseSchema,
	LyricsPronunciationQuerySchema,
	LyricsRhymeQuerySchema,
} from './lyric.ts';

export const querySchemaByKind = {
	pron: SearchPronunciationQuerySchema,
	rhyme: SearchRhymeQuerySchema,
	'lyrics-pron': LyricsPronunciationQuerySchema,
	'lyrics-rhyme': LyricsRhymeQuerySchema,
} as const;

export const responseSchemaByKind = {
	pron: SearchResponseSchema,
	rhyme: z.union([
		SearchResponseSchema,
		LexiconRhymeSearchVariantsResponseSchema,
	]),
	'lyrics-pron': LyricPronunciationSearchResponseSchema,
	'lyrics-rhyme': z.union([
		LyricPronunciationSearchResponseSchema,
		LyricRhymeSearchVariantsResponseSchema,
	]),
} as const;

// ============================================================================
// Type Exports - Lexicon
// ============================================================================

export type SearchPronunciationQuery = z.infer<
	typeof SearchPronunciationQuerySchema
>;
export type SearchRhymeQuery = z.infer<typeof SearchRhymeQuerySchema>;
export type ReadingItem = z.infer<typeof ReadingItemSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type LexiconSearchList = z.infer<typeof LexiconSearchListSchema>;
export type LexiconRhymeSearchVariantsResponse = z.infer<
	typeof LexiconRhymeSearchVariantsResponseSchema
>;
export type AiLexiconSearchQuery = z.infer<typeof AiLexiconSearchQuerySchema>;
export type AiLexiconSearchItem = z.infer<typeof AiLexiconSearchItemSchema>;
export type AiLexiconSearchResponse = z.infer<
	typeof AiLexiconSearchResponseSchema
>;
