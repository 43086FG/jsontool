import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  convertRootType,
  defaultValue,
  duplicateNode,
  deleteAtPath,
  flattenRows,
  getAtPath,
  insertChild,
  isContainer,
  pathKey,
  previewValue,
  uniqueKey,
} from '../lib/json';
import type { JsonPath, JsonType, JsonValue, TreeRow } from '../lib/types';
import { Icon } from '../components/Icon';
import { TypeIcon } from '../components/TypeIcon';
import { Modal } from '../components/Modal';

const ROW_HEIGHT = 56;
// Deep trees keep the normal indent step and scroll horizontally instead of
// capping: the row grows to the right and the tree card shows a bottom
// horizontal scrollbar (themed, works with virtual scrolling).
const INDENT_STEP = 20;
// Minimum width a row needs for chevron + icon + name + actions.
const ROW_BASE_WIDTH = 340;

interface TreeViewProps {
  data: JsonValue;
  expanded: Set<string>;
  onToggle: (path: JsonPath) => void;
  onExpand: (path: JsonPath) => void;
  onEdit: (path: JsonPath) => void;
  onCreate: (data: JsonValue, path: JsonPath) => void;
  onChange: (data: JsonValue) => void;
  onNotify: (message: string) => void;
}

interface PickerState {
  row: TreeRow;
  mode: 'child' | 'sibling';
}

const TYPE_ORDER: JsonType[] = ['object', 'array', 'string', 'number', 'boolean', 'null'];

