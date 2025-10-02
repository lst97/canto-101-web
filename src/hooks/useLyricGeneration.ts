import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';

import { api } from '../lib/api.ts';
import {
  type LyricGenerationResponse,
  LyricGenerationResponseSchema,
} from '../lib/schemas/lyric-generation.ts';
import type { AppError } from '../types/errors.ts';

export interface LyricSessionOptions {
  prompt: string;
  tones: string[];
  seed?: number;
  top?: number;
  apiKey?: string;
}

export interface UseLyricSessionResult {
  generate: (options: LyricSessionOptions) => Promise<void>;
  reset: () => void;
  result: LyricGenerationResponse | null;
  loading: boolean;
  error: string | null;
  rawError: AppError | null;
}

export function useLyricSession(): UseLyricSessionResult {
  const mutation = useMutation<
    LyricGenerationResponse,
    AppError,
    LyricSessionOptions
  >({
    mutationFn: async vars => {
      const payload: Record<string, unknown> = {
        prompt: vars.prompt,
        tones: vars.tones,
      };
      if (typeof vars.seed === 'number' && Number.isFinite(vars.seed)) {
        payload.seed = vars.seed;
      }
      if (typeof vars.top === 'number' && Number.isFinite(vars.top)) {
        payload.top = vars.top;
      }

      const config: Record<string, unknown> = {};
      const resolvedKey = vars.apiKey?.trim();
      if (resolvedKey) {
        config.headers = {
          'X-Gemini-API-Key': resolvedKey,
        };
      }

      const { data } = await api.post(`/lyrics/generate`, payload, config);
      return LyricGenerationResponseSchema.parse(data);
    },
  });

  const generate = useCallback(
    async (options: LyricSessionOptions): Promise<void> => {
      mutation.reset();
      try {
        await mutation.mutateAsync(options);
      } catch (err) {
        // Swallow the error so consumers can read it from mutation state
        console.error('Lyric session generation failed', err);
      }
    },
    [mutation]
  );

  const reset = useCallback(() => {
    mutation.reset();
  }, [mutation]);

  const resolvedError = mutation.error ? mutation.error.message : null;

  return {
    generate,
    reset,
    result: mutation.data ?? null,
    loading: mutation.isPending,
    error: resolvedError,
    rawError: mutation.error ?? null,
  };
}
