import type { JsonPath, JsonType, JsonValue, TreeRow, ParseErrorInfo } from './types';

export function pathKey(path: JsonPath): string {
  return JSON.stringify(path);
}

export function getType(value: unknown): JsonType {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (t === 'object') return 'object';
  if (t === 'number') return 'number';
  if (t === 'boolean') return 'boolean';
  return 'string';
}

export function isContainer(value: unknown): boolean {
  const t = getType(value);
  return t === 'object' || t === 'array';
}

export function childCount(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value as object).length;
  return 0;
}

export function getAtPath(root: JsonValue, path: JsonPath): JsonValue {
  let current: any = root;
  for (const segment of path) {
    if (current === null || current === undefined) return null;
    current = current[segment as any];
  }
  return current as JsonValue;
}

export function setAtPath(root: JsonValue, path: JsonPath, value: JsonValue): JsonValue {
  if (path.length === 0) return value;
  const head = path[0];
  const rest = path.slice(1);
  if (Array.isArray(root)) {
    const copy = root.slice();
    copy[head as number] = setAtPath(root[head as number] ?? null, rest, value);
    return copy;
  }
  if (root && typeof root === 'object') {
    const copy: { [key: string]: JsonValue } = { ...(root as { [key: string]: JsonValue }) };
    const key = String(head);
    copy[key] = setAtPath(copy[key] ?? null, rest, value);
    return copy;
  }
  return root;
}

export function deleteAtPath(root: JsonValue, path: JsonPath): JsonValue {
  if (path.length === 0) return root;
  const parentPath = path.slice(0, -1);
  const parent = getAtPath(root, parentPath);
  if (Array.isArray(parent)) {
    const index = Number(path[path.length - 1]);
    const next = parent.slice();
    next.splice(index, 1);
    return setAtPath(root, parentPath, next);
  }
  if (parent && typeof parent === 'object') {
    const next: { [key: string]: JsonValue } = {};
    const removeKey = String(path[path.length - 1]);
    for (const [k, v] of Object.entries(parent as { [key: string]: JsonValue })) {
      if (k !== removeKey) next[k] = v;
    }
    return setAtPath(root, parentPath, next);
  }
  return root;
}

export function renameAtPath(root: JsonValue, path: JsonPath, nextKey: string): JsonValue {
  if (path.length === 0) return root;
  const parentPath = path.slice(0, -1);
  const parent = getAtPath(root, parentPath);
  if (!parent || Array.isArray(parent) || typeof parent !== 'object') return root;
  const oldKey = String(path[path.length - 1]);
  if (oldKey === nextKey) return root;
  const next: { [key: string]: JsonValue } = {};
  for (const [k, v] of Object.entries(parent as { [key: string]: JsonValue })) {
    next[k === oldKey ? nextKey : k] = v;
  }
  return setAtPath(root, parentPath, next);
}

export function insertChild(
  root: JsonValue,
  parentPath: JsonPath,
  key: string,
  value: JsonValue,
): { data: JsonValue; path: JsonPath } {
  const parent = getAtPath(root, parentPath);
  if (Array.isArray(parent)) {
    const next = parent.concat([value]);
    return { data: setAtPath(root, parentPath, next), path: parentPath.concat(next.length - 1) };
  }
  if (parent && typeof parent === 'object') {
    const next: { [key: string]: JsonValue } = { ...(parent as { [key: string]: JsonValue }) };
    next[key] = value;
    return { data: setAtPath(root, parentPath, next), path: parentPath.concat(key) };
  }
  return { data: root, path: parentPath };
}

