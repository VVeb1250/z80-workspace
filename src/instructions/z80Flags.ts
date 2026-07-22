export const Z80_FLAG_NAMES = [
  "S",
  "Z",
  "F5",
  "H",
  "F3",
  "P/V",
  "N",
  "C",
] as const;

export type Z80FlagName = (typeof Z80_FLAG_NAMES)[number];
export type Z80FlagEffects = Record<Z80FlagName, string>;
export const RESULT_FLAG_SYMBOL = "↕";

const effects = (
  S = "•",
  Z = "•",
  F5 = "•",
  H = "•",
  F3 = "•",
  pv = "•",
  N = "•",
  C = "•",
): Z80FlagEffects => ({ S, Z, F5, H, F3, "P/V": pv, N, C });

const unchanged = effects();
const arithmeticAdd = effects("β", "β", "β", "β", "β", "V", "0", "β");
const arithmeticSubtract = effects("β", "β", "β", "β", "β", "V", "1", "β");
const rotate = effects("β", "β", "β", "0", "β", "P", "0", "β");

const EFFECTS = new Map<string, Z80FlagEffects>();
const assign = (mnemonics: string, value: Z80FlagEffects) => {
  for (const mnemonic of mnemonics.split(" ")) EFFECTS.set(mnemonic, value);
};

assign(
  "CALL DI DJNZ EI EX EXX HALT IM JP JR NOP OUT POP PUSH RES RET RETI RETN RST SET",
  unchanged,
);

assign("ADC", arithmeticAdd);
assign("ADD", effects("β / •", "β / •", "β", "β", "β", "V / •", "0", "β"));
assign("SUB SBC CP NEG", arithmeticSubtract);
assign("INC", effects("β", "β", "β", "β", "β", "V", "0", "•"));
assign("DEC", effects("β", "β", "β", "β", "β", "V", "1", "•"));
assign("AND", effects("β", "β", "β", "1", "β", "P", "0", "0"));
assign("OR XOR", effects("β", "β", "β", "0", "β", "P", "0", "0"));
assign("CCF", effects("•", "•", "β", "β", "β", "•", "0", "β"));
assign("CPL", effects("•", "•", "β", "1", "β", "•", "1", "•"));
assign("DAA", effects("β", "β", "β", "β", "β", "P", "•", "β"));
assign("SCF", effects("•", "•", "β", "0", "β", "•", "0", "1"));

assign("BIT", effects("β", "β", "β", "1", "β", "β", "0", "•"));
assign("RL RLC RR RRC SLA SLL SRA SRL", rotate);
assign("RLA RLCA RRA RRCA", effects("•", "•", "β", "0", "β", "•", "0", "β"));
assign("RLD RRD", effects("β", "β", "β", "0", "β", "P", "0", "•"));

assign("LD", effects("• / β", "• / β", "• / β", "• / 0", "• / β", "• / IFF2", "• / 0", "•"));
assign("LDI LDD", effects("•", "•", "β", "0", "β", "β", "0", "•"));
assign("LDIR LDDR", effects("•", "•", "β", "0", "β", "0 / 1", "0", "•"));
assign("CPI CPD CPIR CPDR", effects("β", "β", "β", "β", "β", "β", "1", "•"));

assign("IN", effects("• / β", "• / β", "• / β", "• / 0", "• / β", "• / P", "• / 0", "•"));
assign("INI INIR IND INDR OUTI OTIR OUTD OTDR", effects("β", "β", "β", "β", "β", "β", "β", "β"));

export function flagEffectsFor(mnemonic: string): Z80FlagEffects {
  return EFFECTS.get(mnemonic) ?? unchanged;
}

const EFFECT_DESCRIPTIONS: Record<string, string> = {
  "•": "Not affected",
  "0": "Reset to 0",
  "1": "Set to 1",
  "β": "Set from the result",
  P: "Parity of the result",
  V: "Signed overflow",
  IFF2: "Copied from interrupt flip-flop 2",
};

export function flagEffectDescription(value: string): string {
  if (value.includes("/")) {
    return value
      .split("/")
      .map((part) => EFFECT_DESCRIPTIONS[part.trim()] ?? part.trim())
      .join(" / ");
  }
  return EFFECT_DESCRIPTIONS[value] ?? "Defined by the instruction result";
}

/** Uses the datasheet's up/down arrow for flags calculated from a result. */
export function displayFlagEffect(value: string): string {
  return value.replaceAll("β", RESULT_FLAG_SYMBOL);
}