export function TreeView({
  data,
  expanded,
  onToggle,
  onExpand,
  onEdit,
  onCreate,
  onChange,
  onNotify,
}: TreeViewProps) {
  const { t } = useTranslation();
  const rows = useMemo(() => flattenRows(data, expanded), [data, expanded]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);
  const [viewportWidth, setViewportWidth] = useState(800);
  const [menu, setMenu] = useState<{ row: TreeRow; x: number; y: number } | null>(null);
  const [picker, setPicker] = useState<PickerState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TreeRow | null>(null);
  const [changeRootOpen, setChangeRootOpen] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) {
        setViewportHeight(rect.height);
        setViewportWidth(rect.width);
      }
    });
    observer.observe(el);
    setViewportHeight(el.clientHeight);
    setViewportWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const maxDepth = useMemo(
    () => rows.reduce((deepest, row) => Math.max(deepest, row.depth), 0),
    [rows],
  );
  const contentWidth = Math.max(viewportWidth, 10 + maxDepth * INDENT_STEP + ROW_BASE_WIDTH);
  const rowWidthFor = (depth: number) =>
    Math.max(viewportWidth, 10 + depth * INDENT_STEP + ROW_BASE_WIDTH);

  const countText = (row: TreeRow): string => {
    if (!row.isContainer) return previewValue(row.value);
    const key = row.type === 'array' ? 'tree.elementCount' : 'tree.childCount';
    return t(key, { count: row.childCount });
  };

  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 8);
  const end = Math.min(rows.length, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + 8);
  const visible = rows.slice(start, end);
  const rootRow = rows[0];
  const showEmpty =
    rows.length === 1 && rootRow?.isContainer && rootRow.expanded && rootRow.childCount === 0;

  const openPicker = (row: TreeRow, mode: 'child' | 'sibling') => {
    setMenu(null);
    setPicker({ row, mode });
  };

  const handlePick = (type: JsonType) => {
    if (!picker) return;
    const { row, mode } = picker;
    const parentPath = mode === 'child' ? row.path : row.path.slice(0, -1);
    const parent = getAtPath(data, parentPath);
    if (!parent || !isContainer(parent)) {
      setPicker(null);
      return;
    }
    const key = Array.isArray(parent)
      ? 'newItem'
      : uniqueKey(parent as { [key: string]: JsonValue }, 'newKey');
    const result = insertChild(data, parentPath, key, defaultValue(type));
    onExpand(parentPath);
    onNotify(t('tree.toastAdded'));
    setPicker(null);
    onCreate(result.data, result.path);
  };

  const handlePickLabeled = () => {
    if (!picker) return;
    const { row, mode } = picker;
    const parentPath = mode === 'child' ? row.path : row.path.slice(0, -1);
    const parent = getAtPath(data, parentPath);
    if (!Array.isArray(parent)) {
      setPicker(null);
      return;
    }
    const innerKey = uniqueKey({}, 'newKey');
    const result = insertChild(data, parentPath, 'newItem', { [innerKey]: '' });
    onExpand(parentPath);
    onNotify(t('tree.toastAdded'));
    setPicker(null);
    onCreate(result.data, result.path.concat(innerKey));
  };

  const pickerParentIsArray = picker
    ? Array.isArray(
        getAtPath(data, picker.mode === 'child' ? picker.row.path : picker.row.path.slice(0, -1)),
      )
    : false;

  const handleCopy = (row: TreeRow) => {
    if (row.isRoot) return;
    const result = duplicateNode(data, row.path);
    onChange(result.data);
    onNotify(t('tree.toastCopied'));
    setMenu(null);
  };

  const handleDelete = () => {
    if (!pendingDelete || pendingDelete.isRoot) {
      setPendingDelete(null);
      return;
    }
    onChange(deleteAtPath(data, pendingDelete.path));
    onNotify(t('tree.toastDeleted'));
    setPendingDelete(null);
  };

  const rootIsArray = Array.isArray(data);

  const handleChangeRoot = () => {
    onChange(convertRootType(data, rootIsArray ? 'object' : 'array'));
    onExpand([]);
    onNotify(t('tree.changeRootDone'));
    setChangeRootOpen(false);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 pb-2 pt-1">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-hairline bg-card shadow-card">
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-auto overscroll-contain"
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          onMouseDown={() => menu && setMenu(null)}
        >
          <div
            className="relative"
            style={{
              width: contentWidth,
              height: rows.length * ROW_HEIGHT + (showEmpty ? 104 : 0),
            }}
          >
            {visible.map((row, offset) => (
              <div
                key={pathKey(row.path)}
                className="absolute start-0"
                style={{
                  top: (start + offset) * ROW_HEIGHT,
                  height: ROW_HEIGHT,
                  width: rowWidthFor(row.depth),
                }}
              >
                <TreeRowItem
                  row={row}
                  subtitle={countText(row)}
                  typeLabel={t(`types.${row.type}`)}
                  addLabel={t('tree.addButton')}
                  changeTypeLabel={t('tree.changeRoot')}
                  onChangeType={
                    row.isRoot && row.isContainer ? () => setChangeRootOpen(true) : undefined
                  }
                  onToggle={() => onToggle(row.path)}
                  onEdit={() => onEdit(row.path)}
                  onAdd={() => openPicker(row, row.isContainer ? 'child' : 'sibling')}
                  onContext={(x, y) => setMenu({ row, x, y })}
                />
              </div>
            ))}
            {showEmpty ? (
              <div
                className="absolute start-0 flex items-center justify-center"
                style={{ top: ROW_HEIGHT, height: ROW_HEIGHT, width: viewportWidth }}
              >
                <span className="text-[12.5px] text-muted/80">
                  {rootRow?.type === 'array' ? t('tree.emptyArray') : t('tree.emptyObject')}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {menu ? (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          labels={{
            edit: t('tree.contextEdit'),
            copy: t('tree.contextCopy'),
            insert: t('tree.contextInsert'),
            delete: t('tree.contextDelete'),
          }}
          isRoot={menu.row.isRoot}
          onClose={() => setMenu(null)}
          onEdit={() => {
            onEdit(menu.row.path);
            setMenu(null);
          }}
          onCopy={() => handleCopy(menu.row)}
          onInsert={() => openPicker(menu.row, menu.row.isContainer ? 'child' : 'sibling')}
          onDelete={() => {
            if (menu.row.isRoot) {
              onNotify(t('tree.cannotDeleteRoot'));
              setMenu(null);
              return;
            }
            setPendingDelete(menu.row);
            setMenu(null);
          }}
        />
      ) : null}

      <Modal
        open={!!picker}
        onClose={() => setPicker(null)}
        title={t('tree.addTitle')}
        description={
          picker
            ? picker.mode === 'child'
              ? picker.row.type === 'array'
                ? t('tree.addElementHint', { name: picker.row.isRoot ? 'Root' : picker.row.key })
                : t('tree.addChildHint', { name: picker.row.isRoot ? 'Root' : picker.row.key })
              : t('tree.addSiblingHint', { name: picker.row.key })
            : undefined
        }
        maxWidth={460}
      >
        <div className="grid grid-cols-2 gap-2.5">
          {TYPE_ORDER.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handlePick(type)}
              className="tap flex h-[76px] flex-col items-start justify-center gap-1.5 rounded-xl border border-hairline bg-canvas/60 px-4 text-start hover:border-accent/40 hover:bg-accent/[0.06]"
            >
              <span className="flex items-center gap-2 text-[14.5px] font-medium text-ink">
                <TypeIcon type={type} size={18} />
                {t(`types.${type}`)}
              </span>
              <span className="w-full truncate text-[12px] text-muted">
                {type === 'object' ? '{ }' : null}
                {type === 'array' ? '[ ]' : null}
                {type === 'string' ? '"text"' : null}
                {type === 'number' ? '0' : null}
                {type === 'boolean' ? 'true / false' : null}
                {type === 'null' ? 'null' : null}
              </span>
            </button>
          ))}
        </div>
        {pickerParentIsArray ? (
          <button
            type="button"
            onClick={handlePickLabeled}
            className="tap mt-2.5 flex w-full flex-col items-start gap-1 rounded-xl border border-accent/35 bg-accent/[0.06] px-4 py-3 text-start hover:border-accent/55 hover:bg-accent/10"
          >
            <span className="flex items-center gap-2 text-[14px] font-medium text-accent">
              <Icon name="tag" size={16} strokeWidth={2.1} />
              {t('tree.labeledValue')}
            </span>
            <span className="text-[12px] leading-4 text-muted">{t('tree.labeledValueHint')}</span>
          </button>
        ) : null}
      </Modal>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title={t('tree.deleteTitle')}
        description={t('tree.deleteDesc', { name: pendingDelete?.key ?? '' })}
        footer={
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setPendingDelete(null)}
              className="tap h-12 flex-1 rounded-field bg-canvas text-[15.5px] font-medium text-ink hover:bg-hover"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="tap h-12 flex-1 rounded-field bg-danger text-[15.5px] font-medium text-white hover:bg-danger/90"
            >
              {t('common.delete')}
            </button>
          </div>
        }
      />

      <Modal
        open={changeRootOpen}
        onClose={() => setChangeRootOpen(false)}
        title={t('tree.changeRootTitle')}
        description={
          rootIsArray ? t('tree.changeRootToObjectDesc') : t('tree.changeRootToArrayDesc')
        }
        maxWidth={440}
        footer={
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setChangeRootOpen(false)}
              className="tap h-12 flex-1 rounded-field bg-canvas text-[15.5px] font-medium text-ink hover:bg-hover"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleChangeRoot}
              className="tap h-12 flex-1 rounded-field bg-accent text-[15.5px] font-medium text-white hover:bg-[#0071e8]"
            >
              {t('tree.changeRootConfirm')}
            </button>
          </div>
        }
      />
    </div>
  );
}

