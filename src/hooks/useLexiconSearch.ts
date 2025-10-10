import { type QueryKey, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { ZodError } from 'zod';

import { AppUnexpectedError, api } from '../lib/api.ts';
import {
	type LexiconRhymeSearchVariantsResponse,
	querySchemaByKind,
	responseSchemaByKind,
	type SearchPronunciationQuery,
	type SearchResponse,
	type SearchRhymeQuery,
} from '../lib/schemas/lexicon.ts';
import type { AppError } from '../types/errors.ts';

// Type of lexicon search we support
export type LexiconSearchKind = { kind: 'pron' } | { kind: 'rhyme' };

type EntryTypeOption = 'all' | 'vocab' | 'char';
type PatternModeOption = 'inclusive' | 'sequence' | 'both';

// Shared option base
interface BaseOptions {
	pageSize: string; // controlled input, converted to number
	entryType: EntryTypeOption;
}

interface PronOptions extends BaseOptions {
	prefix: boolean;
}

interface RhymeOptions extends BaseOptions {
	patternMode: PatternModeOption;
}

type OptionsState = PronOptions | RhymeOptions;

type QueryParams = SearchPronunciationQuery | SearchRhymeQuery;

type SearchResult = SearchResponse | LexiconRhymeSearchVariantsResponse;

type NormalizedQueryError = AppError;

export interface UseLexiconSearchResult {
	kind: LexiconSearchKind['kind'];
	query: string;
	setQuery: (v: string) => void;
	options: OptionsState;
	updateOption: (k: string, v: unknown) => void;
	loading: boolean;
	error: string | null;
	result: SearchResult | null;
	search: () => Promise<void>;
	reset: () => void;
	page: number;
	setPage: (p: number) => void;
}

interface SearchSnapshotBase {
	query: string;
	options: OptionsState;
	page: number;
}

interface SearchSnapshot extends SearchSnapshotBase {
	params: QueryParams;
}

type SearchKind = LexiconSearchKind['kind'];

const QUERY_KEY_PREFIX = 'lexicon-search';

function createDefaultOptions(kind: SearchKind): OptionsState {
	if (kind === 'pron') {
		return {
			pageSize: '50',
			entryType: 'all',
			prefix: false,
		} satisfies PronOptions;
	}
	if (kind === 'rhyme') {
		return {
			pageSize: '50',
			entryType: 'all',
			patternMode: 'both',
		} satisfies RhymeOptions;
	}
	return {
		pageSize: '50',
		entryType: 'all',
		patternMode: 'both',
	} satisfies RhymeOptions;
}

function createQueryKey(
	kind: SearchKind,
	snapshot: SearchSnapshot | null,
): QueryKey {
	if (!snapshot) {
		return [QUERY_KEY_PREFIX, kind, 'idle'];
	}
	return [
		QUERY_KEY_PREFIX,
		kind,
		snapshot.query,
		snapshot.page,
		snapshot.params,
	];
}

function resolveEndpoint(kind: SearchKind): string {
	if (kind === 'pron') return '/lexicon/search/pronunciation';
	return '/lexicon/search/rhyme';
}

function buildParams(
	kind: SearchKind,
	snapshot: SearchSnapshotBase,
): QueryParams {
	const params: Record<string, unknown> = {};
	const trimmedQuery = snapshot.query.trim();

	if (kind === 'pron') {
		params.p = trimmedQuery;
	}
	if (kind === 'rhyme') {
		params.r = trimmedQuery;
	}

	const pageSizeValue = Number(snapshot.options.pageSize);
	if (!Number.isNaN(pageSizeValue) && pageSizeValue > 0) {
		params.pageSize = pageSizeValue;
		params.offset = snapshot.page * pageSizeValue;
	}

	if (kind === 'pron') {
		const { entryType, prefix } = snapshot.options as PronOptions;
		if (entryType && entryType !== 'all') {
			params.entryType = entryType;
		}
		if (prefix) {
			params.prefix = true;
		}
	}

	if (kind === 'rhyme') {
		const { entryType, patternMode } = snapshot.options as RhymeOptions;
		const normalizedMode = patternMode ?? 'both';
		params.mode = normalizedMode;
		if (normalizedMode === 'sequence') {
			params.rhymeSequence = true;
		}
		if (normalizedMode === 'inclusive') {
			params.rhymeSequence = false;
		}
		if (entryType && entryType !== 'all') {
			params.entryType = entryType;
		}
	}

	const schema = querySchemaByKind[kind];
	return schema.parse(params);
}

function defaultValidationMessage(kind: SearchKind): string {
	return kind === 'rhyme'
		? 'cantoLyr.errors.rhyme.missingQuery'
		: 'cantoLyr.errors.pron.missingQuery';
}

function extractValidationMessage(error: unknown, kind: SearchKind): string {
	if (error instanceof ZodError && error.issues.length > 0) {
		return error.issues[0]?.message ?? defaultValidationMessage(kind);
	}
	if (error instanceof Error) {
		return error.message;
	}
	return 'Validation failed';
}

async function fetchLexicon(
	kind: SearchKind,
	snapshot: SearchSnapshot,
): Promise<SearchResult> {
	const response = await api.get<unknown>(resolveEndpoint(kind), {
		params: snapshot.params,
	});
	try {
		const schema = responseSchemaByKind[kind];
		return schema.parse(response.data);
	} catch (error) {
		if (error instanceof ZodError) {
			throw new AppUnexpectedError(
				'cantoLyr.errors.lexicon.invalidResponse',
				error,
			);
		}
		throw error;
	}
}

/**
 * Hook for querying the pronunciation or rhyme lexicon endpoints.
 */
export function useLexiconSearch(
	kindInput: LexiconSearchKind,
): UseLexiconSearchResult {
	const kind = kindInput.kind;
	const [query, setQueryState] = useState<string>('');
	const [options, setOptions] = useState<OptionsState>(() =>
		createDefaultOptions(kind),
	);
	const [page, setPageState] = useState<number>(0);
	const [submitted, setSubmitted] = useState<SearchSnapshot | null>(null);
	const [validationError, setValidationError] = useState<string | null>(null);

	const queryClient = useQueryClient();

	const setQuery = useCallback((value: string) => {
		setValidationError(null);
		setQueryState(value);
	}, []);

	const updateOption = useCallback((key: string, value: unknown) => {
		setValidationError(null);
		setOptions((prev) => ({ ...prev, [key]: value }));
	}, []);

	const baseQueryKey = createQueryKey(kind, submitted);

	const searchQuery = useQuery<SearchResult, NormalizedQueryError>({
		queryKey: baseQueryKey,
		queryFn: () => {
			if (!submitted) {
				throw new AppUnexpectedError(
					'cantoLyr.errors.lexicon.queryWithoutSnapshot',
				);
			}
			return fetchLexicon(kind, submitted);
		},
		enabled: submitted !== null,
		staleTime: 1000 * 60,
		gcTime: 1000 * 60 * 5,
		retry: false,
		meta: {
			description: 'Fetch lexicon search results',
		},
	});

	const search = useCallback(async (): Promise<void> => {
		const normalizedOptions: OptionsState = { ...options };
		const snapshotBase: SearchSnapshotBase = {
			query,
			options: normalizedOptions,
			page: 0,
		};

		try {
			const params = buildParams(kind, snapshotBase);
			const nextSnapshot: SearchSnapshot = {
				...snapshotBase,
				query: snapshotBase.query.trim(),
				params,
			};

			setValidationError(null);
			setPageState(0);
			setSubmitted(nextSnapshot);

			await queryClient
				.prefetchQuery({
					queryKey: createQueryKey(kind, nextSnapshot),
					queryFn: () => fetchLexicon(kind, nextSnapshot),
				})
				.catch(() => undefined);
		} catch (error) {
			setValidationError(extractValidationMessage(error, kind));
		}
	}, [kind, options, query, queryClient]);

	const reset = useCallback(() => {
		setValidationError(null);
		setSubmitted(null);
		setPageState(0);
		setQuery('');
		setOptions(createDefaultOptions(kind));
		queryClient.removeQueries({ queryKey: [QUERY_KEY_PREFIX, kind] });
	}, [kind, queryClient, setQuery]);

	const setPage = useCallback(
		(nextPage: number) => {
			setSubmitted((prev) => {
				if (!prev) {
					return prev;
				}

				const nextPageValue = Math.max(0, nextPage);
				const snapshotBase: SearchSnapshotBase = {
					query: prev.query,
					options: prev.options,
					page: nextPageValue,
				};

				try {
					const params = buildParams(kind, snapshotBase);
					const nextSnapshot: SearchSnapshot = {
						...snapshotBase,
						params,
					};
					setValidationError(null);
					setPageState(nextPageValue);
					queryClient.prefetchQuery({
						queryKey: createQueryKey(kind, nextSnapshot),
						queryFn: () => fetchLexicon(kind, nextSnapshot),
					});
					return nextSnapshot;
				} catch (error) {
					setValidationError(extractValidationMessage(error, kind));
					return prev;
				}
			});
		},
		[kind, queryClient],
	);

	const error =
		validationError ?? (searchQuery.error ? searchQuery.error.message : null);
	const loading =
		submitted !== null &&
		(searchQuery.isPending ||
			searchQuery.isFetching ||
			searchQuery.isRefetching);
	const result = searchQuery.data ?? null;

	return {
		kind,
		query,
		setQuery,
		options,
		updateOption,
		loading,
		error,
		result,
		search,
		reset,
		page,
		setPage,
	};
}

export default useLexiconSearch;
