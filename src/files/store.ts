// Simple client-side multi-file store for user .asm sources, persisted to
// localStorage. The micro_processor tool files are NOT stored here — they are
// read-only kit assets served from /public.

import { SAMPLE_SOURCE } from "../editor/z80language.ts";

export interface CompiledArtifact {
  hex: string; // Intel HEX (C16 -H output) — loadable by Z80sim's Load menu
  lst: string; // listing
  stdout?: string; // compiler log, persisted so reload keeps a coherent status
  sourceAtCompile: string; // source snapshot when compiled (for staleness)
  compiledAt?: number; // epoch ms; absent on artifacts stored before this field
}

export interface AsmFile {
  name: string; // display name, e.g. "lab1.asm"
  content: string;
  compiled?: CompiledArtifact;
}

export type CompileStatus = "none" | "fresh" | "stale";

export function compileStatus(f: AsmFile): CompileStatus {
  if (!f.compiled) return "none";
  return f.compiled.sourceAtCompile === f.content ? "fresh" : "stale";
}

const KEY = "z80ws.files.v1";
const ACTIVE_KEY = "z80ws.active.v1";

export function loadFiles(): AsmFile[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AsmFile[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    /* fall through to seed */
  }
  return [{ name: "lab1.asm", content: SAMPLE_SOURCE }];
}

export function saveFiles(files: AsmFile[]): void {
  localStorage.setItem(KEY, JSON.stringify(files));
}

export function loadActive(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function saveActive(name: string): void {
  localStorage.setItem(ACTIVE_KEY, name);
}

/**
 * Strip any source extension, not just .asm — the import picker also accepts
 * .z80 / .s / .inc / .txt, and leaving those on turns "prog.z80" into
 * "progz80.asm" once the dot is stripped as a special character.
 */
const stripExtension = (input: string) =>
  input.trim().replace(/\.(asm|z80|s|inc|txt)$/i, "");

/** The base a display name reduces to, before uniquifying. */
export const baseNameOf = (input: string) =>
  stripExtension(input).replace(/[^A-Za-z0-9_]/g, "") || "untitled";

/** Ensure a unique "name.asm" for a user-entered base name. */
export function normalizeName(input: string, existing: AsmFile[]): string {
  const base = baseNameOf(input);
  let name = base + ".asm";
  let n = 1;
  while (existing.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
    name = `${base}${n++}.asm`;
  }
  return name;
}

/** The existing file an import would collide with, if any. */
export const findByName = (files: AsmFile[], name: string) =>
  files.find((f) => f.name.toLowerCase() === name.toLowerCase());

/**
 * Cross-16 / DOSBox need DOS 8.3 names: <=8 chars, no special characters.
 * Case is kept as the user typed it — DOS is case-insensitive, so this is the
 * name to show and to type on the command line.
 */
export function dos83Base(displayName: string): string {
  const base = displayName
    .replace(/\.asm$/i, "")
    .replace(/[^A-Za-z0-9_]/g, "")
    .slice(0, 8);
  return base || "lab1";
}

/**
 * True when the Explorer name and the name DOS builds under differ, so the UI
 * can say "this builds as MYFIRSTP.H" instead of silently truncating.
 */
export function isDosNameTruncated(displayName: string): boolean {
  return displayName.replace(/\.asm$/i, "") !== dos83Base(displayName);
}

/**
 * The name DOS actually stores on disk (8.3 is always uppercased there), so
 * anything reading a file back out of the emulator must ask for this form.
 */
export function dosBaseName(displayName: string): string {
  return dos83Base(displayName).toUpperCase();
}
