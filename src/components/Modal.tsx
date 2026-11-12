import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}

export function Modal({ open, onClose, title, description, children, footer, maxWidth = 480 }: ModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/40 p-6 animate-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && onClose) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[88vh] w-full overflow-y-auto rounded-[20px] bg-card p-6 shadow-float animate-pop-in"
        style={{ maxWidth }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            title={t('common.close')}
            className="icon-btn absolute end-2.5 top-2.5 z-10 h-10 w-10 text-muted hover:text-ink"
          >
            <Icon name="close" size={18} strokeWidth={2.2} />
          </button>
        ) : null}
        {title ? (
          <div className="px-8 text-center">
            <h2 className="text-[18px] font-semibold leading-6 text-ink">{title}</h2>
            {description ? (
              <p className="mt-2 text-[13.5px] leading-5 text-muted">{description}</p>
            ) : null}
          </div>
        ) : null}
        {children ? <div className={title ? 'mt-5' : ''}>{children}</div> : null}
        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
