export const SIMULATOR_AUTO_MAXIMIZE_WIDTH = 980;

export const shouldAutoMaximizeSimulator = (viewportWidth: number) =>
  viewportWidth <= SIMULATOR_AUTO_MAXIMIZE_WIDTH;

export interface SimulatorGuidance {
  badge: string;
  instruction: string;
  needsBuild: boolean;
}

export function simulatorGuidance(
  active: boolean,
  hexFileName: string,
  buildReady: boolean,
): SimulatorGuidance {
  if (!buildReady) {
    return {
      badge: active ? "Keyboard → Z80sim" : "Keyboard → Editor",
      instruction: "Assemble the active file before loading it",
      needsBuild: true,
    };
  }
  return {
    badge: active ? "Keyboard → Z80sim" : "Keyboard → Editor",
    instruction: active
      ? `to load : L → ${hexFileName} → Enter`
      : `you are out of Z80sim focus`,
    needsBuild: false,
  };
}
