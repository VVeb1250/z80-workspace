import { useApp } from "../state/AppState";

const TOOL_FILES = [
  "C16.EXE",
  "C16SORT.EXE",
  "Z80.TBL",
  "ASSEMBLE.DAT",
  "UNASSEM.DAT",
  "z80sim.exe",
];

export default function ExplorerPanel() {
  const { files, active, selectFile, newFile, renameFile, deleteFile } =
    useApp();

  return (
    <div className="panel-fill explorer">
      <div className="section-title">
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
      <div className="section-title">micro_processor (read-only)</div>
      <ul className="filelist">
        {TOOL_FILES.map((f) => (
          <li key={f} className="muted readonly">
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
