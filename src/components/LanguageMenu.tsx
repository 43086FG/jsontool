import { useTranslation } from 'react-i18next';
import { LANGUAGES, changeLanguage } from '../i18n';
import { Icon } from './Icon';

interface LanguageMenuProps {
  open: boolean;
  onClose: () => void;
}

export function LanguageMenu({ open, onClose }: LanguageMenuProps) {
  const { i18n } = useTranslation();
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-30" onMouseDown={onClose} role="presentation" />
      <div className="absolute end-0 top-[calc(100%+8px)] z-40 max-h-[70vh] w-60 overflow-y-auto rounded-2xl border border-hairline bg-card py-1.5 shadow-menu animate-pop-in">
        {LANGUAGES.map((lang) => {
          const active = i18n.language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                void changeLanguage(lang.code);
                onClose();
              }}
              className="flex h-11 w-full items-center justify-between gap-3 px-4 text-start text-[14.5px] transition-colors duration-150 hover:bg-canvas"
            >
              <span className={active ? 'font-medium text-accent' : 'text-ink'}>{lang.label}</span>
              {active ? <Icon name="check" size={17} className="text-accent" /> : null}
            </button>
          );
        })}
      </div>
    </>
  );
}
