import { useEffect } from "react";
import Dock from "./Dock";
import Toolbar from "./Toolbar";
import ExplorerSidebar from "./ExplorerSidebar";
import { AppStateProvider, useApp } from "./state/AppState";
import "./App.css";

function Shell() {
  const { sidebarOpen, toggleSidebar } = useApp();

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

  return (
    <div className="app">
      <Toolbar />
      <div className="workbench">
        {sidebarOpen && <ExplorerSidebar />}
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
