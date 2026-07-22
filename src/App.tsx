import { useCallback, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Editor, { type Monaco } from "@monaco-editor/react";
import {
  SAMPLE_SOURCE,
  Z80_LANGUAGE_ID,
  z80Config,
  z80Language,
} from "./editor/z80language";
import { assemble, type AssembleResult } from "./dosbox/assembler";
import "./App.css";

type OutputTab = "console" | "listing" | "hex";

export default function App() {
  const [source, setSource] = useState(SAMPLE_SOURCE);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AssembleResult | null>(null);
  const [tab, setTab] = useState<OutputTab>("console");
  const monacoReady = useRef(false);

  const beforeMount = useCallback((monaco: Monaco) => {
    if (monacoReady.current) return;
    monacoReady.current = true;
    monaco.languages.register({ id: Z80_LANGUAGE_ID });
    monaco.languages.setMonarchTokensProvider(Z80_LANGUAGE_ID, z80Language);
    monaco.languages.setLanguageConfiguration(Z80_LANGUAGE_ID, z80Config);
  }, []);

  const onAssemble = useCallback(async () => {
    setBusy(true);
    setResult(null);
    setTab("console");
    try {
      const r = await assemble(source);
      setResult(r);
      setTab(r.listing ? "listing" : "console");
    } catch (e) {
      setResult({
        ok: false,
        errorCount: -1,
        stdout: `Engine error: ${(e as Error).message}`,
        listing: "",
        hex: "",
      });
    } finally {
      setBusy(false);
    }
  }, [source]);

  const download = useCallback((name: string, text: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const statusText = busy
    ? "Assembling…"
    : result
      ? result.errorCount === 0
        ? "No Errors"
        : result.errorCount > 0
          ? `${result.errorCount} Error(s)`
          : "Failed"
      : "Ready";

  return (
    <div className="app">
      <header className="toolbar">
        <span className="brand">Z80 Workspace</span>
        <button className="btn primary" onClick={onAssemble} disabled={busy}>
          {busy ? "…" : "Assemble (C16)"}
        </button>
        <button
          className="btn"
          disabled={!result?.hex}
          onClick={() => result && download("lab1.h", result.hex)}
        >
          Export .hex
        </button>
        <button
          className="btn"
          disabled={!result?.listing}
          onClick={() => result && download("lab1.lst", result.listing)}
        >
          Export .lst
        </button>
        <span
          className={
            "status " + (result ? (result.errorCount === 0 ? "ok" : "err") : "")
          }
        >
          {statusText}
        </span>
      </header>

      <PanelGroup direction="horizontal" className="body">
        <Panel defaultSize={16} minSize={10} className="pane explorer">
          <div className="pane-title">EXPLORER</div>
          <ul className="filelist">
            <li className="active">lab1.asm</li>
            <li className="muted">micro_processor/</li>
            <li className="child muted">C16.EXE</li>
            <li className="child muted">Z80.TBL</li>
            <li className="child muted">z80sim.exe</li>
          </ul>
        </Panel>

        <PanelResizeHandle className="resize" />

        <Panel defaultSize={52} minSize={25} className="pane">
          <div className="pane-title">lab1.asm</div>
          <div className="editor-wrap">
            <Editor
              language={Z80_LANGUAGE_ID}
              theme="vs-dark"
              value={source}
              onChange={(v) => setSource(v ?? "")}
              beforeMount={beforeMount}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </Panel>

        <PanelResizeHandle className="resize" />

        <Panel defaultSize={32} minSize={18} className="pane">
          <div className="tabbar">
            {(["console", "listing", "hex"] as OutputTab[]).map((t) => (
              <button
                key={t}
                className={"tab " + (tab === t ? "active" : "")}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <pre className="output">
            {tab === "console" &&
              (result?.stdout || "Press Assemble to run C16.")}
            {tab === "listing" && (result?.listing || "(no listing yet)")}
            {tab === "hex" && (result?.hex || "(no hex output yet)")}
          </pre>
        </Panel>
      </PanelGroup>
    </div>
  );
}
