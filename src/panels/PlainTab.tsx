import type { IDockviewPanelHeaderProps } from "dockview-react";
import { useApp, type OutputTab } from "../state/AppState";

// A dockview tab with no close (×) button, used for the output channels so the
// Console / Listing / Hex tabs can't be closed individually. Clicking a tab
// also expands the panel if it was collapsed (focusOutput handles both).
export function PlainTab(props: IDockviewPanelHeaderProps<{ channel: OutputTab }>) {
  const { focusOutput } = useApp();
  const channel = props.params.channel;

  return (
    <div
      className="dv-default-tab plain-tab"
      onClick={() => focusOutput(channel)}
    >
      <span className="dv-default-tab-content">{props.api.title}</span>
    </div>
  );
}
