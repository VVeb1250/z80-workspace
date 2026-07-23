import { Icon } from "../Icon";
import { useApp, type OutputTab } from "../state/AppState";

// One output channel = one dockview tab (VS Code panel style). The tabs
// (Console / Listing / Hex) live in the dockview header; this just renders the
// selected channel's text.
export default function ConsolePanel({ channel }: { channel: OutputTab }) {
  const { result, activeArtifact, settings } = useApp();

  // Console = the last compiler run's messages (an action log). Listing / Hex
  // are per-file build products, so they follow the file being viewed, not
  // whichever file was assembled last.
  const text =
    channel === "console"
      ? result?.stdout
      : channel === "listing"
        ? activeArtifact?.lst
        : activeArtifact?.hex;

  if (!text) {
    const copy = {
      console: {
        title: "No build output yet",
        description: "Assemble the active file to run C16 and see compiler messages here.",
      },
      listing: {
        title: "No listing generated",
        description: "A successful assembly creates an annotated listing for the active file.",
      },
      hex: {
        title: "No Intel HEX generated",
        description: "Assemble the active file to create a HEX image ready for the simulator.",
      },
    }[channel];

    return (
      <div className="panel-fill output-empty">
        <span className="empty-icon"><Icon name="terminal" size={22} /></span>
        <strong>{copy.title}</strong>
        <p>{copy.description}</p>
        {channel === "console" && <kbd>Ctrl + Enter</kbd>}
      </div>
    );
  }

  return (
    <div className="panel-fill">
      <pre
        aria-live={channel === "console" ? "polite" : "off"}
        className="output"
        style={{ fontSize: `${settings.outputFontSize}px` }}
      >
        {text}
      </pre>
    </div>
  );
}
