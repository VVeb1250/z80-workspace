// Z80sim reference content. Every key, prompt and message below is taken
// verbatim from the strings inside z80sim.exe (its own Help screen and status
// bar), so the guide can't drift from what the simulator actually shows.

import type { TutorialLang } from "../settings/store";

export type SimGroupId = "run" | "inspect" | "files" | "system";

export interface SimText {
  name: string;
  body: string;
}

export interface SimCommand {
  /** Key as printed on the Help screen, e.g. "G", "Alt-X". */
  key: string;
  /** The simulator's own label, e.g. "display main Memory". */
  label: string;
  group: SimGroupId;
  th: SimText;
  en: SimText;
  /** Literal prompt / message lines the simulator prints for this key. */
  screen?: string[];
}

export const SIM_GROUPS: {
  id: SimGroupId;
  th: string;
  en: string;
}[] = [
  { id: "run", th: "สั่งรัน", en: "Run" },
  { id: "inspect", th: "ดู / แก้ค่า", en: "Inspect" },
  { id: "files", th: "ไฟล์", en: "Files" },
  { id: "system", th: "ระบบ", en: "System" },
];

export const SIM_COMMANDS: SimCommand[] = [
  {
    key: "L",
    label: "Load",
    group: "files",
    screen: [
      "Enter file name or Press 'Esc' to Cancel.",
      "Filename>> LAB1.H",
      "File load success at 8000h",
    ],
    th: {
      name: "โหลดไฟล์ Intel HEX",
      body: "กด L แล้วพิมพ์ชื่อไฟล์ที่ช่อง Filename>> เช่น lab1.h หรือ LAB1.H (DOS ไม่สนตัวเล็กตัวใหญ่) จากนั้น Enter. โค้ดถูกวางลง memory ตาม ORG ในซอร์ส — ข้อความ File load success at 8000h คือ address ที่โหลดเข้าไป. กด Esc เพื่อยกเลิก.",
    },
    en: {
      name: "Load an Intel HEX file",
      body: "Press L, type the file name at the Filename>> prompt (lab1.h or LAB1.H — DOS ignores case), then Enter. The code lands in memory at the source's ORG — 'File load success at 8000h' tells you where. Esc cancels.",
    },
  },
  {
    key: "G",
    label: "Go",
    group: "run",
    screen: [
      "Program is running press Ctrl - B to terminate",
      "Program halted.",
    ],
    th: {
      name: "รันโปรแกรม",
      body: "รันต่อจากค่า PC ปัจจุบัน. ระหว่างรันกด Ctrl-B เพื่อหยุดกลางคัน. เจอ HALT แล้วขึ้น Program halted.",
    },
    en: {
      name: "Run the program",
      body: "Runs from the current PC. Press Ctrl-B while it runs to terminate. On HALT the simulator prints 'Program halted.'",
    },
  },
  {
    key: "T",
    label: "Trace",
    group: "run",
    screen: ["Press Enter to continue or Press Ctrl - B to break."],
    th: {
      name: "เดินทีละคำสั่ง",
      body: "รันคำสั่งเดียวแล้วหยุด ให้ดูค่า register / flag / memory ที่เปลี่ยน. Enter = คำสั่งถัดไป, Ctrl-B = เลิก trace. ใช้ไล่หาบั๊กได้ตรงจุดที่สุด.",
    },
    en: {
      name: "Step one instruction",
      body: "Executes a single instruction so you can watch registers, flags and memory change. Enter steps again, Ctrl-B breaks out. The fastest way to pin down a bug.",
    },
  },
  {
    key: "S",
    label: "change run Speed",
    group: "run",
    screen: [
      "Speed change to fast (Not refresh register value)",
      "Speed change to normal",
    ],
    th: {
      name: "สลับความเร็ว",
      body: "สลับ normal ↔ fast. โหมด fast ไม่รีเฟรชค่า register ระหว่างรัน จึงเร็วกว่ามาก — เหมาะกับ loop ยาว ๆ แต่จะไม่เห็นค่าขยับ.",
    },
    en: {
      name: "Toggle run speed",
      body: "Switches between normal and fast. Fast skips refreshing the register display while running, so long loops finish quickly — but you won't see values move.",
    },
  },
  {
    key: "M",
    label: "display main Memory",
    group: "inspect",
    screen: ["Enter address or Press 'Esc' to Cancel.", "Address=>> 9000"],
    th: {
      name: "ดู memory ที่ address",
      body: "กระโดด dump ตรงกลางจอไปยัง address ที่พิมพ์ (เลขฐาน 16). ใช้เช็คผลลัพธ์ที่โปรแกรมเขียนลง memory เช่น LD (9000H), A แล้วดูที่ 9000.",
    },
    en: {
      name: "Jump the memory dump",
      body: "Points the middle dump at the address you type (hex). Use it to check what the program wrote — e.g. after LD (9000H), A look at 9000.",
    },
  },
  {
    key: "R",
    label: "assign data to Register",
    group: "inspect",
    screen: [
      "Enter register name. (A, B, C, D, E, H, L)",
      "Register>> A",
      "Value===>> 3F",
    ],
    th: {
      name: "ตั้งค่า register",
      body: "พิมพ์ชื่อ register (A, B, C, D, E, H, L) แล้วใส่ค่าฐาน 16. ใช้ป้อนค่าทดสอบโดยไม่ต้องแก้โค้ดแล้วคอมไพล์ใหม่.",
    },
    en: {
      name: "Set a register",
      body: "Type a register name (A, B, C, D, E, H, L) then a hex value. Handy for feeding test values without editing and reassembling.",
    },
  },
  {
    key: "D",
    label: "assigm Data to memory",
    group: "inspect",
    screen: [
      "Enter address or Press 'Esc' to Cancel.",
      "Address=>> 9000",
      "Enter value to assign to memory address",
    ],
    th: {
      name: "เขียนค่าลง memory",
      body: "ใส่ address แล้วใส่ค่า (ฐาน 16) ลงไปตรง ๆ. ใช้วางข้อมูลตั้งต้นให้โปรแกรมอ่าน. พิมพ์ผิดรูปแบบจะขึ้น Invalid hexadecimal number.",
    },
    en: {
      name: "Write a byte to memory",
      body: "Give an address, then a hex value to store there. Use it to seed input data for your program. A bad value prints 'Invalid hexadecimal number.'",
    },
  },
  {
    key: "U",
    label: "Unassemble",
    group: "inspect",
    th: {
      name: "ถอดรหัสกลับเป็นคำสั่ง",
      body: "แปลง byte ใน memory กลับเป็น mnemonic Z80 (ใช้ตาราง UNASSEM.DAT). ใช้ยืนยันว่า HEX ที่โหลดเข้าไปคือคำสั่งที่เขียนไว้จริง.",
    },
    en: {
      name: "Disassemble memory",
      body: "Turns the bytes in memory back into Z80 mnemonics (via UNASSEM.DAT). Good for confirming the HEX you loaded really is the code you wrote.",
    },
  },
  {
    key: "C",
    label: "Clear all register",
    group: "inspect",
    th: {
      name: "ล้าง register ทั้งหมด",
      body: "เซ็ต register กลับเป็นศูนย์ทั้งชุด. รันซ้ำรอบใหม่ให้เริ่มจากสภาพสะอาดโดยไม่ต้องโหลดไฟล์ใหม่.",
    },
    en: {
      name: "Clear every register",
      body: "Zeroes the whole register set, so a re-run starts from a clean state without reloading the file.",
    },
  },
  {
    key: "E",
    label: "call Editor",
    group: "files",
    screen: [
      "F1      F2       F3       F4          F8           F10",
      "   New     Save     Load     Save as     Assemble      Exit",
    ],
    th: {
      name: "editor ในตัวของ z80sim",
      body: "เปิด editor แบบ DOS ของ z80sim เอง (F1 New, F2 Save, F3 Load, F4 Save as, F8 Assemble, F10 Exit). ในเว็บนี้ไม่ต้องใช้ — เขียนใน editor ของ workspace แล้วกด Assemble (C16) สะดวกกว่า.",
    },
    en: {
      name: "z80sim's built-in editor",
      body: "Opens z80sim's own DOS editor (F1 New, F2 Save, F3 Load, F4 Save as, F8 Assemble, F10 Exit). You don't need it here — write in the workspace editor and press Assemble (C16) instead.",
    },
  },
  {
    key: "H",
    label: "Help",
    group: "system",
    th: {
      name: "หน้า Help ของ z80sim",
      body: "เปิดตารางคีย์ทั้งหมดในตัวโปรแกรม — หน้านี้คือที่มาของรายการคีย์ในคู่มือนี้.",
    },
    en: {
      name: "z80sim's own Help",
      body: "Shows the built-in key table — the same screen this guide is built from.",
    },
  },
  {
    key: "Esc",
    label: "Cancel",
    group: "system",
    th: {
      name: "ยกเลิก prompt",
      body: "ออกจากช่องกรอก (Filename>>, Address=>>, Register>>) โดยไม่ทำอะไร.",
    },
    en: {
      name: "Cancel a prompt",
      body: "Backs out of any input line (Filename>>, Address=>>, Register>>) without applying it.",
    },
  },
  {
    key: "F3 – F10",
    label: "DIP switch",
    group: "system",
    th: {
      name: "สลับ DIP switch บนบอร์ด",
      body: "F3 ถึง F10 สลับสวิตช์ 8 ตัวที่มุมขวาล่างของบอร์ด — เป็น input ให้โปรแกรมอ่านผ่าน port. ผลของ OUT จะขึ้นเป็นข้อความ Has data XXh out at port XXh.",
    },
    en: {
      name: "Flip the board's DIP switches",
      body: "F3 through F10 toggle the eight switches at the board's bottom right — program input read through a port. An OUT shows up as 'Has data XXh out at port XXh'.",
    },
  },
  {
    key: "Alt-X",
    label: "eXit program",
    group: "system",
    th: {
      name: "ออกจาก z80sim",
      body: "ปิดตัวจำลอง. ในเว็บนี้ใช้ปุ่ม Stop Z80sim บน toolbar หรือปิดแท็บ Z80sim แทนได้เลย.",
    },
    en: {
      name: "Quit z80sim",
      body: "Closes the simulator. In this workspace just press Stop Z80sim on the toolbar, or close the Z80sim tab.",
    },
  },
];

