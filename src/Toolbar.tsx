import { useApp } from "./state/AppState";

export default function Toolbar() {
  const {
    onAssemble,
    busy,
    result,
    download,
    baseName,
    statusText,
    simRunning,
    toggleSimulator,
  } = useApp();

  return (
    <header className="toolbar">
      <span className="brand">Z80 Workspace</span>
      <button className="tbtn primary" onClick={onAssemble} disabled={busy}>
        {busy ? "…" : "Assemble (C16)"}
      </button>
      <button
        className="tbtn"
        disabled={!result?.hex}
        onClick={() => result && download(`${baseName}.hex`, result.hex)}
      >
        Export .hex
      </button>
      <button
        className="tbtn"
        disabled={!result?.listing}
        onClick={() => result && download(`${baseName}.lst`, result.listing)}
      >
        Export .lst
      </button>
      <button
        className={"tbtn sim-btn " + (simRunning ? "running" : "idle")}
        onClick={toggleSimulator}
      >
        <span className="sim-dot" />
        {simRunning ? "Stop z80sim" : "Run z80sim"}
      </button>
      <span
        className={
          "status " + (result ? (result.errorCount === 0 ? "ok" : "err") : "")
        }
      >
        {statusText}
      </span>
    </header>
  );
}
