import { useQuery } from '@tanstack/react-query';

import { api } from '../lib/api.ts';
import {
  LyricFilterOptionsResponseSchema,
  type LyricFilterOptions,
} from '../lib/schemas/lexicon.ts';
import type { AppError } from '../types/errors.ts';

const QUERY_KEY = ['lyrics', 'filter-options'] as const;

interface LyricFilterOptionsQueryResult {
  data?: LyricFilterOptions;
  fromCache: boolean;
  fetchedAt?: string;
}

async function fetchLyricFilterOptions(): Promise<LyricFilterOptionsQueryResult> {
  const response = await api.get<unknown>('/lyrics/options');
  const parsed = LyricFilterOptionsResponseSchema.parse(response.data);
  return {
    data: parsed.options,
    fromCache: parsed.fromCache,
    fetchedAt: parsed.fetchedAt,
  };
}

export function useLyricFilterOptions() {
  return useQuery<LyricFilterOptionsQueryResult, AppError>({
    queryKey: QUERY_KEY,
    queryFn: fetchLyricFilterOptions,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
