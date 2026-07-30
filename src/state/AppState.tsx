import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { DockviewApi } from "dockview-react";
import { assemble, type AssembleResult } from "../dosbox/assembler";
import {
  buildHints,
  parseC16Errors,
  type CompilerDiagnostic,
} from "../dosbox/diagnostics";
import type { SimulatorHandle } from "../dosbox/simulator";
import { shouldAutoMaximizeSimulator } from "../dosbox/simulatorUi";
import { bulkDownloadReceipt, downloadReceipt } from "../downloads";
import {
  allReadyArtifacts,
  artifactDescriptors,
  buildPresentation,
  canPersistBuild,
  compiledArtifactFor,
  freshCompiledHexFiles,
  type ArtifactDescriptor,
  type BuildPresentation,
} from "../files/artifacts";
import { TOUR_STEPS } from "../tutorial/tutorialContent";
import {
  DEFAULT_WORKSPACE_SETTINGS,
  loadWorkspaceSettings,
  normalizeWorkspaceSettings,
  saveWorkspaceSettings,
  type WorkspaceSettings,
} from "../settings/store";
import { newFileTemplate } from "../editor/z80language";
import {
  baseNameOf,
  compileStatus,
  dos83Base,
  dosBaseName,
  findByName,
  loadActive,
  loadFiles,
  normalizeName,
  saveActive,
  saveFiles,
  type AsmFile,
  type CompiledArtifact,
  type CompileStatus,
} from "../files/store";

/**
 * Name the hex is written under inside the emulator. Uppercase because that is
 * how DOS stores an 8.3 name; typing it at Z80sim's prompt is case-insensitive.
 */
export const hexName = (displayName: string) =>
  dosBaseName(displayName) + ".H";


export type OutputTab = "console" | "listing" | "hex";
/** Bottom output channels, rendered as tabs in the fixed output footer. */
export const OUTPUT_TABS: OutputTab[] = ["console", "listing", "hex"];

/**
 * Tab label. Console is the compiler's messages, but the other two *are* files
 * — naming them after the build product says which file you are looking at.
 */
export const outputTitle = (t: OutputTab, base: string) =>
  t === "console" ? "Console" : t === "listing" ? `${base}.lst` : `${base}.h`;
/** Default footer height (px) when expanded. */
export const OUTPUT_HEIGHT = 200;

export const EDITOR_PREFIX = "file:";
export const editorId = (name: string) => EDITOR_PREFIX + name;
export const INSTRUCTIONS_PANEL_ID = "docs:z80-instructions";
export const SIM_GUIDE_PANEL_ID = "docs:z80sim-guide";
export const WELCOME_PANEL_ID = "docs:welcome";

interface BuildAttempt {
  fileName: string;
  result: AssembleResult;
  /** Per-line compiler errors, mapped back onto the source. */
  diagnostics: CompilerDiagnostic[];
  /** Whole-file explanations for why the build failed. */
  hints: string[];
}

