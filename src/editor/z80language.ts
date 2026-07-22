// Minimal Monaco Monarch language for Z80 assembly (Cross-16 flavour).
// Enough for readable highlighting: mnemonics, registers, numbers, labels,
// directives, comments (; ...), strings.
import type { languages } from "monaco-editor";

export const Z80_LANGUAGE_ID = "z80asm";

const MNEMONICS = [
  "adc","add","and","bit","call","ccf","cp","cpd","cpdr","cpi","cpir","cpl",
  "daa","dec","di","djnz","ei","ex","exx","halt","im","in","inc","ind","indr",
  "ini","inir","jp","jr","ld","ldd","lddr","ldi","ldir","neg","nop","or","otdr",
  "otir","out","outd","outi","pop","push","res","ret","reti","retn","rl","rla",
  "rlc","rlca","rld","rr","rra","rrc","rrca","rrd","rst","sbc","scf","set","sla",
  "sra","srl","sll","sub","xor",
];

const REGISTERS = [
  "a","b","c","d","e","h","l","i","r","af","bc","de","hl","ix","iy","sp","pc",
  "ixh","ixl","iyh","iyl","nz","z","nc","po","pe","p","m",
];

const DIRECTIVES = [
  "org","equ","db","dw","ds","defb","defw","defs","end","include","if","else",
  "endif","macro","endm","cpu","hof","word",
];

export const z80Language: languages.IMonarchLanguage = {
  ignoreCase: true,
  mnemonics: MNEMONICS,
  registers: REGISTERS,
  directives: DIRECTIVES,
  tokenizer: {
    root: [
      [/;.*$/, "comment"],
      [/^[ \t]*[A-Za-z_.$][\w.$]*:/, "type.identifier"], // label:
      [/[A-Za-z_.$][\w.$]*/, {
        cases: {
          "@mnemonics": "keyword",
          "@directives": "keyword.directive",
          "@registers": "variable.predefined",
          "@default": "identifier",
        },
      }],
      [/\$[0-9A-Fa-f]+/, "number.hex"],
      [/[0-9A-Fa-f]+[hH]\b/, "number.hex"],
      [/%[01]+/, "number.binary"],
      [/[01]+[bB]\b/, "number.binary"],
      [/\d+/, "number"],
      [/"([^"\\]|\\.)*"/, "string"],
      [/'([^'\\]|\\.)*'/, "string"],
      [/[,()+\-*/]/, "delimiter"],
    ],
  },
};

export const z80Config: languages.LanguageConfiguration = {
  comments: { lineComment: ";" },
  brackets: [["(", ")"]],
  autoClosingPairs: [
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
};

export const SAMPLE_SOURCE = `; lab1.asm - Z80 sample (Cross-16 syntax)
                CPU     "Z80.TBL"
                HOF     "INT8"          ; Intel HEX output format

                ORG     8000H

START:          LD      A, 01H
                LD      B, 0AH
LOOP:           ADD     A, A
                DJNZ    LOOP
                LD      (9000H), A
                HALT

                END
`;
