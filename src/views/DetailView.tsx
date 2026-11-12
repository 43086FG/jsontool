import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatJson, getAtPath, getType, renameAtPath, setAtPath } from '../lib/json';
import type { JsonPath, JsonValue } from '../lib/types';
import { Icon } from '../components/Icon';

interface DetailViewProps {
  data: JsonValue;
  path: JsonPath;
  onBack: () => void;
  onSave: (data: JsonValue) => void;
}

export function DetailView({ data, path, onBack, onSave }: DetailViewProps) {
  const { t } = useTranslation();
  const value = getAtPath(data, path);
  const type = getType(value);
  const isRoot = path.length === 0;
  const parentPath = path.slice(0, -1);
  const parent = getAtPath(data, parentPath);
  const isArrayItem = Array.isArray(parent);
  const originalKey = isRoot ? 'Root' : String(path[path.length - 1]);
  const isContainer = type === 'object' || type === 'array';

  const [keyInput, setKeyInput] = useState(originalKey);
  const [valueInput, setValueInput] = useState(
    type === 'string' || type === 'number' ? String(value ?? '') : '',
  );
  const [booleanValue, setBooleanValue] = useState(value === true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setKeyInput(originalKey);
    setValueInput(type === 'string' || type === 'number' ? String(value ?? '') : '');
    setBooleanValue(value === true);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const pathLabel = useMemo(
    () =>
      path.length === 0
        ? 'Root'
        : path
            .map((segment) => (typeof segment === 'number' ? `[${segment}]` : segment))
            .join('.'),
    [path],
  );

  const handleSave = () => {
    const nextKey = keyInput.trim();
    if (!isRoot && !isArrayItem && !nextKey) {
      setError(t('detail.emptyKey'));
      return;
    }
    if (!isRoot && !isArrayItem && nextKey !== originalKey && parent && !Array.isArray(parent)) {
      if (Object.prototype.hasOwnProperty.call(parent, nextKey)) {
        setError(t('detail.duplicateKey'));
        return;
      }
    }

    let nextValue: JsonValue = value;
    if (type === 'string') nextValue = valueInput;
    if (type === 'number') {
      const parsed = Number(valueInput);
      if (valueInput.trim() === '' || Number.isNaN(parsed) || !Number.isFinite(parsed)) {
        setError(t('detail.invalidNumber'));
        return;
      }
      nextValue = parsed;
    }
    if (type === 'boolean') nextValue = booleanValue;
    if (type === 'null') nextValue = null;

    let nextData = data;
    let nextPath = path;
    if (!isRoot && !isArrayItem && nextKey !== originalKey) {
      nextData = renameAtPath(nextData, path, nextKey);
      nextPath = parentPath.concat(nextKey);
    }
    if (!isContainer) {
      nextData = setAtPath(nextData, nextPath, nextValue);
    }
    onSave(nextData);
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[680px] px-6 pb-12 pt-6">
        <div className="mb-5 flex items-center gap-2">
          <button type="button" onClick={onBack} className="icon-btn -ms-2 text-accent" aria-label={t('common.back')}>
            <Icon name="chevron" size={20} className="rotate-180 rtl:rotate-0" strokeWidth={2.2} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold text-ink">{pathLabel}</div>
            <div className="truncate text-[12px] text-muted">{t(`types.${type}`)}</div>
          </div>
        </div>

        {!isArrayItem ? (
          <>
            <div className="mb-2 px-1 text-[13px] font-medium text-muted">{t('detail.keyLabel')}</div>
            <input
              value={keyInput}
              onChange={(event) => {
                setKeyInput(event.target.value);
                setError(null);
              }}
              disabled={isRoot}
              placeholder={t('detail.keyPlaceholder')}
              className="field h-[52px] disabled:bg-card disabled:text-muted"
              dir="auto"
              spellCheck={false}
            />
          </>
        ) : null}
        <div className={`flex items-center justify-between gap-3 px-1 ${isArrayItem ? 'mt-1' : 'mt-2'}`}>
          <div className="flex min-w-0 items-center gap-1.5 text-[12px] text-muted">
            <Icon name="tag" size={14} className="shrink-0 opacity-70" />
            <span className="shrink-0">{t(`types.${type}`)}</span>
            <span className="truncate opacity-70" dir="ltr">
              {pathLabel}
            </span>
          </div>
          <span className="shrink-0 text-[12px] text-muted/80">
            {isRoot ? '1' : isArrayItem ? String(path[path.length - 1]).padStart(2, '0') : '1'}
          </span>
        </div>

        <div className="mb-2 mt-7 px-1 text-[13px] font-medium text-muted">{t('detail.valueLabel')}</div>

        {type === 'boolean' ? (
          <div className="flex gap-2 rounded-field bg-card p-1.5">
            {[true, false].map((flag) => (
              <button
                key={String(flag)}
                type="button"
                onClick={() => setBooleanValue(flag)}
                className={`tap h-[42px] flex-1 rounded-[9px] text-[15px] font-medium transition-colors ${
                  booleanValue === flag ? 'bg-accent text-white' : 'text-ink hover:bg-canvas'
                }`}
              >
                {flag ? t('detail.booleanTrue') : t('detail.booleanFalse')}
              </button>
            ))}
          </div>
        ) : isContainer ? (
          <textarea
            readOnly
            value={formatJson(value)}
            className="h-40 w-full resize-none rounded-field border border-transparent bg-card p-4 font-mono text-[12.5px] leading-5 text-ink/80 outline-none"
            dir="ltr"
            spellCheck={false}
          />
        ) : type === 'null' ? (
          <input
            value={t('detail.nullValue')}
            disabled
            className="field h-[52px] font-mono text-muted"
            dir="ltr"
          />
        ) : (
          <input
            value={valueInput}
            onChange={(event) => {
              setValueInput(event.target.value);
              setError(null);
            }}
            placeholder={t('detail.valuePlaceholder')}
            className="field h-[52px]"
            dir={type === 'number' ? 'ltr' : 'auto'}
            inputMode={type === 'number' ? 'decimal' : 'text'}
            spellCheck={false}
          />
        )}

        <div className="mt-2 flex items-start gap-1.5 px-1 text-[12px] leading-5 text-muted">
          <Icon name="tag" size={14} className="mt-0.5 shrink-0 opacity-70" />
          <div className="min-w-0">
            <div className="truncate">
              {t('detail.typeHint', { type: t(`types.${type}`) })}
              {isContainer ? (
                <span className="ms-2 opacity-70">
                  {type === 'array'
                    ? t('tree.elementCount', { count: (value as JsonValue[]).length })
                    : t('tree.childCount', {
                        count: Object.keys(value as { [key: string]: JsonValue }).length,
                      })}
                </span>
              ) : null}
            </div>
            {isContainer ? <div className="mt-1 opacity-70">{t('detail.containerHint')}</div> : null}
            {error ? <div className="mt-1.5 text-[12.5px] font-medium text-danger">{error}</div> : null}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-16">
          <button
            type="button"
            onClick={onBack}
            className="tap h-11 min-w-[96px] rounded-[10px] bg-accent px-7 text-[15px] font-medium text-white hover:bg-[#0071e8]"
          >
            {t('detail.back')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="tap h-11 min-w-[96px] rounded-[10px] bg-accent px-7 text-[15px] font-medium text-white hover:bg-[#0071e8]"
          >
            {t('detail.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
