import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_WORKSPACE_SETTINGS,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  normalizeWorkspaceSettings,
} from "../src/settings/store.ts";

test("keeps valid workspace settings and replaces unsupported values", () => {
  assert.deepEqual(
    normalizeWorkspaceSettings({
      editorFontSize: 16,
      outputFontSize: 14,
      tabSize: 8,
      wordWrap: true,
      minimap: true,
    }),
    {
      editorFontSize: 16,
      outputFontSize: 14,
      tabSize: 8,
      wordWrap: true,
      minimap: true,
    },
  );

  assert.deepEqual(
    normalizeWorkspaceSettings({ editorFontSize: 99, tabSize: 3 }),
    DEFAULT_WORKSPACE_SETTINGS,
  );
});

test("accepts custom font sizes within the supported range", () => {
  assert.equal(normalizeWorkspaceSettings({ editorFontSize: 15 }).editorFontSize, 15);
  assert.equal(
    normalizeWorkspaceSettings({ outputFontSize: MIN_FONT_SIZE }).outputFontSize,
    MIN_FONT_SIZE,
  );
  assert.equal(
    normalizeWorkspaceSettings({ editorFontSize: MAX_FONT_SIZE }).editorFontSize,
    MAX_FONT_SIZE,
  );
  assert.equal(
    normalizeWorkspaceSettings({ editorFontSize: MIN_FONT_SIZE - 1 }).editorFontSize,
    DEFAULT_WORKSPACE_SETTINGS.editorFontSize,
  );
});
