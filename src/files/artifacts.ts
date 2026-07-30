import { dos83Base, type AsmFile, type CompiledArtifact } from "./store.ts";

export type ArtifactKind = "hex" | "listing";

export interface BuildPresentation {
  kind: "idle" | "busy" | "ok" | "err";
  text: string;
  restored: boolean;
}

interface BuildResultLike {
  ok?: boolean;
  errorCount: number;
  hex?: string;
}

export interface ArtifactDescriptor {
  kind: ArtifactKind;
  label: string;
  fileName: string;
  text: string | undefined;
  state: "missing" | "ready" | "stale";
}

const artifactBase = dos83Base;

/** Size of a build product for display. HEX / LST are ASCII, so length = bytes. */
export const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;

/** Return only the persisted build output that belongs to the selected file. */
export function compiledArtifactFor(
  files: AsmFile[],
  selectedFile: string,
): CompiledArtifact | undefined {
  return files.find((file) => file.name === selectedFile)?.compiled;
}

/** A compiler may emit partial files on error; only a clean build is exportable. */
export const canPersistBuild = (result: BuildResultLike) =>
  result.ok === true && result.errorCount === 0 && !!result.hex;

/** Fresh binaries safe to preload into Z80sim. */
export const freshCompiledHexFiles = (files: AsmFile[]) =>
  files.flatMap((file) =>
    file.compiled?.hex && file.compiled.sourceAtCompile === file.content
      ? [{ fileName: file.name, hex: file.compiled.hex }]
      : [],
  );

/** User-facing build state, including artifacts restored from local storage. */
export function buildPresentation(
  file: AsmFile,
  latestResult: BuildResultLike | null,
  busy: boolean,
): BuildPresentation {
  if (busy) {
    return { kind: "busy", text: "Assembling…", restored: false };
  }
  if (latestResult) {
    if (latestResult.errorCount > 0) {
      return {
        kind: "err",
        text: `${latestResult.errorCount} Error(s)`,
        restored: false,
      };
    }
    if (latestResult.errorCount < 0) {
      return { kind: "err", text: "Build failed", restored: false };
    }
  }
  if (file.compiled && file.compiled.sourceAtCompile !== file.content) {
    return {
      kind: "idle",
      text: "Source changed · assemble again",
      restored: false,
    };
  }
  if (file.compiled && file.compiled.sourceAtCompile === file.content) {
    const base = artifactBase(file.name);
    return {
      kind: "ok",
      text: `Built · ${base}.h + ${base}.lst ready`,
      restored: latestResult == null,
    };
  }
  return { kind: "idle", text: "Ready", restored: false };
}

/**
 * Every up-to-date build product in the workspace. Exporting a lab means
 * handing in each file's .h and .lst, so offer them as one action instead of
 * one download per artifact per file.
 */
export function allReadyArtifacts(
  files: AsmFile[],
): { fileName: string; text: string }[] {
  return files.flatMap((file) =>
    artifactDescriptors(file).flatMap((artifact) =>
      artifact.state === "ready" && artifact.text
        ? [{ fileName: artifact.fileName, text: artifact.text }]
        : [],
    ),
  );
}

/** Canonical labels and filenames shared by output and export surfaces. */
export function artifactDescriptors(file: AsmFile): ArtifactDescriptor[] {
  const base = artifactBase(file.name);
  const state = !file.compiled
    ? "missing"
    : file.compiled.sourceAtCompile === file.content
      ? "ready"
      : "stale";
  return [
    {
      kind: "hex",
      label: "Intel HEX (.h)",
      fileName: `${base}.h`,
      text: file.compiled?.hex,
      state,
    },
    {
      kind: "listing",
      label: "Listing (.lst)",
      fileName: `${base}.lst`,
      text: file.compiled?.lst,
      state,
    },
  ];
}