export function duplicateNode(root: JsonValue, path: JsonPath): { data: JsonValue; path: JsonPath } {
  if (path.length === 0) return { data: root, path };
  const parentPath = path.slice(0, -1);
  const parent = getAtPath(root, parentPath);
  const value = deepClone(getAtPath(root, path));
  if (Array.isArray(parent)) {
    const index = Number(path[path.length - 1]);
    const next = parent.slice();
    next.splice(index + 1, 0, value);
    return { data: setAtPath(root, parentPath, next), path: parentPath.concat(index + 1) };
  }
  if (parent && typeof parent === 'object') {
    const base = `${String(path[path.length - 1])} copy`;
    const key = uniqueKey(parent as { [key: string]: JsonValue }, base);
    const next: { [key: string]: JsonValue } = { ...(parent as { [key: string]: JsonValue }) };
    next[key] = value;
    return { data: setAtPath(root, parentPath, next), path: parentPath.concat(key) };
  }
  return { data: root, path };
}

export function uniqueKey(obj: { [key: string]: JsonValue }, base: string): string {
  if (!(base in obj)) return base;
  let i = 1;
  while (`${base}${i}` in obj) i += 1;
  return `${base}${i}`;
}

export function defaultValue(type: JsonType): JsonValue {
  switch (type) {
    case 'object':
      return {};
    case 'array':
      return [];
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    default:
      return null;
  }
}

export function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      /* fall through */
    }
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

export function formatJson(value: JsonValue): string {
  return JSON.stringify(value, null, 2);
}

export function convertRootType(root: JsonValue, target: 'object' | 'array'): JsonValue {
  if (target === 'array') {
    if (Array.isArray(root)) return root;
    if (root && typeof root === 'object') {
      // Object -> array: keep the original key order, keep values, drop key names.
      return Object.keys(root as { [key: string]: JsonValue }).map(
        (key) => (root as { [key: string]: JsonValue })[key],
      );
    }
    return [root];
  }
  if (!Array.isArray(root)) return root;
  // Array -> object: values keep their order, keys are generated as item1, item2, ...
  const next: { [key: string]: JsonValue } = {};
  root.forEach((value, index) => {
    next[`item${index + 1}`] = value;
  });
  return next;
}

export function flattenRows(root: JsonValue, expanded: Set<string>): TreeRow[] {
  const rows: TreeRow[] = [];
  const rootType = getType(root);

  const pushChildren = (value: JsonValue, basePath: JsonPath, depth: number) => {
    if (depth > 512) return;
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i += 1) {
        pushRow(`[${i}]`, basePath.concat(i), value[i], depth);
      }
      return;
    }
    if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value as { [key: string]: JsonValue })) {
        pushRow(k, basePath.concat(k), v, depth);
      }
    }
  };

  const pushRow = (key: string, path: JsonPath, value: JsonValue, depth: number, isRoot = false) => {
    const type = getType(value);
    const container = type === 'object' || type === 'array';
    const isExpanded = expanded.has(pathKey(path));
    rows.push({
      key,
      path,
      value,
      depth,
      type,
      isContainer: container,
      isRoot,
      expanded: isExpanded,
      childCount: container ? childCount(value) : 0,
    });
    if (container && isExpanded) {
      pushChildren(value, path, depth + 1);
    }
  };

  pushRow('Root', [], root, 0, true);
  return rows;
}

export function previewValue(value: JsonValue): string {
  const type = getType(value);
  if (type === 'string') {
    const raw = value as string;
    return raw.length > 80 ? `${raw.slice(0, 80)}…` : raw;
  }
  if (type === 'number' || type === 'boolean') return String(value);
  if (type === 'null') return 'null';
  return '';
}

export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function isBlankJson(text: string): boolean {
  return stripBom(text).trim() === '';
}

export function parseJson(text: string): { ok: true; data: JsonValue } | { ok: false; error: ParseErrorInfo } {
  const source = stripBom(text);
  try {
    const data = JSON.parse(source) as JsonValue;
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const posMatch = message.match(/position (\d+)/i);
    let position = posMatch ? Number(posMatch[1]) : source.length;
    if (Number.isNaN(position) || position < 0) position = source.length;
    if (position > source.length) position = source.length;
    const before = source.slice(0, position);
    const lines = before.split('\n');
    return {
      ok: false,
      error: {
        message,
        line: lines.length - 1,
        column: lines[lines.length - 1].length,
        position,
      },
    };
  }
}
