import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { appWindow } from '@tauri-apps/api/window';
import * as api from '../lib/api';
import { formatJson, isBlankJson, parseJson, pathKey, stripBom } from '../lib/json';
import type { AppSettings, JsonPath, JsonValue, ParseErrorInfo, ProjectMeta } from '../lib/types';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { TreeView } from '../views/TreeView';
import { DetailView } from '../views/DetailView';
import { SourceView } from '../views/SourceView';

type Mode = 'graph' | 'source';
type PromptIntent = 'close' | 'back';

interface EditorPageProps {
  project: ProjectMeta;
  settings: AppSettings;
  onExit: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onProjectUpdated: (project: ProjectMeta) => void;
}

export function EditorPage({
  project,
  settings,
  onExit,
  onDirtyChange,
  onProjectUpdated,
}: EditorPageProps) {
  const { t } = useTranslation();
  const { toast, showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<JsonValue>({});
  const [text, setText] = useState('');
  const [mode, setMode] = useState<Mode>('graph');
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<ParseErrorInfo | null>(null);
  const [detailPath, setDetailPath] = useState<JsonPath | null>(null);
  const [pendingCreate, setPendingCreate] = useState<{
    before: JsonValue;
    beforeDirty: boolean;
  } | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set([pathKey([])]));
  const [prompt, setPrompt] = useState<PromptIntent | null>(null);
  const [saving, setSaving] = useState(false);

  const dirtyRef = useRef(false);
  const allowCloseRef = useRef(false);

  useEffect(() => {
    dirtyRef.current = dirty;
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .readProject(project.id)
      .then((content) => {
        if (cancelled) return;
        const normalized = stripBom(content);
        setText(normalized);
        if (isBlankJson(content)) {
          // Empty file (0 bytes, BOM or whitespace only): open in source mode
          // without reporting a syntax error.
          setData({});
          setMode('source');
          setError(null);
        } else {
          const parsed = parseJson(normalized);
          if (parsed.ok) {
            setData(parsed.data);
            setMode('graph');
            setError(null);
          } else {
            setData({});
            setMode('source');
            setError(parsed.error);
          }
        }
        setDirty(false);
        setExpanded(new Set([pathKey([])]));
      })
      .catch((err) => {
        if (cancelled) return;
        showToast(err instanceof Error ? err.message : t('editor.loadFailed'));
        setMode('source');
        setText('{}');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  useEffect(() => {
    if (!api.isTauri) return undefined;
    let unlisten: (() => void) | undefined;
    let disposed = false;
    appWindow
      .onCloseRequested((event) => {
        if (allowCloseRef.current) return;
        if (!dirtyRef.current) return;
        event.preventDefault();
        setPrompt('close');
      })
      .then((fn) => {
        if (disposed) fn();
        else unlisten = fn;
      })
      .catch(() => undefined);
    return () => {
      disposed = true;
      if (unlisten) unlisten();
    };
  }, []);

  const doSave = async (): Promise<boolean> => {
    if (saving) return false;
    setSaving(true);
    try {
      let parsedData = data;
      if (mode === 'source') {
        if (isBlankJson(text)) {
          parsedData = {};
          setData({});
        } else {
          const parsed = parseJson(text);
          if (!parsed.ok) {
            setError(parsed.error);
            showToast(t('editor.parseErrorTitle'));
            return false;
          }
          parsedData = parsed.data;
          setData(parsed.data);
        }
      }
      const content = formatJson(parsedData);
      const meta = await api.writeProject(project.id, content);
      setText(content);
      setDirty(false);
      setError(null);
      setData(parsedData);
      onProjectUpdated(meta);
      showToast(t('editor.saved'));
      return true;
    } catch (err) {
      showToast(
        t('editor.saveFailed', {
          message: err instanceof Error ? err.message : t('common.unknownError'),
        }),
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    let parsedData = data;
    if (mode === 'source') {
      if (isBlankJson(text)) {
        parsedData = {};
      } else {
        const parsed = parseJson(text);
        if (!parsed.ok) {
          setError(parsed.error);
          showToast(t('editor.parseErrorTitle'));
          return;
        }
        parsedData = parsed.data;
      }
    }
    try {
      const path = await api.exportJson(
        project.name,
        formatJson(parsedData),
        settings.defaultExportPath,
      );
      if (path) showToast(t('editor.exportSuccess', { path }));
    } catch (err) {
      showToast(
        t('editor.exportFailed', {
          message: err instanceof Error ? err.message : t('common.unknownError'),
        }),
      );
    }
  };

  const switchMode = (next: Mode) => {
    if (next === mode || loading) return;
    if (next === 'source') {
      setText(formatJson(data));
      setError(null);
      setMode('source');
      return;
    }
    if (isBlankJson(text)) {
      setData({});
      setText('{}');
      setError(null);
      setMode('graph');
      return;
    }
    const parsed = parseJson(text);
    if (!parsed.ok) {
      setError(parsed.error);
      showToast(t('editor.switchBlocked'));
      return;
    }
    setData(parsed.data);
    setText(formatJson(parsed.data));
    setError(null);
    setMode('graph');
  };

  const requestBack = () => {
    if (dirty) setPrompt('back');
    else onExit();
  };

  const finishClose = async () => {
    allowCloseRef.current = true;
    if (api.isTauri) await appWindow.close();
    else onExit();
  };

  const handlePromptSave = async () => {
    const intent = prompt;
    if (!intent) return;
    const ok = await doSave();
    if (!ok) return;
    setPrompt(null);
    if (intent === 'close') await finishClose();
    else onExit();
  };

  const handlePromptDiscard = async () => {
    const intent = prompt;
    setDirty(false);
    dirtyRef.current = false;
    setPrompt(null);
    if (intent === 'close') await finishClose();
    else onExit();
  };

  const togglePath = (path: JsonPath) => {
    const key = pathKey(path);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandPath = (path: JsonPath) => {
    const key = pathKey(path);
    setExpanded((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  };

  return (
    <div className="flex h-full flex-col bg-canvas">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-hairline bg-canvas/95 px-2.5 backdrop-blur">
        <button
          type="button"
          onClick={requestBack}
          className="icon-btn text-accent"
          aria-label={t('common.back')}
          title={t('common.back')}
        >
          <Icon name="chevron" size={20} className="rotate-180 rtl:rotate-0" strokeWidth={2.2} />
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <div className="min-w-0 truncate text-center text-[15px] font-semibold text-ink">
            {detailPath ? String(detailPath[detailPath.length - 1] ?? 'Root') : project.name}
          </div>
          {dirty ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="flex items-center gap-0.5 rounded-full bg-hover p-0.5">
            <button
              type="button"
              onClick={() => switchMode('graph')}
              aria-pressed={mode === 'graph'}
              className={`tap flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium ${
                mode === 'graph' ? 'bg-card text-accent shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon name="tree" size={14} />
              {t('editor.graphMode')}
            </button>
            <button
              type="button"
              onClick={() => switchMode('source')}
              aria-pressed={mode === 'source'}
              className={`tap flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium ${
                mode === 'source' ? 'bg-card text-accent shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon name="code" size={14} />
              {t('editor.sourceMode')}
            </button>
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="icon-btn h-9 w-9"
            aria-label={t('common.export')}
            title={t('common.export')}
          >
            <Icon name="export" size={18} />
          </button>

          <button
            type="button"
            onClick={() => void doSave()}
            disabled={saving}
            className="tap h-9 rounded-[9px] bg-accent px-3.5 text-[13.5px] font-medium text-white hover:bg-[#0071e8]"
          >
            {t('editor.save')}
          </button>
        </div>
      </header>

      <div key={detailPath ? 'detail' : mode} className="flex min-h-0 flex-1 flex-col animate-fade-in">
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-[13.5px] text-muted">
            {t('editor.loadingFile')}
          </div>
        ) : detailPath ? (
          <DetailView
            data={data}
            path={detailPath}
            onBack={() => {
              if (pendingCreate) {
                // Cancelling a freshly created node: drop it and restore the
                // document/dirty state from before the creation.
                setData(pendingCreate.before);
                setDirty(pendingCreate.beforeDirty);
                setPendingCreate(null);
              }
              setDetailPath(null);
            }}
            onSave={(next) => {
              setPendingCreate(null);
              setData(next);
              setDirty(true);
              setDetailPath(null);
              showToast(t('detail.savedToast'));
            }}
          />
        ) : mode === 'graph' ? (
          <TreeView
            data={data}
            expanded={expanded}
            onToggle={togglePath}
            onExpand={expandPath}
            onEdit={(path) => setDetailPath(path)}
            onCreate={(next, path) => {
              setPendingCreate({ before: data, beforeDirty: dirty });
              setData(next);
              setDirty(true);
              setDetailPath(path);
            }}
            onChange={(next) => {
              setData(next);
              setDirty(true);
            }}
            onNotify={showToast}
          />
        ) : (
          <SourceView
            text={text}
            error={error}
            onChange={(next) => {
              setText(next);
              setDirty(true);
              setError(null);
            }}
          />
        )}
      </div>

      <footer className="flex h-12 shrink-0 items-center gap-3 border-t border-hairline bg-card/70 px-3">
        <button
          type="button"
          onClick={handleExport}
          className="icon-btn h-9 w-9 text-accent"
          aria-label={t('common.export')}
          title={t('common.export')}
        >
          <Icon name="export" size={19} />
        </button>
        <div className="flex flex-1 justify-center">
          <span
            className={`rounded-full px-3.5 py-1 text-[11.5px] font-medium ${
              dirty ? 'bg-accent/10 text-accent' : 'bg-hover text-muted'
            }`}
          >
            {dirty ? t('editor.unsaved') : t('editor.noChanges')}
          </span>
        </div>
        <span className="w-9 shrink-0" />
      </footer>

      <Modal
        open={!!prompt}
        onClose={() => setPrompt(null)}
        title={t('editor.closePromptTitle')}
        description={t('editor.closePromptDesc')}
        maxWidth={420}
        footer={
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => void handlePromptSave()}
              disabled={saving}
              className="tap h-12 w-full rounded-field bg-accent text-[15.5px] font-medium text-white hover:bg-[#0071e8]"
            >
              {prompt === 'back' ? t('editor.saveAndBack') : t('editor.saveAndClose')}
            </button>
            <button
              type="button"
              onClick={() => void handlePromptDiscard()}
              className="tap h-11 w-full rounded-field text-[15px] font-medium text-danger hover:bg-danger/[0.07]"
            >
              {t('editor.discard')}
            </button>
            <button
              type="button"
              onClick={() => setPrompt(null)}
              className="tap h-11 w-full rounded-field bg-canvas text-[15px] font-medium text-ink hover:bg-hover"
            >
              {t('editor.cancel')}
            </button>
          </div>
        }
      />

      {toast}
    </div>
  );
}
