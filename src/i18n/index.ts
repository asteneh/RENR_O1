import en from './en';
import am from './am';
import { useLanguageStore } from '../store/useLanguageStore';

export type TranslationKey = keyof typeof en;

const translations: Record<string, Record<string, string>> = {
  en,
  am,
};

/**
 * Hook that returns the translation function `t(key)`.
 * Reads the current language from the Zustand store.
 * Falls back to English if a key is missing in the selected language.
 */
export function useTranslation() {
  const language = useLanguageStore((state) => state.language);

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return { t, language };
}

export { en, am };
