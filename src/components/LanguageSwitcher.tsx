import { CN, HK, JP, US } from 'country-flag-icons/react/3x2';
import { Languages } from 'lucide-react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { log } from '../lib/logger.ts';
import { useI18nLoadingStore } from '../stores/i18nLoadingStore.ts';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select.tsx';

export const LanguageSwitcher = () => {
	const { i18n, t } = useTranslation();
	const startLoading = useI18nLoadingStore((state) => state.startLoading);

	const MIN_LOADING_DURATION_MS = 320;

	const languages = [
		{ code: 'en', name: t('language.english'), flag: US },
		{ code: 'zh', name: t('language.chineseTraditional'), flag: HK },
		{ code: 'cn', name: t('language.chineseSimplified'), flag: CN },
		{ code: 'ja', name: t('language.japanese'), flag: JP },
	];

	const handleLanguageChange = useCallback(
		(languageCode: string) => {
			if (languageCode === i18n.language) {
				return;
			}

			startLoading(MIN_LOADING_DURATION_MS);
			void i18n.changeLanguage(languageCode).catch((error: unknown) => {
				log.error('language change failed', {
					error,
					languageCode,
				});
			});
		},
		[i18n, startLoading],
	);

	return (
		<div className="flex items-center gap-2">
			<Languages className="h-4 w-4" />
			<Select value={i18n.language} onValueChange={handleLanguageChange}>
				<SelectTrigger className="w-[140px]">
					<SelectValue
						placeholder={t('language.selectLanguage', 'Select language')}
					/>
				</SelectTrigger>
				<SelectContent>
					{languages.map((lang) => (
						<SelectItem key={lang.code} value={lang.code}>
							<div className="flex items-center gap-2">
								<lang.flag className="h-4 w-6" />
								{lang.name}
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};
