import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { useApp } from "./state/AppState";

// Downloads for the active file, consolidated into one labeled dropdown:
// the .asm source (always available) plus the build outputs (.h / .lst,
// enabled once assembled). Each item names its exact filename.
export default function DownloadMenu() {
  const { activeArtifact, activeFile, contentOf, download, baseName } = useApp();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const hex = activeArtifact?.hex;
  const lst = activeArtifact?.lst;

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
      const width = 220;
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

  const pick = (fileName: string, text: string) => {
    download(fileName, text);
    close(true);
  };

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="tbtn download-trigger"
        onClick={toggle}
        ref={triggerRef}
        title="Download source or build output"
      >
        <Icon name="download" />
        <span>Download</span>
        <Icon className="download-caret" name="chevron-down" size={14} />
      </button>
      {open &&
        createPortal(
          <div className="download-menu" ref={menuRef} role="menu" style={position}>
            <button
              className="menu-item"
              onClick={() => pick(activeFile, contentOf(activeFile))}
              role="menuitem"
              type="button"
            >
              <span className="menu-item-main">Assembly source</span>
              <span className="menu-item-hint">{activeFile}</span>
            </button>
            <button
              className="menu-item"
              disabled={!hex}
              onClick={() => hex && pick(`${baseName}.h`, hex)}
              role="menuitem"
              type="button"
            >
              <span className="menu-item-main">Intel HEX</span>
              <span className="menu-item-hint">{baseName}.h</span>
            </button>
            <button
              className="menu-item"
              disabled={!lst}
              onClick={() => lst && pick(`${baseName}.lst`, lst)}
              role="menuitem"
              type="button"
            >
              <span className="menu-item-main">Listing</span>
              <span className="menu-item-hint">{baseName}.lst</span>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
