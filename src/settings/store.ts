import {
  DEFAULT_Z80_THEME_ID,
  isZ80ThemeId,
  type Z80ThemeId,
} from "../editor/z80Theme.ts";

export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 72;
export const TAB_SIZES = [2, 4, 6, 8] as const;
export const TUTORIAL_LANGS = ["th", "en"] as const;
export const COMPLETION_CASE_MODES = ["upper", "lower", "match"] as const;
export type TutorialLang = (typeof TUTORIAL_LANGS)[number];
export type CompletionCaseMode = (typeof COMPLETION_CASE_MODES)[number];

export interface WorkspaceSettings {
  editorFontSize: number;
  theme: Z80ThemeId;
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
  completionCase: CompletionCaseMode;
  diagnostics: boolean;
  lineNumbers: boolean;
  /** Whether the first-run Welcome panel has been auto-opened before. */
  tutorialSeen: boolean;
  /** Language for tutorial / Welcome content. */
  tutorialLang: TutorialLang;
}

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  editorFontSize: 13,
  theme: DEFAULT_Z80_THEME_ID,
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
  completionCase: "upper",
  diagnostics: true,
  lineNumbers: true,
  tutorialSeen: false,
  tutorialLang: "th",
};

const STORAGE_KEY = "z80ws.settings.v1";

const isAllowedNumber = (
  value: unknown,
  allowed: readonly number[],
): value is number => typeof value === "number" && allowed.includes(value);

const isTutorialLang = (value: unknown): value is TutorialLang =>
  typeof value === "string" &&
  (TUTORIAL_LANGS as readonly string[]).includes(value);

export const isCompletionCaseMode = (
  value: unknown,
): value is CompletionCaseMode =>
  typeof value === "string" &&
  (COMPLETION_CASE_MODES as readonly string[]).includes(value);

const isValidFontSize = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= MIN_FONT_SIZE &&
  value <= MAX_FONT_SIZE;

export function normalizeWorkspaceSettings(value: unknown): WorkspaceSettings {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_WORKSPACE_SETTINGS };
  }
  const input = value as Partial<WorkspaceSettings> & {
    editorTheme?: unknown;
  };
  const theme = input.theme ?? input.editorTheme;
  return {
    editorFontSize: isValidFontSize(input.editorFontSize)
      ? input.editorFontSize
      : DEFAULT_WORKSPACE_SETTINGS.editorFontSize,
    theme: isZ80ThemeId(theme)
      ? theme
      : DEFAULT_WORKSPACE_SETTINGS.theme,
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
    completionCase: isCompletionCaseMode(input.completionCase)
      ? input.completionCase
      : DEFAULT_WORKSPACE_SETTINGS.completionCase,
    diagnostics:
      typeof input.diagnostics === "boolean"
        ? input.diagnostics
        : DEFAULT_WORKSPACE_SETTINGS.diagnostics,
    lineNumbers:
      typeof input.lineNumbers === "boolean"
        ? input.lineNumbers
        : DEFAULT_WORKSPACE_SETTINGS.lineNumbers,
    tutorialSeen:
      typeof input.tutorialSeen === "boolean"
        ? input.tutorialSeen
        : DEFAULT_WORKSPACE_SETTINGS.tutorialSeen,
    tutorialLang: isTutorialLang(input.tutorialLang)
      ? input.tutorialLang
      : DEFAULT_WORKSPACE_SETTINGS.tutorialLang,
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
