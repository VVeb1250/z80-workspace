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
  dosBaseName,
  loadActive,
  loadFiles,
  normalizeName,
  saveActive,
  saveFiles,
  type AsmFile,
} from "../files/store";

export type OutputTab = "console" | "listing" | "hex";

export interface AppState {
  // files
  files: AsmFile[];
  active: AsmFile;
  selectFile: (name: string) => void;
  updateSource: (content: string) => void;
  newFile: () => void;
  deleteFile: (name: string) => void;
  renameFile: (name: string) => void;
  // assemble
  busy: boolean;
  result: AssembleResult | null;
  tab: OutputTab;
  setTab: (t: OutputTab) => void;
  onAssemble: () => Promise<void>;
  statusText: string;
  download: (name: string, text: string) => void;
  baseName: string;
  // dock + simulator
  dockApiRef: React.MutableRefObject<DockviewApi | null>;
  simRunning: boolean;
  setSimRunning: (v: boolean) => void;
  toggleSimulator: () => void;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within AppStateProvider");
  return v;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<AsmFile[]>(() => loadFiles());
  const [activeName, setActiveName] = useState<string>(
    () => loadActive() ?? loadFiles()[0].name,
  );
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AssembleResult | null>(null);
  const [tab, setTab] = useState<OutputTab>("console");
  const [simRunning, setSimRunning] = useState(false);
  const dockApiRef = useRef<DockviewApi | null>(null);

  const active = useMemo(
    () => files.find((f) => f.name === activeName) ?? files[0],
    [files, activeName],
  );

  const persist = useCallback((next: AsmFile[], nextActive?: string) => {
    setFiles(next);
    saveFiles(next);
    if (nextActive) {
      setActiveName(nextActive);
      saveActive(nextActive);
    }
  }, []);

  const updateSource = useCallback(
    (content: string) => {
      setFiles((prev) => {
        const next = prev.map((f) =>
          f.name === active.name ? { ...f, content } : f,
        );
        saveFiles(next);
        return next;
      });
    },
    [active],
  );

  const selectFile = useCallback((name: string) => {
    setActiveName(name);
    saveActive(name);
  }, []);

  const newFile = useCallback(() => {
    const input = window.prompt("New file name (base, .asm added):", "prog");
    if (!input) return;
    const name = normalizeName(input, files);
    persist([...files, { name, content: `; ${name}\n\n                END\n` }], name);
  }, [files, persist]);

  const deleteFile = useCallback(
    (name: string) => {
      if (files.length <= 1) {
        window.alert("Keep at least one file.");
        return;
      }
      if (!window.confirm(`Delete ${name}?`)) return;
      const next = files.filter((f) => f.name !== name);
      persist(next, name === active.name ? next[0].name : active.name);
    },
    [files, active, persist],
  );

  const renameFile = useCallback(
    (name: string) => {
      const input = window.prompt(
        "Rename to (base):",
        name.replace(/\.asm$/i, ""),
      );
      if (!input) return;
      const newName = normalizeName(
        input,
        files.filter((f) => f.name !== name),
      );
      const next = files.map((f) =>
        f.name === name ? { ...f, name: newName } : f,
      );
      persist(next, active.name === name ? newName : active.name);
    },
    [files, active, persist],
  );

  const onAssemble = useCallback(async () => {
    setBusy(true);
    setResult(null);
    setTab("console");
    try {
      const r = await assemble(active.content, dosBaseName(active.name));
      setResult(r);
      setTab(r.listing ? "listing" : "console");
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
  }, [active]);

  const download = useCallback((name: string, text: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const toggleSimulator = useCallback(() => {
    const api = dockApiRef.current;
    if (!api) return;
    const existing = api.getPanel("simulator");
    if (existing) {
      api.removePanel(existing); // unmount → SimulatorPanel cleanup stops sim
    } else {
      const ref = api.getPanel("editor") ?? api.panels[0];
      api.addPanel({
        id: "simulator",
        component: "simulator",
        title: "z80sim",
        position: ref
          ? { referencePanel: ref.id, direction: "right" }
          : undefined,
      });
    }
  }, []);

  const baseName = dosBaseName(active.name).toLowerCase();
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
    active,
    selectFile,
    updateSource,
    newFile,
    deleteFile,
    renameFile,
    busy,
    result,
    tab,
    setTab,
    onAssemble,
    statusText,
    download,
    baseName,
    dockApiRef,
    simRunning,
    setSimRunning,
    toggleSimulator,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
