import { useCallback } from 'react';
import type { ReactElement } from 'react';

import { LyricGenerationForm, LyricGenerationResults } from '.';
import { useLyricSession } from '../../../hooks/useLyricGeneration.ts';

export function LyricSession(): ReactElement {
  const { generate, result, loading, error } = useLyricSession();

  const handleSubmit = useCallback(
    async (options: Parameters<typeof generate>[0]) => {
      await generate(options);
    },
    [generate]
  );

  return (
    <div className="space-y-8">
      <LyricGenerationForm
        loading={loading}
        onSubmit={handleSubmit}
        serverError={error}
      />
      {result && <LyricGenerationResults result={result} />}
    </div>
  );
}

export default LyricSession;
