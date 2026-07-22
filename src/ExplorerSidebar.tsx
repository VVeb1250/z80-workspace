import { useApp } from "./state/AppState";

const TOOL_FILES = [
  "C16.EXE",
  "C16SORT.EXE",
  "Z80.TBL",
  "ASSEMBLE.DAT",
  "UNASSEM.DAT",
  "z80sim.exe",
];

// Fixed left sidebar (outside dockview), like the VS Code / JetBrains project
// pane: not a closeable tab, collapsible via the toolbar toggle.
export default function ExplorerSidebar() {
  const { files, activeFile, openFile, newFile, renameFile, deleteFile } =
    useApp();

  return (
    <aside className="sidebar">
      <div className="section-title">
        <span>Explorer</span>
        <button className="icon-btn" title="New file" onClick={newFile}>
          +
        </button>
      </div>
      <ul className="filelist">
        {files.map((f) => (
          <li
            key={f.name}
            className={f.name === activeFile ? "active" : ""}
            onClick={() => openFile(f.name)}
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
