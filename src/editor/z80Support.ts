import type { Monaco } from "@monaco-editor/react";
import type { editor, Position } from "monaco-editor";
import {
  Z80_DIRECTIVES,
  Z80_LANGUAGE_ID,
  Z80_MNEMONICS,
  Z80_REGISTERS,
  z80Config,
  z80Language,
} from "./z80language.ts";

export type Z80CompletionMode = "root" | "operand" | "jump" | "none";

const JUMP_INSTRUCTIONS = new Set(["call", "djnz", "jp", "jr"]);
const CONDITIONS = ["NZ", "Z", "NC", "C", "PO", "PE", "P", "M"];

const SIGNATURES: Record<string, string[]> = {
  adc: ["ADC A, source", "ADC HL, register pair"],
  add: ["ADD A, source", "ADD HL, register pair", "ADD IX, register pair", "ADD IY, register pair"],
  and: ["AND source"],
  bit: ["BIT bit, source"],
  call: ["CALL address", "CALL condition, address"],
  cp: ["CP source"],
  dec: ["DEC destination"],
  djnz: ["DJNZ address"],
  ex: ["EX destination, source"],
  im: ["IM mode"],
  in: ["IN A, (port)", "IN register, (C)"],
  inc: ["INC destination"],
  jp: ["JP address", "JP condition, address", "JP (HL)", "JP (IX)", "JP (IY)"],
  jr: ["JR address", "JR condition, address"],
  ld: ["LD destination, source"],
  or: ["OR source"],
  out: ["OUT (port), A", "OUT (C), register"],
  res: ["RES bit, source"],
  ret: ["RET", "RET condition"],
  rl: ["RL destination"],
  rlc: ["RLC destination"],
  rr: ["RR destination"],
  rrc: ["RRC destination"],
  rst: ["RST address"],
  sbc: ["SBC A, source", "SBC HL, register pair"],
  set: ["SET bit, source"],
  sla: ["SLA destination"],
  sra: ["SRA destination"],
  srl: ["SRL destination"],
  sub: ["SUB source"],
  xor: ["XOR source"],
};

const DESCRIPTIONS: Record<string, string> = {
  adc: "Add with carry.",
  add: "Add source to destination.",
  and: "Bitwise AND with the accumulator.",
  bit: "Test a bit without changing the operand.",
  call: "Call a subroutine.",
  cp: "Compare a value with the accumulator.",
  djnz: "Decrement B and jump while it is not zero.",
  jp: "Jump to an address.",
  jr: "Jump to a nearby relative address.",
  ld: "Load or copy a value.",
  or: "Bitwise OR with the accumulator.",
  ret: "Return from a subroutine.",
  xor: "Bitwise XOR with the accumulator.",
};

const DIRECTIVE_DESCRIPTIONS: Record<string, string> = {
  cpu: "Select the processor table, normally \"Z80.TBL\".",
  db: "Define one or more bytes.",
  dw: "Define one or more words.",
  ds: "Reserve storage.",
  end: "Mark the end of the source file.",
  equ: "Define a constant value.",
  hof: "Select the output format, normally \"INT8\" for Intel HEX.",
  org: "Set the assembly origin address.",
};

export function collectZ80Labels(source: string): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();
  const definition = /^\s*([A-Za-z_.$][\w.$]*)(?::|\s+EQU\b)/gim;
  let match: RegExpExecArray | null;
  while ((match = definition.exec(source)) !== null) {
    const label = match[1];
    const key = label.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      labels.push(label);
    }
  }
  return labels;
}

export function getZ80CompletionMode(lineBeforeCursor: string): Z80CompletionMode {
  const commentStart = lineBeforeCursor.indexOf(";");
  if (commentStart >= 0) return "none";

  const withoutLabel = lineBeforeCursor.replace(
    /^\s*[A-Za-z_.$][\w.$]*:\s*/,
    "",
  );
  const trimmed = withoutLabel.trimStart();
  if (!trimmed || (!/\s/.test(trimmed) && !/\s$/.test(withoutLabel))) {
    return "root";
  }

  const instruction = trimmed.split(/\s+/, 1)[0].toLowerCase();
  return JUMP_INSTRUCTIONS.has(instruction) ? "jump" : "operand";
}

function activeInstruction(lineBeforeCursor: string): string | undefined {
  const code = lineBeforeCursor
    .replace(/^\s*[A-Za-z_.$][\w.$]*:\s*/, "")
    .trimStart();
  return code.split(/\s+/, 1)[0]?.toLowerCase();
}

// Lowercase suggestions when the user is typing lowercase, else uppercase.
function matchCase(text: string, typed: string): string {
  const lower = typed.length > 0 && typed === typed.toLowerCase();
  return lower ? text.toLowerCase() : text.toUpperCase();
}

const NUMBER_LIKE = /^(?:\$|%|\d|[0-9A-Fa-f]+[hH]$|[01]+[bB]$)/;

let diagnosticsOn = true;
let monacoRef: Monaco | null = null;

