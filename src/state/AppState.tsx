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
import type { SimulatorHandle } from "../dosbox/simulator";
import { compiledArtifactFor } from "../files/artifacts";
import { TOUR_STEPS } from "../tutorial/tutorialContent";
import {
  DEFAULT_WORKSPACE_SETTINGS,
  loadWorkspaceSettings,
  normalizeWorkspaceSettings,
  saveWorkspaceSettings,
  type WorkspaceSettings,
} from "../settings/store";
import {
  compileStatus,
  dosBaseName,
  loadActive,
  loadFiles,
  normalizeName,
  saveActive,
  saveFiles,
  type AsmFile,
  type CompiledArtifact,
  type CompileStatus,
} from "../files/store";

/** DOS 8.3 hex filename z80sim's Load expects, e.g. LAB1.H */
export const hexName = (displayName: string) =>
  dosBaseName(displayName) + ".H";

export type OutputTab = "console" | "listing" | "hex";
/** Bottom output channels, rendered as tabs in the fixed output footer. */
export const OUTPUT_TABS: OutputTab[] = ["console", "listing", "hex"];
export const outputTitle = (t: OutputTab) => t[0].toUpperCase() + t.slice(1);
/** Default footer height (px) when expanded. */
export const OUTPUT_HEIGHT = 200;

export const EDITOR_PREFIX = "file:";
export const editorId = (name: string) => EDITOR_PREFIX + name;
export const INSTRUCTIONS_PANEL_ID = "docs:z80-instructions";
export const WELCOME_PANEL_ID = "docs:welcome";

export interface AppState {
  files: AsmFile[];
  activeFile: string;
  contentOf: (name: string) => string;
  updateSource: (name: string, content: string) => void;
  setActiveFile: (name: string) => void;
  openFile: (name: string) => void;
  openInstructionReference: () => void;
  /** Open (or focus) the Welcome / tutorial panel. */
  openWelcome: () => void;
  createFile: (input: string) => void;
  /** Import .asm sources from disk (file picker or drag-drop). */
  importFiles: (files: FileList | File[]) => Promise<void>;
  deleteFile: (name: string) => void;
  commitRename: (oldName: string, input: string) => void;
  statusOf: (name: string) => CompileStatus;
  /** Compiled .h files (DOS name + bytes) to preload into z80sim. */
  compiledHexFiles: () => { path: string; contents: Uint8Array }[];
  // assemble
  busy: boolean;
  result: AssembleResult | null;
  activeArtifact: CompiledArtifact | undefined;
  settings: WorkspaceSettings;
  updateSettings: (changes: Partial<WorkspaceSettings>) => void;
  resetSettings: () => void;
  activeOutputTab: OutputTab;
  focusOutput: (t: OutputTab) => void;
  outputCollapsed: boolean;
  expandOutput: () => void;
  toggleOutputCollapsed: () => void;
  onAssemble: () => Promise<void>;
  statusText: string;
  download: (name: string, text: string) => void;
  baseName: string;
  // shell
  dockApiRef: React.MutableRefObject<DockviewApi | null>;
  simHandleRef: React.MutableRefObject<SimulatorHandle | null>;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  simRunning: boolean;
  setSimRunning: (v: boolean) => void;
  toggleSimulator: () => void;
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
  const [result, setResult] = useState<AssembleResult | null>(null);
  const [outputCollapsed, setOutputCollapsed] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState<OutputTab>("console");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [simRunning, setSimRunning] = useState(false);
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

  const openInstructionReference = useCallback(() => {
    const api = dockApiRef.current;
    if (!api) return;
    const existing = api.getPanel(INSTRUCTIONS_PANEL_ID);
    if (existing) {
      existing.api.setActive();
      return;
    }
    const anyEditor = api.panels.find((panel) =>
      panel.id.startsWith(EDITOR_PREFIX),
    );
    api.addPanel({
      id: INSTRUCTIONS_PANEL_ID,
      component: "instructions",
      title: "Z80 Instructions",
      position: anyEditor
        ? { referencePanel: anyEditor.id, direction: "within" }
        : undefined,
    });
  }, []);

