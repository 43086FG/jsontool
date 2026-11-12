import { invoke } from '@tauri-apps/api/tauri';
import { open, save } from '@tauri-apps/api/dialog';
import type { AppSettings, ProjectMeta } from './types';

const tauriWindow =
  typeof window === 'undefined'
    ? undefined
    : (window as unknown as { __TAURI__?: unknown; __TAURI_IPC__?: unknown });

export const isTauri = !!tauriWindow && (!!tauriWindow.__TAURI_IPC__ || !!tauriWindow.__TAURI__);

const LS_PROJECTS = 'jsontool.projects';
const LS_SETTINGS = 'jsontool.settings';

interface BrowserProject extends ProjectMeta {
  content: string;
}

function readBrowserProjects(): BrowserProject[] {
  try {
    const raw = localStorage.getItem(LS_PROJECTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBrowserProjects(projects: BrowserProject[]) {
  localStorage.setItem(LS_PROJECTS, JSON.stringify(projects));
}

function browserProjectsToMeta(projects: BrowserProject[]): ProjectMeta[] {
  return projects
    .map(({ content, ...meta }) => meta)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function listProjects(): Promise<ProjectMeta[]> {
  if (isTauri) return invoke<ProjectMeta[]>('list_projects');
  return browserProjectsToMeta(readBrowserProjects());
}

function splitExtension(name: string): { stem: string; ext: string } {
  const match = name.match(/^(.*?)(\.[A-Za-z0-9]{1,11})$/);
  if (match && match[1]) return { stem: match[1], ext: match[2] };
  return { stem: name, ext: '' };
}

function uniqueName(existing: string[], base: string): string {
  const taken = new Set(existing.map((n) => n.toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  const { stem, ext } = splitExtension(base);
  let i = 1;
  while (taken.has(`${stem}${i}${ext}`.toLowerCase())) i += 1;
  return `${stem}${i}${ext}`;
}

export async function createProject(defaultName: string): Promise<ProjectMeta> {
  if (isTauri) return invoke<ProjectMeta>('create_project', { defaultName });
  const projects = readBrowserProjects();
  const name = uniqueName(
    projects.map((p) => p.name),
    defaultName,
  );
  const now = Date.now();
  const project: BrowserProject = {
    id: `p_${now}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    filePath: `browser://${now}`,
    external: false,
    createdAt: now,
    updatedAt: now,
    content: '{}',
  };
  projects.push(project);
  writeBrowserProjects(projects);
  return browserProjectsToMeta([project])[0];
}

export async function registerExternalFile(path: string): Promise<ProjectMeta> {
  return invoke<ProjectMeta>('register_external_file', { path });
}

export async function openLocalFile(): Promise<ProjectMeta | null> {
  if (isTauri) {
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (typeof selected !== 'string') return null;
    return registerExternalFile(selected);
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return resolve(null);
      try {
        const content = await file.text();
        const projects = readBrowserProjects();
        const now = Date.now();
        const existing = projects.find((p) => p.filePath === `browser-file://${file.name}`);
        const project: BrowserProject = existing
          ? { ...existing, content, updatedAt: now }
          : {
              id: `f_${now}_${Math.random().toString(36).slice(2, 8)}`,
              name: file.name,
              filePath: `browser-file://${file.name}`,
              external: true,
              createdAt: now,
              updatedAt: now,
              content,
            };
        const next = existing
          ? projects.map((p) => (p.id === project.id ? project : p))
          : projects.concat([project]);
        writeBrowserProjects(next);
        const { content: _content, ...meta } = project;
        resolve(meta);
      } catch (err) {
        reject(err);
      }
    };
    input.click();
  });
}

export async function importDroppedFile(file: File): Promise<ProjectMeta> {
  const content = await file.text();
  const projects = readBrowserProjects();
  const now = Date.now();
  const filePath = `browser-file://${file.name}`;
  const existing = projects.find((p) => p.filePath === filePath);
  const project: BrowserProject = existing
    ? { ...existing, content, updatedAt: now }
    : {
        id: `f_${now}_${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        filePath,
        external: true,
        createdAt: now,
        updatedAt: now,
        content,
      };
  const next = existing
    ? projects.map((p) => (p.id === project.id ? project : p))
    : projects.concat([project]);
  writeBrowserProjects(next);
  const { content: _content, ...meta } = project;
  return meta;
}

export async function renameProject(id: string, nextName: string): Promise<ProjectMeta> {
  if (isTauri) return invoke<ProjectMeta>('rename_project', { id, nextName });
  const projects = readBrowserProjects();
  const project = projects.find((p) => p.id === id);
  if (!project) throw new Error('Project not found');
  project.name = uniqueName(
    projects.filter((p) => p.id !== id).map((p) => p.name),
    nextName.trim() || project.name,
  );
  project.updatedAt = Date.now();
  writeBrowserProjects(projects);
  const { content: _content, ...meta } = project;
  return meta;
}

export async function deleteProject(id: string): Promise<void> {
  if (isTauri) return invoke<void>('delete_project', { id });
  writeBrowserProjects(readBrowserProjects().filter((p) => p.id !== id));
}

export async function readProject(id: string): Promise<string> {
  if (isTauri) return invoke<string>('read_project', { id });
  return readBrowserProjects().find((p) => p.id === id)?.content ?? '{}';
}

export async function writeProject(id: string, content: string): Promise<ProjectMeta> {
  if (isTauri) return invoke<ProjectMeta>('write_project', { id, content });
  const projects = readBrowserProjects();
  const project = projects.find((p) => p.id === id);
  if (!project) throw new Error('Project not found');
  project.content = content;
  project.updatedAt = Date.now();
  writeBrowserProjects(projects);
  const { content: _content, ...meta } = project;
  return meta;
}

export async function getSettings(): Promise<AppSettings> {
  if (isTauri) return invoke<AppSettings>('get_settings');
  try {
    const raw = localStorage.getItem(LS_SETTINGS);
    if (raw) return { defaultExportPath: '', theme: 'system', ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { defaultExportPath: '', theme: 'system' };
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  if (isTauri) return invoke<AppSettings>('save_settings', { settings });
  localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
  return settings;
}

export async function getStartupFile(): Promise<string | null> {
  if (isTauri) return invoke<string | null>('get_startup_path');
  return null;
}

export async function readTextFile(path: string): Promise<string> {
  return invoke<string>('read_text_file', { path });
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  return invoke<void>('write_text_file', { path, content });
}

function joinPath(dir: string, name: string): string {
  if (!dir) return name;
  return `${dir.replace(/[\\/]+$/, '')}\\${name}`;
}

function safeFileName(name: string): string {
  const sanitized = name.replace(/[\\/:*?"<>|]/g, '_') || 'untitled';
  return /\.json$/i.test(sanitized) ? sanitized : `${sanitized}.json`;
}

export async function exportJson(
  name: string,
  content: string,
  defaultDir: string,
): Promise<string | null> {
  const fileName = safeFileName(name);
  if (isTauri) {
    const path = await save({
      defaultPath: joinPath(defaultDir, fileName),
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!path) return null;
    await writeTextFile(path, content);
    return path;
  }
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return fileName;
}

export async function pickDirectory(): Promise<string | null> {
  if (!isTauri) return null;
  const selected = await open({ directory: true, multiple: false });
  return typeof selected === 'string' ? selected : null;
}