export interface AppState {
  files: AsmFile[];
  activeFile: string;
  contentOf: (name: string) => string;
  updateSource: (name: string, content: string) => void;
  setActiveFile: (name: string) => void;
  openFile: (name: string) => void;
  openInstructionReference: () => void;
  /** Open (or focus) the Z80sim key reference. */
  openSimGuide: () => void;
  /** Open (or focus) the Welcome / tutorial panel. */
  openWelcome: () => void;
  createFile: (input: string) => void;
  /** Import .asm sources from disk (file picker or drag-drop). */
  importFiles: (files: FileList | File[]) => Promise<void>;
  deleteFile: (name: string) => void;
  commitRename: (oldName: string, input: string) => void;
  statusOf: (name: string) => CompileStatus;
  /** Compiled .h files (DOS name + bytes) to preload into Z80sim. */
  compiledHexFiles: () => { path: string; contents: Uint8Array }[];
  // assemble
  busy: boolean;
  result: AssembleResult | null;
  /** Compiler errors for one file, as editor markers. */
  diagnosticsFor: (name: string) => CompilerDiagnostic[];
  /** Whole-file explanations for the active file's failed build. */
  buildHints: string[];
  activeArtifact: CompiledArtifact | undefined;
  activeArtifacts: ArtifactDescriptor[];
  buildState: BuildPresentation;
  settings: WorkspaceSettings;
  updateSettings: (changes: Partial<WorkspaceSettings>) => void;
  resetSettings: () => void;
  activeOutputTab: OutputTab;
  focusOutput: (t: OutputTab, maximize?: boolean) => void;
  outputCollapsed: boolean;
  expandOutput: () => void;
  toggleOutputCollapsed: () => void;
  /** Output fills the dock area (VS Code panel maximize). */
  outputMaximized: boolean;
  toggleOutputMaximized: () => void;
  onAssemble: () => Promise<void>;
  statusText: string;
  download: (name: string, text: string) => void;
  /** Save several build products in one action (one toast, staggered saves). */
  downloadMany: (items: { fileName: string; text: string }[]) => void;
  /** Every up-to-date build product across all files. */
  readyArtifacts: { fileName: string; text: string }[];
  downloadToast: string | null;
  clearDownloadToast: () => void;
  baseName: string;
  // shell
  dockApiRef: React.MutableRefObject<DockviewApi | null>;
  simHandleRef: React.MutableRefObject<SimulatorHandle | null>;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  simRunning: boolean;
  setSimRunning: (v: boolean) => void;
  toggleSimulator: () => void;
  /** DOS name of a hex written into the running sim since it last loaded. */
  simHexUpdate: string | null;
  clearSimHexUpdate: () => void;
  // guided tour
  tourActive: boolean;
  tourStep: number;
  startTour: () => void;
  stopTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within AppStateProvider");
  return v;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<AsmFile[]>(() => loadFiles());
  const [activeFile, setActiveFileState] = useState<string>(
    () => loadActive() ?? loadFiles()[0].name,
  );
  const [busy, setBusy] = useState(false);
  const [buildAttempt, setBuildAttempt] = useState<BuildAttempt | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [outputCollapsed, setOutputCollapsed] = useState(false);
  const [outputMaximized, setOutputMaximized] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState<OutputTab>("console");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [simRunning, setSimRunning] = useState(false);
  const [simHexUpdate, setSimHexUpdate] = useState<string | null>(null);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [settings, setSettings] = useState<WorkspaceSettings>(
    loadWorkspaceSettings,
  );
  const dockApiRef = useRef<DockviewApi | null>(null);
  const simHandleRef = useRef<SimulatorHandle | null>(null);

  const active = useMemo(
    () => files.find((f) => f.name === activeFile) ?? files[0],
    [files, activeFile],
  );
  const attempt = buildAttempt?.fileName === active.name ? buildAttempt : null;
  const result = attempt?.result ?? null;
  const buildHintsForActive = attempt?.hints ?? [];

  // Markers belong to the file that was assembled, whichever tab is focused.
  const diagnosticsFor = useCallback(
    (name: string) =>
      buildAttempt?.fileName === name ? buildAttempt.diagnostics : [],
    [buildAttempt],
  );

  const contentOf = useCallback(
    (name: string) => files.find((f) => f.name === name)?.content ?? "",
    [files],
  );

  const persist = useCallback((next: AsmFile[]) => {
    setFiles(next);
    saveFiles(next);
  }, []);

  const setActiveFile = useCallback((name: string) => {
    setActiveFileState(name);
    saveActive(name);
  }, []);

  const updateSource = useCallback((name: string, content: string) => {
    setFiles((prev) => {
      const next = prev.map((f) => (f.name === name ? { ...f, content } : f));
      saveFiles(next);
      return next;
    });
  }, []);

