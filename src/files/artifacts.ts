import type { AsmFile, CompiledArtifact } from "./store";

/** Return only the persisted build output that belongs to the selected file. */
export function compiledArtifactFor(
  files: AsmFile[],
  selectedFile: string,
): CompiledArtifact | undefined {
  return files.find((file) => file.name === selectedFile)?.compiled;
}
