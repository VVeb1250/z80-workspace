// GoatCounter event pings (index.html loads the snippet). The snippet skips
// localhost and never runs in the desktop build, so dev and Electron send
// nothing — these calls are no-ops there.
//
// Events exist to compare pairs of buttons doing the same job: assembling from
// the toolbar vs from the output panel, and saving a build product from the
// output panel vs the Export menu. Whichever side nobody uses can be dropped.

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
  | "download-output-hex"
  | "download-output-lst"
  | "download-export-asm"
  | "download-export-hex"
  | "download-export-lst"
  | "download-export-both"
  | "download-export-all";

export function trackEvent(event: AnalyticsEvent): void {
  window.goatcounter?.count({ path: event, title: event, event: true });
}
