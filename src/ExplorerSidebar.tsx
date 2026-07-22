import { useRef, useState } from "react";
import { Icon } from "./Icon";
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
    openInstructionReference,
    createFile,
    importFiles,
    commitRename,
    deleteFile,
    statusOf,
  } = useApp();

  const statusTitle: Record<string, string> = {
    none: "Not compiled",
    fresh: "Compiled and up to date",
    stale: "Source changed — assemble again",
  };
  const [edit, setEdit] = useState<Edit>(null);
  const [draft, setDraft] = useState("");
  const [dragging, setDragging] = useState(false);
  const finishing = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files;
    if (picked?.length) void importFiles(picked);
    event.target.value = ""; // allow re-importing the same file later
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files;
    if (dropped?.length) void importFiles(dropped);
  };

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

  const inputRow = (key: string) => (
    <li className="edit-row" key={key}>
      <input
        aria-label={
          edit?.mode === "rename"
            ? "Rename assembly file"
            : "New assembly file name"
        }
        autoFocus
        className="inline-input"
        onBlur={() => finish(true)}
        onChange={(event) => setDraft(event.target.value)}
        onFocus={(event) => event.currentTarget.select()}
        onKeyDown={(event) => {
          if (event.key === "Enter") finish(true);
          else if (event.key === "Escape") finish(false);
        }}
        placeholder="filename"
        spellCheck={false}
        value={draft}
      />
      <span className="ext-hint">.asm</span>
    </li>
  );

  return (
    <aside
      aria-label="Explorer"
      className="app-sidebar"
      style={{ flex: `0 0 ${width}px`, width }}
    >
      <div className="section-title">
        <div className="section-heading">
          <span>Explorer</span>
          <span
            aria-label={`${files.length} assembly files`}
            className="section-count"
          >
            {files.length}
          </span>
        </div>
        <div className="section-actions">
          <button
            aria-label="Import assembly files from disk"
            className="icon-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Import .asm files"
          >
            <Icon name="upload" size={16} />
          </button>
          <button
            aria-label="Create assembly file"
            className="icon-btn"
            onClick={startNew}
            title="New assembly file"
          >
            <Icon name="plus" size={16} />
          </button>
        </div>
      </div>

      <input
        accept=".asm,.z80,.s,.inc,.txt,text/plain"
        className="hidden-file-input"
        multiple
        onChange={onPick}
        ref={fileInputRef}
        type="file"
      />

      <ul
        aria-label="Assembly files"
        className={`filelist source-files${dragging ? " drop-active" : ""}`}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDrop={onDrop}
      >
        {files.map((file) => {
          if (edit?.mode === "rename" && edit.name === file.name) {
            return inputRow(file.name);
          }

          const compileStatus = statusOf(file.name);
          return (
            <li
              className={file.name === activeFile ? "active" : ""}
              key={file.name}
            >
              <button
                aria-current={file.name === activeFile ? "true" : undefined}
                aria-label={`${file.name}, ${statusTitle[compileStatus]}`}
                className="file-open"
                onClick={() => openFile(file.name)}
                onDoubleClick={() => startRename(file.name)}
                title={`Open ${file.name}`}
              >
                <span
                  aria-hidden="true"
                  className={`cstatus ${compileStatus}`}
                  title={statusTitle[compileStatus]}
                />
                <Icon className="file-icon" name="file-code" size={15} />
                <span className="fname">{file.name}</span>
              </button>
              <span className="file-actions">
                <button
                  aria-label={`Rename ${file.name}`}
                  className="icon-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    startRename(file.name);
                  }}
                  title="Rename"
                >
                  <Icon name="pencil" size={15} />
                </button>
                <button
                  aria-label={`Delete ${file.name}`}
                  className="icon-btn danger-icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteFile(file.name);
                  }}
                  title="Delete"
                >
                  <Icon name="trash" size={15} />
                </button>
              </span>
            </li>
          );
        })}
        {edit?.mode === "new" && inputRow("__new")}
      </ul>

      <div className="section-title tool-heading">
        <span>Toolchain</span>
        <span className="readonly-label">
          <Icon name="lock" size={12} /> Read-only
        </span>
      </div>
      <ul
        aria-label="Read-only toolchain files"
        className="filelist tool-files"
      >
        <li className="tool-doc">
          <button
            className="file-open tool-file-open"
            onClick={openInstructionReference}
            title="Open Z80 instruction reference"
            type="button"
          >
            <Icon name="book-open" size={14} />
            <span className="fname">Z80 Instructions</span>
          </button>
        </li>
        {TOOL_FILES.map((file) => (
          <li className="muted readonly" key={file}>
            <Icon name="file" size={14} />
            <span className="fname">{file}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
