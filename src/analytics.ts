// GoatCounter event pings (index.html loads the snippet). The snippet skips
// localhost and never runs in the desktop build, so dev and Electron send
// nothing — these calls are no-ops there.
//
// Events exist to answer two questions, each a pair of buttons doing the same
// job: Explorer hover download vs the Export menu, and the toolbar Assemble
// button vs the clickable command in the output panel. Whichever side nobody
// uses can be dropped.

declare global {
  interface Window {
    goatcounter?: {
      count: (vars: { path: string; title?: string; event: boolean }) => void;
    };
  }
}

export type AnalyticsEvent =
  | "assemble-toolbar"
  | "assemble-console-command"
  | "download-explorer-hex"
  | "download-explorer-lst"
  | "download-export-asm"
  | "download-export-hex"
  | "download-export-lst";

export function trackEvent(event: AnalyticsEvent): void {
  window.goatcounter?.count({ path: event, title: event, event: true });
}
