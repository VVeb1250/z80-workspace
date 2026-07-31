import { useState } from "react";
import { KBD, type KeyStroke } from "../dosbox/keys";
import { Icon } from "../Icon";

// z80sim's control bar.
//
// Letters, digits and punctuation come from the device's own keyboard (the
// Type button focuses an off-screen field to raise it) — it is the keyboard
// people already know, at the size their OS thinks is right. This bar carries
// only what that keyboard cannot produce:
//
//   * z80sim's menu commands, which are single letters but worth a real label
//   * F1-F12 — z80sim maps F3-F10 to the trainer's DIP switches
//   * Ctrl / Alt, for Alt-X (exit) and friends
//   * Esc and the arrows, which phone keyboards omit
//   * Load, which types the hex filename so nobody has to
//
// js-dos's own soft keyboard is not used: its default page has no letters at
// all, and it paints over the DOS screen instead of making room for itself.

interface Key {
  label: string;
  stroke: KeyStroke;
  /** Grid units wide; the row grids are 12 columns. */
  span?: number;
  kind?: "cmd" | "mod";
  title?: string;
}

const cmd = (label: string, ch: string, title?: string): Key => ({
  label,
  stroke: { code: ch.toUpperCase().charCodeAt(0) },
  span: 2,
  kind: "cmd",
  title,
});

const GO = cmd("Go", "g", "Go — run the loaded program");
const TRACE = cmd("Trace", "t", "Trace — single step");
const HELP = cmd("Help", "h");
const EDITOR = cmd("Editor", "e");
const CLEAR = cmd("Clear", "c", "Clear all registers");
const MEMORY = cmd("Mem", "m", "Display main memory");
const REGISTER = cmd("Reg", "r", "Assign data to a register");
const DATA = cmd("Data", "d", "Assign data to memory");
const UNASM = cmd("Unasm", "u", "Unassemble");
const SPEED = cmd("Speed", "s", "Change run speed");

const ESC: Key = {
  label: "Esc",
  stroke: { code: KBD.esc },
  span: 2,
  kind: "cmd",
  title: "Escape — cancel",
};
const ENTER: Key = {
  label: "Enter",
  stroke: { code: KBD.enter },
  span: 2,
  kind: "cmd",
};
const CTRL: Key = {
  label: "Ctrl",
  stroke: { code: KBD.leftctrl },
  span: 2,
  kind: "mod",
};
const ALT: Key = {
  label: "Alt",
  stroke: { code: KBD.leftalt },
  span: 2,
  kind: "mod",
  title: "Alt — with X, exits z80sim",
};
const TAB: Key = {
  label: "Tab",
  stroke: { code: KBD.tab },
  span: 2,
  kind: "mod",
};

const ARROWS: Key[] = [
  { label: "←", stroke: { code: KBD.left }, span: 2, kind: "mod", title: "Left" },
  { label: "↑", stroke: { code: KBD.up }, span: 2, kind: "mod", title: "Up" },
  { label: "↓", stroke: { code: KBD.down }, span: 2, kind: "mod", title: "Down" },
  {
    label: "→",
    stroke: { code: KBD.right },
    span: 2,
    kind: "mod",
    title: "Right",
  },
];

// z80sim reads F3-F10 as the trainer's DIP switches, so the function row is
// not padding here — it is hardware.
const FUNCTION_KEYS: Key[] = (
  [
    ["F1", KBD.f1],
    ["F2", KBD.f2],
    ["F3", KBD.f3],
    ["F4", KBD.f4],
    ["F5", KBD.f5],
    ["F6", KBD.f6],
    ["F7", KBD.f7],
    ["F8", KBD.f8],
    ["F9", KBD.f9],
    ["F10", KBD.f10],
  ] as const
).map(([label, code]) => ({
  label,
  stroke: { code },
  kind: "mod" as const,
  title: `${label}${code >= KBD.f3 && code <= KBD.f10 ? " — DIP switch" : ""}`,
}));

