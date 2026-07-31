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

test("points touch users at the Load button and ignores focus", () => {
  // "Keyboard → Editor" is meaningless on a phone, and so is focus: SimKeyboard
  // sends keys to the emulator directly, so the hint must not change with it.
  const idle = simulatorGuidance(false, "lab1.h", true, true);
  const active = simulatorGuidance(true, "lab1.h", true, true);
  assert.deepEqual(idle, active);
  assert.equal(idle.badge, "Z80sim ready");
  assert.equal(idle.instruction, "tap Load — it types lab1.h for you");
});
