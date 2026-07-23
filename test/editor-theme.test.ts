import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_Z80_THEME_ID,
  registerZ80Themes,
  Z80_THEME_OPTIONS,
  Z80_THEMES,
} from "../src/editor/z80Theme.ts";

function syntaxColors(theme: (typeof Z80_THEMES)[keyof typeof Z80_THEMES]) {
  return Object.fromEntries(
    theme.rules.map(({ token, foreground }) => [token, foreground]),
  );
}

test("offers dark, light and high-contrast editor themes", () => {
  assert.equal(DEFAULT_Z80_THEME_ID, "z80-dark");
  assert.deepEqual(Z80_THEME_OPTIONS, [
    { id: "z80-dark", label: "Z80 Dark" },
    { id: "z80-light", label: "Z80 Light" },
    { id: "z80-high-contrast", label: "High Contrast" },
  ]);
});

test("uses colors suited to the dark editor background", () => {
  const colors = Object.fromEntries(
    Z80_THEMES["z80-dark"].rules.map(({ token, foreground }) => [
      token,
      foreground,
    ]),
  );

  assert.equal(Z80_THEMES["z80-dark"].base, "vs-dark");
  assert.deepEqual(colors, {
    keyword: "569CD6",
    "keyword.directive": "C586C0",
    "variable.predefined": "9CDCFE",
    identifier: "DCDCAA",
    "type.identifier": "DCDCAA",
  });
});

test("uses darker syntax colors on the light editor background", () => {
  assert.equal(Z80_THEMES["z80-light"].base, "vs");
  assert.deepEqual(syntaxColors(Z80_THEMES["z80-light"]), {
    keyword: "0000FF",
    "keyword.directive": "AF00DB",
    "variable.predefined": "0070C1",
    identifier: "795E26",
    "type.identifier": "795E26",
  });
});

test("uses bright syntax colors for high contrast", () => {
  assert.equal(Z80_THEMES["z80-high-contrast"].base, "hc-black");
  assert.deepEqual(syntaxColors(Z80_THEMES["z80-high-contrast"]), {
    keyword: "75BEFF",
    "keyword.directive": "FF7FFF",
    "variable.predefined": "9CDCFE",
    identifier: "FFD700",
    "type.identifier": "FFD700",
  });
});

test("registers every custom theme with Monaco", () => {
  const calls: unknown[][] = [];
  const monaco = {
    editor: {
      defineTheme: (...args: unknown[]) => calls.push(args),
    },
  };

  registerZ80Themes(monaco);

  assert.deepEqual(
    calls,
    Object.entries(Z80_THEMES).map(([id, theme]) => [id, theme]),
  );
});
