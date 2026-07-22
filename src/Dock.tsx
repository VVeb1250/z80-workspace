import { useCallback } from "react";
import {
  DockviewReact,
  themeDark,
  type DockviewReadyEvent,
  type IDockviewPanelProps,
} from "dockview-react";
import "dockview-core/dist/styles/dockview.css";
import EditorPanel from "./panels/EditorPanel";
import ConsolePanel from "./panels/ConsolePanel";
import SimulatorPanel from "./panels/SimulatorPanel";
import { RightHeaderActions } from "./panels/HeaderActions";
import { EDITOR_PREFIX, editorId, useApp } from "./state/AppState";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components: any = {
  editor: (props: IDockviewPanelProps<{ name: string }>) => (
    <EditorPanel {...props} />
  ),
  console: () => <ConsolePanel />,
  simulator: () => <SimulatorPanel />,
};

export default function Dock() {
  const { dockApiRef, activeFile, setActiveFile } = useApp();

  const onReady = useCallback(
    (event: DockviewReadyEvent) => {
      const api = event.api;
      dockApiRef.current = api;

      // First editor tab = the active file.
      api.addPanel({
        id: editorId(activeFile),
        component: "editor",
        title: activeFile,
        params: { name: activeFile },
      });
      // Output docked at the bottom.
      const output = api.addPanel({
        id: "output",
        component: "console",
        title: "Output",
        position: { referencePanel: editorId(activeFile), direction: "below" },
      });
      output.api.setSize({ height: 200 });

      // Keep the app's active file in sync with the focused editor tab.
      api.onDidActivePanelChange((event) => {
        const id = event.panel?.id;
        if (id && id.startsWith(EDITOR_PREFIX)) {
          setActiveFile(id.slice(EDITOR_PREFIX.length));
        }
      });

      // When an editor tab closes, fall back to another open editor.
      api.onDidRemovePanel((panel) => {
        if (!panel.id.startsWith(EDITOR_PREFIX)) return;
        const remaining = api.panels.find((p) =>
          p.id.startsWith(EDITOR_PREFIX),
        );
        if (remaining) {
          setActiveFile(remaining.id.slice(EDITOR_PREFIX.length));
        }
      });
    },
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <DockviewReact
      className="dock"
      components={components}
      theme={themeDark}
      rightHeaderActionsComponent={RightHeaderActions}
      onReady={onReady}
    />
  );
}
