import type { editor } from "monaco-editor";

export const Z80_THEME_ID = "z80-dark";

export const Z80_THEME: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "keyword", foreground: "569CD6" },
    { token: "keyword.directive", foreground: "C586C0" },
    { token: "variable.predefined", foreground: "9CDCFE" },
    { token: "identifier", foreground: "DCDCAA" },
    { token: "type.identifier", foreground: "DCDCAA" },
  ],
  colors: {},
};

interface Z80ThemeRegistrar {
  editor: {
    defineTheme(themeName: string, themeData: editor.IStandaloneThemeData): void;
  };
}

export function registerZ80Theme(monaco: Z80ThemeRegistrar): void {
  monaco.editor.defineTheme(Z80_THEME_ID, Z80_THEME);
}