  // Open a file as an editor tab (or focus it if already open).
  const openFile = useCallback(
    (name: string) => {
      setActiveFile(name);
      const api = dockApiRef.current;
      if (!api) return;
      const id = editorId(name);
      const existing = api.getPanel(id);
      if (existing) {
        existing.api.setActive();
        return;
      }
      const anyEditor = api.panels.find((p) => p.id.startsWith(EDITOR_PREFIX));
      api.addPanel({
        id,
        component: "editor",
        title: name,
        params: { name },
        position: anyEditor
          ? { referencePanel: anyEditor.id, direction: "within" }
          : undefined,
      });
    },
    [setActiveFile],
  );

  // Docs (instruction reference, Z80sim guide, Welcome) all open as a tab
  // beside the editors, and focus rather than duplicate if already open.
  const openDocPanel = useCallback(
    (
      id: string,
      component: string,
      title: string,
      params?: Record<string, unknown>,
    ) => {
      const api = dockApiRef.current;
      if (!api) return;
      const existing = api.getPanel(id);
      if (existing) {
        existing.api.setActive();
        return;
      }
      const anyEditor = api.panels.find((panel) =>
        panel.id.startsWith(EDITOR_PREFIX),
      );
      api.addPanel({
        id,
        component,
        title,
        params,
        position: anyEditor
          ? { referencePanel: anyEditor.id, direction: "within" }
          : undefined,
      });
    },
    [],
  );

  const openInstructionReference = useCallback(
    () => openDocPanel(INSTRUCTIONS_PANEL_ID, "instructions", "Z80 Instructions"),
    [openDocPanel],
  );

  const openSimGuide = useCallback(
    () => openDocPanel(SIM_GUIDE_PANEL_ID, "simGuide", "Z80sim Guide"),
    [openDocPanel],
  );


  const openWelcome = useCallback(
    () => openDocPanel(WELCOME_PANEL_ID, "welcome", "Welcome"),
    [openDocPanel],
  );

  const startTour = useCallback(() => {
    setTourStep(0);
    setTourActive(true);
  }, []);
  const stopTour = useCallback(() => setTourActive(false), []);
  const nextTourStep = useCallback(() => {
    setTourStep((step) => {
      if (step >= TOUR_STEPS.length - 1) {
        setTourActive(false);
        return step;
      }
      return step + 1;
    });
  }, []);
  const prevTourStep = useCallback(
    () => setTourStep((step) => Math.max(0, step - 1)),
    [],
  );

  const createFile = useCallback(
    (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;
      setFiles((prev) => {
        const name = normalizeName(trimmed, prev);
        const next = [...prev, { name, content: newFileTemplate(name) }];
        saveFiles(next);
        queueMicrotask(() => openFile(name));
        return next;
      });
    },
    [openFile],
  );

