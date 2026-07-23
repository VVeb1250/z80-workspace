import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import ConsolePanel from "./ConsolePanel";
import {
  OUTPUT_HEIGHT,
  OUTPUT_TABS,
  outputTitle,
  useApp,
} from "../state/AppState";

const MIN_H = 80;
const MAX_H = 640;
const clampH = (h: number) => Math.min(MAX_H, Math.max(MIN_H, h));

// The output channels (Console / Listing / Hex) as a fixed footer below the
// dock — never a dockview panel, so it can't be dragged, reordered, or pushed
// aside by editor splits. It stays pinned to the bottom, always.
export default function OutputFooter() {
  const { activeOutputTab, focusOutput, outputCollapsed, toggleOutputCollapsed } =
    useApp();
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
      className={`output-footer ${outputCollapsed ? "collapsed" : ""}`}
      data-tour="output"
      ref={rootRef}
      style={outputCollapsed ? undefined : { height }}
    >
      {!outputCollapsed && (
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
          {OUTPUT_TABS.map((tab) => (
            <button
              aria-selected={!outputCollapsed && activeOutputTab === tab}
              className={
                !outputCollapsed && activeOutputTab === tab
                  ? "output-tab active"
                  : "output-tab"
              }
              key={tab}
              onClick={() => focusOutput(tab)}
              role="tab"
              type="button"
            >
              {outputTitle(tab)}
            </button>
          ))}
        </div>
        <button
          aria-expanded={!outputCollapsed}
          aria-label={outputCollapsed ? "Show output" : "Hide output"}
          className="dv-action-btn"
          onClick={toggleOutputCollapsed}
          title={outputCollapsed ? "Show output" : "Hide output"}
        >
          <Icon name={outputCollapsed ? "chevron-up" : "chevron-down"} size={16} />
        </button>
      </div>
      {!outputCollapsed && (
        <div className="output-body">
          <ConsolePanel channel={activeOutputTab} />
        </div>
      )}
    </section>
  );
}
