import assert from "node:assert/strict";
import test from "node:test";
import { editorTypographyOptions } from "../src/editor/editorOptions.ts";

test("lets Monaco derive line height from every supported font size", () => {
  assert.deepEqual(editorTypographyOptions(13), {
    fontSize: 13,
    lineHeight: 0,
  });
  assert.deepEqual(editorTypographyOptions(72), {
    fontSize: 72,
    lineHeight: 0,
  });
});
