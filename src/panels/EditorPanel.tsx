import { useCallback, useRef } from "react";
import Editor, { type Monaco } from "@monaco-editor/react";
import {
  Z80_LANGUAGE_ID,
  z80Config,
  z80Language,
} from "../editor/z80language";
import { useApp } from "../state/AppState";

let languageRegistered = false;

export default function EditorPanel() {
  const { active, updateSource } = useApp();
  const registered = useRef(languageRegistered);

  const beforeMount = useCallback((monaco: Monaco) => {
    if (registered.current) return;
    registered.current = true;
    languageRegistered = true;
    monaco.languages.register({ id: Z80_LANGUAGE_ID });
    monaco.languages.setMonarchTokensProvider(Z80_LANGUAGE_ID, z80Language);
    monaco.languages.setLanguageConfiguration(Z80_LANGUAGE_ID, z80Config);
  }, []);

  return (
    <div className="panel-fill">
      <Editor
        language={Z80_LANGUAGE_ID}
        theme="vs-dark"
        path={active.name}
        value={active.content}
        onChange={(v) => updateSource(v ?? "")}
        beforeMount={beforeMount}
        options={{
          fontSize: 13,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
