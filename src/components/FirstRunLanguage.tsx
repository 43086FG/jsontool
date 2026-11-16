import { useState } from 'react';
import { LANGUAGES, changeLanguage, detectSystemLanguage } from '../i18n';
import { Icon } from './Icon';

/** Short UI copy for the first-run screen, kept next to the language list. */
const COPY: Record<string, { title: string; hint: string; action: string }> = {
  'zh-CN': { title: '选择界面语言', hint: '之后可在设置中随时更改', action: '继续' },
  'zh-TW': { title: '選擇介面語言', hint: '之後可在設定中隨時更改', action: '繼續' },
  en: { title: 'Choose your language', hint: 'You can change this later in Settings', action: 'Continue' },
  ja: { title: '表示言語を選択', hint: '後で設定から変更できます', action: '続ける' },
  ko: { title: '인터페이스 언어 선택', hint: '나중에 설정에서 변경할 수 있습니다', action: '계속' },
  ru: { title: 'Выберите язык интерфейса', hint: 'Позже язык можно изменить в настройках', action: 'Продолжить' },
  ar: { title: 'اختر لغة الواجهة', hint: 'يمكنك تغييرها لاحقًا من الإعدادات', action: 'متابعة' },
  es: { title: 'Elige el idioma de la interfaz', hint: 'Puedes cambiarlo más tarde en Ajustes', action: 'Continuar' },
};

interface FirstRunLanguageProps {
  onDone: () => void;
}

/**
 * Shown before the app UI is mounted when no language choice exists yet.
 * Selecting only marks the option; the choice is written to localStorage by
 * changeLanguage when the user continues, so a crash mid-selection never leaves
 * a half-written preference behind.
 */
export function FirstRunLanguage({ onDone }: FirstRunLanguageProps) {
  const [selected, setSelected] = useState(() => detectSystemLanguage());
  const [saving, setSaving] = useState(false);

  const dir = LANGUAGES.find((lang) => lang.code === selected)?.dir ?? 'ltr';
  const copy = COPY[selected] ?? COPY.en;

  const confirm = async () => {
    if (saving) return;
    setSaving(true);
    await changeLanguage(selected);
    onDone();
  };

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto bg-canvas px-6 py-10" dir={dir}>
      <div className="w-full max-w-[520px] animate-pop-in">
        <div className="mb-7 text-center">
          <img src="/logo.png" alt="" className="mx-auto mb-4 h-16 w-16 rounded-[18px]" />
          <h1 className="text-[24px] font-semibold tracking-tight text-ink">jsontool</h1>
          <p className="mt-2 text-[15px] font-medium text-ink">{copy.title}</p>
          <p className="mt-1 text-[13px] text-muted">{copy.hint}</p>
        </div>

        <div className="rounded-card border border-hairline bg-card p-4 shadow-float">
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => {
              const active = selected === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected(lang.code)}
                  className={`tap flex h-12 items-center justify-between gap-2 rounded-xl border px-3.5 text-[14.5px] transition-colors ${
                    active
                      ? 'border-accent/40 bg-accent/10 font-medium text-accent'
                      : 'border-hairline bg-card text-ink hover:bg-canvas'
                  }`}
                >
                  <span className="truncate">{lang.label}</span>
                  {active ? <Icon name="check" size={16} /> : null}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => void confirm()}
            disabled={saving}
            className="tap mt-3 h-12 w-full rounded-field bg-accent text-[15px] font-medium text-white hover:brightness-105"
          >
            {copy.action}
          </button>
        </div>
      </div>
    </div>
  );
}
