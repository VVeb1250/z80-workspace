import assert from "node:assert/strict";
import test from "node:test";
import { TOUR_STEPS } from "../src/tutorial/tutorialContent.ts";

test("ends the guided journey with exporting build files", () => {
  const last = TOUR_STEPS.at(-1);

  assert.equal(last?.id, "export");
  assert.equal(last?.anchor, "export");
  assert.match(last?.th.body ?? "", /\.h/);
  assert.match(last?.th.body ?? "", /\.lst/);
});