export interface SimStep {
  th: SimText;
  en: SimText;
}

/** The end-to-end path from source file to a running program. */
export const SIM_STEPS: SimStep[] = [
  {
    th: {
      name: "1. คอมไพล์ก่อน",
      body: "กด Assemble (C16) ให้ได้ .H ก่อน — จุดหน้าไฟล์ใน Explorer ต้องเป็นสีเขียว. ยังไม่มี .H ก็ไม่มีอะไรให้ Load.",
    },
    en: {
      name: "1. Assemble first",
      body: "Press Assemble (C16) to produce the .H — the dot beside the file in the Explorer must be green. No .H, nothing to load.",
    },
  },
  {
    th: {
      name: "2. เปิด Z80sim แล้วคลิกในจอ",
      body: "กด Run Z80sim, แล้วคลิกในจอ simulator หนึ่งครั้ง. คีย์บอร์ดจะเข้า sim ก็ต่อเมื่อ sim ถูกโฟกัส — ไม่งั้นตัวอักษรที่พิมพ์ลงไปอยู่ใน editor.",
    },
    en: {
      name: "2. Open Z80sim and click into it",
      body: "Press Run Z80sim, then click once inside the simulator screen. Keys only reach the sim while it has focus — otherwise they land in the editor.",
    },
  },
  {
    th: {
      name: "3. L — โหลด .H",
      body: "กด L แล้วพิมพ์ชื่อไฟล์ที่ช่อง Filename>> จากนั้น Enter (lab1.asm → lab1.h — DOS ไม่สนตัวเล็กตัวใหญ่). ไฟล์ .H ที่ C16 คอมไพล์ไว้ถูกวางที่รากไดรฟ์ C: ของ sim ให้แล้วทุกไฟล์ — ไม่ต้องใส่ path. ขึ้น File load success at 8000h เมื่อโค้ดเข้า memory ตาม ORG แล้ว.",
    },
    en: {
      name: "3. L — load the .H",
      body: "Press L, type the file name at the Filename>> prompt, then Enter (lab1.asm → lab1.h — DOS ignores case). Every .H that C16 produced already sits at the root of the sim's C: drive — no path needed. 'File load success at 8000h' means the code is in memory at your ORG.",
    },
  },
  {
    th: {
      name: "4. G รัน หรือ T เดินทีละคำสั่ง",
      body: "G = รันรวดเดียว (Ctrl-B หยุด), T = ทีละคำสั่งเพื่อดูค่าเปลี่ยน. ดูผลด้วย M ที่ address ปลายทาง.",
    },
    en: {
      name: "4. G to run, T to step",
      body: "G runs straight through (Ctrl-B stops it); T steps one instruction at a time so you can watch values change. Check results with M at the target address.",
    },
  },
];

