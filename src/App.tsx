import { useEffect, useRef, useState } from "react";
import Dock from "./Dock";
import Toolbar from "./Toolbar";
import ExplorerSidebar from "./ExplorerSidebar";
import { AppStateProvider, useApp } from "./state/AppState";
import "./App.css";

const SIDEBAR_MIN = 150;
const SIDEBAR_MAX = 600;
const clampWidth = (w: number) =>
  Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, w));

function Shell() {
  const { sidebarOpen, toggleSidebar } = useApp();
  const workbenchRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = Number(localStorage.getItem("sidebarWidth"));
    return saved ? clampWidth(saved) : 230;
  });

  // Ctrl+B toggles the sidebar, like VS Code.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleSidebar]);

  // Drag the divider to resize the Explorer.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const left = workbenchRef.current?.getBoundingClientRect().left ?? 0;
      setSidebarWidth(clampWidth(e.clientX - left));
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarWidth", String(sidebarWidth));
  }, [sidebarWidth]);

  const startDrag = () => {
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div className="app">
      <Toolbar />
      <div className="workbench" ref={workbenchRef}>
        {sidebarOpen && (
          <>
            <ExplorerSidebar width={sidebarWidth} />
            <div
              className="resize"
              onMouseDown={startDrag}
              title="Drag to resize"
            />
          </>
        )}
        <div className="dock-host">
          <Dock />
        </div>
      </div>
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
