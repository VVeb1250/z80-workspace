import { useEffect, useRef, useState } from "react";
import { trackEvent } from "../analytics";
import { Icon } from "../Icon";
import BuildSuccessActions from "./BuildSuccessActions";
import ConsolePanel from "./ConsolePanel";
import {
  OUTPUT_HEIGHT,
  OUTPUT_TABS,
  outputTitle,
  useApp,
  type OutputTab,
} from "../state/AppState";

const MIN_H = 80;
const MAX_H = 640;
const clampH = (h: number) => Math.min(MAX_H, Math.max(MIN_H, h));

// The output channels (Console / Listing / Hex) as a fixed footer below the
// dock — never a dockview panel, so it can't be dragged, reordered, or pushed
// aside by editor splits. It stays pinned to the bottom, always.
export default function OutputFooter() {
  const {
    activeArtifact,
    activeFile,
    activeOutputTab,
    baseName,
    busy,
    download,
    focusOutput,
    onAssemble,
    outputCollapsed,
    statusOf,
    toggleOutputCollapsed,
    outputMaximized,
    toggleOutputMaximized,
  } = useApp();
  // Build time of the artifacts the Listing / Hex tabs are showing.
  const builtAt = activeArtifact?.compiledAt
    ? new Date(activeArtifact.compiledAt).toLocaleTimeString()
    : null;
  // The Listing / Hex tabs show a build older than the current source.
  const stale = statusOf(activeFile) === "stale";
  // The file a channel is showing. Console is a log, not a file.
  const fileFor = (tab: OutputTab) =>
    tab === "hex"
      ? { name: `${baseName}.h`, text: activeArtifact?.hex }
      : { name: `${baseName}.lst`, text: activeArtifact?.lst };
  const rootRef = useRef<HTMLElement>(null);
  const dragging = useRef(false);
  const [height, setHeight] = useState(() => {
    const saved = Number(localStorage.getItem("outputHeight"));
    return saved ? clampH(saved) : OUTPUT_HEIGHT;
  });

  useEffect(() => {
    localStorage.setItem("outputHeight", String(height));
  }, [height]);

  // Drag the top divider to resize (height grows as the pointer moves up).
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const bottom = rootRef.current?.getBoundingClientRect().bottom ?? 0;
      setHeight(clampH(bottom - e.clientY));
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

  const startDrag = () => {
    if (outputCollapsed) return;
    dragging.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };

  const resizeWithKeyboard = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    setHeight((h) => clampH(h + (e.key === "ArrowUp" ? 12 : -12)));
  };

  return (
    <section
      aria-label="Output"
      className={`output-footer ${outputCollapsed ? "collapsed" : ""}${
        outputMaximized ? " maximized" : ""
      }`}
      data-tour="output"
      ref={rootRef}
      style={outputCollapsed || outputMaximized ? undefined : { height }}
    >
      {!outputCollapsed && !outputMaximized && (
        <div
          aria-label="Resize output"
          aria-orientation="horizontal"
          className="output-resize"
          onKeyDown={resizeWithKeyboard}
          onMouseDown={startDrag}
          role="separator"
          tabIndex={0}
          title="Drag to resize"
        />
      )}
      <div className="output-header">
        <div className="output-tabs" role="tablist">
          {OUTPUT_TABS.map((tab) => {
            const label = outputTitle(tab, baseName);
            const file = fileFor(tab);
            return (
              // Output tabs have no close button, so that slot carries the
              // action for what the tab shows: rerun the compiler on Console,
              // save the file on Listing / Hex.
              <span className="output-tab-wrap" key={tab} role="presentation">
                <button
                  aria-selected={!outputCollapsed && activeOutputTab === tab}
                  className={
                    !outputCollapsed && activeOutputTab === tab
                      ? "output-tab active"
                      : "output-tab"
                  }
                  onClick={() => focusOutput(tab)}
                  role="tab"
                  title={
                    tab === "console"
                      ? "Compiler messages from the last run"
                      : builtAt
                        ? `${label} — built ${builtAt}`
                        : `${label} — not built yet`
                  }
                  type="button"
                >
                  {label}
                  {tab !== "console" && stale && (
                    <span
                      aria-label="built from older source"
                      className="tab-stale"
                      role="img"
                    />
                  )}
                </button>
                {tab === "console" ? (
                  <button
                    aria-busy={busy}
                    aria-label={`Assemble ${activeFile} again`}
                    className="tab-action"
                    disabled={busy}
                    onClick={() => {
                      trackEvent("assemble-console-command");
                      void onAssemble();
                    }}
                    title={`Assemble ${activeFile} again (Ctrl+S)`}
                    type="button"
                  >
                    <Icon
                      className={busy ? "spin" : ""}
                      name={busy ? "loader" : "hammer"}
                      size={13}
                    />
                  </button>
                ) : (
                  <button
                    aria-label={`Download ${file.name}`}
                    className="tab-action"
                    disabled={!file.text || stale}
                    onClick={() => {
                      if (!file.text) return;
                      trackEvent(
                        tab === "hex"
                          ? "download-output-hex"
                          : "download-output-lst",
                      );
                      download(file.name, file.text);
                    }}
                    title={
                      stale
                        ? `${file.name} is stale — assemble again`
                        : file.text
                        ? `Download ${file.name}`
                        : `${file.name} is not built yet`
                    }
                    type="button"
                  >
                    <Icon name="download" size={13} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
        <div className="output-actions">
          <button
            aria-label={outputMaximized ? "Restore output" : "Maximize output"}
            aria-pressed={outputMaximized}
            className="dv-action-btn"
            onClick={toggleOutputMaximized}
            title={outputMaximized ? "Restore output" : "Maximize output"}
          >
            <Icon name={outputMaximized ? "restore" : "maximize"} size={16} />
          </button>
          <button
            aria-expanded={!outputCollapsed}
            aria-label={outputCollapsed ? "Show output" : "Hide output"}
            className="dv-action-btn"
            onClick={toggleOutputCollapsed}
            title={outputCollapsed ? "Show output" : "Hide output"}
          >
            <Icon
              name={outputCollapsed ? "chevron-up" : "chevron-down"}
              size={16}
            />
          </button>
        </div>
      </div>
      {!outputCollapsed && (
        <div className="output-body">
          {activeOutputTab === "console" && <BuildSuccessActions />}
          <ConsolePanel channel={activeOutputTab} />
        </div>
      )}
    </section>
  );
}
