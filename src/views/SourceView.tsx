import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorState, RangeSetBuilder, StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, ViewPlugin, keymap, lineNumbers } from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, matchBrackets, syntaxTree } from '@codemirror/language';
import { json } from '@codemirror/lang-json';
import type { ParseErrorInfo } from '../lib/types';
import { Icon } from '../components/Icon';

interface SourceViewProps {
  text: string;
  error: ParseErrorInfo | null;
  onChange: (text: string) => void;
}

const RAINBOW_CLASSES = ['cm-rainbow-0', 'cm-rainbow-1', 'cm-rainbow-2'];
const rainbowMarks = RAINBOW_CLASSES.map((cls) => Decoration.mark({ class: cls }));

function buildRainbow(view: EditorView): DecorationSet {
  const entries: { from: number; to: number; deco: Decoration }[] = [];
  const tree = syntaxTree(view.state);
  const seen = new Set<string>();
  for (const range of view.visibleRanges) {
    tree.iterate({
      from: range.from,
      to: range.to,
      enter: (node) => {
        const name = node.name;
        if (name !== '{' && name !== '}' && name !== '[' && name !== ']') return;
        let depth = 0;
        for (let parent = node.node.parent; parent; parent = parent.parent) {
          if (parent.name === 'Object' || parent.name === 'Array') depth += 1;
        }
        const index = Math.max(0, depth - 1) % rainbowMarks.length;
        const key = `${node.from}:${index}`;
        if (seen.has(key)) return;
        seen.add(key);
        entries.push({ from: node.from, to: node.to, deco: rainbowMarks[index] });
      },
    });
  }
  entries.sort((a, b) => a.from - b.from || a.to - b.to);
  const builder = new RangeSetBuilder<Decoration>();
  for (const entry of entries) builder.add(entry.from, entry.to, entry.deco);
  return builder.finish();
}

// Colors brackets by nesting depth: level 1 / 2 / 3 then cycles.
const rainbowBrackets = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildRainbow(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildRainbow(update.view);
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
);

function hasUnmatchedBracket(state: EditorState): boolean {
  const pos = state.selection.main.head;
  const checkAt = (index: number): boolean | null => {
    if (index < 0 || index >= state.doc.length) return null;
    const char = state.sliceDoc(index, index + 1);
    const opening = char === '{' || char === '[';
    const closing = char === '}' || char === ']';
    if (!opening && !closing) return null;
    try {
      const result = opening
        ? matchBrackets(state, index, 1)
        : matchBrackets(state, index + 1, -1);
      return !result || !result.matched;
    } catch {
      return true;
    }
  };
  return checkAt(pos - 1) ?? checkAt(pos) ?? false;
}

function unmatchedWatcher(onChange: (value: boolean) => void) {
  return ViewPlugin.fromClass(
    class {
      constructor(view: EditorView) {
        onChange(hasUnmatchedBracket(view.state));
      }

      update(update: ViewUpdate) {
        if (update.selectionSet || update.docChanged) {
          onChange(hasUnmatchedBracket(update.state));
        }
      }
    },
  );
}

const setErrorLine = StateEffect.define<number | null>();

const errorLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(value, tr) {
    for (const effect of tr.effects) {
      if (!effect.is(setErrorLine)) continue;
      if (effect.value === null) return Decoration.none;
      const lineNumber = Math.min(Math.max(effect.value + 1, 1), tr.state.doc.lines);
      return Decoration.set([
        Decoration.line({ class: 'cm-error-line' }).range(tr.state.doc.line(lineNumber).from),
      ]);
    }
    return value.map(tr.changes);
  },
  provide: (field) => EditorView.decorations.from(field),
});

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: 'transparent',
    color: 'rgb(var(--c-ink))',
  },
  '.cm-scroller': {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    lineHeight: '22px',
    overflow: 'auto',
    scrollBehavior: 'smooth',
  },
  '.cm-content': {
    padding: '14px 0',
    caretColor: 'rgb(var(--c-accent))',
  },
  '.cm-line': {
    padding: '0 16px',
  },
  '.cm-gutters': {
    backgroundColor: 'rgb(var(--c-subtle))',
    color: 'rgb(var(--c-muted) / 0.8)',
    border: 'none',
    borderRight: '1px solid rgb(var(--c-hairline))',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    minWidth: '58px',
    padding: '0 10px 0 6px',
    fontSize: '13px',
    lineHeight: '22px',
  },
  '.cm-activeLine': { backgroundColor: 'transparent' },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: 'rgb(var(--c-accent))',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-cursor': { borderLeftColor: 'rgb(var(--c-accent))', borderLeftWidth: '2px' },
});

export function SourceView({ text, error, onChange }: SourceViewProps) {
  const { t } = useTranslation();
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const [unmatched, setUnmatched] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const view = new EditorView({
      state: EditorState.create({
        doc: text,
        extensions: [
          lineNumbers(),
          history(),
          bracketMatching(),
          json(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          EditorState.tabSize.of(2),
          EditorView.contentAttributes.of({
            spellcheck: 'false',
            autocapitalize: 'off',
            autocorrect: 'off',
            dir: 'ltr',
            'aria-label': t('editor.sourceMode'),
          }),
          errorLineField,
          rainbowBrackets,
          unmatchedWatcher(setUnmatched),
          editorTheme,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
        ],
      }),
      parent: host,
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // The editor instance is created once; later text/error changes are synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (view.state.doc.toString() === text) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
  }, [text]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (!error) {
      view.dispatch({ effects: setErrorLine.of(null) });
      return;
    }
    const lineNumber = Math.min(Math.max(error.line, 0), view.state.doc.lines - 1);
    const line = view.state.doc.line(lineNumber + 1);
    const position = Math.min(Math.max(error.position, line.from), line.to);
    view.dispatch({
      effects: [
        setErrorLine.of(lineNumber),
        EditorView.scrollIntoView(line.from, { y: 'center' }),
      ],
      selection: { anchor: position },
    });
    view.focus();
  }, [error]);

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 pb-2 pt-1">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-hairline bg-card shadow-card">
        {error ? (
          <div className="flex items-start gap-2 border-b border-danger/30 bg-danger-soft px-4 py-3 text-[12.5px] leading-5 text-danger-ink">
            <Icon name="warning" size={16} className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold">{t('editor.parseErrorTitle')}</div>
              <div className="break-words">
                {t('editor.errorAt', { line: error.line + 1, column: error.column + 1 })} ·{' '}
                {error.message}
              </div>
            </div>
          </div>
        ) : null}

        <div ref={hostRef} className="min-h-0 flex-1 overflow-hidden" />

        {unmatched ? (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-danger/10 px-3 py-1 text-[12px] font-medium text-danger-ink">
            {t('editor.unmatchedBracket')}
          </div>
        ) : null}
      </div>
    </div>
  );
}