interface TreeRowItemProps {
  row: TreeRow;
  subtitle: string;
  typeLabel: string;
  addLabel: string;
  changeTypeLabel: string;
  onChangeType?: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onAdd: () => void;
  onContext: (x: number, y: number) => void;
}

const TreeRowItem = memo(function TreeRowItem({
  row,
  subtitle,
  typeLabel,
  addLabel,
  changeTypeLabel,
  onChangeType,
  onToggle,
  onEdit,
  onAdd,
  onContext,
}: TreeRowItemProps) {
  const displayName = row.isRoot ? 'Root' : row.key;

  return (
    <div
      className="group flex h-full items-center gap-1.5 pe-3 transition-colors duration-150 hover:bg-subtle"
      style={{ paddingInlineStart: 10 + row.depth * INDENT_STEP }}
      onClick={() => (row.isContainer ? onToggle() : onEdit())}
      onContextMenu={(event) => {
        event.preventDefault();
        onContext(event.clientX, event.clientY);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (row.isContainer) onToggle();
          else onEdit();
        }
      }}
    >
      <span className="flex h-8 w-7 shrink-0 items-center justify-center">
        {row.isContainer ? (
          <button
            type="button"
            aria-label={row.expanded ? 'collapse' : 'expand'}
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-hover hover:text-ink"
          >
            <Icon
              name="chevron"
              size={15}
              className={`transition-transform duration-200 ${row.expanded ? 'rotate-90' : ''}`}
              strokeWidth={2.1}
            />
            <span className="sr-only">toggle</span>
          </button>
        ) : (
          <span className="h-7 w-7" />
        )}
      </span>

      <span className="flex h-9 w-9 shrink-0 items-center justify-center">
        <TypeIcon type={row.type} size={19} />
      </span>

      <div className="min-w-0 flex-1 py-1">
        <div
          className="truncate text-[15px] font-medium leading-[20px] text-ink"
          title={displayName}
        >
          {displayName}
        </div>
        <div className="truncate text-[11.5px] leading-[16px] text-muted">
          <span className="opacity-80">[{typeLabel}]</span>
          {subtitle ? <span> · {subtitle}</span> : null}
        </div>
      </div>

      {row.isRoot && onChangeType ? (
        <button
          type="button"
          title={changeTypeLabel}
          onClick={(event) => {
            event.stopPropagation();
            onChangeType();
          }}
          className="tap me-1 flex h-8 shrink-0 items-center gap-1 rounded-full border border-hairline bg-canvas/80 px-2.5 text-[11.5px] font-medium text-muted hover:border-accent/40 hover:bg-accent/[0.06] hover:text-accent"
        >
          <Icon name="braces" size={13} strokeWidth={1.9} />
          {changeTypeLabel}
        </button>
      ) : null}

      <button
        type="button"
        aria-label={addLabel}
        title={addLabel}
        onClick={(event) => {
          event.stopPropagation();
          onAdd();
        }}
        className="tap flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent opacity-0 transition-opacity duration-150 hover:bg-accent/15 focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Icon name="plus" size={16} strokeWidth={2.2} />
      </button>
    </div>
  );
});

