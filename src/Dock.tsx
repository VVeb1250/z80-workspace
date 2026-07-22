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
import { PlainTab } from "./panels/PlainTab";
import { mountOutputPanels } from "./panels/outputPanels";
import {
  EDITOR_PREFIX,
  editorId,
  isOutputId,
  useApp,
  type OutputTab,
} from "./state/AppState";

const tabComponents = { plain: PlainTab };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components: any = {
  editor: (props: IDockviewPanelProps<{ name: string }>) => (
    <EditorPanel {...props} />
  ),
  console: (props: IDockviewPanelProps<{ channel: OutputTab }>) => (
    <ConsolePanel channel={props.params.channel} />
  ),
  simulator: () => <SimulatorPanel />,
};

export default function Dock() {
  const { dockApiRef, activeFile, setActiveFile, expandOutput } = useApp();

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
      // Output docked at the bottom. Each channel is its own (non-closable)
      // dockview tab (Console / Listing / Hex) so the header reads like VS
      // Code's panel — no redundant "Output" wrapper tab.
      mountOutputPanels(api, editorId(activeFile));

      // Keep the app's active file in sync with the focused editor tab; and
      // selecting an output channel tab expands the panel if it was collapsed.
      api.onDidActivePanelChange((event) => {
        const id = event.panel?.id;
        if (id && id.startsWith(EDITOR_PREFIX)) {
          setActiveFile(id.slice(EDITOR_PREFIX.length));
        } else if (id && isOutputId(id)) {
          expandOutput();
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
      tabComponents={tabComponents}
      theme={themeDark}
      rightHeaderActionsComponent={RightHeaderActions}
      onReady={onReady}
    />
  );
}
