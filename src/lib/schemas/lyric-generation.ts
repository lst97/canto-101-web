import { z } from 'zod';

const PatternSlotSchema = z.object({
	id: z.string(),
	toneDigit: z.string(),
	posTag: z.string(),
	description: z.string(),
	retrievalPrompt: z.string(),
});

const LinePatternSchema = z.object({
	id: z.string(),
	patternString: z.string(),
	groups: z.array(z.string()),
	slots: z.array(PatternSlotSchema),
});

const CandidatePoolStatsSchema = z.object({
	total: z.number().int().nonnegative(),
	semanticCount: z.number().int().nonnegative(),
	freqTopCount: z.number().int().nonnegative(),
	freqRandomCount: z.number().int().nonnegative(),
});

const LineCandidateSchema = z.object({
	text: z.string(),
	patternId: z.string(),
});

const LineSentenceSchema = z.object({
	text: z.string(),
	patternId: z.string(),
	finalRank: z.number(),
	mmrScore: z.number(),
});

export const LyricLineResultSchema = z.object({
	lineIndex: z.number().int().nonnegative(),
	toneSequence: z.string(),
	digitSet: z.array(z.string()),
	patterns: z.array(LinePatternSchema),
	candidatePoolStats: CandidatePoolStatsSchema,
	topSentences: z.array(LineSentenceSchema),
	topParagraphCandidates: z.array(z.string()),
	allLineCandidates: z.array(LineCandidateSchema),
	warnings: z.array(z.string()),
	error: z.string().optional(),
});

export const LyricSessionMetaSchema = z.object({
	feature: z.string(),
	version: z.number().int().nonnegative(),
	createdAt: z.string(),
	seed: z.number().int().nonnegative(),
	lineCount: z.number().int().nonnegative(),
	processingTimeMs: z.number().int().nonnegative().optional(),
});

export const LyricGenerationResponseSchema = z.object({
	meta: LyricSessionMetaSchema,
	lines: z.array(LyricLineResultSchema),
	topOutputs: z.array(z.string()).optional(),
});

export type LyricGenerationResponse = z.infer<
	typeof LyricGenerationResponseSchema
>;
export type LyricLineResult = z.infer<typeof LyricLineResultSchema>;
export type LyricSessionMeta = z.infer<typeof LyricSessionMetaSchema>;
