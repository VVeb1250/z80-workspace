// Simple client-side multi-file store for user .asm sources, persisted to
// localStorage. The micro_processor tool files are NOT stored here — they are
// read-only kit assets served from /public.

import { SAMPLE_SOURCE } from "../editor/z80language";

export interface CompiledArtifact {
  hex: string; // Intel HEX (C16 -H output) — loadable by z80sim's Load menu
  lst: string; // listing
  sourceAtCompile: string; // source snapshot when compiled (for staleness)
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

/** Ensure a unique "name.asm" for a user-entered base name. */
export function normalizeName(input: string, existing: AsmFile[]): string {
  let base = input.trim().replace(/\.asm$/i, "");
  base = base.replace(/[^A-Za-z0-9_]/g, "") || "untitled";
  let name = base + ".asm";
  let n = 1;
  while (existing.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
    name = `${base}${n++}.asm`;
  }
  return name;
}

/**
 * Cross-16 / DOSBox needs DOS 8.3 names. Derive an uppercase <=8 char base
 * from a display name so the assemble step writes valid filenames.
 */
export function dosBaseName(displayName: string): string {
  const base = displayName
    .replace(/\.asm$/i, "")
    .replace(/[^A-Za-z0-9_]/g, "")
    .toUpperCase()
    .slice(0, 8);
  return base || "LAB1";
}
