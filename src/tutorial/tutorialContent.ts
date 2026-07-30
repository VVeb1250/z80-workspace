import type { IconName } from "../Icon";
import type { TutorialLang } from "../settings/store";

/** data-tour anchor keys — must match the `data-tour` attributes in the UI. */
export type TourAnchor =
  | "write"
  | "assemble"
  | "output"
  | "run"
  | "instructions"
  | "export";

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
    anchor: "write",
    th: {
      title: "เขียนโค้ด Z80",
      body: "สร้างไฟล์ใหม่ด้วยปุ่ม + ใน Explorer (ซ้ายมือ) แล้วพิมพ์ assembly ลงในช่อง editor. ระหว่างพิมพ์จะมี autocomplete ของ mnemonic / register และเช็ค error สดให้.",
    },
    en: {
      title: "Write Z80 code",
      body: "Create a file with the + button in the Explorer (left), then type assembly into the editor. You get mnemonic / register autocomplete and live error checking as you go.",
    },
  },
  {
    id: "assemble",
    icon: "hammer",
    anchor: "assemble",
    th: {
      title: "Assemble (Ctrl+S)",
      body: "กดปุ่ม Assemble (C16), Ctrl+S หรือ Ctrl+Enter เพื่อคอมไพล์ด้วย Cross-16 ตัวจริง. ได้ Intel HEX + listing + จำนวน error.",
    },
    en: {
      title: "Assemble (Ctrl+S)",
      body: "Press Assemble (C16), Ctrl+S, or Ctrl+Enter to compile with the real Cross-16 assembler. You get Intel HEX, a listing, and the error count.",
    },
  },
  {
    id: "output",
    icon: "terminal",
    anchor: "output",
    th: {
      title: "อ่านผลลัพธ์",
      body: "ดูผลใน panel ล่าง: Console (ข้อความ), Listing (โค้ด+address), Hex. จุดสีหน้าไฟล์ใน Explorer บอกสถานะ — ⚪ ยังไม่คอมไพล์, 🟢 ตรงกับโค้ด, 🟡 แก้โค้ดแล้วต้องคอมไพล์ใหม่.",
    },
    en: {
      title: "Read the output",
      body: "Check the bottom panel: Console (messages), Listing (code + addresses), Hex. The colored dot by each file shows status — ⚪ not compiled, 🟢 up to date, 🟡 edited, recompile needed.",
    },
  },
  {
    id: "run",
    icon: "play",
    anchor: "run",
    th: {
      title: "Run Z80sim",
      body: "กด Run Z80sim แล้วคลิกในจอให้สถานะเป็น Keyboard → Z80sim. โหลดโค้ดด้วย L → lab1.h → Enter; บนจอแคบระบบจะขยาย simulator ให้อัตโนมัติ. คีย์ที่เหลือดูได้ที่ Z80sim Guide.",
    },
    en: {
      title: "Run Z80sim",
      body: "Press Run Z80sim, then click inside until the badge says Keyboard → Z80sim. Load the program with L → lab1.h → Enter; narrow screens maximize the simulator automatically. The remaining keys are in the Z80sim Guide.",
    },
  },
  {
    id: "instructions",
    icon: "book-open",
    anchor: "instructions",
    th: {
      title: "ตัวช่วยอ้างอิง",
      body: "ไม่แน่ใจ opcode? เปิด Z80 Instructions ใน Explorer เพื่อค้นหา mnemonic, flag และ timing. เปิดคู่มือนี้ซ้ำได้จากปุ่ม ? บน toolbar.",
    },
    en: {
      title: "Reference helper",
      body: "Unsure of an opcode? Open Z80 Instructions in the Explorer for mnemonics, flags, and timing. Reopen this guide anytime from the ? button.",
    },
  },
  {
    id: "export",
    icon: "download",
    anchor: "export",
    th: {
      title: "Export ไฟล์",
      body: "กด Export เพื่อดูหรือดาวน์โหลด .h, .lst หรือ source ตามรูปแบบที่ต้องใช้ใน lab.",
    },
    en: {
      title: "Export files",
      body: "Open Export to view or download .h, .lst, or the source file needed for the lab.",
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
    lead: "เว็บ IDE สำหรับเขียน คอมไพล์ และจำลอง Z80 assembly ในเบราว์เซอร์. ด้านล่างคือภาพรวมของเครื่องมือที่มีให้ใช้.",
    startTour: "ดู interface tour",
    languageLabel: "ภาษา",
  },
  en: {
    eyebrow: "Getting started",
    title: "Welcome to Z80 Workspace",
    lead: "A browser IDE to write, compile, and simulate Z80 assembly. Below is an overview of the available tools.",
    startTour: "View interface tour",
    languageLabel: "Language",
  },
} as const;
