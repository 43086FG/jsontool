import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { appWindow } from '@tauri-apps/api/window';
import * as api from './lib/api';
import { applyTheme } from './lib/theme';
import type { AppSettings, ProjectMeta } from './lib/types';
import { HomePage } from './pages/HomePage';
import { EditorPage } from './pages/EditorPage';
import { Modal } from './components/Modal';

type Screen = { name: 'home' } | { name: 'editor'; project: ProjectMeta };

export default function App() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    defaultExportPath: '',
    theme: 'system',
  });
  const [booted, setBooted] = useState(false);
  const [pendingOpen, setPendingOpen] = useState<ProjectMeta | null>(null);

  const screenRef = useRef(screen);
  const dirtyRef = useRef(false);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    applyTheme(settings.theme ?? 'system');
  }, [settings.theme]);

  const reloadProjects = useCallback(async () => {
    const list = await api.listProjects();
    setProjects(list);
  }, []);

  const showProject = useCallback((project: ProjectMeta) => {
    setScreen({ name: 'editor', project });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [loadedSettings, loadedProjects, startupPath] = await Promise.all([
          api.getSettings(),
          api.listProjects(),
          api.getStartupFile(),
        ]);
        if (cancelled) return;
        applyTheme(loadedSettings.theme ?? 'system');
        setSettings(loadedSettings);
        setProjects(loadedProjects);
        if (startupPath) {
          const meta = await api.registerExternalFile(startupPath);
          if (cancelled) return;
          setProjects(await api.listProjects());
          showProject(meta);
        }
      } catch (err) {
        console.error('Failed to initialise jsontool', err);
      } finally {
        if (!cancelled) setBooted(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showProject]);

  const openPath = useCallback(
    async (filePath: string) => {
      try {
        const meta = await api.registerExternalFile(filePath);
        await reloadProjects();
        if (screenRef.current.name === 'editor' && dirtyRef.current) {
          setPendingOpen(meta);
        } else {
          showProject(meta);
        }
      } catch (err) {
        console.error('Failed to open file', err);
      }
    },
    [reloadProjects, showProject],
  );

  useEffect(() => {
    if (!api.isTauri) return undefined;
    let unlisten: (() => void) | undefined;
    let disposed = false;
    appWindow
      .onFileDropEvent(({ payload }) => {
        if (payload.type !== 'drop') return;
        const target =
          payload.paths.find((p) => p.toLowerCase().endsWith('.json')) ?? payload.paths[0];
        if (target) void openPath(target);
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
  }, [openPath]);

  const handleBrowserDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file || api.isTauri) return;
    if (!/\.json$/i.test(file.name)) return;
    try {
      const meta = await api.importDroppedFile(file);
      await reloadProjects();
      if (screenRef.current.name === 'editor' && dirtyRef.current) setPendingOpen(meta);
      else showProject(meta);
    } catch (err) {
      console.error('Failed to import dropped file', err);
    }
  };

  const handleProjectUpdated = async (meta: ProjectMeta) => {
    await reloadProjects();
    setScreen((prev) =>
      prev.name === 'editor' ? { name: 'editor', project: { ...prev.project, ...meta } } : prev,
    );
  };

  if (!booted) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-canvas">
        <img src="/logo.png" alt="" className="h-14 w-14 rounded-2xl shadow-card" />
        <span className="text-[13px] text-muted">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div
      className="h-full"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => void handleBrowserDrop(event)}
    >
      {screen.name === 'home' ? (
        <HomePage
          projects={projects}
          reloadProjects={reloadProjects}
          settings={settings}
          onSettingsSaved={setSettings}
          onOpenProject={showProject}
        />
      ) : (
        <EditorPage
          key={screen.project.id}
          project={screen.project}
          settings={settings}
          onDirtyChange={(dirty) => {
            dirtyRef.current = dirty;
          }}
          onExit={() => {
            dirtyRef.current = false;
            setScreen({ name: 'home' });
            void reloadProjects();
          }}
          onProjectUpdated={handleProjectUpdated}
        />
      )}

      <Modal
        open={!!pendingOpen}
        onClose={() => setPendingOpen(null)}
        title={t('editor.discardOpenTitle')}
        description={t('editor.discardOpenDesc')}
        maxWidth={420}
        footer={
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setPendingOpen(null)}
              className="tap h-12 flex-1 rounded-field bg-canvas text-[15px] font-medium text-ink hover:bg-hover"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={() => {
                const next = pendingOpen;
                setPendingOpen(null);
                dirtyRef.current = false;
                if (next) showProject(next);
              }}
              className="tap h-12 flex-1 rounded-field bg-accent text-[15px] font-medium text-white hover:bg-[#0071e8]"
            >
              {t('editor.openAnyway')}
            </button>
          </div>
        }
      />
    </div>
  );
}
