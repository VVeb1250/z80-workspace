import assert from "node:assert/strict";
import test from "node:test";
import { compiledArtifactFor } from "../src/files/artifacts.ts";
import type { AsmFile } from "../src/files/store.ts";

test("downloads the compiled artifact that belongs to the selected file", () => {
  const files: AsmFile[] = [
    {
      name: "alpha.asm",
      content: "alpha source",
      compiled: {
        hex: "alpha hex",
        lst: "alpha listing",
        sourceAtCompile: "alpha source",
      },
    },
    {
      name: "beta.asm",
      content: "beta source",
      compiled: {
        hex: "beta hex",
        lst: "beta listing",
        sourceAtCompile: "beta source",
      },
    },
  ];

  assert.deepEqual(compiledArtifactFor(files, "alpha.asm"), files[0].compiled);
  assert.deepEqual(compiledArtifactFor(files, "beta.asm"), files[1].compiled);
});
