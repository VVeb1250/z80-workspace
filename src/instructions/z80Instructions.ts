import {
  Z80_ENCODINGS,
  type Z80Encoding,
} from "./z80Encodings.ts";

export type InstructionGroupId =
  | "load"
  | "arithmetic"
  | "logic"
  | "block"
  | "rotate"
  | "control"
  | "io"
  | "cpu";

export interface Z80Instruction {
  mnemonic: string;
  group: InstructionGroupId;
  summary: string;
  syntax: string[];
  description: string;
  flags: string[];
  encodings: Z80Encoding[];
  example: string;
  note?: string;
}

export const INSTRUCTION_GROUPS: Array<{
  id: InstructionGroupId;
  label: string;
}> = [
  { id: "load", label: "Load & exchange" },
  { id: "arithmetic", label: "Arithmetic" },
  { id: "logic", label: "Logic & compare" },
  { id: "block", label: "Block operations" },
  { id: "rotate", label: "Bits, rotate & shift" },
  { id: "control", label: "Jump, call & return" },
  { id: "io", label: "Input & output" },
  { id: "cpu", label: "CPU control" },
];

type RawInstruction = [
  mnemonic: string,
  group: InstructionGroupId,
  summary: string,
  syntax: string[],
  description: string,
  flags: string[],
  example: string,
  note?: string,
];

