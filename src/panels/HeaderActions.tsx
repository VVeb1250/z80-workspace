import { useEffect, useState } from "react";
import type { IDockviewHeaderActionsProps } from "dockview-react";
import { Icon } from "../Icon";
import { isOutputId, useApp } from "../state/AppState";

// Per-group controls on the right of the tab bar: maximize/restore, plus a
// collapse/expand toggle on the output group (its tabs aren't closable, so the
// pre.output body is hidden here while the tabs stay). Maximize sits to the
// left of the collapse button.
export function RightHeaderActions(props: IDockviewHeaderActionsProps) {
  const { outputCollapsed, toggleOutputCollapsed } = useApp();
  const [maximized, setMaximized] = useState(props.api.isMaximized());

  useEffect(() => {
    const d = props.containerApi.onDidMaximizedGroupChange(() =>
      setMaximized(props.api.isMaximized()),
    );
    return () => d.dispose();
  }, [props.containerApi, props.api]);

  const toggle = () =>
    props.api.isMaximized() ? props.api.exitMaximized() : props.api.maximize();

  const isOutputGroup = props.group.panels.some((p) => isOutputId(p.id));

  return (
    <div className="dv-actions">
      <button
        aria-label={maximized ? "Restore panel" : "Maximize panel"}
        className="dv-action-btn"
        onClick={toggle}
        title={maximized ? "Restore panel" : "Maximize panel"}
      >
        <Icon name={maximized ? "restore" : "maximize"} size={16} />
      </button>
      {isOutputGroup && (
        <button
          aria-expanded={!outputCollapsed}
          aria-label={outputCollapsed ? "Show output" : "Hide output"}
          className="dv-action-btn"
          onClick={toggleOutputCollapsed}
          title={outputCollapsed ? "Show output" : "Hide output"}
        >
          <Icon name={outputCollapsed ? "chevron-up" : "chevron-down"} size={16} />
        </button>
      )}
    </div>
  );
}
