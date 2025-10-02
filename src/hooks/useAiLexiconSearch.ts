import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ZodError } from 'zod';

import { api } from '../lib/api.ts';
import {
  type AiLexiconSearchQuery,
  AiLexiconSearchQuerySchema,
  type AiLexiconSearchResponse,
  AiLexiconSearchResponseSchema,
} from '../lib/schemas/lexicon.ts';
import type { AppError } from '../types/errors.ts';
import { isAppError } from '../types/errors.ts';

export interface UseAiLexiconSearchResult {
  query: string;
  setQuery: (value: string) => void;
  pronunciation: string;
  setPronunciation: (value: string) => void;
  limit: string;
  setLimit: (value: string) => void;
  result: AiLexiconSearchResponse | null;
  loading: boolean;
  error: string | null;
  search: (override?: {
    q: string;
    pronunciation: string;
    limit?: string;
  }) => Promise<void>;
  reset: () => void;
}

export function useAiLexiconSearch(): UseAiLexiconSearchResult {
  const [query, setQuery] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [limit, setLimit] = useState('10');
  const [result, setResult] = useState<AiLexiconSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation<
    AiLexiconSearchResponse,
    AppError,
    AiLexiconSearchQuery
  >({
    mutationFn: async variables => {
      const response = await api.get<unknown>('/lexicon/search/ai', {
        params: variables,
      });
      try {
        return AiLexiconSearchResponseSchema.parse(response.data);
      } catch (cause) {
        if (cause instanceof ZodError) {
          throw {
            kind: 'unexpected',
            message: 'cantoLyr.errors.lexicon.invalidResponse',
            cause,
          } satisfies AppError;
        }
        throw cause;
      }
    },
    onSuccess: data => {
      setResult(data);
      setError(null);
    },
    onError: err => {
      const message =
        typeof err.message === 'string' && err.message.trim().length > 0
          ? err.message
          : 'errors.unexpected.message';
      setError(message);
    },
  });

  const normalizedLimit = useMemo(() => limit.trim(), [limit]);

  const search = useCallback(
    async (override?: { q: string; pronunciation: string; limit?: string }) => {
      const qVal = override?.q ?? query;
      const pronunciationVal = override?.pronunciation ?? pronunciation;
      const limitRaw = (override?.limit ?? normalizedLimit).trim();

      const basePayload: Record<string, unknown> = {
        q: qVal,
        pronunciation: pronunciationVal,
      };
      if (limitRaw.length > 0) {
        basePayload.limit = limitRaw;
      }

      const parsed = AiLexiconSearchQuerySchema.safeParse(basePayload);
      if (!parsed.success) {
        setError(
          parsed.error.issues[0]?.message ??
            'cantoLyr.errors.lexicon.missingQuery'
        );
        return;
      }

      setError(null);
      await mutation.mutateAsync(parsed.data).catch(cause => {
        if (!isAppError(cause)) {
          setError('errors.unexpected.message');
        }
      });
    },
    [mutation, normalizedLimit, pronunciation, query]
  );

  const reset = useCallback(() => {
    setQuery('');
    setPronunciation('');
    setLimit('10');
    setResult(null);
    setError(null);
    mutation.reset();
  }, [mutation]);

  return {
    query,
    setQuery,
    pronunciation,
    setPronunciation,
    limit,
    setLimit,
    result,
    loading: mutation.isPending,
    error,
    search,
    reset,
  };
}

export default useAiLexiconSearch;
