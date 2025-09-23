import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";

import { api } from "../lib/api";
import { LyricGenerationResponseSchema, type LyricGenerationResponse } from "@/lib/schemas/lyric-generation";
import type { AppError } from "@/types/errors";

export interface LyricSessionOptions {
  prompt: string;
  toneSequences: string[];
  seed?: number;
  top?: number;
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
  const mutation = useMutation<LyricGenerationResponse, AppError, LyricSessionOptions>({
    mutationFn: async (vars) => {
      const payload: Record<string, unknown> = {
        prompt: vars.prompt,
        toneSequences: vars.toneSequences,
      };
      if (typeof vars.seed === "number" && Number.isFinite(vars.seed)) {
        payload.seed = vars.seed;
      }
      if (typeof vars.top === "number" && Number.isFinite(vars.top)) {
        payload.top = vars.top;
      }
      const { data } = await api.post(`/lyrics/session`, payload);
      return LyricGenerationResponseSchema.parse(data);
    },
  });

  const generate = useCallback(async (options: LyricSessionOptions): Promise<void> => {
    mutation.reset();
    try {
      await mutation.mutateAsync(options);
    } catch (err) {
      // Swallow the error so consumers can read it from mutation state
      console.error("Lyric session generation failed", err);
    }
  }, [mutation]);

  const reset = useCallback(() => {
    mutation.reset();
  }, [mutation]);

  const resolvedError = mutation.error
    ? mutation.error.message
    : null;

  return {
    generate,
    reset,
    result: mutation.data ?? null,
    loading: mutation.isPending,
    error: resolvedError,
    rawError: mutation.error ?? null,
  };
}
