import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';

import en from '../locales/en.json';

// Initialize i18n synchronously with bundled resources first
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .use(
    resourcesToBackend(async (language: string, _namespace: string) => {
      void _namespace; // mark as used to satisfy eslint no-unused-vars
      if (language === 'en') {
        // English is bundled for immediate availability
        return Promise.resolve(en);
      }
      if (language === 'zh') {
        const mod = await import('../locales/zh.json');
        return mod.default || mod;
      }
      if (language === 'ja') {
        const mod = await import('../locales/ja.json');
        return mod.default || mod;
      }
      // Fallback for any other languages - return en as default
      return Promise.resolve(en);
    })
  )
  .init({
    resources: {
      en: { translation: en },
    },
    ns: ['translation'],
    defaultNS: 'translation',
    // Ensure language resolution aligns to our supported base codes
    supportedLngs: ['en', 'zh', 'ja'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    fallbackLng: 'en',
    debug: import.meta.env.VITE_NODE_ENV === 'development',

    // Ensure react components update immediately when language or store changes
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged',
      bindI18nStore: 'added removed loaded',
    },

    // Avoid rendering nulls for missing keys
    returnNull: false,

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

// Preload the detected language asynchronously for better UX
const preloadDetectedLanguage = async () => {
  try {
    const detector = new LanguageDetector();
    const detectedResult = detector.detect();
    const detectedLng = Array.isArray(detectedResult)
      ? detectedResult[0]
      : detectedResult;

    if (detectedLng && detectedLng !== 'en') {
      // Preload the detected language
      if (detectedLng === 'zh') {
        const mod = await import('../locales/zh.json');
        i18n.addResourceBundle(
          detectedLng,
          'translation',
          mod.default || mod,
          true,
          true
        );
      } else if (detectedLng === 'ja') {
        const mod = await import('../locales/ja.json');
        i18n.addResourceBundle(
          detectedLng,
          'translation',
          mod.default || mod,
          true,
          true
        );
      }
    }
  } catch (error) {
    console.warn('Failed to preload detected language:', error);
  }
};

// Start preloading in the background
preloadDetectedLanguage();

// Optional: proactively load resources on language change to ensure UI updates without reload
i18n.on('languageChanged', async lng => {
  try {
    if (!i18n.hasResourceBundle(lng, 'translation')) {
      if (lng === 'en') {
        i18n.addResourceBundle(lng, 'translation', en, true, true);
      } else if (lng === 'ja') {
        const module = await import('../locales/ja.json');
        i18n.addResourceBundle(
          lng,
          'translation',
          module.default || module,
          true,
          true
        );
      } else if (lng === 'zh') {
        const mod = await import('../locales/zh.json');
        i18n.addResourceBundle(
          lng,
          'translation',
          mod.default || mod,
          true,
          true
        );
      }
    }
  } catch (err) {
    console.warn('languageChanged preload failed', err);
  }
});

export default i18n;
