import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';

import en from '../locales/en.json';
import { useI18nLoadingStore } from '../stores/i18nLoadingStore.ts';
import { log } from './logger.ts';

// Initialize i18n synchronously with bundled resources first
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .use(
    resourcesToBackend(async (language: string) => {
      if (language === 'en') {
        // English is bundled for immediate availability
        return en;
      }
      if (language === 'zh') {
        const mod = await import('../locales/zh.json');
        return mod.default || mod;
      }
      if (language === 'ja') {
        const mod = await import('../locales/ja.json');
        return mod.default || mod;
      }
      if (language === 'cn') {
        const mod = await import('../locales/cn.json');
        return mod.default || mod;
      }
      // Fallback for any other languages - return en as default
      return en;
    })
  )
  .init({
    resources: {
      en: { translation: en },
    },
    ns: ['translation'],
    defaultNS: 'translation',
    // Ensure language resolution aligns to our supported base codes
    supportedLngs: ['en', 'zh', 'ja', 'cn'],
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
      } else if (detectedLng === 'cn') {
        const mod = await import('../locales/cn.json');
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
    log.warn('Failed to preload detected language', { error });
  }
};

// Start preloading in the background
preloadDetectedLanguage();

// Optional: proactively load resources on language change to ensure UI updates without reload
const finishTranslationLoading = () => {
  const { finishLoading } = useI18nLoadingStore.getState();
  finishLoading();
};

const cancelTranslationLoading = (context?: Record<string, unknown>) => {
  const { cancelLoading } = useI18nLoadingStore.getState();
  cancelLoading();
  if (context) {
    log.warn('Translation loading cancelled', context);
  }
};

i18n.on('languageChanged', async lng => {
  try {
    if (i18n.hasResourceBundle(lng, 'translation')) {
      finishTranslationLoading();
      return;
    }

    if (lng === 'en') {
      i18n.addResourceBundle(lng, 'translation', en, true, true);
      finishTranslationLoading();
      return;
    }

    if (lng === 'ja') {
      const module = await import('../locales/ja.json');
      i18n.addResourceBundle(
        lng,
        'translation',
        module.default || module,
        true,
        true
      );
      finishTranslationLoading();
      return;
    }

    if (lng === 'zh') {
      const mod = await import('../locales/zh.json');
      i18n.addResourceBundle(
        lng,
        'translation',
        mod.default || mod,
        true,
        true
      );
      finishTranslationLoading();
      return;
    }

    if (lng === 'cn') {
      const mod = await import('../locales/cn.json');
      i18n.addResourceBundle(
        lng,
        'translation',
        mod.default || mod,
        true,
        true
      );
      finishTranslationLoading();
      return;
    }

    finishTranslationLoading();
  } catch (err) {
    cancelTranslationLoading({ error: err, language: lng });
  }
});

i18n.on('failedLoading', (lng, ns, msg) => {
  cancelTranslationLoading({ language: lng, namespace: ns, message: msg });
});

export { default } from 'i18next';
