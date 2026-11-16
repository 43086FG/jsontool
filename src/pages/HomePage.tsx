import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as api from '../lib/api';
import type { AppSettings, ProjectMeta } from '../lib/types';
import { Icon } from '../components/Icon';
import { TypeIcon } from '../components/TypeIcon';
import { Modal } from '../components/Modal';
import { LanguageMenu } from '../components/LanguageMenu';
import { SettingsSheet } from '../components/SettingsSheet';
import { useToast } from '../components/Toast';

interface HomePageProps {
  projects: ProjectMeta[];
  reloadProjects: () => Promise<void>;
  settings: AppSettings;
  onSettingsSaved: (settings: AppSettings) => void;
  onOpenProject: (project: ProjectMeta) => void;
}

// Keeps the project list where the user left it: HomePage unmounts when a
// project is opened, so the scroll offset lives outside the component.
let savedScrollTop = 0;

function splitProjectName(name: string, external: boolean): { base: string; ext: string } {
  const match = name.match(/^(.*?)(\.[A-Za-z0-9]+)$/);
  if (match && (external || match[2].toLowerCase() === '.json')) {
    return { base: match[1], ext: match[2] };
  }
  return { base: name, ext: '.json' };
}

function MenuItem({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: 'open' | 'pencil' | 'export' | 'trash';
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] transition-colors duration-150 ${
        danger ? 'text-danger hover:bg-danger/10' : 'text-ink hover:bg-canvas'
      }`}
    >
      <Icon name={icon} size={16} />
      {label}
    </button>
  );
}

export function HomePage({
  projects,
  reloadProjects,
  settings,
  onSettingsSaved,
  onOpenProject,
}: HomePageProps) {
  const { t, i18n } = useTranslation();
  const { toast, showToast } = useToast();
  const [langOpen, setLangOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [openingLocal, setOpeningLocal] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ProjectMeta | null>(null);
  const [renameBase, setRenameBase] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ProjectMeta | null>(null);
  const [menu, setMenu] = useState<{ project: ProjectMeta; x: number; y: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // True while we write scrollTop ourselves, so the resulting scroll event does
  // not overwrite the saved offset with the browser-clamped value.
  const restoringRef = useRef(false);
  const renameExt = renameTarget ? splitProjectName(renameTarget.name, renameTarget.external).ext : '.json';

  const restoreScroll = () => {
    const el = scrollRef.current;
    if (!el || el.scrollTop === savedScrollTop) return;
    restoringRef.current = true;
    el.scrollTop = savedScrollTop;
    savedScrollTop = el.scrollTop; // keep the clamped value when the list shrank
    window.requestAnimationFrame(() => {
      restoringRef.current = false;
    });
  };

  useLayoutEffect(() => {
    restoreScroll();
  }, []);

  // Re-sorting after create / rename / delete can move rows above the viewport,
  // which makes the browser reset the scroll offset; put it back.
  useLayoutEffect(() => {
    restoreScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  useEffect(() => {
    if (renameTarget) setRenameBase(splitProjectName(renameTarget.name, renameTarget.external).base);
  }, [renameTarget]);

  const handleCreate = async (topType: 'object' | 'array') => {
    if (creating) return;
    setCreating(true);
    try {
      let project = await api.createProject('untitled.json');
      if (topType === 'array') {
        project = await api.writeProject(project.id, '[]');
      }
      setCreateOpen(false);
      await reloadProjects();
      onOpenProject(project);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.unknownError'));
    } finally {
      setCreating(false);
    }
  };

  const handleOpenLocal = async () => {
    if (openingLocal) return;
    setOpeningLocal(true);
    try {
      const project = await api.openLocalFile();
      if (project) {
        await reloadProjects();
        onOpenProject(project);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('editor.loadFailed'));
    } finally {
      setOpeningLocal(false);
    }
  };

  const handleRename = async () => {
    if (!renameTarget || busy) return;
    const base = renameBase.trim();
    if (!base) return;
    setBusy(true);
    try {
      await api.renameProject(renameTarget.id, `${base}${renameExt}`);
      await reloadProjects();
      setRenameTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.unknownError'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || busy) return;
    setBusy(true);
    try {
      await api.deleteProject(deleteTarget.id);
      await reloadProjects();
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.unknownError'));
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async (project: ProjectMeta) => {
    if (busy) return;
    setBusy(true);
    try {
      const raw = await api.readProject(project.id);
      let data: unknown;
      try {
        data = JSON.parse(raw);
      } catch {
        showToast(t('home.exportInvalid'));
        return;
      }
      const path = await api.exportJson(
        project.name,
        JSON.stringify(data, null, 2),
        settings.defaultExportPath,
      );
      if (path) showToast(t('home.exportSuccess'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.unknownError'));
    } finally {
      setBusy(false);
    }
  };

  const formatDate = (timestamp: number) =>
    new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto bg-canvas"
      onScroll={(event) => {
        if (!restoringRef.current) savedScrollTop = event.currentTarget.scrollTop;
      }}
    >
      <div className="mx-auto w-full max-w-[960px] px-6 pb-16 pt-7 sm:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <img
              src="/logo.png"
              alt=""
              className="h-[52px] w-[52px] shrink-0 rounded-[13px] shadow-card"
            />
            <div className="min-w-0">
              <h1 className="truncate text-[28px] font-bold leading-9 text-ink">jsontool</h1>
              <p className="mt-0.5 truncate text-[13.5px] text-muted">{t('app.tagline')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen((open) => !open)}
                className="tap inline-flex h-10 items-center gap-2 rounded-full bg-card px-3.5 text-[13px] font-medium text-ink shadow-card hover:bg-raise"
                aria-label={t('common.language')}
              >
                <Icon name="globe" size={17} className="text-accent" />
                <span className="uppercase">{i18n.language.split('-')[0]}</span>
              </button>
              <LanguageMenu open={langOpen} onClose={() => setLangOpen(false)} />
            </div>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="icon-btn bg-card shadow-card hover:bg-raise"
              aria-label={t('common.settings')}
              title={t('common.settings')}
            >
              <Icon name="gear" size={19} />
            </button>

            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              disabled={creating}
              className="tap inline-flex h-10 items-center gap-1.5 rounded-[11px] bg-accent px-4 text-[14px] font-medium text-white shadow-card hover:bg-[#0071e8]"
            >
              <Icon name="plus" size={17} strokeWidth={2.2} />
              {t('home.newProject')}
            </button>
          </div>
        </header>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenLocal}
            disabled={openingLocal}
            className="tap inline-flex h-10 items-center gap-2 rounded-[10px] border border-hairline bg-card px-3.5 text-[13.5px] font-medium text-accent hover:border-accent/30 hover:bg-raise"
          >
            <Icon name="open" size={17} />
            {t('home.openLocal')}
          </button>
          <span className="ms-auto text-[12px] text-muted">
            {projects.length > 0 ? projects.length : ''}
          </span>
        </div>

        <div className="mt-3 overflow-hidden rounded-[16px] border border-hairline bg-card shadow-card">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-canvas text-muted">
                <Icon name="file" size={26} />
              </span>
              <div className="mt-4 text-[16px] font-semibold text-ink">{t('home.emptyTitle')}</div>
              <p className="mt-1.5 max-w-[340px] text-[13px] leading-5 text-muted">
                {t('home.emptyDesc')}
              </p>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                disabled={creating}
                className="tap mt-5 inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-accent px-4 text-[13.5px] font-medium text-white hover:bg-[#0071e8]"
              >
                <Icon name="plus" size={16} strokeWidth={2.2} />
                {t('home.newProject')}
              </button>
            </div>
          ) : (
            <ul>
              {projects.map((project) => (
                <li
                  key={project.id}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setMenu({ project, x: event.clientX, y: event.clientY });
                  }}
                  className="group flex h-[68px] items-center gap-3.5 border-b border-hairline/80 px-4 transition-colors duration-150 last:border-b-0 hover:bg-subtle sm:px-5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-accent/[0.07] text-accent">
                    <Icon name="file" size={21} />
                  </span>

                  <button
                    type="button"
                    onClick={() => onOpenProject(project)}
                    className="min-w-0 flex-1 text-start"
                  >
                    <div className="truncate text-[15px] font-semibold leading-5 text-ink">
                      {project.name}
                    </div>
                    <div className="mt-1 flex min-w-0 items-center gap-2">
                      <span className="truncate text-[12px] text-muted">
                        {t('home.updated', { date: formatDate(project.updatedAt) })}
                      </span>
                      {project.external ? (
                        <span className="shrink-0 rounded-full bg-canvas px-2 py-0.5 text-[10.5px] text-muted">
                          {t('home.localFile')}
                        </span>
                      ) : null}
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => onOpenProject(project)}
                      className="tap hidden h-9 items-center rounded-lg px-3 text-[13.5px] font-medium text-accent hover:bg-accent/[0.08] sm:inline-flex"
                    >
                      {t('common.open')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenameTarget(project)}
                      className="icon-btn h-9 w-9 hover:bg-hover"
                      aria-label={`${t('common.rename')} ${project.name}`}
                      title={t('common.rename')}
                    >
                      <Icon name="pencil" size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(project)}
                      className="icon-btn h-9 w-9 text-danger hover:bg-danger/10"
                      aria-label={t('home.deleteAction', { name: project.name })}
                      title={t('common.delete')}
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-5 text-center text-[12px] text-muted/80">{t('home.siteHint')}</p>
      </div>

      {menu ? (
        <>
          <div
            className="fixed inset-0 z-40"
            onMouseDown={() => setMenu(null)}
            onContextMenu={(event) => {
              event.preventDefault();
              setMenu(null);
            }}
          />
          <div
            className="fixed z-50 w-[176px] rounded-xl border border-hairline bg-card p-1 shadow-menu animate-pop-in"
            style={{
              left: Math.max(8, Math.min(menu.x, window.innerWidth - 188)),
              top: Math.max(8, Math.min(menu.y, window.innerHeight - 200)),
            }}
          >
            <MenuItem
              icon="open"
              label={t('common.open')}
              onClick={() => {
                const project = menu.project;
                setMenu(null);
                onOpenProject(project);
              }}
            />
            <MenuItem
              icon="pencil"
              label={t('common.rename')}
              onClick={() => {
                setRenameTarget(menu.project);
                setMenu(null);
              }}
            />
            <MenuItem
              icon="export"
              label={t('common.export')}
              onClick={() => {
                const project = menu.project;
                setMenu(null);
                void handleExport(project);
              }}
            />
            <div className="my-1 h-px bg-hairline" />
            <MenuItem
              icon="trash"
              danger
              label={t('common.delete')}
              onClick={() => {
                setDeleteTarget(menu.project);
                setMenu(null);
              }}
            />
          </div>
        </>
      ) : null}

      <Modal
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title={t('home.renameTitle')}
        footer={
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setRenameTarget(null)}
              className="tap h-12 flex-1 rounded-field bg-canvas text-[15.5px] font-medium text-ink hover:bg-hover"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleRename}
              disabled={busy || !renameBase.trim()}
              className="tap h-12 flex-1 rounded-field bg-accent text-[15.5px] font-medium text-white hover:bg-[#0071e8]"
            >
              {t('common.save')}
            </button>
          </div>
        }
      >
        <div className="flex h-[52px] items-center rounded-field border border-hairline bg-canvas px-4 focus-within:border-accent/50 focus-within:bg-card focus-within:ring-4 focus-within:ring-accent/10">
          <input
            value={renameBase}
            onChange={(event) => setRenameBase(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleRename();
            }}
            placeholder={t('home.renamePlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-muted/70"
            autoFocus
            dir="auto"
          />
          <span className="ms-1 shrink-0 select-none font-mono text-[15px] text-muted/80">
            {renameExt}
          </span>
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('home.deleteTitle')}
        description={t('home.deleteDesc', { name: deleteTarget?.name ?? '' })}
        footer={
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="tap h-12 flex-1 rounded-field bg-canvas text-[15.5px] font-medium text-ink hover:bg-hover"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="tap h-12 flex-1 rounded-field bg-danger text-[15.5px] font-medium text-white hover:bg-danger/90"
            >
              {t('common.delete')}
            </button>
          </div>
        }
      />

      <Modal
        open={createOpen}
        onClose={() => {
          if (!creating) setCreateOpen(false);
        }}
        title={t('home.createTitle')}
        description={t('home.createHint')}
        maxWidth={440}
      >
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleCreate('object')}
            disabled={creating}
            className="tap flex h-[104px] flex-col items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/[0.06] px-3 text-[14.5px] font-medium text-ink hover:border-accent/60 hover:bg-accent/10"
          >
            <TypeIcon type="object" size={24} />
            {t('types.object')}
            <span className="font-mono text-[12px] font-normal text-muted">{'{}'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleCreate('array')}
            disabled={creating}
            className="tap flex h-[104px] flex-col items-center justify-center gap-2 rounded-xl border border-hairline bg-canvas/60 px-3 text-[14.5px] font-medium text-ink hover:border-accent/40 hover:bg-accent/[0.06]"
          >
            <TypeIcon type="array" size={24} />
            {t('types.array')}
            <span className="font-mono text-[12px] font-normal text-muted">[]</span>
          </button>
        </div>
      </Modal>

      <SettingsSheet
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSaved={onSettingsSaved}
      />

      {toast}
    </div>
  );
}
