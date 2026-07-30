import { trackEvent } from "../analytics";
import { Icon } from "../Icon";
import { assembleCommand } from "../dosbox/assembler";
import OutputViewer from "./OutputViewer";
import { forDisplay } from "./outputText";
import { useApp, type OutputTab } from "../state/AppState";

// One output channel = one dockview tab (VS Code panel style). The tabs
// (Console / Listing / Hex) live in the dockview header; this just renders the
// selected channel's text.
export default function ConsolePanel({ channel }: { channel: OutputTab }) {
  // baseName follows the file that would actually be assembled (a stale saved
  // active-file name falls back to the first file, activeFile alone doesn't).
  const {
    result,
    activeArtifact,
    activeFile,
    baseName,
    buildHints,
    busy,
    onAssemble,
    settings,
    statusOf,
  } = useApp();

  // Console = the last compiler run's messages (an action log). Listing / Hex
  // are per-file build products, so they follow the file being viewed, not
  // whichever file was assembled last.
  const text =
    channel === "console"
      ? result?.stdout ??
        activeArtifact?.stdout ??
        (statusOf(activeFile) === "fresh"
          ? `Build restored from the previous session.\n${baseName}.h and ${baseName}.lst are ready.`
          : undefined)
      : channel === "listing"
        ? activeArtifact?.lst
        : activeArtifact?.hex;

  if (!text) {
    // Students come from the CLI lab sheet, so each empty state spells out the
    // DOS command Assemble runs — the button is that command, not a substitute.
    const copy = {
      console: {
        title: "Not assembled yet",
        description:
          "Click the command to run it with the real C16.EXE in DOSBox — same as the Assemble (C16) button:",
      },
      listing: {
        title: "No listing generated",
        description:
          "The -L switch writes the annotated listing. Click the command to run it:",
      },
      hex: {
        title: "No Intel HEX generated",
        description:
          "The -H switch writes the .H image Z80sim loads. Click the command to run it:",
      },
    }[channel];

    return (
      <div className="panel-fill output-empty">
        <span className="empty-icon"><Icon name="terminal" size={22} /></span>
        <strong>{copy.title}</strong>
        <p>{copy.description}</p>
        <button
          aria-busy={busy}
          className="empty-command"
          disabled={busy}
          onClick={() => {
            trackEvent("assemble-console-command");
            void onAssemble();
          }}
          title={`Run this command on ${activeFile}`}
          type="button"
        >
          <code>{`C:\\>${assembleCommand(baseName)}`}</code>
        </button>
        {channel === "console" && <kbd>Ctrl + Enter</kbd>}
      </div>
    );
  }

  if (channel !== "console") {
    return (
      <OutputViewer
        fileName={`${baseName}.${channel === "hex" ? "h" : "lst"}`}
        text={text}
      />
    );
  }

  return (
    <div className="panel-fill">
      {buildHints.length > 0 && (
        // C16 says "S" and echoes the line; it never says why. These are the
        // whole-file causes behind a wall of identical syntax errors.
        <div className="build-hints" role="note">
          <Icon name="alert-circle" size={16} />
          <ul>
            {buildHints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
        </div>
      )}
      <pre
        aria-live="polite"
        className="output"
        style={{ fontSize: `${settings.outputFontSize}px` }}
      >
        {forDisplay(text)}
      </pre>
    </div>
  );
}
