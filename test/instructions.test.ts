import assert from "node:assert/strict";
import test from "node:test";
import { Z80_MNEMONICS } from "../src/editor/z80language.ts";
import {
  filterZ80Instructions,
  instructionForms,
  Z80_INSTRUCTIONS,
} from "../src/instructions/z80Instructions.ts";
import {
  encodingComment,
  opcodeToBinary,
  opcodeToBitLayout,
} from "../src/instructions/z80Encodings.ts";
import {
  displayFlagEffect,
  flagEffectDescription,
  flagEffectsFor,
} from "../src/instructions/z80Flags.ts";

test("documents every mnemonic supported by the editor", () => {
  const documented = new Set(
    Z80_INSTRUCTIONS.map((instruction) => instruction.mnemonic.toLowerCase()),
  );
  assert.deepEqual(
    Z80_MNEMONICS.filter((mnemonic) => !documented.has(mnemonic)),
    [],
  );
  assert.equal(documented.size, Z80_INSTRUCTIONS.length);
  assert.deepEqual(
    Z80_INSTRUCTIONS.filter((instruction) => !instruction.encodings.length),
    [],
  );
});

test("provides opcode size and timing for each encoding form", () => {
  const ld = Z80_INSTRUCTIONS.find((instruction) => instruction.mnemonic === "LD");
  assert.ok(ld);
  assert.ok(ld.encodings.length > 5);
  assert.ok(
    ld.encodings.every(
      ({ opcode, bytes, mCycles, tStates }) =>
        opcode && bytes && mCycles && tStates,
    ),
  );
});

test("documents every direct and absolute-memory LD operand family", () => {
  const ld = Z80_INSTRUCTIONS.find((instruction) => instruction.mnemonic === "LD");
  assert.ok(ld);
  const forms = new Set(ld.encodings.map((encoding) => encoding.form));
  for (const expected of [
    "LD A, (BC)",
    "LD A, (DE)",
    "LD (BC), A",
    "LD (DE), A",
    "LD BC, (nn)",
    "LD DE, (nn)",
    "LD SP, (nn)",
    "LD (nn), BC",
    "LD (nn), DE",
    "LD (nn), SP",
  ]) {
    assert.ok(forms.has(expected), `missing ${expected}`);
  }
});

test("uses encoding data as the visible operand-form source", () => {
  const ld = Z80_INSTRUCTIONS.find((instruction) => instruction.mnemonic === "LD");
  const haltMatches = Z80_INSTRUCTIONS.filter(
    (instruction) => instruction.mnemonic === "HALT",
  );
  assert.ok(ld);
  assert.deepEqual(instructionForms(ld), ld.encodings.map(({ form }) => form));
  assert.equal(instructionForms(ld).includes("LD A, (BC)"), true);
  assert.equal(haltMatches.length, 1);
  assert.deepEqual(instructionForms(haltMatches[0]), ["HALT"]);
  assert.equal(haltMatches[0].encodings[0].opcode, "76");
});

test("converts opcode bytes to binary without losing symbolic operands", () => {
  assert.equal(opcodeToBinary("00"), "00000000");
  assert.equal(opcodeToBinary("DD/FD 8E d"), "11011101/11111101 10001110 d");
  assert.equal(
    opcodeToBinary("CB 40+b×8+r"),
    "11001011 01000000+b×8+r",
  );
  assert.equal(opcodeToBinary("C4+cc×8 nn"), "11000100+cc×8 nn");
});

test("groups symbolic opcode fields by their real bit width", () => {
  const [opcode] = opcodeToBitLayout("40+r×8+r′");
  assert.equal(opcode.kind, "byte");
  if (opcode.kind !== "byte") return;
  assert.deepEqual(
    opcode.alternatives[0].map(({ label, width, variable }) => ({
      label,
      width,
      variable,
    })),
    [
      { label: "01", width: 2, variable: false },
      { label: "r", width: 3, variable: true },
      { label: "r′", width: 3, variable: true },
    ],
  );
});

test("describes flag outcomes and encoding comments", () => {
  assert.equal(flagEffectsFor("AND").H, "1");
  assert.equal(flagEffectsFor("AND")["P/V"], "P");
  assert.match(flagEffectsFor("LD")["P/V"], /IFF2/);
  assert.equal(
    flagEffectDescription("• / IFF2"),
    "Not affected / Copied from interrupt flip-flop 2",
  );
  assert.equal(displayFlagEffect("• / β"), "• / ↕");
  const djnz = Z80_INSTRUCTIONS.find((instruction) => instruction.mnemonic === "DJNZ");
  assert.ok(djnz);
  assert.equal(
    encodingComment("DJNZ", djnz.encodings[0]),
    "Timing: B=0 / branch taken",
  );
  const nop = Z80_INSTRUCTIONS.find((instruction) => instruction.mnemonic === "NOP");
  assert.ok(nop);
  assert.equal(encodingComment("NOP", nop.encodings[0]), "");
});

test("searches instruction names, syntax and plain-language descriptions", () => {
  assert.deepEqual(
    filterZ80Instructions("DJNZ").map((instruction) => instruction.mnemonic),
    ["DJNZ"],
  );
  assert.ok(
    filterZ80Instructions("masking").some(
      (instruction) => instruction.mnemonic === "AND",
    ),
  );
  assert.ok(
    filterZ80Instructions("(IX+d)", "rotate").some(
      (instruction) => instruction.mnemonic === "BIT",
    ),
  );
  assert.deepEqual(
    filterZ80Instructions("LD A, (BC)").map(({ mnemonic }) => mnemonic),
    ["LD"],
  );
});
