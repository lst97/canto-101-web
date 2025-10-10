import type { ReactElement } from 'react';
import { z } from 'zod';

import { LexiconSearchBase } from './LexiconSearchBase.tsx';

const PronunciationQuerySchema = z.object({
	query: z
		.string()
		.trim()
		.min(1, { message: 'cantoLyr.errors.pron.missingQuery' })
		.max(4, { message: 'cantoLyr.errors.lexicon.tooLong' })
		.regex(/^[023459]+$/, { message: 'cantoLyr.errors.lexicon.invalidDigits' }),
});

export function LexiconPronunciationSearch(): ReactElement {
	return (
		<LexiconSearchBase
			kind="pron"
			querySchema={PronunciationQuerySchema}
			groupSize={50}
			inputProps={{
				inputMode: 'numeric',
				pattern: '[023459]*',
				autoCapitalize: 'off',
				autoCorrect: 'off',
			}}
		/>
	);
}

export default LexiconPronunciationSearch;
