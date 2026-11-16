export type JsonType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export type JsonPath = (string | number)[];

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface ProjectMeta {
  id: string;
  name: string;
  filePath: string;
  external: boolean;
  createdAt: number;
  updatedAt: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  defaultExportPath: string;
  theme: ThemeMode;
}

export interface TreeRow {
  key: string;
  path: JsonPath;
  value: JsonValue;
  depth: number;
  type: JsonType;
  isContainer: boolean;
  isRoot: boolean;
  expanded: boolean;
  childCount: number;
}

export interface ParseErrorInfo {
  message: string;
  line: number;
  column: number;
  position: number;
}
