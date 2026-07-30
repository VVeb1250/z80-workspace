// Turn Cross-16's console output into per-line diagnostics.
//
// C16 does not print line numbers. On pass 2 it echoes each offending source
// line prefixed with a one-letter error code and the current address:
//
//   S  008000               START:          LD      A, 05H
//
// So we match those echoes back onto the source to recover a line number, in
// order, which is what the editor needs to draw a squiggle.

export interface CompilerDiagnostic {
  /** 1-based source line; 0 when the echo matched nothing. */
  line: number;
  /** Cross-16's one-letter error code, e.g. "S". */
  code: string;
  message: string;
}

const ERROR_LINE = /^([A-Z])\s+([0-9A-F]{4,8})\s{2,}(.*)$/;

/** Directives Cross-16 needs before it can assemble Z80 at all. */
const hasDirective = (source: string, name: string) =>
  new RegExp(`^\\s*${name}\\b`, "im").test(source);

export const missingCpuTable = (source: string) => !hasDirective(source, "CPU");
export const missingHexFormat = (source: string) => !hasDirective(source, "HOF");

/**
 * Locate an echoed source line. Matching walks forward so repeated lines (a
 * bare HALT in two places) land on distinct rows, and falls back to a global
 * search when the echo is out of order.
 */
function findLine(lines: string[], echo: string, from: number): number {
  const wanted = echo.trim();
  if (!wanted) return 0;
  for (let i = from; i < lines.length; i++) {
    if (lines[i].trim() === wanted) return i + 1;
  }
  for (let i = 0; i < from; i++) {
    if (lines[i].trim() === wanted) return i + 1;
  }
  return 0;
}

/** Per-line errors reported by C16 in this run. */
export function parseC16Errors(
  stdout: string,
  source: string,
): CompilerDiagnostic[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const found: CompilerDiagnostic[] = [];
  let cursor = 0;
  for (const raw of stdout.replace(/\r\n?/g, "\n").split("\n")) {
    const match = ERROR_LINE.exec(raw);
    if (!match) continue;
    const [, code, , echo] = match;
    const line = findLine(lines, echo, cursor);
    if (line) cursor = line;
    found.push({
      line,
      code,
      message: `Cross-16 error "${code}" on this line`,
    });
  }
  return found;
}

/**
 * Why a whole file failed, when the per-line errors all share one cause. A file
 * with no CPU table has no opcodes at all, so every mnemonic is a syntax error
 * — saying that once is worth more than N identical squiggles.
 */
export function buildHints(source: string, errorCount: number): string[] {
  if (errorCount === 0) return [];
  const hints: string[] = [];
  if (missingCpuTable(source)) {
    hints.push(
      'No CPU table: add  CPU  "Z80.TBL"  near the top, or every Z80 mnemonic is a syntax error.',
    );
  }
  if (missingHexFormat(source)) {
    hints.push('No output format: add  HOF  "INT8"  to get an Intel HEX file.');
  }
  if (!/^\s*END\b/im.test(source)) {
    hints.push("No END directive: Cross-16 stops at the end of the source.");
  }
  return hints;
}
