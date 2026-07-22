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

export const JSDOS_SCOPE = "jsdos-scope";

// js-dos.css is a global DaisyUI/Tailwind sheet. Both our <link> and the one
// js-dos.js injects itself leak component classes (.btn/.tab/.toggle/...) and
// a preflight reset into the whole page. We confine all of it to the sim
// container: disable every js-dos.css sheet and re-emit it prefixed under
// `.jsdos-scope`, so nothing outside the simulator is ever touched.
let scopingInstalled = false;

function prefixSelector(selectorText: string, scope: string): string {
  return selectorText
    .split(",")
    .map((raw) => {
      const s = raw.trim();
      if (s === "*") return `${scope} *`;
      if (/^(html|body|:root|:host)\b/.test(s)) {
        return s.replace(/^(html|body|:root|:host)/, scope);
      }
      return `${scope} ${s}`;
    })
    .join(", ");
}

function buildScoped(rules: CSSRuleList, scope: string): string {
  let out = "";
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSStyleRule) {
      out += `${prefixSelector(rule.selectorText, scope)}{${rule.style.cssText}}\n`;
    } else if (rule instanceof CSSMediaRule) {
      out += `@media ${rule.conditionText}{${buildScoped(rule.cssRules, scope)}}\n`;
    } else if (
      typeof CSSSupportsRule !== "undefined" &&
      rule instanceof CSSSupportsRule
    ) {
      out += `@supports ${rule.conditionText}{${buildScoped(rule.cssRules, scope)}}\n`;
    } else {
      out += `${rule.cssText}\n`; // @keyframes / @font-face / etc. left as-is
    }
  }
  return out;
}

async function scopeJsDosLink(link: HTMLLinkElement) {
  if (link.dataset.jsdosScoped) return;
  link.dataset.jsdosScoped = "1";
  const href = link.href;
  // Removing the node is the only reliable way to stop the global sheet —
  // toggling link.disabled leaves sheet.disabled false and it keeps applying.
  link.remove();
  try {
    const text = await (await fetch(href)).text();
    const sheet = new CSSStyleSheet();
    await sheet.replace(text);
    const style = document.createElement("style");
    style.setAttribute("data-jsdos-scoped", "");
    style.textContent = buildScoped(sheet.cssRules, "." + JSDOS_SCOPE);
    document.head.appendChild(style);
  } catch {
    // If scoping fails, restore the original global sheet so the sim still
    // looks right (accepting the leak as the lesser evil).
    const restore = document.createElement("link");
    restore.rel = "stylesheet";
    restore.href = href;
    document.head.appendChild(restore);
  }
}

function installCssScoping() {
  if (scopingInstalled) return;
  scopingInstalled = true;
  const consider = (node: Node) => {
    if (node instanceof HTMLLinkElement && /js-dos\.css/.test(node.href)) {
      void scopeJsDosLink(node);
    }
  };
  document.head
    .querySelectorAll("link")
    .forEach((l) => consider(l));
  new MutationObserver((muts) => {
    for (const m of muts) m.addedNodes.forEach(consider);
  }).observe(document.head, { childList: true });
}

let jsdosLoad: Promise<DosFn> | null = null;

function loadJsDos(): Promise<DosFn> {
  if (window.Dos) return Promise.resolve(window.Dos);
  if (jsdosLoad) return jsdosLoad;
  // Catch every js-dos.css sheet (ours below + the one js-dos.js injects).
  installCssScoping();
  jsdosLoad = new Promise<DosFn>((resolve, reject) => {
    // CSS (also scoped by the observer above)
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

/**
 * Boot z80sim.exe into the given container element. `extraFiles` (e.g. compiled
 * .h hex files) are placed on C: so the user can Load them directly.
 */
export async function startSimulator(
  el: HTMLElement,
  extraFiles: { path: string; contents: Uint8Array }[] = [],
): Promise<SimulatorHandle> {
  const Dos = await loadJsDos();

  const initFs = [
    ...(await Promise.all(
      SIM_FILES.map(async (f) => ({
        path: f,
        contents: await fetchBin("micro_processor/" + f),
      })),
    )),
    ...extraFiles,
  ];

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

  // js-dos only auto-starts (dos/bndReady -> autoStart && countDownStart===0
  // -> bndPlay) on a fresh page load. Two things break that on our panels:
  //   1. autoStart can't beat the browser's user-gesture rule -- by the time
  //      Dos() runs (after async file fetches) the click that opened the panel
  //      has expired, so js-dos falls back to its "click to start" overlay.
  //   2. js-dos keeps a page-level (Redux) store, so a *second* Dos() after a
  //      stop() (close tab -> reopen) never re-arms the auto-start path and
  //      always lands on that overlay.
  // Either way, click the overlay's play button ourselves the moment it
  // appears so the sim boots on its own, every time.
  dismissStartOverlay(el);

  return {
    stop: () => props.stop(),
    ci: () => ci,
  };
}

function dismissStartOverlay(el: HTMLElement) {
  let done = false;
  const click = () => {
    // js-dos v8 renders the manual start overlay as an SVG "play" icon with
    // class `play-button` (the full-size one is `.play-button.w-full`; a
    // separate `.play-button.w-48` is the unrelated upload icon). Its onClick
    // dispatches the same bndPlay action auto-start would, so a synthetic click
    // boots the emulator -- SVGElement has no reliable .click(), so dispatch a
    // real MouseEvent.
    const play = el.querySelector<SVGElement>(".play-button.w-full");
    if (play) {
      play.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
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
