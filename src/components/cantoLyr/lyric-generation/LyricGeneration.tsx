import { useCallback } from 'react';
import type { ReactElement } from 'react';

import { LyricGenerationForm, LyricGenerationResults } from '.';
import { useLyricSession } from '../../../hooks/useLyricGeneration.ts';

interface LyricSessionProps {
  apiKey: string;
}

export function LyricSession({ apiKey }: LyricSessionProps): ReactElement {
  const { generate, result, loading, error } = useLyricSession();

  const handleSubmit = useCallback(
    async (options: Parameters<typeof generate>[0]) => {
      const resolvedKey = apiKey.trim();
      if (!resolvedKey) {
        // This shouldn't happen since we disable the form, but just in case
        return;
      }
      await generate({ ...options, apiKey: resolvedKey });
    },
    [generate, apiKey]
  );

  return (
    <div className="space-y-8">
      <LyricGenerationForm
        loading={loading}
        onSubmit={handleSubmit}
        serverError={error}
        disabled={!apiKey}
      />
      {result && <LyricGenerationResults result={result} />}
    </div>
  );
}

export default LyricSession;
