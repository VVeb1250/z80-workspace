import assert from "node:assert/strict";
import test from "node:test";
import {
  simulatorGuidance,
  shouldAutoMaximizeSimulator,
} from "../src/dosbox/simulatorUi.ts";

test("maximizes a narrow simulator and explains its keyboard focus contract", () => {
  assert.equal(shouldAutoMaximizeSimulator(980), true);
  assert.equal(shouldAutoMaximizeSimulator(981), false);
  assert.deepEqual(simulatorGuidance(false, "lab1.h", true), {
    badge: "Keyboard → Editor",
    instruction: "Click the screen · L → lab1.h → Enter",
    needsBuild: false,
  });
  assert.deepEqual(simulatorGuidance(true, "lab1.h", true), {
    badge: "Keyboard → Z80sim",
    instruction: "L → lab1.h → Enter",
    needsBuild: false,
  });
});
