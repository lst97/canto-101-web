import type { PropsWithChildren } from 'react';
import type { LyricSearchContextValue } from './lyricSearchContextCore';
import { LyricSearchContext } from './lyricSearchContextCore';

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
