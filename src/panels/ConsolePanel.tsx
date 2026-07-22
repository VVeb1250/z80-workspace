import { useApp, type OutputTab } from "../state/AppState";

// One output channel = one dockview tab (VS Code panel style). The tabs
// (Console / Listing / Hex) live in the dockview header; this just renders the
// selected channel's text.
export default function ConsolePanel({ channel }: { channel: OutputTab }) {
  const { result } = useApp();

  const text =
    channel === "console"
      ? result?.stdout || "Press Assemble to run C16."
      : channel === "listing"
        ? result?.listing || "(no listing yet)"
        : result?.hex || "(no hex output yet)";

  return (
    <div className="panel-fill">
      <pre className="output">{text}</pre>
    </div>
  );
}
