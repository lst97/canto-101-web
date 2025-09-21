import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { AppError } from "@/types/errors";

export interface LyricSessionOptions {
  prompt: string;
  toneSequences: string[];
}

export function useLyricSession() {
  const [prompt, setPrompt] = useState("");
  const [toneSequencesInput, setToneSequencesInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation<{ data: unknown }, AppError, LyricSessionOptions>({
    mutationFn: async (vars: LyricSessionOptions) => {
      return api.post(`/lyrics/session`, vars);
    },
    onSuccess: ({ data }) => {
      setResult(JSON.stringify(data, null, 2));
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const generate = useCallback(async (): Promise<void> => {
    const trimmedPrompt = prompt.trim();
    const sequences = toneSequencesInput
      .split(",")
      .map(v => v.trim())
      .filter(v => v.length > 0);

    if (!trimmedPrompt) {
      setError("cantoLyr.errors.lyrics.missingPrompt");
      return;
    }
    if (sequences.length === 0) {
      setError("cantoLyr.errors.lyrics.missingSequences");
      return;
    }
    setError(null);
    setResult(null);
    await mutation.mutateAsync({ prompt: trimmedPrompt, toneSequences: sequences }).catch(() => undefined);
  }, [prompt, toneSequencesInput, mutation]);

  return {
    prompt,
    setPrompt,
    toneSequencesInput,
    setToneSequencesInput,
    result,
    error,
    loading: mutation.isPending,
    generate,
  };
}
