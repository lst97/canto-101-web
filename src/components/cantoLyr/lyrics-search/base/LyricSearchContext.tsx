import type { PropsWithChildren } from 'react';
import { LyricSearchContext } from './lyricSearchContextCore';
import type { LyricSearchContextValue } from './lyricSearchContextCore';

export function LyricSearchProvider({
  value,
  children,
}: PropsWithChildren<{ value: LyricSearchContextValue }>) {
  return (
    <LyricSearchContext.Provider value={value}>
      {children}
    </LyricSearchContext.Provider>
  );
}
