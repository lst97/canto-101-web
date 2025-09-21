import { useState, useCallback } from "react";
import { useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { ZodError } from "zod";

import { api } from "@/lib/api";
import type { AppError } from "@/types/errors";
import {
  querySchemaByKind,
  responseSchemaByKind,
  type LyricSearchResponse,
  type LyricsPronunciationQuery,
  type LyricsRhymeQuery,
  type SearchPronunciationQuery,
  type SearchResponse,
  type SearchRhymeQuery,
} from "@/lib/schemas/lexicon";

// Type of lexicon search we support
export type LexiconSearchKind =
  | { kind: "pron" }
  | { kind: "rhyme" }
  // Future extension for lyrics (pronunciation-based line search)
  | { kind: "lyrics-pron"; filters?: LyricsPronFilters }
  | { kind: "lyrics-rhyme"; filters?: LyricsRhymeFilters };

// Shared option base
interface BaseOptions {
  mode: string; // 'all' sentinel
  pageSize: string; // controlled input, converted to number
}

interface PronOptions extends BaseOptions {
  prefix: boolean;
}

type RhymeOptions = BaseOptions;

// Placeholder advanced filters for lyrics (not yet wired to UI)
export interface LyricsPronFilters {
  position?: string; // numeric
  themes?: string; // comma separated
  keywords?: string;
  lyricist?: string;
  artist?: string;
  id?: string;
  sentiment?: string;
  year?: string; // numeric
}
export interface LyricsRhymeFilters extends Omit<LyricsPronFilters, "position"> {
  rhymePosition?: string;
}

type OptionsState = PronOptions | RhymeOptions | (BaseOptions & Record<string, unknown>);

type QueryParams =
  | SearchPronunciationQuery
  | SearchRhymeQuery
  | LyricsPronunciationQuery
  | LyricsRhymeQuery;

type SearchResult = SearchResponse | LyricSearchResponse;

type NormalizedQueryError = AppError;

export interface UseLexiconSearchResult {
  kind: LexiconSearchKind["kind"];
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

type SearchKind = LexiconSearchKind["kind"];

const QUERY_KEY_PREFIX = "lexicon-search";

function createDefaultOptions(kind: SearchKind): OptionsState {
  if (kind === "pron") {
    return { mode: "all", pageSize: "25", prefix: false } satisfies PronOptions;
  }
  if (kind === "rhyme") {
    return { mode: "all", pageSize: "25" } satisfies RhymeOptions;
  }
  return { mode: "all", pageSize: "25" } satisfies BaseOptions;
}

function createQueryKey(kind: SearchKind, snapshot: SearchSnapshot | null): QueryKey {
  if (!snapshot) {
    return [QUERY_KEY_PREFIX, kind, "idle"];
  }
  return [QUERY_KEY_PREFIX, kind, snapshot.query, snapshot.page, snapshot.params];
}

function resolveEndpoint(kind: SearchKind): string {
  if (kind === "pron") return "/lexicon/search/pronunciation";
  if (kind === "rhyme") return "/lexicon/search/rhyme";
  if (kind === "lyrics-pron") return "/lyrics/search/pronunciation";
  return "/lyrics/search/rhyme";
}

function buildParams(kind: SearchKind, snapshot: SearchSnapshotBase): QueryParams {
  const params: Record<string, unknown> = {};
  const trimmedQuery = snapshot.query.trim();

  if (kind === "pron" || kind === "lyrics-pron") {
    params.p = trimmedQuery;
  }
  if (kind === "rhyme" || kind === "lyrics-rhyme") {
    params.r = trimmedQuery;
  }

  const mode = (snapshot.options as BaseOptions).mode;
  if (mode && mode !== "all") {
    params.mode = mode;
  }

  const pageSizeValue = Number((snapshot.options as BaseOptions).pageSize);
  if (!Number.isNaN(pageSizeValue) && pageSizeValue > 0) {
    params.pageSize = pageSizeValue;
    params.offset = snapshot.page * pageSizeValue;
  }

  if (kind === "pron" && "prefix" in snapshot.options && (snapshot.options as PronOptions).prefix) {
    params.prefix = true;
  }

  // TODO: lyrics-pron and lyrics-rhyme filters when UI exposes them.
  const schema = querySchemaByKind[kind];
  return schema.parse(params);
}

function defaultValidationMessage(kind: SearchKind): string {
  return kind === "rhyme" || kind === "lyrics-rhyme"
    ? "cantoLyr.errors.rhyme.missingQuery"
    : "cantoLyr.errors.pron.missingQuery";
}

function extractValidationMessage(error: unknown, kind: SearchKind): string {
  if (error instanceof ZodError && error.issues.length > 0) {
    return error.issues[0]?.message ?? defaultValidationMessage(kind);
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Validation failed";
}

async function fetchLexicon(kind: SearchKind, snapshot: SearchSnapshot): Promise<SearchResult> {
  const response = await api.get<unknown>(resolveEndpoint(kind), {
    params: snapshot.params,
  });
  try {
    const schema = responseSchemaByKind[kind];
    return schema.parse(response.data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw {
        kind: "unexpected",
        message: "Invalid server response",
        cause: error,
      } satisfies AppError;
    }
    throw error;
  }
}

/**
 * Unified hook for pronunciation or rhyme lexicon search.
 * TODO (lyrics integration): Extend to a third kind 'lyrics-pron' | 'lyrics-rhyme' that adds
 * advanced filters (position/rhymePosition, themes, keywords, lyricist, artist, id, sentiment,
 * year, offset) and pagination support. Consider splitting base params builder + specialized
 * composer functions or using a small strategy map keyed by kind.
 */
export function useLexiconSearch(kindInput: LexiconSearchKind): UseLexiconSearchResult {
  const kind = kindInput.kind;
  const [query, setQueryState] = useState<string>("");
  const [options, setOptions] = useState<OptionsState>(() => createDefaultOptions(kind));
  const [page, setPageState] = useState<number>(0);
  const [submitted, setSubmitted] = useState<SearchSnapshot | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const setQuery = useCallback((value: string) => {
    setValidationError(null);
    setQueryState(value);
  }, [setValidationError]);

  const updateOption = useCallback((key: string, value: unknown) => {
    setValidationError(null);
    setOptions(prev => ({ ...prev, [key]: value }));
  }, [setValidationError]);

  const baseQueryKey = createQueryKey(kind, submitted);

  const searchQuery = useQuery<SearchResult, NormalizedQueryError>({
    queryKey: baseQueryKey,
    queryFn: () => {
      if (!submitted) {
        throw {
          message: "Query attempted without snapshot",
          kind: "unexpected",
        } as NormalizedQueryError;
      }
      return fetchLexicon(kind, submitted);
    },
    enabled: submitted !== null,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    retry: false,
    meta: {
      description: "Fetch lexicon search results",
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
    setQuery("");
    setOptions(createDefaultOptions(kind));
    void queryClient.removeQueries({ queryKey: [QUERY_KEY_PREFIX, kind] });
  }, [kind, queryClient, setQuery]);

  const setPage = useCallback(
    (nextPage: number) => {
      setSubmitted(prev => {
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
          void queryClient.prefetchQuery({
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
    [kind, queryClient, setValidationError],
  );

  const error = validationError ?? (searchQuery.error ? searchQuery.error.message : null);
  const loading = submitted !== null && (searchQuery.isPending || searchQuery.isFetching || searchQuery.isRefetching);
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
