import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.tsx';
import { US, HK, CN, JP } from 'country-flag-icons/react/3x2';

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'en', name: t('language.english'), flag: US },
    { code: 'zh', name: t('language.chineseTraditional'), flag: HK },
    { code: 'cn', name: t('language.chineseSimplified'), flag: CN },
    { code: 'ja', name: t('language.japanese'), flag: JP },
  ];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

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
          {languages.map(lang => (
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