export interface SimKeyboardProps {
  onKey: (stroke: KeyStroke) => void;
  /** One-tap Load: types L, the hex name and Enter. Absent until a build exists. */
  onLoad?: () => void;
  loadName?: string;
  /** Raise or dismiss the device's own keyboard. */
  onToggleNativeKeyboard: () => void;
  /** True while the device keyboard has focus. */
  nativeKeyboard: boolean;
  onClose: () => void;
}

export default function SimKeyboard({
  loadName,
  nativeKeyboard,
  onClose,
  onKey,
  onLoad,
  onToggleNativeKeyboard,
}: SimKeyboardProps) {
  const [expanded, setExpanded] = useState(false);

  const key = (k: Key, index: number) => (
    <button
      className={`simkey${k.kind ? ` simkey-${k.kind}` : ""}`}
      key={`${k.label}-${index}`}
      onPointerDown={(event) => {
        // Fire on press, not click: a click moves DOM focus off the sim host
        // (and off the type field, closing the device keyboard mid-sentence).
        event.preventDefault();
        onKey(k.stroke);
      }}
      style={k.span ? { gridColumn: `span ${k.span}` } : undefined}
      title={k.title ?? k.label}
      type="button"
    >
      {k.label}
    </button>
  );

  return (
    <div
      aria-label="Z80sim controls"
      className={`simkbd${expanded ? " expanded" : ""}`}
      role="group"
    >
      <div className="simkbd-row simkbd-commands">
        <button
          className="simkey simkey-load"
          disabled={!onLoad}
          onPointerDown={(event) => {
            event.preventDefault();
            onLoad?.();
          }}
          title={
            onLoad
              ? `Load ${loadName} into Z80sim — types L, the filename and Enter for you`
              : "Assemble the active file first"
          }
          type="button"
        >
          <Icon name="play" size={13} />
          Load {loadName ?? ""}
        </button>
        {key(GO, 0)}
        {key(TRACE, 1)}
        {key(ESC, 2)}
        <button
          aria-pressed={nativeKeyboard}
          className={`simkey simkey-type${nativeKeyboard ? " on" : ""}`}
          // A real click: focus() only raises the device keyboard from inside
          // a genuine user gesture, and preventDefault on pointerdown would
          // suppress the focus change that gesture is for.
          onClick={onToggleNativeKeyboard}
          title={
            nativeKeyboard
              ? "Hide the device keyboard"
              : "Type with the device keyboard"
          }
          type="button"
        >
          <Icon name="terminal" size={14} />
        </button>
        <button
          aria-expanded={expanded}
          className="simkey simkey-mod"
          onPointerDown={(event) => {
            event.preventDefault();
            setExpanded((v) => !v);
          }}
          title={expanded ? "Fewer keys" : "Function keys and menu commands"}
          type="button"
        >
          <Icon name={expanded ? "chevron-down" : "chevron-up"} size={15} />
        </button>
      </div>

      {expanded && (
        <>
          <div className="simkbd-row simkbd-10">{FUNCTION_KEYS.map(key)}</div>
          <div className="simkbd-row simkbd-commands">
            {key(HELP, 3)}
            {key(MEMORY, 4)}
            {key(REGISTER, 5)}
            {key(DATA, 6)}
            {key(CLEAR, 7)}
            {key(UNASM, 8)}
          </div>
          <div className="simkbd-row simkbd-commands">
            {key(EDITOR, 9)}
            {key(SPEED, 10)}
            {ARROWS.map(key)}
          </div>
          <div className="simkbd-row simkbd-commands">
            {key(CTRL, 11)}
            {key(ALT, 12)}
            {key(TAB, 13)}
            {key(ENTER, 14)}
            {key(
              {
                label: "⌫",
                stroke: { code: KBD.backspace },
                span: 2,
                kind: "mod",
                title: "Backspace",
              },
              15,
            )}
            <button
              aria-label="Hide controls"
              className="simkey simkey-mod"
              onClick={onClose}
              style={{ gridColumn: "span 2" }}
              title="Hide controls"
              type="button"
            >
              <Icon name="x" size={15} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
