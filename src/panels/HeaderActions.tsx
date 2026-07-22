import { useEffect, useState } from "react";
import type { IDockviewHeaderActionsProps } from "dockview-react";

// Per-group maximize / restore control, rendered on the right of each tab bar.
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
        className="dv-action-btn"
        onClick={toggle}
        title={maximized ? "Restore panel" : "Maximize panel"}
      >
        {maximized ? "❐" : "▢"}
      </button>
    </div>
  );
}