/** Labelled regions of the Z80sim screen, drawn by the guide's diagram. */
export interface SimScreenRegion {
  id: string;
  th: SimText;
  en: SimText;
}

export const SIM_SCREEN_REGIONS: SimScreenRegion[] = [
  {
    id: "registers",
    th: {
      name: "แถบ register",
      body: "A B C D E H L F พร้อมชุดเงา (A' B' …), IX IY SP PC. เลข F แสดงเป็นบิต flag เรียงกัน.",
    },
    en: {
      name: "Register bar",
      body: "A B C D E H L F plus the shadow set (A' B' …), IX IY SP PC. F is shown as its individual flag bits.",
    },
  },
  {
    id: "counters",
    th: {
      name: "ตัวนับเวลา",
      body: "Machine Cycles, T-States และ Execution Time สะสมจากคำสั่งที่รันไป — ใช้วัดว่าโค้ดกินเวลาเท่าไร.",
    },
    en: {
      name: "Timing counters",
      body: "Machine Cycles, T-States and Execution Time accumulate as instructions run — how you measure the cost of your code.",
    },
  },
  {
    id: "memory",
    th: {
      name: "หน้าต่าง memory",
      body: "address : 16 ไบต์ : ASCII ต่อบรรทัด. กด M เพื่อกระโดดไป address อื่น.",
    },
    en: {
      name: "Memory window",
      body: "address : 16 bytes : ASCII per row. Press M to jump elsewhere.",
    },
  },
  {
    id: "command",
    th: {
      name: "บรรทัดคำสั่ง",
      body: "ช่องรับค่าตอน Load / Address / Register — prompt จะขึ้นตรงนี้.",
    },
    en: {
      name: "Command line",
      body: "Where the Load / Address / Register prompts appear and take your input.",
    },
  },
  {
    id: "message",
    th: {
      name: "บรรทัด Message",
      body: "ผลลัพธ์และ error ของ sim เช่น File load success at 8000h หรือ Program halted.",
    },
    en: {
      name: "Message line",
      body: "The simulator's results and errors — 'File load success at 8000h', 'Program halted.', and so on.",
    },
  },
  {
    id: "status",
    th: {
      name: "แถบคีย์ล่างจอ",
      body: "Help · Go · Load · Trace · Editor · Alt-X eXit — ตัวอักษรที่ไฮไลต์คือคีย์ที่ต้องกด.",
    },
    en: {
      name: "Status bar",
      body: "Help · Go · Load · Trace · Editor · Alt-X eXit — the highlighted letter is the key to press.",
    },
  },
  {
    id: "board",
    th: {
      name: "บอร์ด ET-Board",
      body: "จอ LCD, LED 8 ดวง และ DIP switch 8 ตัว (F3–F10) — ส่วน I/O ที่โปรแกรมสั่งผ่าน port ได้.",
    },
    en: {
      name: "ET-Board hardware",
      body: "The LCD, eight LEDs and eight DIP switches (F3–F10) — the I/O your program drives through ports.",
    },
  },
];

