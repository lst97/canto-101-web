import { CN, HK, JP, US } from 'country-flag-icons/react/3x2';
import type React from 'react';

export type SearchMode = 'key' | 'text';

export const SUPPORTED_LANGUAGES: { code: string; name: string }[] = [
	{ code: 'en', name: 'English' },
	{ code: 'zh', name: '中文' },
	{ code: 'ja', name: '日本語' },
	{ code: 'cn', name: '简体中文' },
];

export const FLAG_COMPONENTS: Record<string, React.ComponentType<unknown>> = {
	en: US as unknown as React.ComponentType<unknown>,
	zh: HK as unknown as React.ComponentType<unknown>,
	ja: JP as unknown as React.ComponentType<unknown>,
	cn: CN as unknown as React.ComponentType<unknown>,
};
