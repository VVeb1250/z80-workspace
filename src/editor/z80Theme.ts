import type { editor } from "monaco-editor";

type SyntaxPalette = {
  directive: string;
  label: string;
  mnemonic: string;
  register: string;
};

const syntaxRules = ({
  directive,
  label,
  mnemonic,
  register,
}: SyntaxPalette): editor.ITokenThemeRule[] => [
  { token: "keyword", foreground: mnemonic },
  { token: "keyword.directive", foreground: directive },
  { token: "variable.predefined", foreground: register },
  { token: "identifier", foreground: label },
  { token: "type.identifier", foreground: label },
];

export const Z80_THEMES = {
  "z80-dark": {
    base: "vs-dark",
    inherit: true,
    rules: syntaxRules({
      directive: "C586C0",
      label: "DCDCAA",
      mnemonic: "569CD6",
      register: "9CDCFE",
    }),
    colors: {},
  },
  "z80-light": {
    base: "vs",
    inherit: true,
    rules: syntaxRules({
      directive: "AF00DB",
      label: "795E26",
      mnemonic: "0000FF",
      register: "0070C1",
    }),
    colors: {},
  },
  "z80-high-contrast": {
    base: "hc-black",
    inherit: true,
    rules: syntaxRules({
      directive: "FF7FFF",
      label: "FFD700",
      mnemonic: "75BEFF",
      register: "9CDCFE",
    }),
    colors: {},
  },
} satisfies Record<string, editor.IStandaloneThemeData>;

export type Z80ThemeId = keyof typeof Z80_THEMES;

export const DEFAULT_Z80_THEME_ID: Z80ThemeId = "z80-dark";

export const Z80_THEME_OPTIONS: readonly {
  id: Z80ThemeId;
  label: string;
}[] = [
  { id: "z80-dark", label: "Z80 Dark" },
  { id: "z80-light", label: "Z80 Light" },
  { id: "z80-high-contrast", label: "High Contrast" },
];

export function isZ80ThemeId(value: unknown): value is Z80ThemeId {
  return typeof value === "string" && Object.hasOwn(Z80_THEMES, value);
}

interface Z80ThemeRegistrar {
  editor: {
    defineTheme(themeName: string, themeData: editor.IStandaloneThemeData): void;
  };
}

export function registerZ80Themes(monaco: Z80ThemeRegistrar): void {
  for (const [themeName, themeData] of Object.entries(Z80_THEMES)) {
    monaco.editor.defineTheme(themeName, themeData);
  }
}
