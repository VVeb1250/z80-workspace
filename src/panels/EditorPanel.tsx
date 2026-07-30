import { useCallback, useEffect, useRef } from "react";
import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import type { IDockviewPanelProps } from "dockview-react";
import { editorTypographyOptions } from "../editor/editorOptions";
import { runZ80TabAction } from "../editor/tabAction";
import { Z80_LANGUAGE_ID } from "../editor/z80language";
import {
  registerZ80LanguageSupport,
  setZ80CompletionCaseMode,
  setZ80Diagnostics,
} from "../editor/z80Support";
import { registerZ80Themes } from "../editor/z80Theme";
import { useApp } from "../state/AppState";

// Each editor tab is bound to one file, passed via dockview panel params.
export default function EditorPanel(
  props: IDockviewPanelProps<{ name: string }>,
) {
  const name = props.params.name;
  const { contentOf, diagnosticsFor, updateSource, setActiveFile, settings } =
    useApp();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const diagnostics = diagnosticsFor(name);
  const indentationSettingsRef = useRef({
    insertSpaces: settings.insertSpaces,
    tabSize: settings.tabSize,
  });
  indentationSettingsRef.current = {
    insertSpaces: settings.insertSpaces,
    tabSize: settings.tabSize,
  };
  const tabAcceptsSuggestionRef = useRef(settings.tabAcceptsSuggestion);
  tabAcceptsSuggestionRef.current = settings.tabAcceptsSuggestion;

  useEffect(() => {
    editorRef.current?.getModel()?.updateOptions({
      insertSpaces: settings.insertSpaces,
      tabSize: settings.tabSize,
    });
  }, [settings.insertSpaces, settings.tabSize]);

  useEffect(() => {
    setZ80Diagnostics(settings.diagnostics);
  }, [settings.diagnostics]);

  useEffect(() => {
    setZ80CompletionCaseMode(settings.completionCase);
  }, [settings.completionCase]);

  // Compiler errors as squiggles. Owner "c16" keeps them separate from the
  // editor's own live diagnostics, so neither clears the other.
  const diagnosticsRef = useRef(diagnostics);
  diagnosticsRef.current = diagnostics;
  const applyMarkers = useCallback(() => {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();
    if (!monaco || !model) return;
    monaco.editor.setModelMarkers(
      model,
      "c16",
      diagnosticsRef.current
        .filter((d) => d.line > 0 && d.line <= model.getLineCount())
        .map((d) => ({
          severity: monaco.MarkerSeverity.Error,
          message: d.message,
          startLineNumber: d.line,
          endLineNumber: d.line,
          startColumn: 1,
          endColumn: model.getLineMaxColumn(d.line),
        })),
    );
  }, []);

  useEffect(applyMarkers, [applyMarkers, diagnostics]);

  const beforeMount = useCallback((monaco: Monaco) => {
    registerZ80Themes(monaco);
    registerZ80LanguageSupport(monaco);
  }, []);

  const onMount = useCallback<OnMount>((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.getModel()?.updateOptions(indentationSettingsRef.current);

    const runIndentCommand = (command: "tab" | "outdent") => {
      editor.trigger("z80-indent", "hideSuggestWidget", null);
      editor.trigger("z80-indent", command, null);
    };

    editor.addAction({
      id: "z80-indent-with-tab",
      label: "Indent with Tab",
      keybindings: [monaco.KeyCode.Tab],
      precondition: "editorTextFocus && !editorReadonly",
      run: () => runZ80TabAction(editor, tabAcceptsSuggestionRef.current),
    });
    editor.addAction({
      id: "z80-outdent-with-shift-tab",
      label: "Outdent with Shift+Tab",
      keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.Tab],
      precondition: "editorTextFocus && !editorReadonly",
      run: () => runIndentCommand("outdent"),
    });

    applyMarkers(); // a panel reopened after a build still shows its errors
  }, [applyMarkers]);

  return (
    <div className="panel-fill" onFocus={() => setActiveFile(name)}>
      <Editor
        language={Z80_LANGUAGE_ID}
        theme={settings.theme}
        path={name}
        value={contentOf(name)}
        onChange={(v) => updateSource(name, v ?? "")}
        beforeMount={beforeMount}
        onMount={onMount}
        options={{
          ...editorTypographyOptions(settings.editorFontSize),
          fontFamily: 'Consolas, "Courier New", monospace',
          minimap: { enabled: settings.minimap },
          lineNumbers: settings.lineNumbers ? "on" : "off",
          padding: { top: 8, bottom: 8 },
          renderLineHighlight: "all",
          smoothScrolling: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          autoIndent: "full",
          tabSize: settings.tabSize,
          insertSpaces: settings.insertSpaces,
          detectIndentation: false,
          useTabStops: true,
          tabCompletion: "off",
          tabFocusMode: false,
          quickSuggestionsDelay: 80,
          acceptSuggestionOnEnter: "smart",
          wordBasedSuggestions: "off",
          parameterHints: { enabled: settings.parameterHints },
          hover: { enabled: settings.hoverInformation ? "on" : "off" },
          renderWhitespace: settings.renderWhitespace ? "all" : "none",
          quickSuggestions: settings.quickSuggestions
            ? { other: true, comments: false, strings: false }
            : false,
          suggestOnTriggerCharacters: settings.quickSuggestions,
          wordWrap: settings.wordWrap ? "on" : "off",
        }}
      />
    </div>
  );
}