const RAW_INSTRUCTIONS: RawInstruction[] = [
  ["ADC", "arithmetic", "Add with the carry bit.", ["ADC A, source", "ADC HL, pair"], "Adds the source and the current Carry flag to the destination. Use it after ADD when adding values wider than one register.", ["S", "Z", "H", "P/V", "N", "C"], "ADC A, B"],
  ["ADD", "arithmetic", "Add a value to a register.", ["ADD A, source", "ADD HL, pair", "ADD IX, pair", "ADD IY, pair"], "Adds the source to the destination and stores the result in the destination. It does not include the previous Carry flag.", ["S", "Z", "H", "P/V", "N", "C"], "ADD A, 05H"],
  ["AND", "logic", "Keep only bits set in both values.", ["AND source"], "Performs a bitwise AND between A and the source, then stores the result in A. It is useful for masking unwanted bits.", ["S", "Z", "H", "P/V", "N", "C"], "AND 0FH"],
  ["BIT", "rotate", "Test one bit without changing the value.", ["BIT bit, register", "BIT bit, (HL)", "BIT bit, (IX+d)"], "Checks whether the selected bit is zero. The operand is left unchanged and the result is reported through the flags.", ["S", "Z", "H", "P/V", "N"], "BIT 7, A"],
  ["CALL", "control", "Call a subroutine and remember where to return.", ["CALL address", "CALL condition, address"], "Pushes the address of the next instruction onto the stack, then jumps to the target. A conditional CALL runs only when its condition is true.", [], "CALL DRAW_PIXEL"],
  ["CCF", "logic", "Flip the Carry flag.", ["CCF"], "Changes Carry from 0 to 1 or from 1 to 0. This is useful when preparing multi-byte arithmetic.", ["H", "N", "C"], "CCF"],
  ["CP", "logic", "Compare a value with A.", ["CP source"], "Subtracts the source from A only to update the flags. Neither A nor the source is changed.", ["S", "Z", "H", "P/V", "N", "C"], "CP 0AH"],
  ["CPD", "block", "Compare A with memory, then move backward once.", ["CPD"], "Compares A with (HL), decrements HL and decrements BC. Use it to scan memory from high addresses to low addresses.", ["S", "Z", "H", "P/V", "N"], "CPD"],
  ["CPDR", "block", "Search backward until equal or BC reaches zero.", ["CPDR"], "Repeats CPD while no match is found and BC is not zero. Afterward, Z tells you whether a match was found.", ["S", "Z", "H", "P/V", "N"], "CPDR"],
  ["CPI", "block", "Compare A with memory, then move forward once.", ["CPI"], "Compares A with (HL), increments HL and decrements BC. It performs one step of a forward memory search.", ["S", "Z", "H", "P/V", "N"], "CPI"],
  ["CPIR", "block", "Search forward until equal or BC reaches zero.", ["CPIR"], "Repeats CPI while no match is found and BC is not zero. Afterward, Z tells you whether a match was found.", ["S", "Z", "H", "P/V", "N"], "CPIR"],
  ["CPL", "logic", "Invert every bit in A.", ["CPL"], "Replaces each 0 bit in A with 1 and each 1 bit with 0. This computes the one's complement of A.", ["H", "N"], "CPL"],
  ["DAA", "arithmetic", "Adjust A after packed-BCD arithmetic.", ["DAA"], "Corrects A after an ADD, ADC, SUB or SBC so the result can be interpreted as two packed decimal digits.", ["S", "Z", "H", "P/V", "C"], "ADD A, B\nDAA"],
  ["DEC", "arithmetic", "Decrease a value by one.", ["DEC register", "DEC (HL)", "DEC pair"], "Subtracts one from the operand. For 8-bit operands it updates most arithmetic flags but leaves Carry unchanged.", ["S", "Z", "H", "P/V", "N"], "DEC B"],
  ["DI", "cpu", "Disable maskable interrupts.", ["DI"], "Prevents maskable interrupts from being accepted. Non-maskable interrupts are not affected.", [], "DI", "The interrupt state changes after DI executes."],
  ["DJNZ", "control", "Loop by decrementing B.", ["DJNZ address"], "Decrements B and jumps to the target while B is not zero. It is a compact way to build counted loops.", [], "LD B, 10\nLOOP: NOP\nDJNZ LOOP"],
  ["EI", "cpu", "Enable maskable interrupts.", ["EI"], "Allows maskable interrupts again. The Z80 waits until the instruction after EI has completed before accepting one.", [], "EI", "The one-instruction delay lets you safely return or initialize state."],
  ["EX", "load", "Swap two register sets.", ["EX DE, HL", "EX AF, AF'", "EX (SP), HL", "EX (SP), IX", "EX (SP), IY"], "Exchanges both operands without using a temporary register. The available pairs are fixed by the instruction form.", [], "EX DE, HL"],
  ["EXX", "load", "Swap BC, DE and HL with their alternate set.", ["EXX"], "Switches the three main register pairs with BC', DE' and HL'. It is useful for fast context changes.", [], "EXX"],
  ["HALT", "cpu", "Pause until an interrupt arrives.", ["HALT"], "Stops normal instruction execution while keeping memory refresh active. Execution resumes when an interrupt is accepted.", [], "HALT"],
  ["IM", "cpu", "Select the maskable interrupt mode.", ["IM 0", "IM 1", "IM 2"], "Chooses how the CPU finds the handler for maskable interrupts: device-provided instruction, fixed vector 0038H, or a vector table through I.", [], "IM 1"],
  ["IN", "io", "Read a byte from an input port.", ["IN A, (port)", "IN register, (C)"], "Reads from an I/O port into a register. The immediate-port form uses A as the high part of the port address on the bus.", ["S", "Z", "H", "P/V", "N"], "IN A, (20H)"],
  ["INC", "arithmetic", "Increase a value by one.", ["INC register", "INC (HL)", "INC pair"], "Adds one to the operand. For 8-bit operands it updates most arithmetic flags but leaves Carry unchanged.", ["S", "Z", "H", "P/V", "N"], "INC HL"],
  ["IND", "io", "Input one byte and move backward.", ["IND"], "Reads from port BC into (HL), decrements HL and decrements B. It performs one backward block-input step.", ["S", "Z", "H", "P/V", "N", "C"], "IND"],
  ["INDR", "io", "Input bytes backward until B becomes zero.", ["INDR"], "Repeats IND until B reaches zero, transferring a block from an I/O port into descending memory addresses.", ["S", "Z", "H", "P/V", "N", "C"], "INDR"],
  ["INI", "io", "Input one byte and move forward.", ["INI"], "Reads from port BC into (HL), increments HL and decrements B. It performs one forward block-input step.", ["S", "Z", "H", "P/V", "N", "C"], "INI"],
  ["INIR", "io", "Input bytes forward until B becomes zero.", ["INIR"], "Repeats INI until B reaches zero, transferring a block from an I/O port into ascending memory addresses.", ["S", "Z", "H", "P/V", "N", "C"], "INIR"],
  ["JP", "control", "Jump to another address.", ["JP address", "JP condition, address", "JP (HL)", "JP (IX)", "JP (IY)"], "Replaces PC with the target address. Conditional forms jump only when the selected flag condition is true.", [], "JP NZ, LOOP"],
  ["JR", "control", "Jump to a nearby relative address.", ["JR address", "JR NZ, address", "JR Z, address", "JR NC, address", "JR C, address"], "Adds a signed displacement to PC. JR uses fewer bytes than JP but can only reach a target roughly 128 bytes away.", [], "JR Z, DONE"],
  ["LD", "load", "Copy a value between registers or memory.", ["LD destination, source", "LD pair, value", "LD (address), A", "LD A, (address)"], "Copies the source into the destination without changing the source. The valid combinations depend on operand size and addressing mode.", [], "LD A, (HL)"],
  ["LDD", "block", "Copy one byte and move backward.", ["LDD"], "Copies (HL) to (DE), then decrements HL and DE and decrements BC. It performs one backward block-copy step.", ["H", "P/V", "N"], "LDD"],
  ["LDDR", "block", "Copy a block backward until BC reaches zero.", ["LDDR"], "Repeats LDD until BC is zero. Use it when source and destination blocks must be traversed from high addresses to low addresses.", ["H", "P/V", "N"], "LDDR"],
  ["LDI", "block", "Copy one byte and move forward.", ["LDI"], "Copies (HL) to (DE), then increments HL and DE and decrements BC. It performs one forward block-copy step.", ["H", "P/V", "N"], "LDI"],
  ["LDIR", "block", "Copy a block forward until BC reaches zero.", ["LDIR"], "Repeats LDI until BC is zero. Set HL to the source, DE to the destination and BC to the byte count first.", ["H", "P/V", "N"], "LD HL, SOURCE\nLD DE, TARGET\nLD BC, LENGTH\nLDIR"],
  ["NEG", "arithmetic", "Replace A with its two's-complement negative.", ["NEG"], "Calculates 0 minus A. Applying NEG twice restores the original value except for the signed overflow edge case.", ["S", "Z", "H", "P/V", "N", "C"], "NEG"],
  ["NOP", "cpu", "Do nothing for one instruction.", ["NOP"], "Changes no registers, memory or flags. It is useful for timing, alignment and temporary patches.", [], "NOP"],
  ["OR", "logic", "Set bits present in either value.", ["OR source"], "Performs a bitwise OR between A and the source, then stores the result in A.", ["S", "Z", "H", "P/V", "N", "C"], "OR 80H"],
  ["OTDR", "io", "Output bytes backward until B becomes zero.", ["OTDR"], "Repeats OUTD until B reaches zero, sending bytes from descending memory addresses to an I/O port.", ["S", "Z", "H", "P/V", "N", "C"], "OTDR"],
  ["OTIR", "io", "Output bytes forward until B becomes zero.", ["OTIR"], "Repeats OUTI until B reaches zero, sending bytes from ascending memory addresses to an I/O port.", ["S", "Z", "H", "P/V", "N", "C"], "OTIR"],
  ["OUT", "io", "Write a byte to an output port.", ["OUT (port), A", "OUT (C), register"], "Writes a register value to an I/O port. The immediate-port form uses A as the high part of the port address on the bus.", [], "OUT (20H), A"],
  ["OUTD", "io", "Output one byte and move backward.", ["OUTD"], "Writes (HL) to port BC, decrements HL and decrements B. It performs one backward block-output step.", ["S", "Z", "H", "P/V", "N", "C"], "OUTD"],
  ["OUTI", "io", "Output one byte and move forward.", ["OUTI"], "Writes (HL) to port BC, increments HL and decrements B. It performs one forward block-output step.", ["S", "Z", "H", "P/V", "N", "C"], "OUTI"],
  ["POP", "load", "Restore a register pair from the stack.", ["POP AF", "POP BC", "POP DE", "POP HL", "POP IX", "POP IY"], "Reads two bytes from the address at SP into the selected register pair, then increases SP by two.", [], "POP HL"],
  ["PUSH", "load", "Save a register pair on the stack.", ["PUSH AF", "PUSH BC", "PUSH DE", "PUSH HL", "PUSH IX", "PUSH IY"], "Decreases SP by two and writes the selected register pair to the stack. PUSH and POP should normally be balanced.", [], "PUSH AF"],
  ["RES", "rotate", "Clear one selected bit.", ["RES bit, register", "RES bit, (HL)", "RES bit, (IX+d)"], "Sets the chosen bit to 0 and leaves every other bit unchanged.", [], "RES 0, A"],
  ["RET", "control", "Return from a subroutine.", ["RET", "RET condition"], "Pops an address from the stack into PC. Conditional forms return only when the selected flag condition is true.", [], "RET Z"],
  ["RETI", "control", "Return from a maskable interrupt handler.", ["RETI"], "Restores PC from the stack and signals supported interrupt hardware that the service routine has finished.", [], "RETI"],
  ["RETN", "control", "Return from a non-maskable interrupt handler.", ["RETN"], "Restores PC from the stack and copies the saved interrupt-enable state back into IFF1.", [], "RETN"],
  ["RL", "rotate", "Rotate left through Carry.", ["RL register", "RL (HL)", "RL (IX+d)"], "Moves every bit left. Bit 7 goes to Carry and the old Carry value enters bit 0.", ["S", "Z", "H", "P/V", "N", "C"], "RL C"],
  ["RLA", "rotate", "Rotate A left through Carry.", ["RLA"], "Moves A left by one bit. Bit 7 goes to Carry and the old Carry value enters bit 0.", ["H", "N", "C"], "RLA"],
  ["RLC", "rotate", "Rotate left with bit 7 wrapping to bit 0.", ["RLC register", "RLC (HL)", "RLC (IX+d)"], "Moves every bit left. The old bit 7 is copied to both bit 0 and Carry.", ["S", "Z", "H", "P/V", "N", "C"], "RLC B"],
  ["RLCA", "rotate", "Rotate A left with wraparound.", ["RLCA"], "Moves A left by one bit. The old bit 7 is copied to both bit 0 and Carry.", ["H", "N", "C"], "RLCA"],
  ["RLD", "rotate", "Rotate decimal nibbles left through A and memory.", ["RLD"], "Rotates three 4-bit nibbles among the low half of A and the byte at (HL). The high half of A stays unchanged.", ["S", "Z", "H", "P/V", "N"], "RLD"],
  ["RR", "rotate", "Rotate right through Carry.", ["RR register", "RR (HL)", "RR (IX+d)"], "Moves every bit right. Bit 0 goes to Carry and the old Carry value enters bit 7.", ["S", "Z", "H", "P/V", "N", "C"], "RR C"],
  ["RRA", "rotate", "Rotate A right through Carry.", ["RRA"], "Moves A right by one bit. Bit 0 goes to Carry and the old Carry value enters bit 7.", ["H", "N", "C"], "RRA"],
  ["RRC", "rotate", "Rotate right with bit 0 wrapping to bit 7.", ["RRC register", "RRC (HL)", "RRC (IX+d)"], "Moves every bit right. The old bit 0 is copied to both bit 7 and Carry.", ["S", "Z", "H", "P/V", "N", "C"], "RRC B"],
  ["RRCA", "rotate", "Rotate A right with wraparound.", ["RRCA"], "Moves A right by one bit. The old bit 0 is copied to both bit 7 and Carry.", ["H", "N", "C"], "RRCA"],
  ["RRD", "rotate", "Rotate decimal nibbles right through A and memory.", ["RRD"], "Rotates three 4-bit nibbles among the low half of A and the byte at (HL), in the opposite direction to RLD.", ["S", "Z", "H", "P/V", "N"], "RRD"],
  ["RST", "control", "Call one of eight fixed low-memory vectors.", ["RST 00H", "RST 08H", "RST 10H", "RST 18H", "RST 20H", "RST 28H", "RST 30H", "RST 38H"], "Pushes the return address and jumps to a fixed vector. It is a compact one-byte subroutine call.", [], "RST 38H"],
  ["SBC", "arithmetic", "Subtract with the Carry bit as borrow.", ["SBC A, source", "SBC HL, pair"], "Subtracts both the source and the current Carry flag from the destination. Use it after SUB when subtracting multi-byte values.", ["S", "Z", "H", "P/V", "N", "C"], "SBC A, B"],
  ["SCF", "logic", "Set the Carry flag.", ["SCF"], "Sets Carry to 1 without changing the accumulator. Half Carry and Add/Subtract are cleared.", ["H", "N", "C"], "SCF"],
  ["SET", "rotate", "Set one selected bit.", ["SET bit, register", "SET bit, (HL)", "SET bit, (IX+d)"], "Sets the chosen bit to 1 and leaves every other bit unchanged.", [], "SET 7, A"],
  ["SLA", "rotate", "Shift left and insert zero.", ["SLA register", "SLA (HL)", "SLA (IX+d)"], "Moves every bit left, inserts 0 into bit 0 and moves the old bit 7 into Carry.", ["S", "Z", "H", "P/V", "N", "C"], "SLA A"],
  ["SRA", "rotate", "Arithmetic shift right while keeping the sign.", ["SRA register", "SRA (HL)", "SRA (IX+d)"], "Moves every bit right while copying bit 7 back into itself. Signed negative values therefore remain negative.", ["S", "Z", "H", "P/V", "N", "C"], "SRA A"],
  ["SRL", "rotate", "Logical shift right and insert zero.", ["SRL register", "SRL (HL)", "SRL (IX+d)"], "Moves every bit right, inserts 0 into bit 7 and moves the old bit 0 into Carry.", ["S", "Z", "H", "P/V", "N", "C"], "SRL A"],
  ["SLL", "rotate", "Undocumented left shift that inserts one.", ["SLL register", "SLL (HL)", "SLL (IX+d)"], "Moves every bit left like SLA but inserts 1 into bit 0. It exists on classic Z80 silicon but is not part of the official documented set.", ["S", "Z", "H", "P/V", "N", "C"], "SLL A", "Assembler and emulator support can vary."],
  ["SUB", "arithmetic", "Subtract a value from A.", ["SUB source"], "Subtracts the source from A and stores the result in A. It does not subtract the previous Carry flag.", ["S", "Z", "H", "P/V", "N", "C"], "SUB 01H"],
  ["XOR", "logic", "Toggle bits that differ between two values.", ["XOR source"], "Performs a bitwise exclusive OR between A and the source. XOR A is a common way to clear A and set Z.", ["S", "Z", "H", "P/V", "N", "C"], "XOR A"],
];

export const Z80_INSTRUCTIONS: Z80Instruction[] = RAW_INSTRUCTIONS.map(
  ([mnemonic, group, summary, syntax, description, flags, example, note]) => ({
    mnemonic,
    group,
    summary,
    syntax,
    description,
    flags,
    encodings: Z80_ENCODINGS[mnemonic] ?? [],
    example,
    note,
  }),
);

export function instructionForms(instruction: Z80Instruction): string[] {
  return [...new Set(instruction.encodings.map(({ form }) => form))];
}

export function filterZ80Instructions(
  query: string,
  group: InstructionGroupId | "all" = "all",
): Z80Instruction[] {
  const normalized = query.trim().toLowerCase();
  return Z80_INSTRUCTIONS.filter((instruction) => {
    if (group !== "all" && instruction.group !== group) return false;
    if (!normalized) return true;
    return [
      instruction.mnemonic,
      instruction.summary,
      instruction.description,
      ...instruction.syntax,
      ...instructionForms(instruction),
    ].some((value) => value.toLowerCase().includes(normalized));
  });
}

export function instructionGroupLabel(group: InstructionGroupId): string {
  return INSTRUCTION_GROUPS.find((item) => item.id === group)?.label ?? group;
}
