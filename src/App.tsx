import { useCallback, useMemo, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Editor, { type Monaco } from "@monaco-editor/react";
import {
  Z80_LANGUAGE_ID,
  z80Config,
  z80Language,
} from "./editor/z80language";
import { assemble, type AssembleResult } from "./dosbox/assembler";
import { startSimulator, type SimulatorHandle } from "./dosbox/simulator";
import {
  dosBaseName,
  loadActive,
  loadFiles,
  normalizeName,
  saveActive,
  saveFiles,
  type AsmFile,
} from "./files/store";
import "./App.css";

type OutputTab = "console" | "listing" | "hex";

const TOOL_FILES = [
  "C16.EXE",
  "C16SORT.EXE",
  "Z80.TBL",
  "ASSEMBLE.DAT",
  "UNASSEM.DAT",
  "z80sim.exe",
];

export default function App() {
  const [files, setFiles] = useState<AsmFile[]>(() => loadFiles());
  const [activeName, setActiveName] = useState<string>(
    () => loadActive() ?? loadFiles()[0].name,
  );
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AssembleResult | null>(null);
  const [tab, setTab] = useState<OutputTab>("console");
  const [simRunning, setSimRunning] = useState(false);
  const [simBusy, setSimBusy] = useState(false);
  const monacoReady = useRef(false);
  const simElRef = useRef<HTMLDivElement>(null);
  const simHandleRef = useRef<SimulatorHandle | null>(null);

  const active = useMemo(
    () => files.find((f) => f.name === activeName) ?? files[0],
    [files, activeName],
  );

  const persist = useCallback((next: AsmFile[], nextActive?: string) => {
    setFiles(next);
    saveFiles(next);
    if (nextActive) {
      setActiveName(nextActive);
      saveActive(nextActive);
    }
  }, []);

  const updateSource = useCallback(
    (content: string) => {
      persist(
        files.map((f) => (f.name === active.name ? { ...f, content } : f)),
      );
    },
    [files, active, persist],
  );

  const selectFile = useCallback(
    (name: string) => {
      setActiveName(name);
      saveActive(name);
    },
    [],
  );

  const newFile = useCallback(() => {
    const input = window.prompt("New file name (base, .asm added):", "prog");
    if (!input) return;
    const name = normalizeName(input, files);
    persist(
      [...files, { name, content: `; ${name}\n\n                END\n` }],
      name,
    );
  }, [files, persist]);

  const deleteFile = useCallback(
    (name: string) => {
      if (files.length <= 1) {
        window.alert("Keep at least one file.");
        return;
      }
      if (!window.confirm(`Delete ${name}?`)) return;
      const next = files.filter((f) => f.name !== name);
      persist(next, name === active.name ? next[0].name : active.name);
    },
    [files, active, persist],
  );

  const renameFile = useCallback(
    (name: string) => {
      const input = window.prompt("Rename to (base):", name.replace(/\.asm$/i, ""));
      if (!input) return;
      const newName = normalizeName(input, files.filter((f) => f.name !== name));
      const next = files.map((f) => (f.name === name ? { ...f, name: newName } : f));
      persist(next, active.name === name ? newName : active.name);
    },
    [files, active, persist],
  );

  const toggleSimulator = useCallback(async () => {
    if (simBusy) return;
    setSimBusy(true);
    try {
      if (simRunning) {
        await simHandleRef.current?.stop();
        simHandleRef.current = null;
        setSimRunning(false);
      } else if (simElRef.current) {
        setSimRunning(true); // reveal container first so it has size
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        simHandleRef.current = await startSimulator(simElRef.current);
      }
    } catch (e) {
      setSimRunning(false);
      alert(`z80sim failed to start: ${(e as Error).message}`);
    } finally {
      setSimBusy(false);
    }
  }, [simRunning, simBusy]);

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
      const r = await assemble(active.content, dosBaseName(active.name));
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
  }, [active]);

  const download = useCallback((name: string, text: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const base = dosBaseName(active.name).toLowerCase();
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
          onClick={() => result && download(`${base}.hex`, result.hex)}
        >
          Export .hex
        </button>
        <button
          className="btn"
          disabled={!result?.listing}
          onClick={() => result && download(`${base}.lst`, result.listing)}
        >
          Export .lst
        </button>
        <button
          className={"btn " + (simRunning ? "danger" : "")}
          onClick={toggleSimulator}
          disabled={simBusy}
        >
          {simBusy ? "…" : simRunning ? "Stop z80sim" : "Run z80sim"}
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
          <div className="pane-title">
            <span>Files</span>
            <button className="icon-btn" title="New file" onClick={newFile}>
              +
            </button>
          </div>
          <ul className="filelist">
            {files.map((f) => (
              <li
                key={f.name}
                className={f.name === active.name ? "active" : ""}
                onClick={() => selectFile(f.name)}
              >
                <span className="fname">{f.name}</span>
                <span className="file-actions">
                  <button
                    className="icon-btn"
                    title="Rename"
                    onClick={(e) => {
                      e.stopPropagation();
                      renameFile(f.name);
                    }}
                  >
                    ✎
                  </button>
                  <button
                    className="icon-btn"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFile(f.name);
                    }}
                  >
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <div className="pane-title">micro_processor (read-only)</div>
          <ul className="filelist">
            {TOOL_FILES.map((f) => (
              <li key={f} className="muted readonly">
                {f}
              </li>
            ))}
          </ul>
        </Panel>

        <PanelResizeHandle className="resize" />

        <Panel defaultSize={52} minSize={25} className="pane">
          <div className="pane-title">{active.name}</div>
          <div className="editor-wrap">
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
        </Panel>

        <PanelResizeHandle className="resize" />

        <Panel defaultSize={32} minSize={18} className="pane">
          <PanelGroup direction="vertical">
            <Panel
              defaultSize={simRunning ? 55 : 0}
              minSize={simRunning ? 25 : 0}
              className="sim-panel"
              style={{ display: simRunning ? "flex" : "none" }}
            >
              <div className="pane-title">z80sim — ET-Board Simulator</div>
              <div ref={simElRef} className="sim-wrap" />
            </Panel>

            {simRunning && <PanelResizeHandle className="resize-h" />}

            <Panel defaultSize={simRunning ? 45 : 100} minSize={18} className="pane">
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
        </Panel>
      </PanelGroup>
    </div>
  );
}
