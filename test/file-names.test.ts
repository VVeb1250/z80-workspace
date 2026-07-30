import assert from "node:assert/strict";
import test from "node:test";
import {
  baseNameOf,
  dos83Base,
  findByName,
  isDosNameTruncated,
  normalizeName,
} from "../src/files/store.ts";
import type { AsmFile } from "../src/files/store.ts";

const file = (name: string): AsmFile => ({ name, content: "" });

test("strips every accepted source extension, not just .asm", () => {
  assert.equal(baseNameOf("prog.z80"), "prog");
  assert.equal(baseNameOf("macros.inc"), "macros");
  assert.equal(baseNameOf("notes.txt"), "notes");
  assert.equal(baseNameOf("LAB 1.ASM"), "LAB1");
});

test("uniquifies a colliding import instead of overwriting silently", () => {
  const existing = [file("lab1.asm")];
  assert.equal(normalizeName("lab1.asm", existing), "lab11.asm");
  assert.equal(normalizeName("lab2", existing), "lab2.asm");
});

test("finds the file an import would collide with, ignoring case", () => {
  const files = [file("lab1.asm"), file("Lab2.asm")];
  assert.equal(findByName(files, "LAB1.asm")?.name, "lab1.asm");
  assert.equal(findByName(files, "lab2.asm")?.name, "Lab2.asm");
  assert.equal(findByName(files, "lab3.asm"), undefined);
});

test("reports when the Explorer name is not the name DOS builds under", () => {
  assert.equal(dos83Base("myfirstprogram.asm"), "myfirstp");
  assert.equal(isDosNameTruncated("myfirstprogram.asm"), true);
  assert.equal(isDosNameTruncated("lab1.asm"), false);
});
