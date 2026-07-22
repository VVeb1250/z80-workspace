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

export const EDITOR_PREFIX = "file:";
export const editorId = (name: string) => EDITOR_PREFIX + name;

export interface AppState {
  files: AsmFile[];
  activeFile: string;
  contentOf: (name: string) => string;
  updateSource: (name: string, content: string) => void;
  setActiveFile: (name: string) => void;
  openFile: (name: string) => void;
  createFile: (input: string) => void;
  deleteFile: (name: string) => void;
  commitRename: (oldName: string, input: string) => void;
  // assemble
  busy: boolean;
  result: AssembleResult | null;
  tab: OutputTab;
  setTab: (t: OutputTab) => void;
  onAssemble: () => Promise<void>;
  statusText: string;
  download: (name: string, text: string) => void;
  baseName: string;
  // shell
  dockApiRef: React.MutableRefObject<DockviewApi | null>;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
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
  const [activeFile, setActiveFileState] = useState<string>(
    () => loadActive() ?? loadFiles()[0].name,
  );
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AssembleResult | null>(null);
  const [tab, setTab] = useState<OutputTab>("console");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [simRunning, setSimRunning] = useState(false);
  const dockApiRef = useRef<DockviewApi | null>(null);

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

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

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
    createFile,
    deleteFile,
    commitRename,
    busy,
    result,
    tab,
    setTab,
    onAssemble,
    statusText,
    download,
    baseName,
    dockApiRef,
    sidebarOpen,
    toggleSidebar,
    simRunning,
    setSimRunning,
    toggleSimulator,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
