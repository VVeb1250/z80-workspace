import { useCallback, useRef } from "react";
import Editor, { type Monaco } from "@monaco-editor/react";
import type { IDockviewPanelProps } from "dockview-react";
import {
  Z80_LANGUAGE_ID,
  z80Config,
  z80Language,
} from "../editor/z80language";
import { useApp } from "../state/AppState";

let languageRegistered = false;

// Each editor tab is bound to one file, passed via dockview panel params.
export default function EditorPanel(
  props: IDockviewPanelProps<{ name: string }>,
) {
  const name = props.params.name;
  const { contentOf, updateSource, setActiveFile, settings } = useApp();
  const registered = useRef(languageRegistered);

  const beforeMount = useCallback((monaco: Monaco) => {
    if (!registered.current) {
      registered.current = true;
      languageRegistered = true;
      monaco.languages.register({ id: Z80_LANGUAGE_ID });
      monaco.languages.setMonarchTokensProvider(Z80_LANGUAGE_ID, z80Language);
      monaco.languages.setLanguageConfiguration(Z80_LANGUAGE_ID, z80Config);
    }
  }, []);

  return (
    <div className="panel-fill" onFocus={() => setActiveFile(name)}>
      <Editor
        language={Z80_LANGUAGE_ID}
        theme="vs-dark"
        path={name}
        value={contentOf(name)}
        onChange={(v) => updateSource(name, v ?? "")}
        beforeMount={beforeMount}
        options={{
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: settings.editorFontSize,
          lineHeight: 20,
          minimap: { enabled: settings.minimap },
          padding: { top: 8, bottom: 8 },
          renderLineHighlight: "all",
          smoothScrolling: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: settings.tabSize,
          insertSpaces: true,
          detectIndentation: false,
          wordWrap: settings.wordWrap ? "on" : "off",
        }}
      />
    </div>
  );
}
