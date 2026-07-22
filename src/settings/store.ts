export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 72;
export const TAB_SIZES = [2, 4, 8] as const;

export interface WorkspaceSettings {
  editorFontSize: number;
  outputFontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
}

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  editorFontSize: 13,
  outputFontSize: 13,
  tabSize: 4,
  wordWrap: false,
  minimap: false,
};

const STORAGE_KEY = "z80ws.settings.v1";

const isAllowedNumber = (
  value: unknown,
  allowed: readonly number[],
): value is number => typeof value === "number" && allowed.includes(value);

const isValidFontSize = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= MIN_FONT_SIZE &&
  value <= MAX_FONT_SIZE;

export function normalizeWorkspaceSettings(value: unknown): WorkspaceSettings {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_WORKSPACE_SETTINGS };
  }
  const input = value as Partial<WorkspaceSettings>;
  return {
    editorFontSize: isValidFontSize(input.editorFontSize)
      ? input.editorFontSize
      : DEFAULT_WORKSPACE_SETTINGS.editorFontSize,
    outputFontSize: isValidFontSize(input.outputFontSize)
      ? input.outputFontSize
      : DEFAULT_WORKSPACE_SETTINGS.outputFontSize,
    tabSize: isAllowedNumber(input.tabSize, TAB_SIZES)
      ? input.tabSize
      : DEFAULT_WORKSPACE_SETTINGS.tabSize,
    wordWrap:
      typeof input.wordWrap === "boolean"
        ? input.wordWrap
        : DEFAULT_WORKSPACE_SETTINGS.wordWrap,
    minimap:
      typeof input.minimap === "boolean"
        ? input.minimap
        : DEFAULT_WORKSPACE_SETTINGS.minimap,
  };
}

export function loadWorkspaceSettings(): WorkspaceSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizeWorkspaceSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...DEFAULT_WORKSPACE_SETTINGS };
  }
}

export function saveWorkspaceSettings(settings: WorkspaceSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
