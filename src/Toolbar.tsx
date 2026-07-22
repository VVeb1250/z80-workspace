import { useEffect } from "react";
import DownloadMenu from "./DownloadMenu";
import { Icon } from "./Icon";
import SettingsMenu from "./SettingsMenu";
import { useApp } from "./state/AppState";

export default function Toolbar() {
  const {
    onAssemble,
    busy,
    result,
    statusText,
    simRunning,
    toggleSimulator,
    toggleSidebar,
    sidebarOpen,
  } = useApp();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "Enter" &&
        !busy
      ) {
        event.preventDefault();
        void onAssemble();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onAssemble]);

  const statusKind = busy
    ? "busy"
    : result
      ? result.errorCount === 0
        ? "ok"
        : "err"
      : "idle";

  return (
    <header className="toolbar">
      <button
        aria-expanded={sidebarOpen}
        aria-label={sidebarOpen ? "Hide Explorer" : "Show Explorer"}
        className="icon-btn toolbar-icon-btn sb-toggle"
        title="Toggle sidebar (Ctrl+B)"
        onClick={toggleSidebar}
      >
        <Icon name="panel-left" />
      </button>
      <strong className="brand">Z80 Workspace</strong>
      <nav className="toolbar-actions" aria-label="Workspace actions">
        <button
          aria-busy={busy}
          aria-keyshortcuts="Control+Enter Meta+Enter"
          className="tbtn primary"
          onClick={() => void onAssemble()}
          disabled={busy}
          title="Assemble active file (Ctrl+Enter)"
        >
          <Icon name={busy ? "loader" : "hammer"} className={busy ? "spin" : ""} />
          <span>{busy ? "Assembling…" : "Assemble"}</span>
        </button>
        <DownloadMenu />
        <button
          aria-pressed={simRunning}
          className={`tbtn sim-btn ${simRunning ? "running" : "idle"}`}
          onClick={toggleSimulator}
          title={simRunning ? "Stop the simulator" : "Open and run the simulator"}
        >
          <Icon name={simRunning ? "stop" : "play"} />
          <span>{simRunning ? "Stop simulator" : "Run simulator"}</span>
        </button>
      </nav>
      <span
        aria-atomic="true"
        aria-live="polite"
        className={`status ${statusKind}`}
        role="status"
      >
        <Icon
          name={
            statusKind === "ok"
              ? "check-circle"
              : statusKind === "err"
                ? "alert-circle"
                : statusKind === "busy"
                  ? "loader"
                  : "terminal"
          }
          className={statusKind === "busy" ? "spin" : ""}
        />
        <span>{statusText}</span>
      </span>
      <SettingsMenu />
    </header>
  );
}
