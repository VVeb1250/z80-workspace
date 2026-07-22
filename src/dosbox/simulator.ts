// z80sim interactive pane.
//
// z80sim.exe is a graphical (Borland BGI EGA/VGA) DOS app driven by the
// keyboard, so it can't be scripted headless like C16. We hand it to the
// js-dos v8 *high-level* player (window.Dos), which renders the DOS video to
// a canvas and wires keyboard/mouse/touch for free — exactly the "don't
// hand-write a renderer + keymap" path.

import type { CommandInterface } from "emulators";

// Minimal shape of the js-dos v8 high-level options we use.
interface DosOptions {
  dosboxConf?: string;
  initFs?: unknown;
  pathPrefix?: string;
  backend?: "dosbox" | "dosboxX";
  autoStart?: boolean;
  noCloud?: boolean;
  kiosk?: boolean;
  onEvent?: (event: string, ci?: CommandInterface) => void;
}
interface DosProps {
  stop: () => Promise<void>;
}
type DosFn = (el: HTMLElement, options: DosOptions) => DosProps;

declare global {
  interface Window {
    Dos?: DosFn;
  }
}

const JSDOS_BASE = import.meta.env.BASE_URL + "jsdos/";

// All micro_processor files z80sim may touch (its own tables + kit data).
const SIM_FILES = [
  "z80sim.exe",
  "ASSEMBLE.DAT",
  "UNASSEM.DAT",
  "HEX.DAT",
  "LCD.DAT",
  "Z80.TBL",
];

let jsdosLoad: Promise<DosFn> | null = null;

function loadJsDos(): Promise<DosFn> {
  if (window.Dos) return Promise.resolve(window.Dos);
  if (jsdosLoad) return jsdosLoad;
  jsdosLoad = new Promise<DosFn>((resolve, reject) => {
    // CSS
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = JSDOS_BASE + "js-dos.css";
    document.head.appendChild(css);
    // JS (defines window.Dos)
    const js = document.createElement("script");
    js.src = JSDOS_BASE + "js-dos.js";
    js.onload = () =>
      window.Dos
        ? resolve(window.Dos)
        : reject(new Error("js-dos.js loaded but window.Dos missing"));
    js.onerror = () => reject(new Error("failed to load js-dos.js"));
    document.head.appendChild(js);
  });
  return jsdosLoad;
}

async function fetchBin(relPath: string): Promise<Uint8Array> {
  const res = await fetch(import.meta.env.BASE_URL + relPath);
  if (!res.ok) throw new Error(`fetch ${relPath} failed: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

export interface SimulatorHandle {
  stop: () => Promise<void>;
  ci: () => CommandInterface | null;
}

/** Boot z80sim.exe into the given container element. */
export async function startSimulator(
  el: HTMLElement,
): Promise<SimulatorHandle> {
  const Dos = await loadJsDos();

  const initFs = await Promise.all(
    SIM_FILES.map(async (f) => ({
      path: f,
      contents: await fetchBin("micro_processor/" + f),
    })),
  );

  const dosboxConf = [
    "[sdl]",
    "autolock=false",
    "[cpu]",
    "cycles=max",
    "[autoexec]",
    "mount c .",
    "c:",
    "z80sim.exe",
  ].join("\n");

  let ci: CommandInterface | null = null;
  const props = Dos(el, {
    dosboxConf,
    initFs,
    pathPrefix: JSDOS_BASE + "emulators/",
    backend: "dosbox",
    autoStart: true,
    noCloud: true,
    kiosk: true,
    onEvent: (event, readyCi) => {
      if (event === "ci-ready" && readyCi) ci = readyCi;
    },
  });

  // autoStart can't beat the browser's user-gesture rule: by the time Dos()
  // runs (after async file fetches) the click that opened the panel has
  // expired, so js-dos falls back to its "click to start" overlay. Dismiss it
  // programmatically the moment it appears so the sim starts on its own.
  dismissStartOverlay(el);

  return {
    stop: () => props.stop(),
    ci: () => ci,
  };
}

function dismissStartOverlay(el: HTMLElement) {
  let done = false;
  const click = () => {
    const overlay = el.querySelector<HTMLElement>(
      ".emulator-click-to-start-overlay",
    );
    if (overlay) {
      // click the overlay and its icon to be safe
      overlay.click();
      el.querySelector<HTMLElement>(".emulator-click-to-start-icon")?.click();
      done = true;
      return true;
    }
    return false;
  };

  // Catch the overlay the instant js-dos inserts it.
  const observer = new MutationObserver(() => {
    if (click()) observer.disconnect();
  });
  observer.observe(el, { childList: true, subtree: true });

  // Polling fallback (covers overlays already present / observer misses).
  const deadline = Date.now() + 15000;
  const poll = () => {
    if (done) return;
    if (click()) {
      observer.disconnect();
      return;
    }
    if (Date.now() < deadline) setTimeout(poll, 200);
    else observer.disconnect();
  };
  poll();
}
