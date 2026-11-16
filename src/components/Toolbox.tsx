import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

function uuidv4(): string {
  const cryptoObj = typeof crypto !== 'undefined' ? crypto : null;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    try {
      return cryptoObj.randomUUID();
    } catch {
      /* fall through */
    }
  }
  const bytes = new Uint8Array(16);
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy copy */
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

interface ResultRowProps {
  label: string;
  value: string;
  copied: boolean;
  copyLabel: string;
  onCopy: () => void;
}

function ResultRow({ label, value, copied, copyLabel, onCopy }: ResultRowProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-canvas px-2.5 py-1.5">
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
        <div className="truncate font-mono text-[12.5px] text-ink" dir="ltr">
          {value}
        </div>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="shrink-0 rounded-md px-2 py-1 text-[12px] font-medium text-accent hover:bg-accent/10"
      >
        {copyLabel}
      </button>
    </div>
  );
}

export function Toolbox() {
  const { t, i18n } = useTranslation();
  const [count, setCount] = useState(5);
  const [uuids, setUuids] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  const flash = (message: string) => {
    setStatus(message);
    const timer = window.setTimeout(() => setStatus(null), 1600);
    timers.current.push(timer);
  };

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const generate = () => {
    setGenerating(true);
    const timer = window.setTimeout(() => {
      setUuids(Array.from({ length: count }, () => uuidv4()));
      setGenerating(false);
      flash(t('tools.generated', { count }));
    }, 140);
    timers.current.push(timer);
  };

  const copy = async (text: string, key: string) => {
    const ok = await copyText(text);
    if (!ok) return;
    setCopied(key);
    flash(t('tools.copied'));
    const timer = window.setTimeout(() => setCopied((prev) => (prev === key ? null : prev)), 1200);
    timers.current.push(timer);
  };

  const [tsInput, setTsInput] = useState('');
  const [dateInput, setDateInput] = useState('');

  const tsResult = useMemo(() => {
    const raw = tsInput.trim();
    if (!raw) return { error: null as string | null, local: '', utc: '' };
    if (!/^(?:\d{10}|\d{13})$/.test(raw)) {
      return { error: t('tools.tsInvalid') as string | null, local: '', utc: '' };
    }
    const millis = raw.length === 13 ? Number(raw) : Number(raw) * 1000;
    const date = new Date(millis);
    if (Number.isNaN(date.getTime())) {
      return { error: t('tools.tsInvalid') as string | null, local: '', utc: '' };
    }
    const local = new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short',
      numberingSystem: 'latn',
    }).format(date);
    const iso = date.toISOString();
    const utc = `${iso.slice(0, 10)} ${iso.slice(11, 19)} UTC`;
    return { error: null, local, utc };
  }, [tsInput, i18n.language, t]);

  const dateResult = useMemo(() => {
    if (!dateInput) return { error: null as string | null, seconds: '', millis: '' };
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) {
      return { error: t('tools.dateInvalid') as string | null, seconds: '', millis: '' };
    }
    return {
      error: null,
      seconds: String(Math.floor(date.getTime() / 1000)),
      millis: String(date.getTime()),
    };
  }, [dateInput, t]);

  return (
    <div className="space-y-3">
      <div className="rounded-card border border-hairline bg-card p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[14px] font-semibold text-ink">{t('tools.uuidTitle')}</div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[12.5px] text-muted">
              {t('tools.count')}
              <select
                value={count}
                onChange={(event) => setCount(Number(event.target.value))}
                className="h-9 rounded-[9px] border border-hairline bg-canvas px-2 text-[13px] text-ink outline-none"
              >
                {[1, 5, 10, 20].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={generate}
              disabled={generating}
              className="tap h-9 rounded-[9px] bg-accent px-3 text-[13px] font-medium text-white disabled:opacity-60"
            >
              {generating ? t('tools.generating') : t('tools.generate')}
            </button>
          </div>
        </div>

        {uuids.length > 0 ? (
          <>
            <div className="mt-3 max-h-[170px] space-y-1.5 overflow-y-auto">
              {uuids.map((id) => (
                <div key={id} className="flex items-center gap-2 rounded-lg bg-canvas px-2.5 py-1.5">
                  <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-ink" dir="ltr">
                    {id}
                  </span>
                  <button
                    type="button"
                    onClick={() => void copy(id, id)}
                    className="shrink-0 rounded-md px-1.5 py-0.5 text-[12px] font-medium text-accent hover:bg-accent/10"
                  >
                    {copied === id ? t('tools.copiedShort') : t('tools.copy')}
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void copy(uuids.join('\n'), 'all')}
              className="tap mt-2 h-9 w-full rounded-[9px] bg-accent/10 text-[13px] font-medium text-accent hover:bg-accent/15"
            >
              {copied === 'all' ? t('tools.copied') : t('tools.copyAll')}
            </button>
          </>
        ) : null}
      </div>

      <div className="rounded-card border border-hairline bg-card p-3.5">
        <div className="text-[14px] font-semibold text-ink">{t('tools.tsTitle')}</div>

        <div className="mt-3">
          <div className="mb-1.5 text-[12.5px] text-muted">{t('tools.tsToDate')}</div>
          <input
            value={tsInput}
            onChange={(event) => setTsInput(event.target.value)}
            placeholder={t('tools.tsPlaceholder')}
            inputMode="numeric"
            dir="ltr"
            spellCheck={false}
            className="field h-11 font-mono text-[14px]"
          />
          {tsResult.error ? (
            <p className="mt-1.5 text-[12px] leading-4 text-danger-ink">{tsResult.error}</p>
          ) : null}
          {tsResult.local ? (
            <div className="mt-2 space-y-1.5">
              <ResultRow
                label={t('tools.localTime')}
                value={tsResult.local}
                copied={copied === 'local'}
                copyLabel={copied === 'local' ? t('tools.copiedShort') : t('tools.copy')}
                onCopy={() => void copy(tsResult.local, 'local')}
              />
              <ResultRow
                label={t('tools.utcTime')}
                value={tsResult.utc}
                copied={copied === 'utc'}
                copyLabel={copied === 'utc' ? t('tools.copiedShort') : t('tools.copy')}
                onCopy={() => void copy(tsResult.utc, 'utc')}
              />
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <div className="mb-1.5 text-[12.5px] text-muted">{t('tools.dateToTs')}</div>
          <input
            type="datetime-local"
            value={dateInput}
            onChange={(event) => setDateInput(event.target.value)}
            step={1}
            dir="ltr"
            className="field h-11 text-[14px]"
          />
          {dateResult.error ? (
            <p className="mt-1.5 text-[12px] leading-4 text-danger-ink">{dateResult.error}</p>
          ) : null}
          {dateResult.seconds ? (
            <div className="mt-2 space-y-1.5">
              <ResultRow
                label={t('tools.seconds')}
                value={dateResult.seconds}
                copied={copied === 'sec'}
                copyLabel={copied === 'sec' ? t('tools.copiedShort') : t('tools.copy')}
                onCopy={() => void copy(dateResult.seconds, 'sec')}
              />
              <ResultRow
                label={t('tools.millis')}
                value={dateResult.millis}
                copied={copied === 'ms'}
                copyLabel={copied === 'ms' ? t('tools.copiedShort') : t('tools.copy')}
                onCopy={() => void copy(dateResult.millis, 'ms')}
              />
            </div>
          ) : null}
        </div>
      </div>

      {status ? (
        <p className="flex items-center gap-1.5 text-[12px] text-accent">
          <Icon name="check" size={14} />
          {status}
        </p>
      ) : null}
    </div>
  );
}
