export interface Z80Encoding {
  form: string;
  opcode: string;
  bytes: string;
  mCycles: string;
  tStates: string;
}

export interface OpcodeBitSegment {
  label: string;
  width: number;
  variable: boolean;
}

export type OpcodeBitAtom =
  | { kind: "byte"; alternatives: OpcodeBitSegment[][] }
  | { kind: "separator"; label: string };

type EncodingRow = [
  form: string,
  opcode: string,
  bytes: string | number,
  mCycles: string | number,
  tStates: string | number,
];

const rows = (...values: EncodingRow[]): Z80Encoding[] =>
  values.map(([form, opcode, bytes, mCycles, tStates]) => ({
    form,
    opcode,
    bytes: String(bytes),
    mCycles: String(mCycles),
    tStates: String(tStates),
  }));

/**
 * Opcode templates and timing from the Zilog Z80 CPU User Manual.
 * r = 8-bit register code, rp = register-pair code, cc = condition code,
 * b = bit number, d/e = signed displacement, n/nn = immediate byte/word.
 */
export const Z80_ENCODINGS: Record<string, Z80Encoding[]> = {
  ADC: rows(
    ["ADC A, r", "88+r", 1, 1, 4],
    ["ADC A, n", "CE n", 2, 2, 7],
    ["ADC A, (HL)", "8E", 1, 2, 7],
    ["ADC A, (IX/IY+d)", "DD/FD 8E d", 3, 5, 19],
    ["ADC HL, rp", "ED 4A+rp×10H", 2, 4, 15],
  ),
  ADD: rows(
    ["ADD A, r", "80+r", 1, 1, 4],
    ["ADD A, n", "C6 n", 2, 2, 7],
    ["ADD A, (HL)", "86", 1, 2, 7],
    ["ADD A, (IX/IY+d)", "DD/FD 86 d", 3, 5, 19],
    ["ADD HL, rp", "09+rp×10H", 1, 3, 11],
    ["ADD IX/IY, rp", "DD/FD 09+rp×10H", 2, 4, 15],
  ),
  AND: rows(
    ["AND r", "A0+r", 1, 1, 4],
    ["AND n", "E6 n", 2, 2, 7],
    ["AND (HL)", "A6", 1, 2, 7],
    ["AND (IX/IY+d)", "DD/FD A6 d", 3, 5, 19],
  ),
  BIT: rows(
    ["BIT b, r", "CB 40+b×8+r", 2, 2, 8],
    ["BIT b, (HL)", "CB 46+b×8", 2, 3, 12],
    ["BIT b, (IX/IY+d)", "DD/FD CB d 46+b×8", 4, 5, 20],
  ),
  CALL: rows(
    ["CALL nn", "CD nn", 3, 5, 17],
    ["CALL cc, nn", "C4+cc×8 nn", 3, "3 / 5", "10 / 17"],
  ),
  CCF: rows(["CCF", "3F", 1, 1, 4]),
  CP: rows(
    ["CP r", "B8+r", 1, 1, 4],
    ["CP n", "FE n", 2, 2, 7],
    ["CP (HL)", "BE", 1, 2, 7],
    ["CP (IX/IY+d)", "DD/FD BE d", 3, 5, 19],
  ),
  CPD: rows(["CPD", "ED A9", 2, 4, 16]),
  CPDR: rows(["CPDR", "ED B9", 2, "4 / 5", "16 / 21"]),
  CPI: rows(["CPI", "ED A1", 2, 4, 16]),
  CPIR: rows(["CPIR", "ED B1", 2, "4 / 5", "16 / 21"]),
  CPL: rows(["CPL", "2F", 1, 1, 4]),
  DAA: rows(["DAA", "27", 1, 1, 4]),
  DEC: rows(
    ["DEC r", "05+r×8", 1, 1, 4],
    ["DEC (HL)", "35", 1, 3, 11],
    ["DEC (IX/IY+d)", "DD/FD 35 d", 3, 6, 23],
    ["DEC rp", "0B+rp×10H", 1, 2, 6],
    ["DEC IX/IY", "DD/FD 2B", 2, 2, 10],
  ),
  DI: rows(["DI", "F3", 1, 1, 4]),
  DJNZ: rows(["DJNZ e", "10 e", 2, "2 / 3", "8 / 13"]),
  EI: rows(["EI", "FB", 1, 1, 4]),
  EX: rows(
    ["EX DE, HL", "EB", 1, 1, 4],
    ["EX AF, AF′", "08", 1, 1, 4],
    ["EX (SP), HL", "E3", 1, 5, 19],
    ["EX (SP), IX/IY", "DD/FD E3", 2, 6, 23],
  ),
  EXX: rows(["EXX", "D9", 1, 1, 4]),
  HALT: rows(["HALT", "76", 1, 1, 4]),
  IM: rows(
    ["IM 0", "ED 46", 2, 2, 8],
    ["IM 1", "ED 56", 2, 2, 8],
    ["IM 2", "ED 5E", 2, 2, 8],
  ),
  IN: rows(
    ["IN A, (n)", "DB n", 2, 3, 11],
    ["IN r, (C)", "ED 40+r×8", 2, 3, 12],
  ),
  INC: rows(
    ["INC r", "04+r×8", 1, 1, 4],
    ["INC (HL)", "34", 1, 3, 11],
    ["INC (IX/IY+d)", "DD/FD 34 d", 3, 6, 23],
    ["INC rp", "03+rp×10H", 1, 2, 6],
    ["INC IX/IY", "DD/FD 23", 2, 2, 10],
  ),
  IND: rows(["IND", "ED AA", 2, 4, 16]),
  INDR: rows(["INDR", "ED BA", 2, "4 / 5", "16 / 21"]),
  INI: rows(["INI", "ED A2", 2, 4, 16]),
  INIR: rows(["INIR", "ED B2", 2, "4 / 5", "16 / 21"]),
  JP: rows(
    ["JP nn", "C3 nn", 3, 3, 10],
    ["JP cc, nn", "C2+cc×8 nn", 3, 3, 10],
    ["JP (HL)", "E9", 1, 1, 4],
    ["JP (IX/IY)", "DD/FD E9", 2, 2, 8],
  ),
  JR: rows(
    ["JR e", "18 e", 2, 3, 12],
    ["JR cc, e", "20+cc×8 e", 2, "2 / 3", "7 / 12"],
  ),
  LD: rows(
    ["LD r, r′", "40+r×8+r′", 1, 1, 4],
    ["LD r, n", "06+r×8 n", 2, 2, 7],
    ["LD r, (HL) / LD (HL), r", "46+r×8 / 70+r", 1, 2, 7],
    ["LD r, (IX/IY+d)", "DD/FD 46+r×8 d", 3, 5, 19],
    ["LD (IX/IY+d), r", "DD/FD 70+r d", 3, 5, 19],
    ["LD A, (BC)", "0A", 1, 2, 7],
    ["LD A, (DE)", "1A", 1, 2, 7],
    ["LD (BC), A", "02", 1, 2, 7],
    ["LD (DE), A", "12", 1, 2, 7],
    ["LD (HL), n", "36 n", 2, 3, 10],
    ["LD (IX/IY+d), n", "DD/FD 36 d n", 4, 5, 19],
    ["LD rp, nn", "01+rp×10H nn", 3, 3, 10],
    ["LD IX/IY, nn", "DD/FD 21 nn", 4, 4, 14],
    ["LD (nn), A / LD A, (nn)", "32 nn / 3A nn", 3, 4, 13],
    ["LD (nn), HL / LD HL, (nn)", "22 nn / 2A nn", 3, 5, 16],
    ["LD BC, (nn)", "ED 4B nn", 4, 6, 20],
    ["LD DE, (nn)", "ED 5B nn", 4, 6, 20],
    ["LD SP, (nn)", "ED 7B nn", 4, 6, 20],
    ["LD (nn), BC", "ED 43 nn", 4, 6, 20],
    ["LD (nn), DE", "ED 53 nn", 4, 6, 20],
    ["LD (nn), SP", "ED 73 nn", 4, 6, 20],
    ["LD (nn), IX/IY / reverse", "DD/FD 22 nn / 2A nn", 4, 6, 20],
    ["LD A, I/R / LD I/R, A", "ED 57/5F / ED 47/4F", 2, 2, 9],
    ["LD SP, HL", "F9", 1, 2, 6],
    ["LD SP, IX/IY", "DD/FD F9", 2, 3, 10],
  ),
  LDD: rows(["LDD", "ED A8", 2, 4, 16]),
  LDDR: rows(["LDDR", "ED B8", 2, "4 / 5", "16 / 21"]),
  LDI: rows(["LDI", "ED A0", 2, 4, 16]),
  LDIR: rows(["LDIR", "ED B0", 2, "4 / 5", "16 / 21"]),
  NEG: rows(["NEG", "ED 44", 2, 2, 8]),
  NOP: rows(["NOP", "00", 1, 1, 4]),
  OR: rows(
    ["OR r", "B0+r", 1, 1, 4],
    ["OR n", "F6 n", 2, 2, 7],
    ["OR (HL)", "B6", 1, 2, 7],
    ["OR (IX/IY+d)", "DD/FD B6 d", 3, 5, 19],
  ),
  OTDR: rows(["OTDR", "ED BB", 2, "4 / 5", "16 / 21"]),
  OTIR: rows(["OTIR", "ED B3", 2, "4 / 5", "16 / 21"]),
  OUT: rows(
    ["OUT (n), A", "D3 n", 2, 3, 11],
    ["OUT (C), r", "ED 41+r×8", 2, 3, 12],
  ),
  OUTD: rows(["OUTD", "ED AB", 2, 4, 16]),
  OUTI: rows(["OUTI", "ED A3", 2, 4, 16]),
  POP: rows(
    ["POP AF/BC/DE/HL", "C1+rp×10H", 1, 3, 10],
    ["POP IX/IY", "DD/FD E1", 2, 4, 14],
  ),
  PUSH: rows(
    ["PUSH AF/BC/DE/HL", "C5+rp×10H", 1, 3, 11],
    ["PUSH IX/IY", "DD/FD E5", 2, 4, 15],
  ),
  RES: rows(
    ["RES b, r", "CB 80+b×8+r", 2, 2, 8],
    ["RES b, (HL)", "CB 86+b×8", 2, 4, 15],
    ["RES b, (IX/IY+d)", "DD/FD CB d 86+b×8", 4, 6, 23],
  ),
  RET: rows(
    ["RET", "C9", 1, 3, 10],
    ["RET cc", "C0+cc×8", 1, "1 / 3", "5 / 11"],
  ),
  RETI: rows(["RETI", "ED 4D", 2, 4, 14]),
  RETN: rows(["RETN", "ED 45", 2, 4, 14]),
  RL: rows(
    ["RL r", "CB 10+r", 2, 2, 8],
    ["RL (HL)", "CB 16", 2, 4, 15],
    ["RL (IX/IY+d)", "DD/FD CB d 16", 4, 6, 23],
  ),
  RLA: rows(["RLA", "17", 1, 1, 4]),
  RLC: rows(
    ["RLC r", "CB 00+r", 2, 2, 8],
    ["RLC (HL)", "CB 06", 2, 4, 15],
    ["RLC (IX/IY+d)", "DD/FD CB d 06", 4, 6, 23],
  ),
  RLCA: rows(["RLCA", "07", 1, 1, 4]),
  RLD: rows(["RLD", "ED 6F", 2, 5, 18]),
  RR: rows(
    ["RR r", "CB 18+r", 2, 2, 8],
    ["RR (HL)", "CB 1E", 2, 4, 15],
    ["RR (IX/IY+d)", "DD/FD CB d 1E", 4, 6, 23],
  ),
  RRA: rows(["RRA", "1F", 1, 1, 4]),
  RRC: rows(
    ["RRC r", "CB 08+r", 2, 2, 8],
    ["RRC (HL)", "CB 0E", 2, 4, 15],
    ["RRC (IX/IY+d)", "DD/FD CB d 0E", 4, 6, 23],
  ),
  RRCA: rows(["RRCA", "0F", 1, 1, 4]),
  RRD: rows(["RRD", "ED 67", 2, 5, 18]),
  RST: rows(["RST vector", "C7+vector", 1, 3, 11]),
  SBC: rows(
    ["SBC A, r", "98+r", 1, 1, 4],
    ["SBC A, n", "DE n", 2, 2, 7],
    ["SBC A, (HL)", "9E", 1, 2, 7],
    ["SBC A, (IX/IY+d)", "DD/FD 9E d", 3, 5, 19],
    ["SBC HL, rp", "ED 42+rp×10H", 2, 4, 15],
  ),
  SCF: rows(["SCF", "37", 1, 1, 4]),
  SET: rows(
    ["SET b, r", "CB C0+b×8+r", 2, 2, 8],
    ["SET b, (HL)", "CB C6+b×8", 2, 4, 15],
    ["SET b, (IX/IY+d)", "DD/FD CB d C6+b×8", 4, 6, 23],
  ),
  SLA: rows(
    ["SLA r", "CB 20+r", 2, 2, 8],
    ["SLA (HL)", "CB 26", 2, 4, 15],
    ["SLA (IX/IY+d)", "DD/FD CB d 26", 4, 6, 23],
  ),
  SRA: rows(
    ["SRA r", "CB 28+r", 2, 2, 8],
    ["SRA (HL)", "CB 2E", 2, 4, 15],
    ["SRA (IX/IY+d)", "DD/FD CB d 2E", 4, 6, 23],
  ),
  SRL: rows(
    ["SRL r", "CB 38+r", 2, 2, 8],
    ["SRL (HL)", "CB 3E", 2, 4, 15],
    ["SRL (IX/IY+d)", "DD/FD CB d 3E", 4, 6, 23],
  ),
  SLL: rows(
    ["SLL r", "CB 30+r", 2, 2, 8],
    ["SLL (HL)", "CB 36", 2, 4, 15],
    ["SLL (IX/IY+d)", "DD/FD CB d 36", 4, 6, 23],
  ),
  SUB: rows(
    ["SUB r", "90+r", 1, 1, 4],
    ["SUB n", "D6 n", 2, 2, 7],
    ["SUB (HL)", "96", 1, 2, 7],
    ["SUB (IX/IY+d)", "DD/FD 96 d", 3, 5, 19],
  ),
  XOR: rows(
    ["XOR r", "A8+r", 1, 1, 4],
    ["XOR n", "EE n", 2, 2, 7],
    ["XOR (HL)", "AE", 1, 2, 7],
    ["XOR (IX/IY+d)", "DD/FD AE d", 3, 5, 19],
  ),
};

