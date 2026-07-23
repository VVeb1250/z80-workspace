import { useCallback } from "react";
import {
  DockviewReact,
  themeDark,
  type DockviewReadyEvent,
  type IDockviewPanelProps,
} from "dockview-react";
import "dockview-core/dist/styles/dockview.css";
import EditorPanel from "./panels/EditorPanel";
import SimulatorPanel from "./panels/SimulatorPanel";
import InstructionsPanel from "./panels/InstructionsPanel";
import WelcomePanel from "./panels/WelcomePanel";
import { RightHeaderActions } from "./panels/HeaderActions";
import { EDITOR_PREFIX, editorId, useApp } from "./state/AppState";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components: any = {
  editor: (props: IDockviewPanelProps<{ name: string }>) => (
    <EditorPanel {...props} />
  ),
  simulator: () => <SimulatorPanel />,
  instructions: () => <InstructionsPanel />,
  welcome: () => <WelcomePanel />,
};

export default function Dock() {
  const {
    dockApiRef,
    activeFile,
    setActiveFile,
    settings,
    openWelcome,
    updateSettings,
  } = useApp();

  const onReady = useCallback(
    (event: DockviewReadyEvent) => {
      const api = event.api;
      dockApiRef.current = api;

      // First editor tab = the active file. Output is a fixed footer outside
      // dockview (see OutputFooter), so nothing else is mounted here.
      api.addPanel({
        id: editorId(activeFile),
        component: "editor",
        title: activeFile,
        params: { name: activeFile },
      });

      // First visit: greet the user with the Welcome panel, then mark it seen
      // so it never auto-opens again.
      if (!settings.tutorialSeen) {
        openWelcome();
        updateSettings({ tutorialSeen: true });
      }

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
