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
    openWelcome,
  } = useApp();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const hasCommandKey = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      const isAssembleShortcut =
        hasCommandKey && (key === "s" || key === "enter");

      if (!isAssembleShortcut) return;

      event.preventDefault();
      if (!busy) {
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
        title="Toggle sidebar"
        onClick={toggleSidebar}
      >
        <Icon name="panel-left" />
      </button>
      <strong className="brand">Z80 Workspace</strong>
      <nav className="toolbar-actions" aria-label="Workspace actions">
        <button
          aria-busy={busy}
          aria-keyshortcuts="Control+S Meta+S Control+Enter Meta+Enter"
          className="tbtn primary"
          data-tour="assemble"
          onClick={() => void onAssemble()}
          disabled={busy}
          title="Assemble active file with C16 (Ctrl+S / Ctrl+Enter)"
        >
          <Icon name={busy ? "loader" : "hammer"} className={busy ? "spin" : ""} />
          <span>{busy ? "Assembling…" : "Assemble (C16)"}</span>
        </button>
        <DownloadMenu />
        <button
          aria-pressed={simRunning}
          className={`tbtn sim-btn ${simRunning ? "running" : "idle"}`}
          data-tour="run"
          onClick={toggleSimulator}
          title={simRunning ? "Stop z80sim" : "Open and run z80sim"}
        >
          <Icon name={simRunning ? "stop" : "play"} />
          <span>{simRunning ? "Stop z80sim" : "Run z80sim"}</span>
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
      <button
        className="icon-btn toolbar-icon-btn"
        data-tour="help"
        onClick={openWelcome}
        title="Getting started / tutorial"
        aria-label="Getting started"
      >
        <Icon name="help-circle" size={16} />
      </button>
      <SettingsMenu />
    </header>
  );
}
