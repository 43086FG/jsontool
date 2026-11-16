import type { ThemeMode } from './types';

const DARK_QUERY = '(prefers-color-scheme: dark)';
let mediaQuery: MediaQueryList | null = null;
let currentMode: ThemeMode = 'system';

function resolved(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
    return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
  }
  return mode;
}

function paint() {
  if (typeof document === 'undefined') return;
  const next = resolved(currentMode);
  const root = document.documentElement;
  root.classList.toggle('dark', next === 'dark');
  root.dataset.theme = next;
}

export function applyTheme(mode: ThemeMode) {
  currentMode = mode === 'light' || mode === 'dark' ? mode : 'system';
  paint();
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
  if (!mediaQuery) {
    mediaQuery = window.matchMedia(DARK_QUERY);
    const onChange = () => {
      if (currentMode === 'system') paint();
    };
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onChange);
    } else if (typeof (mediaQuery as unknown as { addListener?: (fn: () => void) => void }).addListener === 'function') {
      (mediaQuery as unknown as { addListener: (fn: () => void) => void }).addListener(onChange);
    }
  }
}

// Browser preview: apply the stored theme before the first paint to avoid a flash.
export function applyStoredTheme() {
  if (typeof window === 'undefined') return;
  if ((window as unknown as { __TAURI__?: unknown }).__TAURI__) return;
  try {
    const raw = localStorage.getItem('jsontool.settings');
    if (!raw) return;
    const parsed = JSON.parse(raw) as { theme?: string };
    if (parsed && (parsed.theme === 'light' || parsed.theme === 'dark' || parsed.theme === 'system')) {
      applyTheme(parsed.theme);
    }
  } catch {
    /* ignore */
  }
}
