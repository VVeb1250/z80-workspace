import type { IconName } from "../Icon";
import type { TutorialLang } from "../settings/store";

/** data-tour anchor keys — must match the `data-tour` attributes in the UI. */
export type TourAnchor =
  | "explorer"
  | "assemble"
  | "output"
  | "run"
  | "instructions"
  | "help";

export interface TutorialText {
  title: string;
  body: string;
}

export interface TutorialStep {
  id: string;
  icon: IconName;
  th: TutorialText;
  en: TutorialText;
  /** If set, this step is also a stop in the guided tour, anchored here. */
  anchor?: TourAnchor;
}

/**
 * The end-to-end workflow, authored once and reused by both the Welcome panel
 * (all steps) and the guided tour (steps that carry an `anchor`). Mirrors the
 * README "วิธีใช้" walkthrough.
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "write",
    icon: "file-code",
    anchor: "explorer",
    th: {
      title: "1. เขียนโค้ด Z80",
      body: "สร้างไฟล์ใหม่ด้วยปุ่ม + ใน Explorer (ซ้ายมือ) แล้วพิมพ์ assembly ลงในช่อง editor. ระหว่างพิมพ์จะมี autocomplete ของ mnemonic / register และเช็ค error สดให้.",
    },
    en: {
      title: "1. Write Z80 code",
      body: "Create a file with the + button in the Explorer (left), then type assembly into the editor. You get mnemonic / register autocomplete and live error checking as you go.",
    },
  },
  {
    id: "assemble",
    icon: "hammer",
    anchor: "assemble",
    th: {
      title: "2. Assemble (Ctrl+Enter)",
      body: "กดปุ่ม Assemble หรือ Ctrl+Enter เพื่อคอมไพล์ด้วย Cross-16 ตัวจริง. ได้ Intel HEX + listing + จำนวน error.",
    },
    en: {
      title: "2. Assemble (Ctrl+Enter)",
      body: "Press the Assemble button or Ctrl+Enter to compile with the real Cross-16 assembler. You get Intel HEX, a listing, and the error count.",
    },
  },
  {
    id: "output",
    icon: "terminal",
    anchor: "output",
    th: {
      title: "3. อ่านผลลัพธ์",
      body: "ดูผลใน panel ล่าง: Console (ข้อความ), Listing (โค้ด+address), Hex. จุดสีหน้าไฟล์ใน Explorer บอกสถานะ — ⚪ ยังไม่คอมไพล์, 🟢 ตรงกับโค้ด, 🟡 แก้โค้ดแล้วต้องคอมไพล์ใหม่.",
    },
    en: {
      title: "3. Read the output",
      body: "Check the bottom panel: Console (messages), Listing (code + addresses), Hex. The colored dot by each file shows status — ⚪ not compiled, 🟢 up to date, 🟡 edited, recompile needed.",
    },
  },
  {
    id: "run",
    icon: "play",
    anchor: "run",
    th: {
      title: "4. Run simulator",
      body: "กด Run simulator เพื่อเปิด z80sim ข้าง editor. ไฟล์ .h ที่คอมไพล์แล้วจะถูกใส่ให้อัตโนมัติ. ในตัว sim กด L → Enter → พิมพ์ชื่อไฟล์ hex (เช่น LAB1.H) เพื่อโหลดโค้ดเข้า memory.",
    },
    en: {
      title: "4. Run the simulator",
      body: "Press Run simulator to open z80sim beside the editor. Your compiled .h files are loaded in automatically. Inside the sim press L → Enter → type the hex filename (e.g. LAB1.H) to load the code into memory.",
    },
  },
  {
    id: "instructions",
    icon: "book-open",
    anchor: "instructions",
    th: {
      title: "5. ตัวช่วยอ้างอิง",
      body: "ไม่แน่ใจ opcode? เปิด Z80 Instructions ใน Explorer เพื่อค้นหา mnemonic ดูรูปแบบที่ถูกต้อง flag และ timing.",
    },
    en: {
      title: "5. Reference helper",
      body: "Unsure of an opcode? Open Z80 Instructions in the Explorer to search mnemonics and see valid forms, flags, and timing.",
    },
  },
  {
    id: "help",
    icon: "help-circle",
    anchor: "help",
    th: {
      title: "6. เปิดคู่มือนี้ซ้ำได้",
      body: "กดปุ่ม ? บน toolbar เพื่อเปิดหน้านี้อีกครั้งเมื่อไหร่ก็ได้. ปรับ theme / font / ตัวเลือก editor ได้ที่ปุ่มเฟือง Settings. Ctrl+B ซ่อน/แสดง sidebar.",
    },
    en: {
      title: "6. Reopen this guide anytime",
      body: "Press the ? button on the toolbar to reopen this page whenever you like. Adjust theme / font / editor options from the Settings gear. Ctrl+B toggles the sidebar.",
    },
  },
];

/** Steps that appear as stops in the guided tour, in order. */
export const TOUR_STEPS = TUTORIAL_STEPS.filter(
  (step): step is TutorialStep & { anchor: TourAnchor } => step.anchor != null,
);

export const textFor = (step: TutorialStep, lang: TutorialLang): TutorialText =>
  lang === "en" ? step.en : step.th;

/** Panel-level copy (heading / language toggle / CTA), also localized. */
export const WELCOME_UI = {
  th: {
    eyebrow: "เริ่มต้นใช้งาน",
    title: "ยินดีต้อนรับสู่ Z80 Workspace",
    lead: "เว็บ IDE สำหรับเขียน คอมไพล์ และจำลอง Z80 assembly ในเบราว์เซอร์. ทำตาม 6 ขั้นด้านล่างได้เลย.",
    startTour: "เริ่ม Guided tour",
    languageLabel: "ภาษา",
  },
  en: {
    eyebrow: "Getting started",
    title: "Welcome to Z80 Workspace",
    lead: "A browser IDE to write, compile, and simulate Z80 assembly. Follow the 6 steps below to get going.",
    startTour: "Start guided tour",
    languageLabel: "Language",
  },
} as const;
