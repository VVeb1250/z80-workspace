import assert from "node:assert/strict";
import test from "node:test";
import {
  collectZ80Labels,
  getZ80CompletionMode,
} from "../src/editor/z80Support.ts";

test("collects labels and EQU symbols without duplicate casing", () => {
  assert.deepEqual(
    collectZ80Labels(`
START:  LD A, 1
loop:   DJNZ loop
VALUE   EQU 10
LOOP:   NOP
`),
    ["START", "loop", "VALUE"],
  );
});

test("selects completion vocabulary from the cursor context", () => {
  assert.equal(getZ80CompletionMode("    L"), "root");
  assert.equal(getZ80CompletionMode("START:  LD "), "operand");
  assert.equal(getZ80CompletionMode("    JR "), "jump");
  assert.equal(getZ80CompletionMode("    LD A ; comment"), "none");
});
