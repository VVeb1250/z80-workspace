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
      theme: "z80-light",
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
      tutorialSeen: true,
      tutorialLang: "en",
    }),
    {
      editorFontSize: 16,
      theme: "z80-light",
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
      tutorialSeen: true,
      tutorialLang: "en",
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

test("defaults unsupported editor themes to Z80 Dark", () => {
  assert.equal(DEFAULT_WORKSPACE_SETTINGS.theme, "z80-dark");
  assert.equal(
    normalizeWorkspaceSettings({ theme: "neon-rainbow" }).theme,
    "z80-dark",
  );
});

test("hides the Welcome auto-open flag until the first run marks it seen", () => {
  assert.equal(DEFAULT_WORKSPACE_SETTINGS.tutorialSeen, false);
  assert.equal(normalizeWorkspaceSettings({}).tutorialSeen, false);
  assert.equal(normalizeWorkspaceSettings({ tutorialSeen: true }).tutorialSeen, true);
});

test("defaults tutorial language to Thai and rejects unknown languages", () => {
  assert.equal(DEFAULT_WORKSPACE_SETTINGS.tutorialLang, "th");
  assert.equal(normalizeWorkspaceSettings({ tutorialLang: "en" }).tutorialLang, "en");
  assert.equal(normalizeWorkspaceSettings({ tutorialLang: "fr" }).tutorialLang, "th");
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
