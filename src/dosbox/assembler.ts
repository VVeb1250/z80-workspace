// Z80 assemble engine.
//
// Strategy: keyboard-free and deterministic. Each assemble boots a fresh
// headless DOSBox (emulators.dosboxDirect) whose autoexec runs the Cross-16
// assembler on the user's source, then writes a marker file. We poll for the
// marker, read back the listing + hex, then tear the machine down.
//
// No keystroke injection, no stdout-timing races: the marker file is the
// single source of truth that C16 finished.

import type { Emulators, CommandInterface } from "emulators";

// emulators.js is a browserify bundle that assigns a global `window.emulators`
// (not an ES module), so we load it as a side-effect script and grab the global.
// Loading via BASE_URL keeps it correct on both dev and a GitHub Pages subpath.
declare global {
  interface Window {
    emulators?: Emulators;
  }
}

let emuPromise: Promise<Emulators> | null = null;

function getEmulators(): Promise<Emulators> {
  if (window.emulators) {
    window.emulators.pathPrefix = import.meta.env.BASE_URL + "emulators/";
    return Promise.resolve(window.emulators);
  }
  if (!emuPromise) {
    emuPromise = new Promise<Emulators>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = import.meta.env.BASE_URL + "emulators/emulators.js";
      s.onload = () => {
        if (!window.emulators) {
          reject(new Error("emulators.js loaded but window.emulators is missing"));
          return;
        }
        window.emulators.pathPrefix = import.meta.env.BASE_URL + "emulators/";
        resolve(window.emulators);
      };
      s.onerror = () => reject(new Error("failed to load emulators.js"));
      document.head.appendChild(s);
    });
  }
  return emuPromise;
}

// Read-only tool files that must be present on C: for C16 to run.
// Z80.TBL is the CPU table Cross-16 reads; the rest ship with the kit.
const TOOL_FILES = [
  "C16.EXE",
  "C16SORT.EXE",
  "Z80.TBL",
  "ASSEMBLE.DAT",
  "UNASSEM.DAT",
  "HEX.DAT",
];

const SRC = "LAB1.ASM";
const HEX = "LAB1.H";
const LST = "LAB1.LST";
const DONE = "DONE.TXT";

let toolCache: { path: string; contents: Uint8Array }[] | null = null;

async function fetchBin(relPath: string): Promise<Uint8Array> {
  const res = await fetch(import.meta.env.BASE_URL + relPath);
  if (!res.ok) throw new Error(`fetch ${relPath} failed: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function loadToolFiles() {
  if (toolCache) return toolCache;
  const entries = await Promise.all(
    TOOL_FILES.map(async (f) => ({
      path: f,
      contents: await fetchBin("micro_processor/" + f),
    })),
  );
  toolCache = entries;
  return entries;
}

function decode(bytes: Uint8Array): string {
  // The DOS tools emit CP437-ish ASCII; latin1 keeps every byte printable
  // and avoids UTF-8 replacement characters on box-drawing chars.
  return new TextDecoder("latin1").decode(bytes);
}

async function tryReadText(
  ci: CommandInterface,
  file: string,
): Promise<string> {
  // The emcripten FS path base is uncertain (Z: vs C:), so try a few forms.
  for (const p of [file, "C:/" + file, "c:/" + file, "./" + file]) {
    try {
      const bytes = await ci.fsReadFile(p);
      if (bytes && bytes.length > 0) return decode(bytes);
    } catch {
      /* try next */
    }
  }
  return "";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface AssembleResult {
  ok: boolean;
  errorCount: number;
  stdout: string; // captured console output (best-effort)
  listing: string; // LAB1.LST contents
  hex: string; // LAB1.H (Intel HEX) contents
}

/** Parse the Cross-16 tail line, e.g. "End of Assembly -- No Errors" / "3 Errors". */
function parseErrors(text: string): number {
  if (/No Errors/i.test(text)) return 0;
  const m = /(\d+)\s+Error/i.exec(text);
  return m ? parseInt(m[1], 10) : 0;
}

export async function assemble(source: string): Promise<AssembleResult> {
  const emulators = await getEmulators();
  const initFs: unknown[] = [...(await loadToolFiles())];
  initFs.push({ path: SRC, contents: new TextEncoder().encode(source) });

  const dosboxConf = [
    "[cpu]",
    "cycles=max",
    "[autoexec]",
    // The init files land in the emscripten CWD ("."). emulators' default
    // autoexec mounts that as C:; our custom conf replaces it, so we must
    // re-add the mount + cd ourselves or C: won't exist.
    "mount c .",
    "c:",
    `c16 ${SRC} -H ${HEX} -L ${LST}`,
    `echo done > ${DONE}`,
  ].join("\n");
  initFs.push({ dosboxConf, jsdosConf: { version: emulators.version } });

  let stdout = "";
  let done = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ci = await emulators.dosboxDirect(initFs as any);
  // Detect completion from the console stream, NOT by polling files: while
  // C16 is running the machine is busy and every fsReadFile rejects. onStdout
  // keeps flowing during execution, so we watch for the assembler's tail line.
  ci.events().onStdout((m) => {
    stdout += m;
    if (/End of Assembly|Fatal Error/i.test(stdout)) done = true;
  });

  const deadline = Date.now() + 20000;
  while (Date.now() < deadline && !done) {
    await sleep(100);
  }
  // Let the autoexec return to the prompt so the FS is idle before we read.
  await sleep(400);

  const listing = await tryReadText(ci, LST);
  const hex = await tryReadText(ci, HEX);
  await ci.exit();

  if (!done) {
    return {
      ok: false,
      errorCount: -1,
      stdout: stdout + "\n[timeout: assembler did not finish in 15s]",
      listing,
      hex,
    };
  }

  const errorCount = parseErrors(stdout + "\n" + listing);
  return { ok: errorCount === 0, errorCount, stdout, listing, hex };
}
