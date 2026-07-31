// Keyboard codes for js-dos's CommandInterface.sendKeyEvent.
//
// These are the emulator's own KBD_* values (a GLFW-style table), NOT browser
// KeyboardEvent.keyCode / .code values — the two disagree for everything but
// the digits. Letters are the *uppercase* ASCII value regardless of the case
// you want: send 65 with no shift and DOS receives "a".
//
// Values transcribed from the js-dos v8 bundle's KBD_* map in
// public/jsdos/js-dos.js. Only the keys the simulator bar exposes are listed.

export const KBD = {
  space: 32,
  quote: 39,
  comma: 44,
  minus: 45,
  period: 46,
  slash: 47,
  semicolon: 59,
  equals: 61,
  leftbracket: 91,
  backslash: 92,
  rightbracket: 93,
  grave: 96,
  esc: 256,
  enter: 257,
  tab: 258,
  backspace: 259,
  insert: 260,
  delete: 261,
  right: 262,
  left: 263,
  down: 264,
  up: 265,
  pageup: 266,
  pagedown: 267,
  home: 268,
  end: 269,
  f1: 290,
  f2: 291,
  f3: 292,
  f4: 293,
  f5: 294,
  f6: 295,
  f7: 296,
  f8: 297,
  f9: 298,
  f10: 299,
  leftshift: 340,
  leftctrl: 341,
  leftalt: 342,
} as const;

export interface KeyStroke {
  code: number;
  /** Hold left shift across this stroke (for the shifted punctuation). */
  shift?: boolean;
}

// The unshifted punctuation a DOS 8.3 filename can contain, plus the few
// symbols worth typing at a z80sim prompt.
const PUNCTUATION: Record<string, KeyStroke> = {
  " ": { code: KBD.space },
  ".": { code: KBD.period },
  "-": { code: KBD.minus },
  ",": { code: KBD.comma },
  "/": { code: KBD.slash },
  "\\": { code: KBD.backslash },
  ";": { code: KBD.semicolon },
  "'": { code: KBD.quote },
  "=": { code: KBD.equals },
  "[": { code: KBD.leftbracket },
  "]": { code: KBD.rightbracket },
  "`": { code: KBD.grave },
  ":": { code: KBD.semicolon, shift: true },
  "_": { code: KBD.minus, shift: true },
  "+": { code: KBD.equals, shift: true },
  "~": { code: KBD.grave, shift: true },
  "!": { code: 49, shift: true },
  "@": { code: 50, shift: true },
  "#": { code: 51, shift: true },
  $: { code: 52, shift: true },
  "%": { code: 53, shift: true },
  "^": { code: 54, shift: true },
  "&": { code: 55, shift: true },
  "*": { code: 56, shift: true },
  "(": { code: 57, shift: true },
  ")": { code: 48, shift: true },
};

/**
 * The stroke that types `ch`, or null when we have no key for it.
 *
 * Case is deliberately ignored: DOS echoes lowercase for an unshifted letter
 * and its filenames are case-insensitive, so "LAB1.H" and "lab1.h" both type
 * as the same six unshifted strokes.
 */
export function strokeForChar(ch: string): KeyStroke | null {
  if (ch.length !== 1) return null;
  if (/[a-z]/i.test(ch)) return { code: ch.toUpperCase().charCodeAt(0) };
  if (/[0-9]/.test(ch)) return { code: ch.charCodeAt(0) };
  return PUNCTUATION[ch] ?? null;
}

/**
 * The strokes that type `text`, or null if any character is untypeable — the
 * caller should fall back to asking the user to type it rather than sending a
 * half-finished filename into a live prompt.
 */
export function strokesForText(text: string): KeyStroke[] | null {
  const strokes: KeyStroke[] = [];
  for (const ch of text) {
    const stroke = strokeForChar(ch);
    if (!stroke) return null;
    strokes.push(stroke);
  }
  return strokes;
}

/** The full key sequence for z80sim's Load command: L, the name, then Enter. */
export function loadCommandStrokes(hexFileName: string): KeyStroke[] | null {
  const name = strokesForText(hexFileName);
  if (!name) return null;
  return [{ code: "L".charCodeAt(0) }, ...name, { code: KBD.enter }];
}

export interface KeySender {
  sendKeyEvent: (code: number, pressed: boolean) => void;
}

/**
 * Play `strokes` into the emulator as real key down/up pairs.
 *
 * DOSBox samples the keyboard per emulated frame, so a down and up in the same
 * tick can be missed entirely — hence the gap between them. `wait` is injected
 * so tests can run the sequence without real timers.
 */
export async function sendStrokes(
  ci: KeySender,
  strokes: KeyStroke[],
  wait: (ms: number) => Promise<void>,
  holdMs = 60,
  gapMs = 40,
): Promise<void> {
  for (const stroke of strokes) {
    if (stroke.shift) ci.sendKeyEvent(KBD.leftshift, true);
    ci.sendKeyEvent(stroke.code, true);
    await wait(holdMs);
    ci.sendKeyEvent(stroke.code, false);
    if (stroke.shift) ci.sendKeyEvent(KBD.leftshift, false);
    await wait(gapMs);
  }
}