export const SIM_GUIDE_UI = {
  th: {
    eyebrow: "Toolchain reference",
    title: "Z80sim",
    lead: "คีย์ทั้งหมดของ ET-Board Simulator พร้อมข้อความที่มันตอบกลับ.",
    searchLabel: "ค้นหาคีย์หรือหน้าที่",
    searchPlaceholder: "ค้นหาคีย์ เช่น Load, Trace, memory",
    clearSearch: "ล้างการค้นหา",
    all: "ทั้งหมด",
    quickStart: "ลำดับการใช้งาน",
    screenMap: "ส่วนต่าง ๆ บนจอ",
    commands: "คีย์คำสั่ง",
    whatYouSee: "สิ่งที่จอแสดง",
    notes: "ข้อควรรู้ในเว็บนี้",
    empty: "ไม่พบคีย์ที่ค้นหา",
    emptyHint: "ลองพิมพ์ Load, Trace หรือ register",
    count: (shown: number, total: number) => `${shown} จาก ${total} คีย์`,
    source:
      "คีย์และข้อความทั้งหมดถอดจากหน้า Help ในตัว z80sim.exe (Z80 ET-Board Simulator, ภาควิชาวิศวกรรมคอมพิวเตอร์ ม.ขอนแก่น, 1997).",
    languageLabel: "ภาษา",
  },
  en: {
    eyebrow: "Toolchain reference",
    title: "Z80sim",
    lead: "Every ET-Board Simulator key, with the messages it prints back.",
    searchLabel: "Search keys or purpose",
    searchPlaceholder: "Search a key, e.g. Load, Trace, memory",
    clearSearch: "Clear search",
    all: "All",
    quickStart: "Start to finish",
    screenMap: "What's on screen",
    commands: "Command keys",
    whatYouSee: "What you see",
    notes: "In this workspace",
    empty: "No matching key",
    emptyHint: "Try Load, Trace or register",
    count: (shown: number, total: number) => `${shown} of ${total} keys`,
    source:
      "Keys and messages taken from the Help screen inside z80sim.exe (Z80 ET-Board Simulator, Dept. of Computer Engineering, Khon Kaen University, 1997).",
    languageLabel: "Language",
  },
} as const;