interface ContextMenuProps {
  x: number;
  y: number;
  labels: { edit: string; copy: string; insert: string; delete: string };
  isRoot: boolean;
  onClose: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onInsert: () => void;
  onDelete: () => void;
}

function ContextMenu({
  x,
  y,
  labels,
  isRoot,
  onClose,
  onEdit,
  onCopy,
  onInsert,
  onDelete,
}: ContextMenuProps) {
  const width = 188;
  const height = 196;
  const left = Math.min(x, window.innerWidth - width - 12);
  const top = Math.min(y, window.innerHeight - height - 12);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-40" onMouseDown={onClose} onContextMenu={onClose} role="presentation" />
      <div
        className="fixed z-50 w-[188px] overflow-hidden rounded-[14px] border border-hairline bg-card py-1 shadow-menu animate-pop-in"
        style={{ left: Math.max(8, left), top: Math.max(8, top) }}
      >
        <MenuItem label={labels.edit} icon="pencil" onClick={onEdit} />
        <MenuItem label={labels.copy} icon="copy" onClick={onCopy} disabled={isRoot} />
        <MenuItem label={labels.insert} icon="insert" onClick={onInsert} />
        <div className="mx-2 my-1 h-px bg-hairline" />
        <MenuItem label={labels.delete} icon="trash" onClick={onDelete} danger disabled={isRoot} />
      </div>
    </>
  );
}

function MenuItem({
  label,
  icon,
  onClick,
  danger,
  disabled,
}: {
  label: string;
  icon: 'pencil' | 'copy' | 'insert' | 'trash';
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-11 w-full items-center gap-3 px-3.5 text-start text-[14px] transition-colors duration-150 disabled:opacity-35 ${
        danger ? 'text-danger hover:bg-danger/[0.08]' : 'text-ink hover:bg-canvas'
      }`}
    >
      <Icon name={icon} size={17} className={danger ? '' : 'text-muted'} />
      {label}
    </button>
  );
}
