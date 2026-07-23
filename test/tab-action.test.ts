import assert from "node:assert/strict";
import test from "node:test";
import { runZ80TabAction } from "../src/editor/tabAction.ts";

type TriggerCall = [source: string, command: string, payload: unknown];

function editorWithSuggestionVisibility(visible: boolean) {
  const calls: TriggerCall[] = [];
  return {
    calls,
    editor: {
      getDomNode: () => ({
        querySelector: (selector: string) =>
          visible && selector === ".suggest-widget.visible" ? {} : null,
      }),
      trigger: (source: string, command: string, payload: unknown) => {
        calls.push([source, command, payload]);
      },
    },
  };
}

test("Tab indents, then opens completion and signature help", () => {
  const { editor, calls } = editorWithSuggestionVisibility(false);

  runZ80TabAction(editor, false);

  assert.deepEqual(calls, [
    ["z80-indent", "hideSuggestWidget", null],
    ["z80-indent", "tab", null],
    ["z80-tab", "editor.action.triggerSuggest", null],
    ["z80-tab", "editor.action.triggerParameterHints", null],
  ]);
});

test("Tab still accepts a visible suggestion when enabled", () => {
  const { editor, calls } = editorWithSuggestionVisibility(true);

  runZ80TabAction(editor, true);

  assert.deepEqual(calls, [
    ["z80-tab-suggestion", "acceptSelectedSuggestion", null],
    ["z80-tab-suggestion", "hideSuggestWidget", null],
  ]);
});

test("Tab opens helpers when suggestion acceptance is enabled but no suggestion is visible", () => {
  const { editor, calls } = editorWithSuggestionVisibility(false);

  runZ80TabAction(editor, true);

  assert.deepEqual(calls, [
    ["z80-indent", "hideSuggestWidget", null],
    ["z80-indent", "tab", null],
    ["z80-tab", "editor.action.triggerSuggest", null],
    ["z80-tab", "editor.action.triggerParameterHints", null],
  ]);
});