  const openWelcome = useCallback(() => {
    const api = dockApiRef.current;
    if (!api) return;
    const existing = api.getPanel(WELCOME_PANEL_ID);
    if (existing) {
      existing.api.setActive();
      return;
    }
    const anyEditor = api.panels.find((panel) =>
      panel.id.startsWith(EDITOR_PREFIX),
    );
    api.addPanel({
      id: WELCOME_PANEL_ID,
      component: "welcome",
      title: "Welcome",
      position: anyEditor
        ? { referencePanel: anyEditor.id, direction: "within" }
        : undefined,
    });
  }, []);

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
        const next = [
          ...prev,
          { name, content: `; ${name}\n\n                END\n` },
        ];
        saveFiles(next);
        queueMicrotask(() => openFile(name));
        return next;
      });
    },
    [openFile],
  );

  // Import .asm files from disk. Names are normalized (collisions get a
  // numeric suffix); the last imported file opens as the active editor tab.
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

  const toggleOutputCollapsed = useCallback(
    () => setOutputCollapsed((collapsed) => !collapsed),
    [],
  );

  // Select an output channel, expanding the footer if it was collapsed.
  const focusOutput = useCallback((t: OutputTab) => {
    setActiveOutputTab(t);
    setOutputCollapsed(false);
  }, []);

  const onAssemble = useCallback(async () => {
    setBusy(true);
    setResult(null);
    focusOutput("console");
    const fileName = active.name;
    const sourceAtCompile = active.content;
    try {
      const r = await assemble(sourceAtCompile, dosBaseName(fileName));
      setResult(r);
      focusOutput(r.listing ? "listing" : "console");
      if (r.hex) {
        // Persist the compiled artifact against this file.
        setFiles((prev) => {
          const next = prev.map((f) =>
            f.name === fileName
              ? { ...f, compiled: { hex: r.hex, lst: r.listing, sourceAtCompile } }
              : f,
          );
          saveFiles(next);
          return next;
        });
        // If z80sim is already running, drop the fresh .h into its FS so the
        // user can Load it immediately (L -> Enter -> <name>.h).
        const ci = simHandleRef.current?.ci();
        if (ci) {
          void ci.fsWriteFile(
            hexName(fileName),
            new TextEncoder().encode(r.hex),
          );
        }
      }
    } catch (e) {
      setResult({
        ok: false,
        errorCount: -1,
        stdout: `Engine error: ${(e as Error).message}`,
        listing: "",
        hex: "",
      });
    } finally {
      setBusy(false);
    }
  }, [active, focusOutput]);

  const download = useCallback((name: string, text: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const statusOf = useCallback(
    (name: string): CompileStatus => {
      const f = files.find((x) => x.name === name);
      return f ? compileStatus(f) : "none";
    },
    [files],
  );

  const compiledHexFiles = useCallback(
    () =>
      files
        .filter((f) => f.compiled?.hex)
        .map((f) => ({
          path: hexName(f.name),
          contents: new TextEncoder().encode(f.compiled!.hex),
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
    // Dock z80sim beside the editor (its own big, readable half) — not with
    // the small bottom Output panel.
    const anyEditor = api.panels.find((p) => p.id.startsWith(EDITOR_PREFIX));
    api.addPanel({
      id: "simulator",
      component: "simulator",
      title: "z80sim",
      position: anyEditor
        ? { referencePanel: anyEditor.id, direction: "right" }
        : undefined,
    });
  }, []);

  const baseName = dosBaseName(active.name).toLowerCase();
  const activeArtifact = compiledArtifactFor(files, active.name);
  const statusText = busy
    ? "Assembling…"
    : result
      ? result.errorCount === 0
        ? "No Errors"
        : result.errorCount > 0
          ? `${result.errorCount} Error(s)`
          : "Failed"
      : "Ready";

  const value: AppState = {
    files,
    activeFile,
    contentOf,
    updateSource,
    setActiveFile,
    openFile,
    openInstructionReference,
    openWelcome,
    createFile,
    importFiles,
    deleteFile,
    commitRename,
    statusOf,
    compiledHexFiles,
    busy,
    result,
    activeArtifact,
    settings,
    updateSettings,
    resetSettings,
    activeOutputTab,
    focusOutput,
    outputCollapsed,
    expandOutput,
    toggleOutputCollapsed,
    onAssemble,
    statusText,
    download,
    baseName,
    dockApiRef,
    simHandleRef,
    sidebarOpen,
    toggleSidebar,
    simRunning,
    setSimRunning,
    toggleSimulator,
    tourActive,
    tourStep,
    startTour,
    stopTour,
    nextTourStep,
    prevTourStep,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
