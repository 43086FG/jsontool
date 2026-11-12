import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as api from '../lib/api';
import { applyTheme } from '../lib/theme';
import type { AppSettings, ThemeMode } from '../lib/types';
import { LANGUAGES, changeLanguage } from '../i18n';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { Toolbox } from './Toolbox';

interface SettingsSheetProps {
  open: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSaved: (settings: AppSettings) => void;
}

const THEME_OPTIONS: { mode: ThemeMode; labelKey: string }[] = [
  { mode: 'light', labelKey: 'home.themeLight' },
  { mode: 'dark', labelKey: 'home.themeDark' },
  { mode: 'system', labelKey: 'home.themeSystem' },
];

export function SettingsSheet({ open, settings, onClose, onSaved }: SettingsSheetProps) {
  const { t, i18n } = useTranslation();
  const [panel, setPanel] = useState<'main' | 'tools'>('main');
  const [path, setPath] = useState(settings.defaultExportPath);
  const [theme, setTheme] = useState<ThemeMode>(settings.theme ?? 'system');
  const [browseHint, setBrowseHint] = useState<string | null>(null);
  const pathRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef(settings);
  const saveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (open) {
      setPanel('main');
      setPath(settings.defaultExportPath);
      setTheme(settings.theme ?? 'system');
      setBrowseHint(null);
    }
  }, [open, settings.defaultExportPath, settings.theme]);

  // Every change is persisted right away; closing the sheet just closes it.
  const persist = (patch: Partial<AppSettings>) => {
    const next: AppSettings = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    void api
      .saveSettings(next)
      .then((saved) => onSaved(saved))
      .catch(() => undefined);
  };

  const handlePathChange = (value: string) => {
    setPath(value);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => persist({ defaultExportPath: value.trim() }), 280);
  };

  const handleClose = () => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    persist({ defaultExportPath: path.trim() });
    onClose();
  };

  const handleBrowse = async () => {
    if (api.isTauri) {
      const picked = await api.pickDirectory();
      if (picked) {
        setPath(picked);
        persist({ defaultExportPath: picked });
        setBrowseHint(null);
      }
      return;
    }
    // Browser preview has no native folder picker: explain and fall back to typing a path.
    setBrowseHint(t('home.browseDesktopOnly'));
    pathRef.current?.focus();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={panel === 'tools' ? t('tools.title') : t('home.settingsTitle')}
      maxWidth={560}
    >
      {panel === 'tools' ? (
        <div className="space-y-3 text-start">
          <button
            type="button"
            onClick={() => setPanel('main')}
            className="tap inline-flex h-9 items-center gap-1.5 rounded-full bg-canvas px-3 text-[13px] font-medium text-accent hover:bg-hover"
          >
            <Icon name="chevron" size={16} className="rotate-180 rtl:rotate-0" strokeWidth={2.1} />
            {t('home.settingsTitle')}
          </button>
          <Toolbox />
        </div>
      ) : (
        <div className="space-y-6 text-start">
          <section>
            <div className="mb-2 px-1 text-[13px] font-medium uppercase tracking-wide text-muted">
              {t('home.themeLabel')}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map((option) => {
                const active = theme === option.mode;
                return (
                  <button
                    key={option.mode}
                    type="button"
                    onClick={() => {
                      setTheme(option.mode);
                      applyTheme(option.mode);
                      persist({ theme: option.mode });
                    }}
                    className={`tap h-11 rounded-xl border px-2 text-[13.5px] transition-colors ${
                      active
                        ? 'border-accent/40 bg-accent/10 font-medium text-accent'
                        : 'border-hairline bg-card text-ink hover:bg-canvas'
                    }`}
                  >
                    <span className="truncate">{t(option.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-2 px-1 text-[13px] font-medium uppercase tracking-wide text-muted">
              {t('home.languageLabel')}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((lang) => {
                const active = i18n.language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => void changeLanguage(lang.code)}
                    className={`tap flex h-11 items-center justify-between gap-2 rounded-xl border px-3.5 text-[14px] transition-colors ${
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
          </section>

          <section>
            <div className="mb-2 px-1 text-[13px] font-medium uppercase tracking-wide text-muted">
              {t('home.defaultExportPath')}
            </div>
            <div className="flex items-stretch gap-2">
              <input
                ref={pathRef}
                value={path}
                onChange={(event) => handlePathChange(event.target.value)}
                placeholder={t('home.exportPathPlaceholder')}
                className="field h-12 flex-1"
                dir="ltr"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={handleBrowse}
                className="tap inline-flex h-12 shrink-0 items-center gap-2 rounded-field bg-accent/10 px-4 text-[14.5px] font-medium text-accent hover:bg-accent/15"
              >
                <Icon name="folder" size={18} />
                {t('common.browse')}
              </button>
            </div>
            <p className="mt-2 px-1 text-[12.5px] leading-5 text-muted">
              {t('home.defaultExportPathHint')}
            </p>
            {browseHint ? (
              <p className="mt-1 px-1 text-[12.5px] leading-5 text-accent">{browseHint}</p>
            ) : null}
          </section>

          <section>
            <div className="mb-2 px-1 text-[13px] font-medium uppercase tracking-wide text-muted">
              {t('tools.title')}
            </div>
            <button
              type="button"
              onClick={() => setPanel('tools')}
              className="tap flex w-full items-center gap-3 rounded-card border border-hairline bg-card p-4 text-start hover:bg-subtle"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-accent/10 text-accent">
                <Icon name="gear" size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-medium text-ink">{t('tools.title')}</span>
                <span className="block truncate text-[12.5px] text-muted">{t('tools.summary')}</span>
              </span>
              <Icon name="chevron" size={18} className="shrink-0 text-muted rtl:rotate-180" />
            </button>
          </section>

          <section>
            <div className="mb-2 px-1 text-[13px] font-medium uppercase tracking-wide text-muted">
              {t('home.aboutLabel')}
            </div>
            <div className="rounded-card bg-canvas p-4">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="" className="h-11 w-11 rounded-[10px]" />
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-ink">jsontool</div>
                  <div className="truncate text-[12.5px] text-muted">
                    {t('home.version', { version: '1.0.0' })}
                  </div>
                </div>
              </div>
              <div className="mt-3 border-t border-hairline pt-3 text-[12.5px] text-muted">
                {t('home.author')}
              </div>
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}
