import Editor from "@monaco-editor/react";
import type { IDockviewPanelProps } from "dockview-react";
import { Icon } from "../Icon";
import { editorTypographyOptions } from "../editor/editorOptions";
import { compiledArtifactFor, formatBytes } from "../files/artifacts";
import { artifactName, useApp, type ArtifactKind } from "../state/AppState";

// A build product opened as its own tab. Read-only on purpose: these files are
// C16's output, not something to edit — reassembling is what changes them.
export default function ArtifactPanel(
  props: IDockviewPanelProps<{ name: string; kind: ArtifactKind }>,
) {
  const { name, kind } = props.params;
  const { files, settings, statusOf } = useApp();
  const artifact = compiledArtifactFor(files, name);
  const text = kind === "hex" ? artifact?.hex : artifact?.lst;
  const dosName = artifactName(name, kind);

  if (!text) {
    return (
      <div className="panel-fill output-empty">
        <span className="empty-icon"><Icon name="terminal" size={22} /></span>
        <strong>{dosName} is gone</strong>
        <p>
          This build product no longer exists — assemble {name} again to
          recreate it.
        </p>
      </div>
    );
  }

  const stale = statusOf(name) === "stale";

  return (
    <div className="panel-fill artifact-view">
      <div className="artifact-bar">
        <Icon name="file" size={13} />
        <strong>{dosName}</strong>
        <span>{formatBytes(text.length)}</span>
        <span className="artifact-source">from {name}</span>
        {stale && (
          <span className="artifact-stale">
            <Icon name="alert-circle" size={12} /> source changed since this
            build
          </span>
        )}
      </div>
      <Editor
        language="plaintext"
        theme={settings.theme}
        path={`${dosName}::${name}`}
        value={text}
        options={{
          ...editorTypographyOptions(settings.editorFontSize),
          fontFamily: 'Consolas, "Courier New", monospace',
          readOnly: true,
          domReadOnly: true,
          minimap: { enabled: settings.minimap },
          lineNumbers: settings.lineNumbers ? "on" : "off",
          padding: { top: 8, bottom: 8 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          renderWhitespace: "none",
          wordWrap: settings.wordWrap ? "on" : "off",
        }}
      />
    </div>
  );
}