/** Workspace-specific gotchas that the DOS program can't tell you about. */
export const SIM_NOTES: SimStep[] = [
  {
    th: {
      name: "คีย์บอร์ดต้องโฟกัสที่ sim",
      body: "คลิกในจอ simulator ก่อนพิมพ์ ไม่งั้นคีย์ตกลง editor.",
    },
    en: {
      name: "The sim needs focus",
      body: "Click inside the simulator before typing, or the keys go to the editor.",
    },
  },
  {
    th: {
      name: "ชื่อไฟล์เป็นแบบ DOS 8.3",
      body: "lab1.asm → LAB1.H — ตัดเหลือ 8 ตัวอักษร ตัดอักขระพิเศษออก. ตอนพิมพ์ที่ Filename>> จะตัวเล็กหรือตัวใหญ่ก็ได้.",
    },
    en: {
      name: "File names are DOS 8.3",
      body: "lab1.asm → LAB1.H — trimmed to eight characters, special characters dropped. Type it in either case at the Filename>> prompt.",
    },
  },
  {
    th: {
      name: "คอมไพล์ใหม่ไม่ต้องปิด sim",
      body: "กด Assemble ระหว่าง sim เปิดอยู่ ไฟล์ .H ใหม่ถูกใส่เข้าไดรฟ์ C: ทันที — กด L โหลดซ้ำได้เลย.",
    },
    en: {
      name: "Reassemble without restarting",
      body: "Assembling while the sim runs drops the fresh .H straight into its C: drive — just press L and load it again.",
    },
  },
  {
    th: {
      name: "Numpad ต้องเปิด NumLock",
      body: "ตัวเลขบน numpad ส่งเข้า sim ได้เมื่อ NumLock เปิดเท่านั้น.",
    },
    en: {
      name: "Numpad needs NumLock on",
      body: "Numpad digits only reach the simulator while NumLock is on.",
    },
  },
];

export const simTextFor = (
  item: { th: SimText; en: SimText },
  lang: TutorialLang,
): SimText => (lang === "en" ? item.en : item.th);

/** Match on key, the simulator's own label, and the localized copy. */
export function filterSimCommands(
  query: string,
  group: SimGroupId | "all",
  lang: TutorialLang,
): SimCommand[] {
  const needle = query.trim().toLowerCase();
  return SIM_COMMANDS.filter((command) => {
    if (group !== "all" && command.group !== group) return false;
    if (!needle) return true;
    const text = simTextFor(command, lang);
    return [command.key, command.label, text.name, text.body]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });
}
