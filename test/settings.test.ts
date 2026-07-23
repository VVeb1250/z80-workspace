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
      insertSpaces: false,
      wordWrap: true,
      minimap: true,
      quickSuggestions: false,
      parameterHints: false,
      hoverInformation: false,
      renderWhitespace: true,
      tabAcceptsSuggestion: true,
      diagnostics: false,
      lineNumbers: false,
    }),
    {
      editorFontSize: 16,
      outputFontSize: 14,
      tabSize: 8,
      insertSpaces: false,
      wordWrap: true,
      minimap: true,
      quickSuggestions: false,
      parameterHints: false,
      hoverInformation: false,
      renderWhitespace: true,
      tabAcceptsSuggestion: true,
      diagnostics: false,
      lineNumbers: false,
    },
  );

  assert.deepEqual(
    normalizeWorkspaceSettings({ editorFontSize: 99, tabSize: 3 }),
    DEFAULT_WORKSPACE_SETTINGS,
  );
});

test("keeps Tab suggestion acceptance disabled by default", () => {
  assert.equal(DEFAULT_WORKSPACE_SETTINGS.tabAcceptsSuggestion, false);
  assert.equal(normalizeWorkspaceSettings({}).tabAcceptsSuggestion, false);
});

test("uses spaces by default but supports real tab characters", () => {
  assert.equal(DEFAULT_WORKSPACE_SETTINGS.insertSpaces, true);
  assert.equal(normalizeWorkspaceSettings({ insertSpaces: false }).insertSpaces, false);
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