// Toggle live diagnostics (settings). Re-validates or clears every z80 model.
export function setZ80Diagnostics(enabled: boolean): void {
  diagnosticsOn = enabled;
  if (!monacoRef) return;
  for (const model of monacoRef.editor.getModels()) {
    if (model.getLanguageId() !== Z80_LANGUAGE_ID) continue;
    if (enabled) validateZ80Model(monacoRef, model);
    else monacoRef.editor.setModelMarkers(model, "z80", []);
  }
}

// Live diagnostics: unknown mnemonics, undefined jump targets, 0x hex.
function validateZ80Model(
  monaco: Monaco,
  model: editor.ITextModel,
): void {
  if (!diagnosticsOn) return;
  const text = model.getValue();
  const known = new Set(collectZ80Labels(text).map((l) => l.toLowerCase()));
  const macro = /^\s*([A-Za-z_.$][\w.$]*)\s+MACRO\b/gim;
  for (let m; (m = macro.exec(text)); ) known.add(m[1].toLowerCase());
  const mnemonics = new Set(Z80_MNEMONICS);
  const directives = new Set(Z80_DIRECTIVES);
  const conditions = new Set(CONDITIONS.map((c) => c.toLowerCase()));
  const markers: editor.IMarkerData[] = [];
  const warn = (line: number, col: number, len: number, message: string) =>
    markers.push({
      severity: monaco.MarkerSeverity.Warning,
      message,
      startLineNumber: line,
      startColumn: col,
      endLineNumber: line,
      endColumn: col + len,
    });

  for (let ln = 1; ln <= model.getLineCount(); ln++) {
    const raw = model.getLineContent(ln);
    const code = raw.includes(";") ? raw.slice(0, raw.indexOf(";")) : raw;
    for (let h; (h = /\b0x[0-9A-Fa-f]+\b/gi.exec(code)); ) {
      warn(ln, h.index + 1, h[0].length, "Cross-16 hex is NNh or $NN, not 0x.");
      break;
    }
    const rest = code.replace(/^\s*[A-Za-z_.$][\w.$]*:\s*/, "").trim();
    if (!rest) continue;
    const tokens = rest.split(/\s+/);
    const first = tokens[0];
    if (tokens[1] && /^(equ|macro|=)$/i.test(tokens[1])) continue;
    if (first.startsWith(".")) continue;
    const low = first.toLowerCase();

    if (!mnemonics.has(low) && !directives.has(low)) {
      if (!known.has(low) && /^[A-Za-z_.$][\w.$]*$/.test(first)) {
        warn(ln, raw.indexOf(first) + 1, first.length, `Unknown instruction '${first}'.`);
      }
      continue;
    }
    if (JUMP_INSTRUCTIONS.has(low)) {
      const ops = rest
        .slice(first.length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const target = ops[ops.length - 1];
      if (
        target &&
        /^[A-Za-z_.][\w.]*$/.test(target) &&
        !NUMBER_LIKE.test(target) &&
        !conditions.has(target.toLowerCase()) &&
        !Z80_REGISTERS.includes(target.toLowerCase()) &&
        !known.has(target.toLowerCase())
      ) {
        warn(ln, raw.indexOf(target) + 1, target.length, `Undefined label '${target}'.`);
      }
    }
  }
  monaco.editor.setModelMarkers(model, "z80", markers);
}

let registered = false;

export function registerZ80LanguageSupport(monaco: Monaco): void {
  if (registered) return;
  registered = true;
  monacoRef = monaco;

  monaco.languages.register({ id: Z80_LANGUAGE_ID });
  monaco.languages.setMonarchTokensProvider(Z80_LANGUAGE_ID, z80Language);
  monaco.languages.setLanguageConfiguration(Z80_LANGUAGE_ID, z80Config);

  // Debounced live diagnostics per z80 model.
  const timers = new Map<editor.ITextModel, number>();
  const schedule = (model: editor.ITextModel) => {
    window.clearTimeout(timers.get(model));
    timers.set(
      model,
      window.setTimeout(() => validateZ80Model(monaco, model), 300),
    );
  };
  const attach = (model: editor.ITextModel) => {
    if (model.getLanguageId() !== Z80_LANGUAGE_ID) return;
    validateZ80Model(monaco, model);
    model.onDidChangeContent(() => schedule(model));
    model.onWillDispose(() => {
      window.clearTimeout(timers.get(model));
      timers.delete(model);
    });
  };
  monaco.editor.getModels().forEach(attach);
  monaco.editor.onDidCreateModel(attach);

  monaco.languages.registerCompletionItemProvider(Z80_LANGUAGE_ID, {
    triggerCharacters: [" ", "("],
    provideCompletionItems(model: editor.ITextModel, position: Position) {
      const line = model.getLineContent(position.lineNumber);
      const lineBeforeCursor = line.slice(0, position.column - 1);
      const mode = getZ80CompletionMode(lineBeforeCursor);
      if (mode === "none") return { suggestions: [] };

      const word = model.getWordUntilPosition(position);
      const range = new monaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn,
      );
      const instruction = activeInstruction(lineBeforeCursor);
      const labels = collectZ80Labels(model.getValue());
      const typed = word.word;
      const suggestions: Array<ReturnType<typeof completion>> = [];

      function completion(
        label: string,
        kind: number,
        detail: string,
        sortText: string,
        documentation?: string,
        insertText?: string,
      ) {
        return {
          label,
          kind,
          detail,
          documentation,
          insertText: insertText ?? label,
          range,
          sortText,
        };
      }

      if (mode === "root") {
        for (const mnemonic of Z80_MNEMONICS) {
          const upper = mnemonic.toUpperCase();
          const name = matchCase(mnemonic, typed);
          suggestions.push(
            completion(
              upper,
              monaco.languages.CompletionItemKind.Keyword,
              SIGNATURES[mnemonic]?.join(" · ") ?? "Z80 instruction",
              `1_${upper}`,
              DESCRIPTIONS[mnemonic],
              name,
            ),
          );
        }
        for (const directive of Z80_DIRECTIVES) {
          const upper = directive.toUpperCase();
          suggestions.push(
            completion(
              upper,
              monaco.languages.CompletionItemKind.Keyword,
              "Cross-16 directive",
              `2_${upper}`,
              DIRECTIVE_DESCRIPTIONS[directive],
              matchCase(directive, typed),
            ),
          );
        }
      } else {
        if (mode === "jump") {
          for (const label of labels) {
            suggestions.push(
              completion(
                label,
                monaco.languages.CompletionItemKind.Reference,
                "Label in this file",
                `0_${label}`,
              ),
            );
          }
          if (instruction !== "djnz") {
            for (const condition of CONDITIONS) {
              suggestions.push(
                completion(
                  condition,
                  monaco.languages.CompletionItemKind.EnumMember,
                  "Condition code",
                  `1_${condition}`,
                  undefined,
                  matchCase(condition, typed),
                ),
              );
            }
          }
          return { suggestions };
        }

        if (instruction === "cpu") {
          suggestions.push(
            completion(
              '"Z80.TBL"',
              monaco.languages.CompletionItemKind.Value,
              "Z80 processor table",
              "0_Z80",
            ),
          );
        } else if (instruction === "hof") {
          suggestions.push(
            completion(
              '"INT8"',
              monaco.languages.CompletionItemKind.Value,
              "Intel HEX output",
              "0_INT8",
            ),
          );
        } else {
          for (const register of Z80_REGISTERS) {
            const upper = register.toUpperCase();
            if (CONDITIONS.includes(upper)) continue;
            suggestions.push(
              completion(
                upper,
                monaco.languages.CompletionItemKind.Variable,
                "Z80 register or condition",
                `1_${upper}`,
                undefined,
                matchCase(register, typed),
              ),
            );
          }
          for (const condition of CONDITIONS) {
            suggestions.push(
              completion(
                condition,
                monaco.languages.CompletionItemKind.EnumMember,
                "Condition code",
                `1_${condition}`,
                undefined,
                matchCase(condition, typed),
              ),
            );
          }
          for (const label of labels) {
            suggestions.push(
              completion(
                label,
                monaco.languages.CompletionItemKind.Reference,
                "Label in this file",
                `2_${label}`,
              ),
            );
          }
        }
      }

      return { suggestions };
    },
  });

  monaco.languages.registerHoverProvider(Z80_LANGUAGE_ID, {
    provideHover(model: editor.ITextModel, position: Position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;
      const key = word.word.toLowerCase();
      const description = DESCRIPTIONS[key] ?? DIRECTIVE_DESCRIPTIONS[key];
      const signatures = SIGNATURES[key];
      if (!description && !signatures && !Z80_REGISTERS.includes(key)) return null;

      const contents = [];
      if (description) contents.push({ value: `**${word.word.toUpperCase()}** — ${description}` });
      if (signatures) contents.push({ value: signatures.map((item) => `\`${item}\``).join("  \n") });
      if (Z80_REGISTERS.includes(key) && !description && !signatures) contents.push({ value: `**${word.word.toUpperCase()}** — Z80 register or condition code.` });
      return {
        contents,
        range: new monaco.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn,
        ),
      };
    },
  });

  monaco.languages.registerSignatureHelpProvider(Z80_LANGUAGE_ID, {
    signatureHelpTriggerCharacters: [" ", ","],
    signatureHelpRetriggerCharacters: [","],
    provideSignatureHelp(model: editor.ITextModel, position: Position) {
      const line = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
      if (line.includes(";")) return null;
      const instruction = activeInstruction(line);
      const signatures = instruction ? SIGNATURES[instruction] : undefined;
      if (!signatures || !instruction || !/\s/.test(line.trimStart())) return null;
      const activeParameter = Math.max(0, line.split(",").length - 1);
      return {
        value: {
          signatures: signatures.map((label) => ({
            label,
            documentation: DESCRIPTIONS[instruction],
            parameters: label
              .slice(label.indexOf(" ") + 1)
              .split(",")
              .filter(Boolean)
              .map((parameter) => ({ label: parameter.trim() })),
          })),
          activeSignature: 0,
          activeParameter,
        },
        dispose() {},
      };
    },
  });
}