  // Import sources from disk (file picker or drag-drop). Re-importing a name
  // that already exists offers to replace it — silently making lab11.asm hides
  // the update the user meant to bring in. Declining keeps both, suffixed.
  const importFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      if (!incoming.length) return;
      const read = await Promise.all(
        incoming.map(async (file) => ({
          base: file.name,
          content: await file.text(),
        })),
      );
      let lastName = "";
      setFiles((prev) => {
        let next = prev;
        for (const { base, content } of read) {
          const wanted = baseNameOf(base) + ".asm";
          const clash = findByName(next, wanted);
          if (
            clash &&
            window.confirm(`${clash.name} already exists. Replace its contents?`)
          ) {
            // Replacing invalidates the old build: it belongs to the old source.
            next = next.map((f) =>
              f.name === clash.name ? { name: f.name, content } : f,
            );
            lastName = clash.name;
            continue;
          }
          const name = normalizeName(base, next);
          next = [...next, { name, content }];
          lastName = name;
        }
        saveFiles(next);
        return next;
      });
      if (lastName) queueMicrotask(() => openFile(lastName));
    },
    [openFile],
  );

  const deleteFile = useCallback(
    (name: string) => {
      if (files.length <= 1) {
        window.alert("Keep at least one file.");
        return;
      }
      if (!window.confirm(`Delete ${name}?`)) return;
      const next = files.filter((f) => f.name !== name);
      persist(next);
      const panel = dockApiRef.current?.getPanel(editorId(name));
      if (panel) dockApiRef.current?.removePanel(panel);
      if (activeFile === name) setActiveFile(next[0].name);
    },
    [files, activeFile, persist, setActiveFile],
  );

  const commitRename = useCallback(
    (oldName: string, input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;
      const newName = normalizeName(
        trimmed,
        files.filter((f) => f.name !== oldName),
      );
      if (newName === oldName) return;
      const next = files.map((f) =>
        f.name === oldName ? { ...f, name: newName } : f,
      );
      persist(next);
      const api = dockApiRef.current;
      const panel = api?.getPanel(editorId(oldName));
      const wasOpen = !!panel;
      if (panel) api?.removePanel(panel);
      if (wasOpen) queueMicrotask(() => openFile(newName));
      if (activeFile === oldName) setActiveFile(newName);
    },
    [files, activeFile, persist, setActiveFile, openFile],
  );

  // The output footer lives outside dockview, so collapse / expand / channel
  // selection are plain state — the footer renders from these.
  const expandOutput = useCallback(() => setOutputCollapsed(false), []);

  // Hiding the output also drops it out of maximize — restoring should never
  // bring back a full-screen panel the user just dismissed.
  const toggleOutputCollapsed = useCallback(
    () =>
      setOutputCollapsed((collapsed) => {
        if (!collapsed) setOutputMaximized(false);
        return !collapsed;
      }),
    [],
  );

  // Maximizing a collapsed output expands it first — otherwise the button
  // would appear to do nothing.
  const toggleOutputMaximized = useCallback(() => {
    setOutputMaximized((maximized) => {
      if (!maximized) setOutputCollapsed(false);
      return !maximized;
    });
  }, []);

  // Select an output channel, expanding the footer if it was collapsed.
  const focusOutput = useCallback(
    (t: OutputTab, maximize = false) => {
      setActiveOutputTab(t);
      setOutputCollapsed(false);
      if (maximize) setOutputMaximized(true);
    },
    [],
  );

  const onAssemble = useCallback(async () => {
    setBusy(true);
    const fileName = active.name;
    const sourceAtCompile = active.content;
    setBuildAttempt(null);
    try {
      const r = await assemble(sourceAtCompile, dos83Base(fileName));
      setBuildAttempt({
        fileName,
        result: r,
        diagnostics: parseC16Errors(r.stdout, sourceAtCompile),
        hints: buildHints(sourceAtCompile, r.errorCount),
      });
      if (canPersistBuild(r)) {
        // Persist the compiled artifact against this file.
        setFiles((prev) => {
          const next = prev.map((f) =>
            f.name === fileName
              ? {
                  ...f,
                  compiled: {
                    hex: r.hex,
                    lst: r.listing,
                    stdout: r.stdout,
                    sourceAtCompile,
                    compiledAt: Date.now(),
                  },
                }
              : f,
          );
          saveFiles(next);
          return next;
        });
        // If Z80sim is already running, drop the fresh .h into its FS so the
        // user can Load it immediately (L -> Enter -> <name>.h). Z80sim does
        // not notice the file changed, so tell the user to load it again.
        const ci = simHandleRef.current?.ci();
        if (ci) {
          void ci.fsWriteFile(
            hexName(fileName),
            new TextEncoder().encode(r.hex),
          );
          setSimHexUpdate(hexName(fileName));
        }
      }
    } catch (e) {
      setBuildAttempt({
        fileName,
        result: {
          ok: false,
          errorCount: -1,
          stdout: `Engine error: ${(e as Error).message}`,
          listing: "",
          hex: "",
          hexFile: hexName(fileName),
        },
        diagnostics: [],
        hints: [],
      });
    } finally {
      setBusy(false);
    }
  }, [active]);

  const saveToDisk = useCallback((name: string, text: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, []);

  const download = useCallback(
    (name: string, text: string) => {
      saveToDisk(name, text);
      setDownloadToast(downloadReceipt(name).message);
    },
    [saveToDisk],
  );

  // Browsers throttle back-to-back programmatic downloads, so space them out
  // instead of firing the whole batch in one tick.
  const downloadMany = useCallback(
    (items: { fileName: string; text: string }[]) => {
      if (!items.length) return;
      items.forEach((item, index) => {
        window.setTimeout(
          () => saveToDisk(item.fileName, item.text),
          index * 250,
        );
      });
      setDownloadToast(
        items.length === 1
          ? downloadReceipt(items[0].fileName).message
          : bulkDownloadReceipt(items.length).message,
      );
    },
    [saveToDisk],
  );

  const readyArtifacts = useMemo(() => allReadyArtifacts(files), [files]);

  const clearDownloadToast = useCallback(() => setDownloadToast(null), []);

  const clearSimHexUpdate = useCallback(() => setSimHexUpdate(null), []);

  const statusOf = useCallback(
    (name: string): CompileStatus => {
      const f = files.find((x) => x.name === name);
      return f ? compileStatus(f) : "none";
    },
    [files],
  );

  const compiledHexFiles = useCallback(
    () =>
      freshCompiledHexFiles(files).map(({ fileName, hex }) => ({
          path: hexName(fileName),
          contents: new TextEncoder().encode(hex),
        })),
    [files],
  );

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  const updateSettings = useCallback(
    (changes: Partial<WorkspaceSettings>) => {
      setSettings((current) => {
        const next = normalizeWorkspaceSettings({ ...current, ...changes });
        saveWorkspaceSettings(next);
        return next;
      });
    },
    [],
  );

  const resetSettings = useCallback(() => {
    const defaults = { ...DEFAULT_WORKSPACE_SETTINGS };
    saveWorkspaceSettings(defaults);
    setSettings(defaults);
  }, []);

  const toggleSimulator = useCallback(() => {
    const api = dockApiRef.current;
    if (!api) return;
    const existing = api.getPanel("simulator");
    if (existing) {
      api.removePanel(existing);
      return;
    }
    setOutputMaximized(false);
    // Dock Z80sim beside the editor (its own big, readable half) — not with
    // the small bottom Output panel.
    const anyEditor = api.panels.find((p) => p.id.startsWith(EDITOR_PREFIX));
    const panel = api.addPanel({
      id: "simulator",
      component: "simulator",
      title: "Z80sim",
      position: anyEditor
        ? { referencePanel: anyEditor.id, direction: "right" }
        : undefined,
    });
    if (shouldAutoMaximizeSimulator(window.innerWidth)) {
      queueMicrotask(() => panel.api.maximize());
    }
  }, []);

  const baseName = dos83Base(active.name);
  const activeArtifact = compiledArtifactFor(files, active.name);
  const activeArtifacts = artifactDescriptors(active);
  const buildState = buildPresentation(active, result, busy);
  const statusText = buildState.text;

  const value: AppState = {
    files,
    activeFile,
    contentOf,
    updateSource,
    setActiveFile,
    openFile,
    openInstructionReference,
    openSimGuide,
    openWelcome,
    createFile,
    importFiles,
    deleteFile,
    commitRename,
    statusOf,
    compiledHexFiles,
    busy,
    result,
    diagnosticsFor,
    buildHints: buildHintsForActive,
    activeArtifact,
    activeArtifacts,
    buildState,
    settings,
    updateSettings,
    resetSettings,
    activeOutputTab,
    focusOutput,
    outputCollapsed,
    expandOutput,
    toggleOutputCollapsed,
    outputMaximized,
    toggleOutputMaximized,
    onAssemble,
    statusText,
    download,
    downloadMany,
    readyArtifacts,
    downloadToast,
    clearDownloadToast,
    baseName,
    dockApiRef,
    simHandleRef,
    sidebarOpen,
    toggleSidebar,
    simRunning,
    setSimRunning,
    toggleSimulator,
    simHexUpdate,
    clearSimHexUpdate,
    tourActive,
    tourStep,
    startTour,
    stopTour,
    nextTourStep,
    prevTourStep,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
