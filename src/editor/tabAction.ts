interface Z80TabEditor {
  getDomNode(): { querySelector(selector: string): unknown } | null;
  trigger(source: string, command: string, payload: unknown): void;
}

export function runZ80TabAction(
  editor: Z80TabEditor,
  tabAcceptsSuggestion: boolean,
): void {
  const suggestionVisible = Boolean(
    editor.getDomNode()?.querySelector(".suggest-widget.visible"),
  );

  if (tabAcceptsSuggestion && suggestionVisible) {
    editor.trigger("z80-tab-suggestion", "acceptSelectedSuggestion", null);
    editor.trigger("z80-tab-suggestion", "hideSuggestWidget", null);
    return;
  }

  editor.trigger("z80-indent", "hideSuggestWidget", null);
  editor.trigger("z80-indent", "tab", null);
  editor.trigger("z80-tab", "editor.action.triggerSuggest", null);
  editor.trigger("z80-tab", "editor.action.triggerParameterHints", null);
}
