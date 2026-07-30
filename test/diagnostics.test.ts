import assert from "node:assert/strict";
import test from "node:test";
import {
  buildHints,
  parseC16Errors,
} from "../src/dosbox/diagnostics.ts";

// Real Cross-16 pass-2 output for a file with no CPU directive.
const STDOUT = `C:\\>c16 myfirstp.asm -H myfirstp.h -L myfirstp.lst

Cross-16 Meta-Assembler    PC/MS-DOS    Version 1.21
Copyright (C) 1987 Universal Cross-Assemblers

Starting pass number 1

Starting pass number 2
S  008000               START:          LD      A, 05H
S  008000                               LD      B, 03H
S  008000                               HALT

End of Assembly -- 3 Errors`;

const SOURCE = `; myfirstprogram.asm

                ORG     8000H

START:          LD      A, 05H
                LD      B, 03H
                HALT

                END
`;

test("maps echoed compiler errors back onto their source lines", () => {
  assert.deepEqual(parseC16Errors(STDOUT, SOURCE), [
    { line: 5, code: "S", message: 'Cross-16 error "S" on this line' },
    { line: 6, code: "S", message: 'Cross-16 error "S" on this line' },
    { line: 7, code: "S", message: 'Cross-16 error "S" on this line' },
  ]);
});

test("ignores banner and progress lines that are not errors", () => {
  const noise = "Starting pass number 2\nEnd of Assembly -- No Errors";
  assert.deepEqual(parseC16Errors(noise, SOURCE), []);
});

test("keeps repeated source lines on distinct rows", () => {
  const source = "                HALT\n                NOP\n                HALT\n";
  const stdout = [
    "S  008000                               HALT",
    "S  008001                               HALT",
  ].join("\n");
  assert.deepEqual(
    parseC16Errors(stdout, source).map((d) => d.line),
    [1, 3],
  );
});

test("explains the whole-file causes behind a failed build", () => {
  assert.deepEqual(buildHints(SOURCE, 3), [
    'No CPU table: add  CPU  "Z80.TBL"  near the top, or every Z80 mnemonic is a syntax error.',
    'No output format: add  HOF  "INT8"  to get an Intel HEX file.',
  ]);
});

test("stays quiet when the build succeeded", () => {
  assert.deepEqual(buildHints(SOURCE, 0), []);
});

test("does not blame directives that are present", () => {
  const complete = `                CPU     "Z80.TBL"
                HOF     "INT8"
                HALT
                END
`;
  assert.deepEqual(buildHints(complete, 1), []);
});
