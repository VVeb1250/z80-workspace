import { useRef, useState } from "react";
import { useApp } from "./state/AppState";

const TOOL_FILES = [
  "C16.EXE",
  "C16SORT.EXE",
  "Z80.TBL",
  "ASSEMBLE.DAT",
  "UNASSEM.DAT",
  "z80sim.exe",
];

type Edit = { mode: "new" } | { mode: "rename"; name: string } | null;

// Fixed left sidebar (outside dockview), like the VS Code / JetBrains project
// pane. New / rename use an inline input row (VS Code style) — no native
// prompt() dialogs.
export default function ExplorerSidebar({ width }: { width: number }) {
  const {
    files,
    activeFile,
    openFile,
    createFile,
    commitRename,
    deleteFile,
    statusOf,
  } = useApp();

  const statusTitle: Record<string, string> = {
    none: "Not compiled",
    fresh: "Compiled (up to date)",
    stale: "Compiled — source changed since (recompile)",
  };
  const [edit, setEdit] = useState<Edit>(null);
  const [draft, setDraft] = useState("");
  const finishing = useRef(false);

  const startNew = () => {
    setDraft("");
    setEdit({ mode: "new" });
  };
  const startRename = (name: string) => {
    setDraft(name.replace(/\.asm$/i, ""));
    setEdit({ mode: "rename", name });
  };

  const finish = (save: boolean) => {
    if (finishing.current || !edit) return;
    finishing.current = true;
    if (save) {
      if (edit.mode === "new") createFile(draft);
      else commitRename(edit.name, draft);
    }
    setEdit(null);
    setDraft("");
    setTimeout(() => {
      finishing.current = false;
    }, 0);
  };

  const inputRow = (extraClass = "") => (
    <li className={"edit-row " + extraClass}>
      <input
        className="inline-input"
        autoFocus
        spellCheck={false}
        value={draft}
        placeholder="filename"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") finish(true);
          else if (e.key === "Escape") finish(false);
        }}
        onBlur={() => finish(true)}
      />
      <span className="ext-hint">.asm</span>
    </li>
  );

  return (
    <aside
      className="app-sidebar"
      style={{ flex: `0 0 ${width}px`, width }}
    >
      <div className="section-title">
        <span>Explorer</span>
        <button className="icon-btn" title="New file" onClick={startNew}>
          +
        </button>
      </div>
      <ul className="filelist">
        {files.map((f) =>
          edit?.mode === "rename" && edit.name === f.name ? (
            <div key={f.name}>{inputRow()}</div>
          ) : (
            <li
              key={f.name}
              className={f.name === activeFile ? "active" : ""}
              onClick={() => openFile(f.name)}
            >
              <span
                className={"cstatus " + statusOf(f.name)}
                title={statusTitle[statusOf(f.name)]}
              />
              <span className="fname">{f.name}</span>
              <span className="file-actions">
                <button
                  className="icon-btn"
                  title="Rename"
                  onClick={(e) => {
                    e.stopPropagation();
                    startRename(f.name);
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
          ),
        )}
        {edit?.mode === "new" && inputRow()}
      </ul>
      <div className="section-title">micro_processor (read-only)</div>
      <ul className="filelist">
        {TOOL_FILES.map((f) => (
          <li key={f} className="muted readonly">
            {f}
          </li>
        ))}
      </ul>
    </aside>
  );
}
