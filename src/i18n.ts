import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './locales/ar.json';
import en from './locales/en.json';
import es from './locales/es.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import ru from './locales/ru.json';
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';

export interface LanguageOption {
  code: string;
  label: string;
  dir: 'ltr' | 'rtl';
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'zh-CN', label: '简体中文', dir: 'ltr' },
  { code: 'zh-TW', label: '繁體中文', dir: 'ltr' },
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ja', label: '日本語', dir: 'ltr' },
  { code: 'ko', label: '한국어', dir: 'ltr' },
  { code: 'ru', label: 'Русский', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'es', label: 'Español', dir: 'ltr' },
];

export const LANG_STORAGE_KEY = 'jsontool.lang';

function resolveInitialLanguage(): string {
  const saved = localStorage.getItem(LANG_STORAGE_KEY);
  if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
  const nav = navigator.language || 'zh-CN';
  if (nav.toLowerCase().startsWith('zh-tw') || nav.toLowerCase().startsWith('zh-hk')) return 'zh-TW';
  if (nav.toLowerCase().startsWith('zh')) return 'zh-CN';
  const short = nav.slice(0, 2).toLowerCase();
  const matched = LANGUAGES.find((l) => l.code.toLowerCase() === short);
  return matched ? matched.code : 'en';
}

export function applyDocumentLanguage(code: string) {
  const lang = LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
  document.documentElement.lang = lang.code;
  document.documentElement.dir = lang.dir;
}

i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    'zh-TW': { translation: zhTW },
    en: { translation: en },
    ja: { translation: ja },
    ko: { translation: ko },
    ru: { translation: ru },
    ar: { translation: ar },
    es: { translation: es },
  },
  lng: resolveInitialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

applyDocumentLanguage(i18n.language);

export async function changeLanguage(code: string) {
  localStorage.setItem(LANG_STORAGE_KEY, code);
  applyDocumentLanguage(code);
  await i18n.changeLanguage(code);
}

export default i18n;
