import type { AsmFile, CompiledArtifact } from "./store";

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
