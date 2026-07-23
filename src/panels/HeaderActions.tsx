import { useEffect, useState } from "react";
import type { IDockviewHeaderActionsProps } from "dockview-react";
import { Icon } from "../Icon";

// Per-group control on the right of the tab bar: maximize / restore. The output
// channels are a fixed footer outside dockview, so no output-specific controls
// live here anymore.
export function RightHeaderActions(props: IDockviewHeaderActionsProps) {
  const [maximized, setMaximized] = useState(props.api.isMaximized());

  useEffect(() => {
    const d = props.containerApi.onDidMaximizedGroupChange(() =>
      setMaximized(props.api.isMaximized()),
    );
    return () => d.dispose();
  }, [props.containerApi, props.api]);

  const toggle = () =>
    props.api.isMaximized() ? props.api.exitMaximized() : props.api.maximize();

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
    </div>
  );
}
