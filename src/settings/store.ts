import {
  DEFAULT_Z80_THEME_ID,
  isZ80ThemeId,
  type Z80ThemeId,
} from "../editor/z80Theme.ts";

export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 72;
export const TAB_SIZES = [2, 4, 6, 8] as const;

export interface WorkspaceSettings {
  editorFontSize: number;
  editorTheme: Z80ThemeId;
  outputFontSize: number;
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: boolean;
  minimap: boolean;
  quickSuggestions: boolean;
  parameterHints: boolean;
  hoverInformation: boolean;
  renderWhitespace: boolean;
  tabAcceptsSuggestion: boolean;
  diagnostics: boolean;
  lineNumbers: boolean;
}

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  editorFontSize: 13,
  editorTheme: DEFAULT_Z80_THEME_ID,
  outputFontSize: 13,
  tabSize: 4,
  insertSpaces: true,
  wordWrap: false,
  minimap: false,
  quickSuggestions: true,
  parameterHints: true,
  hoverInformation: true,
  renderWhitespace: false,
  tabAcceptsSuggestion: false,
  diagnostics: true,
  lineNumbers: true,
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
    editorTheme: isZ80ThemeId(input.editorTheme)
      ? input.editorTheme
      : DEFAULT_WORKSPACE_SETTINGS.editorTheme,
    outputFontSize: isValidFontSize(input.outputFontSize)
      ? input.outputFontSize
      : DEFAULT_WORKSPACE_SETTINGS.outputFontSize,
    tabSize: isAllowedNumber(input.tabSize, TAB_SIZES)
      ? input.tabSize
      : DEFAULT_WORKSPACE_SETTINGS.tabSize,
    insertSpaces:
      typeof input.insertSpaces === "boolean"
        ? input.insertSpaces
        : DEFAULT_WORKSPACE_SETTINGS.insertSpaces,
    wordWrap:
      typeof input.wordWrap === "boolean"
        ? input.wordWrap
        : DEFAULT_WORKSPACE_SETTINGS.wordWrap,
    minimap:
      typeof input.minimap === "boolean"
        ? input.minimap
        : DEFAULT_WORKSPACE_SETTINGS.minimap,
    quickSuggestions:
      typeof input.quickSuggestions === "boolean"
        ? input.quickSuggestions
        : DEFAULT_WORKSPACE_SETTINGS.quickSuggestions,
    parameterHints:
      typeof input.parameterHints === "boolean"
        ? input.parameterHints
        : DEFAULT_WORKSPACE_SETTINGS.parameterHints,
    hoverInformation:
      typeof input.hoverInformation === "boolean"
        ? input.hoverInformation
        : DEFAULT_WORKSPACE_SETTINGS.hoverInformation,
    renderWhitespace:
      typeof input.renderWhitespace === "boolean"
        ? input.renderWhitespace
        : DEFAULT_WORKSPACE_SETTINGS.renderWhitespace,
    tabAcceptsSuggestion:
      typeof input.tabAcceptsSuggestion === "boolean"
        ? input.tabAcceptsSuggestion
        : DEFAULT_WORKSPACE_SETTINGS.tabAcceptsSuggestion,
    diagnostics:
      typeof input.diagnostics === "boolean"
        ? input.diagnostics
        : DEFAULT_WORKSPACE_SETTINGS.diagnostics,
    lineNumbers:
      typeof input.lineNumbers === "boolean"
        ? input.lineNumbers
        : DEFAULT_WORKSPACE_SETTINGS.lineNumbers,
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
