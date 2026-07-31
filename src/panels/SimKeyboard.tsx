import { useState } from "react";
import { KBD, type KeyStroke } from "../dosbox/keys";
import { Icon } from "../Icon";

// z80sim's on-screen keyboard.
//
// js-dos ships one, but its default page has no letters at all (they hide
// behind an unlabelled layout-cycle key) and it paints over the DOS screen.
// This replaces it with a keyboard laid out for this machine, mounted as a
// sibling of the canvas so opening it *shrinks* the screen instead of covering
// it.
//
// It stays collapsed to a single command row by default. A full QWERTY costs
// over half a phone screen, and once Load types the filename for you there is
// very little left that needs letters — so the alphabet is one tap away rather
// than permanently in the way.

interface Key {
  label: string;
  stroke: KeyStroke;
  /** Grid units wide; the row grids are 12 columns. */
  span?: number;
  kind?: "cmd" | "mod";
  title?: string;
}

const letter = (ch: string): Key => ({
  label: ch,
  stroke: { code: ch.toUpperCase().charCodeAt(0) },
});
const digit = (ch: string): Key => ({
  label: ch,
  stroke: { code: ch.charCodeAt(0) },
});

// The commands off the bottom bar of the z80sim screen.
const GO: Key = { label: "Go", stroke: { code: 71 }, span: 2, kind: "cmd" };
const TRACE: Key = {
  label: "Trace",
  stroke: { code: 84 },
  span: 2,
  kind: "cmd",
};
const ESC: Key = {
  label: "Esc",
  stroke: { code: KBD.esc },
  span: 2,
  kind: "cmd",
  title: "Escape",
};
const HELP: Key = { label: "Help", stroke: { code: 72 }, span: 2, kind: "cmd" };
const EDITOR: Key = {
  label: "Editor",
  stroke: { code: 69 },
  span: 2,
  kind: "cmd",
};
const ENTER: Key = {
  label: "Enter",
  stroke: { code: KBD.enter },
  span: 3,
  kind: "cmd",
};
const BACKSPACE: Key = {
  label: "⌫",
  stroke: { code: KBD.backspace },
  span: 2,
  kind: "mod",
  title: "Backspace",
};

const NUMBER_ROW: Key[] = "1234567890".split("").map(digit);
const LETTER_ROWS: Key[][] = [
  "qwertyuiop".split("").map(letter),
  "asdfghjkl".split("").map(letter),
  "zxcvbnm".split("").map(letter),
];
const HEX_ROW: Key[] = "ABCDEF".split("").map((c) => ({
  ...letter(c),
  span: 2,
}));

const SYMBOLS: Key[] = [
  { label: ".", stroke: { code: KBD.period } },
  { label: "-", stroke: { code: KBD.minus } },
  { label: "_", stroke: { code: KBD.minus, shift: true } },
  { label: ":", stroke: { code: KBD.semicolon, shift: true } },
  { label: "\\", stroke: { code: KBD.backslash } },
  { label: "/", stroke: { code: KBD.slash } },
  { label: ",", stroke: { code: KBD.comma } },
  { label: "Tab", stroke: { code: KBD.tab }, kind: "mod" },
  { label: "Ctrl", stroke: { code: KBD.leftctrl }, kind: "mod" },
  { label: "Alt", stroke: { code: KBD.leftalt }, kind: "mod" },
];

const ARROWS: Key[] = [
  { label: "←", stroke: { code: KBD.left }, kind: "mod", title: "Left" },
  { label: "↑", stroke: { code: KBD.up }, kind: "mod", title: "Up" },
  { label: "↓", stroke: { code: KBD.down }, kind: "mod", title: "Down" },
  { label: "→", stroke: { code: KBD.right }, kind: "mod", title: "Right" },
];

export interface SimKeyboardProps {
  onKey: (stroke: KeyStroke) => void;
  /** One-tap Load: types L, the hex name and Enter. Absent until a build exists. */
  onLoad?: () => void;
  loadName?: string;
  onClose: () => void;
}

export default function SimKeyboard({
  loadName,
  onClose,
  onKey,
  onLoad,
}: SimKeyboardProps) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState<"letters" | "symbols">("letters");

  const key = (k: Key, index: number) => (
    <button
      className={`simkey${k.kind ? ` simkey-${k.kind}` : ""}`}
      key={`${k.label}-${index}`}
      onPointerDown={(event) => {
        // Fire on press, not click: a click moves DOM focus off the sim host
        // and flips the panel back to "out of Z80sim focus".
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
      aria-label="Z80sim keyboard"
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
          aria-expanded={expanded}
          className="simkey simkey-mod simkbd-more"
          onPointerDown={(event) => {
            event.preventDefault();
            setExpanded((v) => !v);
          }}
          title={expanded ? "Fewer keys" : "All keys (letters, digits, arrows)"}
          type="button"
        >
          {expanded ? (
            <Icon name="chevron-down" size={15} />
          ) : (
            <Icon name="chevron-up" size={15} />
          )}
        </button>
      </div>

      {expanded && (
        <>
          <div className="simkbd-row simkbd-commands">
            {key(HELP, 3)}
            {key(EDITOR, 4)}
            {ARROWS.map(key)}
            {key(BACKSPACE, 5)}
          </div>

          {page === "letters" ? (
            <>
              <div className="simkbd-row simkbd-10">
                {NUMBER_ROW.map(key)}
              </div>
              <div className="simkbd-row simkbd-10">
                {LETTER_ROWS[0].map(key)}
              </div>
              <div className="simkbd-row simkbd-10 simkbd-indent">
                {LETTER_ROWS[1].map(key)}
              </div>
              <div className="simkbd-row simkbd-10 simkbd-indent2">
                {LETTER_ROWS[2].map(key)}
              </div>
            </>
          ) : (
            <>
              <div className="simkbd-row">{HEX_ROW.map(key)}</div>
              <div className="simkbd-row simkbd-10">{SYMBOLS.map(key)}</div>
            </>
          )}

          <div className="simkbd-row simkbd-commands">
            <button
              className="simkey simkey-mod"
              onPointerDown={(event) => {
                event.preventDefault();
                setPage((p) => (p === "letters" ? "symbols" : "letters"));
              }}
              style={{ gridColumn: "span 2" }}
              title={page === "letters" ? "Hex and symbols" : "Letters"}
              type="button"
            >
              {page === "letters" ? "A-F .?" : "abc"}
            </button>
            {key({ label: "space", stroke: { code: KBD.space }, span: 5 }, 6)}
            {key(ENTER, 7)}
            <button
              aria-label="Hide keyboard"
              className="simkey simkey-mod"
              onClick={onClose}
              style={{ gridColumn: "span 2" }}
              title="Hide keyboard"
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
