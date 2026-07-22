import { useCallback } from "react";
import {
  DockviewReact,
  themeAbyss,
  type DockviewReadyEvent,
  type IDockviewPanelProps,
} from "dockview-react";
import "dockview-core/dist/styles/dockview.css";
import ExplorerPanel from "./panels/ExplorerPanel";
import EditorPanel from "./panels/EditorPanel";
import ConsolePanel from "./panels/ConsolePanel";
import SimulatorPanel from "./panels/SimulatorPanel";
import { RightHeaderActions } from "./panels/HeaderActions";
import { useApp } from "./state/AppState";

// dockview renders these inside the React tree, so they can useApp() context.
const components = {
  explorer: (_props: IDockviewPanelProps) => <ExplorerPanel />,
  editor: (_props: IDockviewPanelProps) => <EditorPanel />,
  console: (_props: IDockviewPanelProps) => <ConsolePanel />,
  simulator: (_props: IDockviewPanelProps) => <SimulatorPanel />,
};

export default function Dock() {
  const { dockApiRef } = useApp();

  const onReady = useCallback(
    (event: DockviewReadyEvent) => {
      const api = event.api;
      dockApiRef.current = api;

      const explorer = api.addPanel({
        id: "explorer",
        component: "explorer",
        title: "Explorer",
      });
      const editor = api.addPanel({
        id: "editor",
        component: "editor",
        title: "Editor",
        position: { referencePanel: "explorer", direction: "right" },
      });
      api.addPanel({
        id: "console",
        component: "console",
        title: "Output",
        position: { referencePanel: "editor", direction: "below" },
      });

      // initial sizing: narrow explorer, shorter console
      explorer.api.setSize({ width: 220 });
      editor.api.setSize({ height: 460 });
    },
    [dockApiRef],
  );

  return (
    <DockviewReact
      className="dock"
      components={components}
      theme={themeAbyss}
      rightHeaderActionsComponent={RightHeaderActions}
      onReady={onReady}
    />
  );
}
