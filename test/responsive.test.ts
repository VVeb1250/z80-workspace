import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { COARSE_QUERY, NARROW_QUERY } from "../src/responsive.ts";

const css = readFileSync(new URL("../src/App.css", import.meta.url), "utf8");

// The narrow layout is half JS and half CSS: React decides whether to render
// the Explorer as a drawer and the Output as a sheet, while CSS decides how
// those look. If the two disagree about the breakpoint there is a band of
// widths where a drawer is painted as a pane, so pin them together.
test("the narrow breakpoint agrees between the layout code and the stylesheet", () => {
  const px = /max-width:\s*(\d+)px/.exec(NARROW_QUERY)?.[1];
  assert.ok(px, `NARROW_QUERY should be a max-width query, got ${NARROW_QUERY}`);
  assert.match(
    css,
    new RegExp(`change one and you must change the other`),
    "App.css should keep the note explaining the shared breakpoint",
  );
  assert.match(
    css,
    new RegExp(`Below ${px}px the workbench stops splitting`),
    `App.css should document the same ${px}px breakpoint as NARROW_QUERY`,
  );
});

test("touch affordances key off the pointer, not the viewport width", () => {
  // A 1280px-wide tablet needs finger-sized targets; a 700px-wide desktop
  // window does not. Anything hover-only must be un-hidden in this block or
  // it is unreachable on a touch screen.
  assert.equal(COARSE_QUERY, "(pointer: coarse)");
  const block = /@media \(pointer: coarse\) \{([\s\S]*?)\n\}/.exec(css)?.[1];
  assert.ok(block, "App.css should have a (pointer: coarse) block");
  for (const selector of [".file-actions", ".tab-action"]) {
    assert.ok(
      block.includes(selector),
      `${selector} is revealed on :hover, so it must be forced visible for touch`,
    );
  }
});
