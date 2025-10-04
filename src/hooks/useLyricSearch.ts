import { useCallback, useState } from 'react';
import { type QueryKey, useQuery, useQueryClient } from '@tanstack/react-query';
import { ZodError } from 'zod';

import { api, AppUnexpectedError } from '../lib/api.ts';
import type { AppError } from '../types/errors.ts';
import {
  LyricPronunciationSearchResponseSchema,
  type LyricSearchResponse,
  type LyricsPronunciationQuery,
  LyricsPronunciationQuerySchema,
  type LyricsRhymeQuery,
  LyricsRhymeQuerySchema,
} from '../lib/schemas/lyric.ts';

const querySchemaByKind = {
  'lyrics-pron': LyricsPronunciationQuerySchema,
  'lyrics-rhyme': LyricsRhymeQuerySchema,
};

const responseSchemaByKind = {
  'lyrics-pron': LyricPronunciationSearchResponseSchema,
  'lyrics-rhyme': LyricPronunciationSearchResponseSchema,
};

export type AiLyricSearchKind =
  | { kind: 'lyrics-pron'; filters?: LyricsPronFilters }
  | { kind: 'lyrics-rhyme'; filters?: LyricsRhymeFilters };

interface BaseOptions {
  pageSize: string;
}

export interface LyricsPronFilters {
  position?: string;
  themes?: string;
  keywords?: string;
  lyricist?: string;
  artist?: string;
  sentiment?: string;
  year?: string;
}

export interface LyricsRhymeFilters
  extends Omit<LyricsPronFilters, 'position'> {
  mode?: 'sequence' | 'inclusive';
}

export interface LyricsPronOptions extends BaseOptions {
  position: string;
  themes: string;
  keywords: string;
  lyricist: string;
  artist: string;
  sentiment: string;
  year: string;
}

export interface LyricsRhymeOptions extends BaseOptions {
  rhymePosition: string;
  themes: string;
  keywords: string;
  lyricist: string;
  artist: string;
  sentiment: string;
  year: string;
  mode: 'sequence' | 'inclusive';
}

type OptionsState = LyricsPronOptions | LyricsRhymeOptions;

type QueryParams = LyricsPronunciationQuery | LyricsRhymeQuery;

type SearchResult = LyricSearchResponse;

type NormalizedQueryError = AppError;

export interface UseAiLyricSearchResult {
  kind: AiLyricSearchKind['kind'];
  query: string;
  setQuery: (v: string) => void;
  options: OptionsState;
  updateOption: (k: string, v: unknown) => void;
  loading: boolean;
  error: string | null;
  rawError: AppError | null;
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

type SearchKind = AiLyricSearchKind['kind'];

const QUERY_KEY_PREFIX = 'lyric-search';

function createDefaultOptions(kind: SearchKind): OptionsState {
  if (kind === 'lyrics-pron') {
    return {
      pageSize: '25',
      position: '',
      themes: '',
      keywords: '',
      lyricist: '',
      artist: '',
      sentiment: '',
      year: '',
    } satisfies LyricsPronOptions;
  }
  return {
    pageSize: '25',
    rhymePosition: '',
    themes: '',
    keywords: '',
    lyricist: '',
    artist: '',
    sentiment: '',
    year: '',
    mode: 'inclusive',
  } satisfies LyricsRhymeOptions;
}

function createQueryKey(
  kind: SearchKind,
  snapshot: SearchSnapshot | null
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

function resolveEndpoint(): string {
  return '/lyrics/search';
}

function buildParams(
  kind: SearchKind,
  snapshot: SearchSnapshotBase
): QueryParams {
  const params: Record<string, unknown> = {};
  const trimmedQuery = snapshot.query.trim();

  if (kind === 'lyrics-pron') {
    params.tone = trimmedQuery;
  } else {
    params.rhyme = trimmedQuery;
  }

  const pageSizeValue = Number(snapshot.options.pageSize);
  if (!Number.isNaN(pageSizeValue) && pageSizeValue > 0) {
    params.pageSize = pageSizeValue;
    params.offset = snapshot.page * pageSizeValue;
  }

  if (kind === 'lyrics-pron') {
    const { position, themes, keywords, lyricist, artist, sentiment, year } =
      snapshot.options as LyricsPronOptions;

    if (position.trim()) params.tonePosition = position.trim();
    if (themes.trim()) params.themes = themes.trim();
    if (keywords.trim()) params.keywords = keywords.trim();
    if (lyricist.trim()) params.lyricist = lyricist.trim();
    if (artist.trim()) params.artist = artist.trim();
    if (sentiment.trim()) params.sentiment = sentiment.trim();
    if (year.trim()) params.year = year.trim();
  } else {
    const {
      rhymePosition,
      themes,
      keywords,
      lyricist,
      artist,
      sentiment,
      year,
      mode,
    } = snapshot.options as LyricsRhymeOptions;

    if (rhymePosition.trim()) params.rhymePosition = rhymePosition.trim();
    if (themes.trim()) params.themes = themes.trim();
    if (keywords.trim()) params.keywords = keywords.trim();
    if (lyricist.trim()) params.lyricist = lyricist.trim();
    if (artist.trim()) params.artist = artist.trim();
    if (sentiment.trim()) params.sentiment = sentiment.trim();
    if (year.trim()) params.year = year.trim();

    params.mode = mode;
  }

  const schema = querySchemaByKind[kind];
  return schema.parse(params);
}

function defaultValidationMessage(kind: SearchKind): string {
  return kind === 'lyrics-rhyme'
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

async function fetchLyricSearch(
  kind: SearchKind,
  snapshot: SearchSnapshot
): Promise<SearchResult> {
  const response = await api.get<unknown>(resolveEndpoint(), {
    params: snapshot.params,
  });
  try {
    const schema = responseSchemaByKind[kind];
    return schema.parse(response.data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppUnexpectedError(
        'cantoLyr.errors.lyrics.invalidResponse',
        error
      );
    }
    throw error;
  }
}

export function useAiLyricSearch(
  kindInput: AiLyricSearchKind
): UseAiLyricSearchResult {
  const kind = kindInput.kind;
  const [query, setQueryState] = useState<string>('');
  const [options, setOptions] = useState<OptionsState>(() =>
    createDefaultOptions(kind)
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
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const baseQueryKey = createQueryKey(kind, submitted);

  const searchQuery = useQuery<SearchResult, NormalizedQueryError>({
    queryKey: baseQueryKey,
    queryFn: () => {
      if (!submitted) {
        throw new AppUnexpectedError(
          'cantoLyr.errors.lyrics.queryWithoutSnapshot'
        );
      }
      return fetchLyricSearch(kind, submitted);
    },
    enabled: submitted !== null,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    retry: false,
    meta: {
      description: 'Fetch lyric search results',
    },
  });

  const search = useCallback(async (): Promise<void> => {
    const snapshotBase: SearchSnapshotBase = {
      query,
      options,
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
          queryFn: () => fetchLyricSearch(kind, nextSnapshot),
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
      setSubmitted(prev => {
        if (!prev) return prev;

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
            queryFn: () => fetchLyricSearch(kind, nextSnapshot),
          });
          return nextSnapshot;
        } catch (error) {
          setValidationError(extractValidationMessage(error, kind));
          return prev;
        }
      });
    },
    [kind, queryClient]
  );

  const error =
    validationError ?? (searchQuery.error ? searchQuery.error.message : null);
  const rawError = validationError
    ? null
    : ((searchQuery.error as AppError | null) ?? null);
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
    rawError,
    result,
    search,
    reset,
    page,
    setPage,
  };
}

export default useAiLyricSearch;
