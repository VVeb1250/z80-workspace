import assert from "node:assert/strict";
import test from "node:test";
import {
  registerZ80Theme,
  Z80_THEME,
  Z80_THEME_ID,
} from "../src/editor/z80Theme.ts";

test("defines the expected Z80 syntax color categories", () => {
  const colors = Object.fromEntries(
    Z80_THEME.rules.map(({ token, foreground }) => [token, foreground]),
  );

  assert.equal(Z80_THEME_ID, "z80-dark");
  assert.equal(Z80_THEME.base, "vs-dark");
  assert.equal(Z80_THEME.inherit, true);
  assert.deepEqual(colors, {
    keyword: "569CD6",
    "keyword.directive": "C586C0",
    "variable.predefined": "9CDCFE",
    identifier: "DCDCAA",
    "type.identifier": "DCDCAA",
  });
});

test("registers the custom theme with Monaco", () => {
  const calls: unknown[][] = [];
  const monaco = {
    editor: {
      defineTheme: (...args: unknown[]) => calls.push(args),
    },
  };

  registerZ80Theme(monaco);

  assert.deepEqual(calls, [[Z80_THEME_ID, Z80_THEME]]);
});
