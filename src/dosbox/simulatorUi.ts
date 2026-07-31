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
 * go?", because the sim and the editor compete for the physical keyboard — so
 * the hint tracks focus and spells out the Load keystrokes.
 *
 * On touch there is no such competition: SimKeyboard sends keys straight to the
 * emulator whether or not the host has DOM focus, and its Load button types the
 * whole `L`, filename, Enter sequence. So the hint drops the focus talk and
 * just points at that button.
 */
export function simulatorGuidance(
  active: boolean,
  hexFileName: string,
  buildReady: boolean,
  touch = false,
): SimulatorGuidance {
  const badge = touch
    ? "Z80sim ready"
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
      instruction: `tap Load — it types ${hexFileName} for you`,
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
