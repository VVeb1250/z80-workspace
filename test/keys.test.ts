import assert from "node:assert/strict";
import test from "node:test";
import {
  KBD,
  loadCommandStrokes,
  sendStrokes,
  strokeForChar,
  strokesForText,
} from "../src/dosbox/keys.ts";

test("letters map to the uppercase ASCII code, unshifted, whatever the case", () => {
  // DOS echoes lowercase for an unshifted letter key, and its filenames are
  // case-insensitive — so both cases must produce the identical stroke.
  assert.deepEqual(strokeForChar("a"), { code: 65 });
  assert.deepEqual(strokeForChar("A"), { code: 65 });
  assert.deepEqual(strokeForChar("z"), { code: 90 });
  assert.deepEqual(strokeForChar("l"), { code: 76 });
});

test("digits and filename punctuation map without a shift", () => {
  assert.deepEqual(strokeForChar("0"), { code: 48 });
  assert.deepEqual(strokeForChar("9"), { code: 57 });
  assert.deepEqual(strokeForChar("."), { code: KBD.period });
  assert.deepEqual(strokeForChar("-"), { code: KBD.minus });
});

test("shifted punctuation carries the shift flag", () => {
  assert.deepEqual(strokeForChar("_"), { code: KBD.minus, shift: true });
  assert.deepEqual(strokeForChar(":"), { code: KBD.semicolon, shift: true });
});

test("an untypeable character fails the whole string, not just itself", () => {
  // Half a filename typed into a live prompt is worse than none: z80sim would
  // be left sitting at a Load prompt with garbage in it.
  assert.equal(strokeForChar("ก"), null);
  assert.equal(strokesForText("labก.h"), null);
  assert.equal(loadCommandStrokes("labก.h"), null);
});

test("the load command is L, then the name, then Enter", () => {
  const strokes = loadCommandStrokes("lab1.h");
  assert.ok(strokes);
  assert.deepEqual(strokes, [
    { code: 76 }, // L — z80sim's Load command
    { code: 76 }, // l
    { code: 65 }, // a
    { code: 66 }, // b
    { code: 49 }, // 1
    { code: KBD.period },
    { code: 72 }, // h
    { code: KBD.enter },
  ]);
});

test("sendStrokes emits a separated down/up pair per key", async () => {
  // DOSBox samples the keyboard once per emulated frame, so a down and up in
  // the same tick is dropped entirely — the wait between them is load-bearing.
  const events: [number, boolean][] = [];
  const waits: number[] = [];
  await sendStrokes(
    { sendKeyEvent: (code, pressed) => events.push([code, pressed]) },
    [{ code: 65 }, { code: KBD.enter }],
    async (ms) => {
      waits.push(ms);
    },
  );
  assert.deepEqual(events, [
    [65, true],
    [65, false],
    [KBD.enter, true],
    [KBD.enter, false],
  ]);
  assert.equal(waits.length, 4, "every press waits before and after release");
  assert.ok(waits.every((ms) => ms > 0));
});

test("a shifted stroke wraps the key in shift down/up", async () => {
  const events: [number, boolean][] = [];
  await sendStrokes(
    { sendKeyEvent: (code, pressed) => events.push([code, pressed]) },
    [{ code: KBD.minus, shift: true }],
    async () => {},
  );
  assert.deepEqual(events, [
    [KBD.leftshift, true],
    [KBD.minus, true],
    [KBD.minus, false],
    [KBD.leftshift, false],
  ]);
});
