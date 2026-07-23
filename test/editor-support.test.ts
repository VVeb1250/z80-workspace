import assert from "node:assert/strict";
import test from "node:test";
import {
  collectZ80Labels,
  formatZ80Completion,
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

test("formats completion text using the selected casing mode", () => {
  assert.equal(formatZ80Completion("ld", "l", "upper"), "LD");
  assert.equal(formatZ80Completion("LD", "L", "lower"), "ld");
  assert.equal(formatZ80Completion("LD", "l", "match"), "ld");
  assert.equal(formatZ80Completion("ld", "L", "match"), "LD");
  assert.equal(formatZ80Completion("ld", "", "match"), "LD");
});