/** Converts literal hexadecimal bytes while preserving symbolic operands. */
export function opcodeToBinary(opcode: string): string {
  return opcode.replace(/\b([0-9A-F]{2})H?\b/g, (_match, byte: string) =>
    Number.parseInt(byte, 16).toString(2).padStart(8, "0"),
  );
}

const fixedSegment = (label: string): OpcodeBitSegment => ({
  label,
  width: label.length,
  variable: false,
});

const variableSegment = (label: string, width: number): OpcodeBitSegment => ({
  label,
  width,
  variable: true,
});

function fixedByte(hex: string): OpcodeBitSegment[] {
  const bits = Number.parseInt(hex, 16).toString(2).padStart(8, "0");
  return [
    fixedSegment(bits.slice(0, 2)),
    fixedSegment(bits.slice(2, 5)),
    fixedSegment(bits.slice(5)),
  ];
}

function expressionByte(token: string): OpcodeBitSegment[] | undefined {
  let match = token.match(/^([0-9A-F]{2})\+([A-Za-z′]+)×8\+([A-Za-z′]+)$/);
  if (match) {
    const bits = Number.parseInt(match[1], 16).toString(2).padStart(8, "0");
    return [fixedSegment(bits.slice(0, 2)), variableSegment(match[2], 3), variableSegment(match[3], 3)];
  }

  match = token.match(/^([0-9A-F]{2})\+([A-Za-z′]+)×8$/);
  if (match) {
    const bits = Number.parseInt(match[1], 16).toString(2).padStart(8, "0");
    return [fixedSegment(bits.slice(0, 2)), variableSegment(match[2], 3), fixedSegment(bits.slice(5))];
  }

  match = token.match(/^([0-9A-F]{2})\+([A-Za-z′]+)×10H$/);
  if (match) {
    const bits = Number.parseInt(match[1], 16).toString(2).padStart(8, "0");
    return [fixedSegment(bits.slice(0, 2)), variableSegment(match[2], 2), fixedSegment(bits.slice(4))];
  }

  match = token.match(/^([0-9A-F]{2})\+([A-Za-z′]+)$/);
  if (match) {
    const bits = Number.parseInt(match[1], 16).toString(2).padStart(8, "0");
    return [fixedSegment(bits.slice(0, 2)), variableSegment(match[2], 3), fixedSegment(bits.slice(5))];
  }

  return undefined;
}

