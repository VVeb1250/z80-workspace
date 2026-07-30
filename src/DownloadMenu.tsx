import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { trackEvent } from "./analytics";
import type { ArtifactKind } from "./files/artifacts";
import { Icon } from "./Icon";
import { useApp } from "./state/AppState";

export default function DownloadMenu() {
  const {
    activeArtifacts,
    activeFile,
    busy,
    contentOf,
    download,
    downloadMany,
    focusOutput,
    onAssemble,
    readyArtifacts,
  } = useApp();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const toggle = () => {
    if (open) {
      close();
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const width = Math.min(390, window.innerWidth - 16);
      setPosition({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        top: rect.bottom + 4,
        width,
      });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        close();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const pick = (fileName: string, text: string, kind?: ArtifactKind) => {
    trackEvent(
      kind === "hex"
        ? "download-export-hex"
        : kind === "listing"
          ? "download-export-lst"
          : "download-export-asm",
    );
    download(fileName, text);
  };

  // Both products of the active file, and everything built across the
  // workspace — one lab hand-in is rarely a single artifact.
  const activeReady = activeArtifacts.flatMap((artifact) =>
    artifact.state === "ready" && artifact.text
      ? [{ fileName: artifact.fileName, text: artifact.text }]
      : [],
  );
  const activeNotBuilt = activeReady.length === 0;

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className="tbtn download-trigger"
        data-tour="export"
        onClick={toggle}
        ref={triggerRef}
        title="View or download build files"
      >
        <Icon name="download" />
        <span>Export</span>
        <Icon className="download-caret" name="chevron-down" size={14} />
      </button>
      {open &&
        createPortal(
          <div
            aria-label="Export files"
            className="download-menu export-menu"
            ref={menuRef}
            role="dialog"
            style={position}
          >
            <header className="export-header">
              <div>
                <strong>Export files</strong>
                <span>{activeFile}</span>
              </div>
            </header>

            <div className="export-artifacts">
              {activeArtifacts.map((artifact) => {
                const ready = artifact.state === "ready" && !!artifact.text;
                return (
                  <div className="export-artifact" key={artifact.kind}>
                    <div>
                      <strong>{artifact.fileName}</strong>
                      <span>
                        {artifact.label} ·{" "}
                        {artifact.state === "ready"
                          ? "Ready"
                          : artifact.state === "stale"
                            ? "Reassemble first"
                            : "Not built"}
                      </span>
                    </div>
                    <button
                      aria-label={`View ${artifact.fileName}`}
                      className="tbtn"
                      disabled={!ready}
                      onClick={() => {
                        close();
                        focusOutput(
                          artifact.kind === "hex" ? "hex" : "listing",
                          true,
                        );
                      }}
                      type="button"
                    >
                      View
                    </button>
                    <button
                      aria-label={`Download ${artifact.fileName}`}
                      className="tbtn primary"
                      disabled={!ready}
                      onClick={() =>
                        artifact.text &&
                        pick(artifact.fileName, artifact.text, artifact.kind)
                      }
                      type="button"
                    >
                      Download
                    </button>
                  </div>
                );
              })}
            </div>

            {/* One column of icon + label + count, so the rows below the
                artifact list read as a list and not as stray buttons. */}
            <div className="export-actions">
              {activeReady.length > 1 && (
                <button
                  className="export-action"
                  onClick={() => {
                    trackEvent("download-export-both");
                    downloadMany(activeReady);
                    close();
                  }}
                  type="button"
                >
                  <Icon name="download" size={15} />
                  <span className="export-action-label">
                    Download both build files
                  </span>
                  <span className="export-action-meta">
                    {activeReady.length}
                  </span>
                </button>
              )}

              {readyArtifacts.length > activeReady.length && (
                <button
                  className="export-action"
                  onClick={() => {
                    trackEvent("download-export-all");
                    downloadMany(readyArtifacts);
                    close();
                  }}
                  type="button"
                >
                  <Icon name="download" size={15} />
                  <span className="export-action-label">
                    Download every built file
                  </span>
                  <span className="export-action-meta">
                    {readyArtifacts.length}
                  </span>
                </button>
              )}

              <button
                className="export-action"
                onClick={() => pick(activeFile, contentOf(activeFile))}
                type="button"
              >
                <Icon name="file-code" size={15} />
                <span className="export-action-label">Assembly source</span>
                <span className="export-action-meta mono">{activeFile}</span>
              </button>

              {activeNotBuilt && (
                // Otherwise the menu is a wall of disabled buttons with no way
                // out — the thing the user actually needs is a build.
                <button
                  aria-busy={busy}
                  className="export-action accent"
                  disabled={busy}
                  onClick={() => {
                    close();
                    void onAssemble();
                  }}
                  type="button"
                >
                  <Icon name="hammer" size={15} />
                  <span className="export-action-label">
                    Assemble {activeFile} now
                  </span>
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
