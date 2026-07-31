export const SIMULATOR_AUTO_MAXIMIZE_WIDTH = 980;

export const shouldAutoMaximizeSimulator = (viewportWidth: number) =>
  viewportWidth <= SIMULATOR_AUTO_MAXIMIZE_WIDTH;

export interface SimulatorGuidance {
  badge: string;
  instruction: string;
  needsBuild: boolean;
}

/**
 * The one-line hint above the Z80sim screen.
 *
 * On a pointer-fine device the interesting question is "where do my keystrokes
 * go?", because the sim and the editor compete for the physical keyboard. On a
 * touch device there is usually no physical keyboard at all, so the hint has to
 * point at js-dos's on-screen one instead — it lives behind the ⌨ button in the
 * sidebar strip down the left edge of the DOS screen.
 */
export function simulatorGuidance(
  active: boolean,
  hexFileName: string,
  buildReady: boolean,
  touch = false,
): SimulatorGuidance {
  const badge = touch
    ? active
      ? "Z80sim ready"
      : "Tap to control"
    : active
      ? "Keyboard → Z80sim"
      : "Keyboard → Editor";

  if (!buildReady) {
    return {
      badge,
      instruction: "Assemble the active file before loading it",
      needsBuild: true,
    };
  }

  if (touch) {
    return {
      badge,
      instruction: active
        ? `⌨ on the left edge, then : L → ${hexFileName} → Enter`
        : "tap the screen to control Z80sim",
      needsBuild: false,
    };
  }

  return {
    badge,
    instruction: active
      ? `to load : L → ${hexFileName} → Enter`
      : `you are out of Z80sim focus`,
    needsBuild: false,
  };
}
