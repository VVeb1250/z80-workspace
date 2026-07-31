import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Dock from "./Dock";
import Toolbar from "./Toolbar";
import ExplorerSidebar from "./ExplorerSidebar";
import OutputFooter from "./panels/OutputFooter";
import GuidedTour from "./tutorial/GuidedTour";
import { applyWorkspaceTheme } from "./editor/z80Theme";
import { useNarrowLayout } from "./responsive";
import { AppStateProvider, useApp } from "./state/AppState";
import "./App.css";

const SIDEBAR_MIN = 150;
const SIDEBAR_MAX = 600;
const clampWidth = (w: number) =>
  Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, w));

function Shell() {
  const {
    clearDownloadToast,
    closeSidebar,
    downloadToast,
    settings,
    sidebarOpen,
    outputMaximized,
  } = useApp();
  const workbenchRef = useRef<HTMLDivElement>(null);
  // Below the narrow breakpoint the Explorer stops being a pane and becomes an
  // overlay drawer: at 390px a 230px pane leaves no editor to speak of.
  const narrow = useNarrowLayout();
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = Number(localStorage.getItem("sidebarWidth"));
    return saved ? clampWidth(saved) : 230;
  });

  useLayoutEffect(() => {
    applyWorkspaceTheme(document.documentElement, settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    localStorage.setItem("sidebarWidth", String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    if (!downloadToast) return;
    const timer = window.setTimeout(clearDownloadToast, 2800);
    return () => window.clearTimeout(timer);
  }, [clearDownloadToast, downloadToast]);

  // Escape closes the drawer, the usual way out of a modal overlay.
  useEffect(() => {
    if (!narrow || !sidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSidebar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeSidebar, narrow, sidebarOpen]);

  // Drag the divider to resize the Explorer. Pointer events (not mouse events)
  // so this works with a finger or a stylus too; pointer capture keeps the
  // stream coming even when the pointer outruns the 4px handle.
  const startDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onDragMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const left = workbenchRef.current?.getBoundingClientRect().left ?? 0;
    setSidebarWidth(clampWidth(event.clientX - left));
  }, []);

  const endDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const resizeWithKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowLeft" ? -1 : 1;
    setSidebarWidth((current) => clampWidth(current + direction * 12));
  };

  return (
    <div className="app">
      <Toolbar />
      <div
        className={`workbench${narrow ? " narrow" : ""}`}
        ref={workbenchRef}
      >
        {narrow && sidebarOpen && (
          <button
            aria-label="Close Explorer"
            className="scrim"
            onClick={closeSidebar}
            type="button"
          />
        )}
        {sidebarOpen && (
          <>
            {/* In drawer mode the width comes from CSS (a share of the
                viewport), so the dragged pane width is not applied. */}
            <ExplorerSidebar
              onNavigate={narrow ? closeSidebar : undefined}
              width={narrow ? null : sidebarWidth}
            />
            {!narrow && (
              <div
                aria-label="Resize Explorer"
                aria-orientation="vertical"
                aria-valuemax={SIDEBAR_MAX}
                aria-valuemin={SIDEBAR_MIN}
                aria-valuenow={sidebarWidth}
                className="resize"
                onKeyDown={resizeWithKeyboard}
                onLostPointerCapture={endDrag}
                onPointerDown={startDrag}
                onPointerMove={onDragMove}
                onPointerUp={endDrag}
                role="separator"
                tabIndex={0}
                title="Drag to resize"
              />
            )}
          </>
        )}
        <div
          className={`dock-host${outputMaximized ? " output-maximized" : ""}`}
        >
          <div className="dock-area">
            <Dock />
          </div>
          <OutputFooter />
        </div>
      </div>
      <GuidedTour />
      {downloadToast && (
        <div aria-live="polite" className="download-toast" role="status">
          {downloadToast}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  );
}
