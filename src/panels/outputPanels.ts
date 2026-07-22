import type { DockviewApi } from "dockview-react";
import {
  OUTPUT_HEADER,
  OUTPUT_HEIGHT,
  OUTPUT_TABS,
  outputId,
  outputTitle,
} from "../state/AppState";

// Mount the three bottom output channels (Console / Listing / Hex) as one
// dockview group with non-closable tabs. The group's minimum height is lowered
// to the tab-bar height so the "hide output" toggle can collapse it to just the
// tabs. No-op if the channels are already open.
export function mountOutputPanels(api: DockviewApi, editorRefId?: string) {
  if (api.getPanel(outputId(OUTPUT_TABS[0]))) return;
  OUTPUT_TABS.forEach((ch, i) => {
    const panel = api.addPanel({
      id: outputId(ch),
      component: "console",
      tabComponent: "plain", // non-closable tab (no × button)
      title: outputTitle(ch),
      params: { channel: ch },
      position:
        i === 0
          ? editorRefId
            ? { referencePanel: editorRefId, direction: "below" }
            : undefined
          : { referencePanel: outputId(OUTPUT_TABS[0]), direction: "within" },
    });
    if (i === 0) {
      panel.group.api.setConstraints({ minimumHeight: OUTPUT_HEADER });
      panel.api.setSize({ height: OUTPUT_HEIGHT });
    }
  });
  api.getPanel(outputId(OUTPUT_TABS[0]))?.api.setActive();
}
