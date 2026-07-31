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
    instruction: "you are out of Z80sim focus",
    needsBuild: false,
  });
  assert.deepEqual(simulatorGuidance(true, "lab1.h", true), {
    badge: "Keyboard → Z80sim",
    instruction: "to load : L → lab1.h → Enter",
    needsBuild: false,
  });
});

test("asks for a build before it explains loading", () => {
  for (const touch of [false, true]) {
    const guidance = simulatorGuidance(true, "lab1.h", false, touch);
    assert.equal(guidance.needsBuild, true);
    assert.equal(
      guidance.instruction,
      "Assemble the active file before loading it",
    );
  }
});

test("points touch users at the on-screen keyboard, not the physical one", () => {
  // "Keyboard → Editor" is meaningless on a phone: there is no keyboard to
  // steer, so the hint has to name js-dos's own soft keyboard instead.
  const idle = simulatorGuidance(false, "lab1.h", true, true);
  assert.equal(idle.badge, "Tap to control");
  assert.equal(idle.instruction, "tap the screen to control Z80sim");

  const active = simulatorGuidance(true, "lab1.h", true, true);
  assert.equal(active.badge, "Z80sim ready");
  assert.match(active.instruction, /⌨/);
  assert.match(active.instruction, /L → lab1\.h → Enter/);
});
