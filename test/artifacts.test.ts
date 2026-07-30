import assert from "node:assert/strict";
import test from "node:test";
import {
  allReadyArtifacts,
  artifactDescriptors,
  buildPresentation,
  canPersistBuild,
  compiledArtifactFor,
  freshCompiledHexFiles,
} from "../src/files/artifacts.ts";
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

test("presents a fresh persisted build as ready after reload", () => {
  const file: AsmFile = {
    name: "lab1.asm",
    content: "current source",
    compiled: {
      hex: "hex",
      lst: "listing",
      sourceAtCompile: "current source",
      compiledAt: Date.UTC(2026, 6, 31, 8, 15),
    },
  };

  assert.deepEqual(buildPresentation(file, null, false), {
    kind: "ok",
    text: "Built · lab1.h + lab1.lst ready",
    restored: true,
  });
});

test("does not present stale persisted artifacts as ready", () => {
  const file: AsmFile = {
    name: "lab1.asm",
    content: "edited source",
    compiled: {
      hex: "old hex",
      lst: "old listing",
      sourceAtCompile: "previous source",
    },
  };

  assert.deepEqual(buildPresentation(file, null, false), {
    kind: "idle",
    text: "Source changed · assemble again",
    restored: false,
  });
});

test("shows the latest failed attempt even when a previous build is stale", () => {
  const file: AsmFile = {
    name: "lab1.asm",
    content: "edited source",
    compiled: {
      hex: "old hex",
      lst: "old listing",
      sourceAtCompile: "previous source",
    },
  };

  assert.deepEqual(buildPresentation(file, { errorCount: 2 }, false), {
    kind: "err",
    text: "2 Error(s)",
    restored: false,
  });
});

test("persists artifacts only from a successful assemble", () => {
  assert.equal(canPersistBuild({ ok: true, errorCount: 0, hex: "hex" }), true);
  assert.equal(
    canPersistBuild({ ok: false, errorCount: 1, hex: "partial hex" }),
    false,
  );
  assert.equal(canPersistBuild({ ok: true, errorCount: 0, hex: "" }), false);
});

test("preloads only fresh compiled files into Z80sim", () => {
  const files: AsmFile[] = [
    {
      name: "fresh.asm",
      content: "fresh source",
      compiled: {
        hex: "fresh hex",
        lst: "",
        sourceAtCompile: "fresh source",
      },
    },
    {
      name: "stale.asm",
      content: "edited source",
      compiled: {
        hex: "stale hex",
        lst: "",
        sourceAtCompile: "old source",
      },
    },
  ];

  assert.deepEqual(freshCompiledHexFiles(files), [
    { fileName: "fresh.asm", hex: "fresh hex" },
  ]);
});

test("collects every up-to-date build product for a bulk export", () => {
  const files: AsmFile[] = [
    {
      name: "fresh.asm",
      content: "fresh source",
      compiled: {
        hex: "fresh hex",
        lst: "fresh listing",
        sourceAtCompile: "fresh source",
      },
    },
    {
      name: "stale.asm",
      content: "edited source",
      compiled: {
        hex: "stale hex",
        lst: "stale listing",
        sourceAtCompile: "old source",
      },
    },
    { name: "unbuilt.asm", content: "source" },
  ];

  assert.deepEqual(allReadyArtifacts(files), [
    { fileName: "fresh.h", text: "fresh hex" },
    { fileName: "fresh.lst", text: "fresh listing" },
  ]);
});

test("describes DOS artifact names and freshness from the selected source", () => {
  const file: AsmFile = {
    name: "long-lab-name.asm",
    content: "source",
    compiled: {
      hex: "hex",
      lst: "listing",
      sourceAtCompile: "source",
    },
  };

  assert.deepEqual(artifactDescriptors(file), [
    {
      kind: "hex",
      label: "Intel HEX (.h)",
      fileName: "longlabn.h",
      text: "hex",
      state: "ready",
    },
    {
      kind: "listing",
      label: "Listing (.lst)",
      fileName: "longlabn.lst",
      text: "listing",
      state: "ready",
    },
  ]);
});
