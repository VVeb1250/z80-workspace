import { useRef, useState } from "react";
import { baseNameOf, dos83Base, isDosNameTruncated } from "./files/store";
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
//
// `width: null` means drawer mode (narrow viewports): the Explorer floats over
// the editor and CSS sizes it, so the dragged pane width does not apply.
// `onNavigate` then closes the drawer once the user has picked something —
// leaving it open on top of the file they just opened is the classic drawer
// mistake.
export default function ExplorerSidebar({
  onNavigate,
  width,
}: {
  onNavigate?: () => void;
  width: number | null;
}) {
  const {
    files,
    activeFile,
    openFile,
    openInstructionReference,
    openSimGuide,
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

  // What DOS will actually call the file being typed. Cross-16 runs in DOSBox,
  // so anything past 8 characters is dropped — show that before it surprises
  // the user in the Output tabs.
  const draftDosBase = dos83Base(draft);
  const draftTruncated =
    draft.trim().length > 0 && baseNameOf(draft) !== draftDosBase;

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
      {draftTruncated && (
        <span className="dos-name-hint" role="note">
          builds as {draftDosBase}.asm
        </span>
      )}
    </li>
  );

  const drawer = width === null;
  // Everything that puts a different thing on screen also dismisses the drawer.
  const navigate = (open: () => void) => () => {
    open();
    onNavigate?.();
  };

  return (
    <aside
      aria-label="Explorer"
      aria-modal={drawer ? true : undefined}
      className={`app-sidebar${drawer ? " drawer" : ""}`}
      role={drawer ? "dialog" : undefined}
      style={drawer ? undefined : { flex: `0 0 ${width}px`, width }}
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
            <Icon name="import" size={16} />
          </button>
          <button
            aria-label="Create assembly file"
            className="icon-btn"
            data-tour="write"
            onClick={startNew}
            title="New assembly file"
          >
            <Icon name="plus" size={16} />
          </button>
          {/* Drawer mode only: the scrim and Escape also dismiss it, but a
              visible X is the affordance people actually look for, and on a
              390px screen the scrim is a 70px strip. */}
          {drawer && (
            <button
              aria-label="Close Explorer"
              className="icon-btn drawer-close"
              onClick={onNavigate}
              title="Close Explorer"
              type="button"
            >
              <Icon name="x" size={16} />
            </button>
          )}
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
          const dosBase = dos83Base(file.name);
          const truncated = isDosNameTruncated(file.name);
          const dosNote = `DOS 8.3 name: builds as ${dosBase}.h and ${dosBase}.lst`;
          return (
            <li
              className={file.name === activeFile ? "active" : ""}
              key={file.name}
            >
              <button
                aria-current={file.name === activeFile ? "true" : undefined}
                aria-label={
                  truncated
                    ? `${file.name}, ${statusTitle[compileStatus]}, ${dosNote}`
                    : `${file.name}, ${statusTitle[compileStatus]}`
                }
                className="file-open"
                onClick={navigate(() => openFile(file.name))}
                onDoubleClick={() => startRename(file.name)}
                title={
                  truncated ? `Open ${file.name}\n${dosNote}` : `Open ${file.name}`
                }
              >
                <span
                  aria-hidden="true"
                  className={`cstatus ${compileStatus}`}
                  title={statusTitle[compileStatus]}
                />
                <Icon className="file-icon" name="file-code" size={15} />
                <span className="fname">{file.name}</span>
                {truncated && (
                  <span aria-hidden="true" className="dos-badge" title={dosNote}>
                    {dosBase}
                  </span>
                )}
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
            data-tour="instructions"
            onClick={navigate(openInstructionReference)}
            title="Open Z80 instruction reference"
            type="button"
          >
            <Icon name="book-open" size={14} />
            <span className="fname">Z80 Instructions</span>
          </button>
        </li>
        <li className="tool-doc">
          <button
            className="file-open tool-file-open"
            onClick={navigate(openSimGuide)}
            title="Open the Z80sim key reference"
            type="button"
          >
            <Icon name="book-open" size={14} />
            <span className="fname">Z80sim Guide</span>
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