function tokenToAtoms(token: string): OpcodeBitAtom[] {
  if (token === "/") return [{ kind: "separator", label: "or" }];
  if (token === "nn") {
    return [
      { kind: "byte", alternatives: [[variableSegment("n low", 8)]] },
      { kind: "byte", alternatives: [[variableSegment("n high", 8)]] },
    ];
  }
  if (["n", "d", "e", "opcode"].includes(token)) {
    return [{ kind: "byte", alternatives: [[variableSegment(token, 8)]] }];
  }

  const expression = expressionByte(token);
  if (expression) return [{ kind: "byte", alternatives: [expression] }];

  const alternatives = token.split("/");
  if (alternatives.every((value) => /^[0-9A-F]{2}$/.test(value))) {
    return [{ kind: "byte", alternatives: alternatives.map(fixedByte) }];
  }

  return [{ kind: "byte", alternatives: [[variableSegment(token, 8)]] }];
}

/** Builds byte diagrams whose symbolic fields span their actual bit width. */
export function opcodeToBitLayout(opcode: string): OpcodeBitAtom[] {
  return opcode.split(/\s+/).flatMap(tokenToAtoms);
}

const REGISTER_COMMENT =
  "r: B=000, C=001, D=010, E=011, H=100, L=101, A=111";

export function encodingComment(
  mnemonic: string,
  encoding: Z80Encoding,
): string {
  if (/^(CPIR|CPDR|LDIR|LDDR|INIR|INDR|OTIR|OTDR)$/.test(mnemonic)) {
    return "Timing: stop / repeat";
  }
  if (mnemonic === "DJNZ") return "Timing: B=0 / branch taken";
  if (/\bcc\b/.test(encoding.form)) return "Timing: condition false / true";
  if (/\br[′']?\b/.test(encoding.form)) return REGISTER_COMMENT;
  if (/\brp\b/.test(encoding.form)) {
    return "rp: BC=00, DE=01, HL=10, SP/AF=11";
  }
  if (/\bb\b/.test(encoding.form)) return "b: bit number 0–7";
  if (/IX\/IY/.test(encoding.form)) return "DD selects IX; FD selects IY";
  if (mnemonic === "RST") return "vector: 00H, 08H, …, 38H";
  if (mnemonic === "SLL") return "Undocumented on the original Z80";
  return "";
}
