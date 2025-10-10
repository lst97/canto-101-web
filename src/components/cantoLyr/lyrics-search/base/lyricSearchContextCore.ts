import { createContext, useContext } from 'react';

export type LyricSearchKind = 'lyrics-pron' | 'lyrics-rhyme';

export type LyricSearchContextValue = {
	kind: LyricSearchKind;
	queryText: string;
};

export const LyricSearchContext = createContext<
	LyricSearchContextValue | undefined
>(undefined);

export function useLyricSearchContext(): LyricSearchContextValue {
	const ctx = useContext(LyricSearchContext);
	if (!ctx) {
		throw new Error(
			'useLyricSearchContext must be used within LyricSearchProvider',
		);
	}
	return ctx;
}
