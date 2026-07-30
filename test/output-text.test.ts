import assert from "node:assert/strict";
import test from "node:test";
import { forDisplay, highlightSegments } from "../src/panels/outputText.ts";

test("drops the DOS paging characters a <pre> would render literally", () => {
  const listing = " 8000 3E01      START:\r\n\f 8002 060A\r\n\f";
  assert.equal(forDisplay(listing), " 8000 3E01      START:\n 8002 060A\n");
});

test("splits text into plain and matching runs, ignoring case", () => {
  assert.deepEqual(highlightSegments("LD A, LD B", "ld"), [
    { text: "LD", match: true },
    { text: " A, ", match: false },
    { text: "LD", match: true },
    { text: " B", match: false },
  ]);
});

test("returns the whole text as one run when nothing is searched", () => {
  assert.deepEqual(highlightSegments("HALT", ""), [
    { text: "HALT", match: false },
  ]);
  assert.deepEqual(highlightSegments("HALT", "nop"), [
    { text: "HALT", match: false },
  ]);
});
