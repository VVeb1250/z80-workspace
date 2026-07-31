import { useCallback, useEffect, useRef, useState } from "react";
import {
  KBD,
  loadCommandStrokes,
  sendStrokes,
  strokeForKeyName,
  strokesForText,
  type KeyStroke,
} from "../dosbox/keys";
import { startSimulator } from "../dosbox/simulator";
import { simulatorGuidance } from "../dosbox/simulatorUi";
import { Icon } from "../Icon";
import { COARSE_QUERY, useMediaQuery } from "../responsive";
import { useApp } from "../state/AppState";
import SimKeyboard from "./SimKeyboard";

// The panel's existence == the simulator running. Mounting starts Z80sim;
// closing the tab (or Stop) removes the panel -> unmount -> stop.
export default function SimulatorPanel() {
  const {
    baseName,
    clearSimHexUpdate,
    compiledHexFiles,
    setSimRunning,
    simHandleRef,
    simHexUpdate,
    statusOf,
    activeFile,
  } = useApp();
  const hostRef = useRef<HTMLDivElement>(null);
  const emulatorRef = useRef<HTMLDivElement>(null);
  // An off-screen field whose only job is to make the device's own keyboard
  // appear. While it holds focus it owns the keyboard completely — see the
  // gate below, which hides those keys from js-dos so nothing types twice.
  const typeFieldRef = useRef<HTMLInputElement>(null);
  const typingNativeRef = useRef(false);
  const [nativeKeyboard, setNativeKeyboard] = useState(false);
  const [simActiveState, setSimActiveState] = useState(false);
  const [simReady, setSimReady] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  // Bumping this re-runs the boot effect, which is how Retry works.
  const [bootAttempt, setBootAttempt] = useState(0);
  const touch = useMediaQuery(COARSE_QUERY);
  // Open by default on touch: without a physical keyboard this bar is the only
  // way to drive z80sim at all, so hiding it behind a toggle would repeat the
  // mistake js-dos makes.
  const [keyboardOpen, setKeyboardOpen] = useState(touch);
  const [typing, setTyping] = useState(false);
  const buildReady = statusOf(activeFile) === "fresh";
  const guidance = simulatorGuidance(
    simActiveState,
    `${baseName}.h`,
    buildReady,
    touch,
  );

  useEffect(() => {
    let cancelled = false;
    setSimRunning(true);
    clearSimHexUpdate(); // a fresh boot preloads current hex; nothing to reload

    // js-dos preventDefault()s almost every key via a window listener, eating
    // editor keystrokes. Gate it: registered before js-dos, `gate` runs first
    // in the bubble phase and hides keys from js-dos unless the sim is active.
    let simActive = false;
    const withinSim = (t: EventTarget | null) =>
      t instanceof Node && !!hostRef.current?.contains(t);
    const setActive = (active: boolean) => {
      simActive = active;
      setSimActiveState(active);
    };
    const onPointerDown = (e: PointerEvent) => {
      setActive(withinSim(e.target));
    };
    const onFocusIn = (e: FocusEvent) => {
      setActive(withinSim(e.target));
    };
    // js-dos mis-maps the numpad to KBD_kp* (renders as letters). Send the
    // main-row code instead. Needs NumLock ON to see these keyCodes.
    const numpadKbd = (kc: number): number | null => {
      if (kc >= 96 && kc <= 105) return kc - 48; // Numpad 0-9 -> KBD_0..9
      if (kc === 110) return 46; // Numpad . -> KBD_period
      if (kc === 109) return 45; // Numpad - -> KBD_minus
      return null;
    };
    const gate = (e: KeyboardEvent) => {
      // The type field is focused: its own handlers translate and forward
      // every key, so js-dos must not also see them.
      if (typingNativeRef.current) {
        e.stopImmediatePropagation();
        return;
      }
      if (!simActive) {
        e.stopImmediatePropagation();
        return;
      }
      if (e.location !== 3) return; // not a numpad key -> let js-dos handle it
      const kbd = numpadKbd(e.keyCode);
      const ci = simHandleRef.current?.ci();
      if (kbd === null || !ci) return; // Enter/*/+/etc -> leave to js-dos
      e.stopImmediatePropagation();
      e.preventDefault();
      ci.sendKeyEvent(kbd, e.type === "keydown");
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("focusin", onFocusIn, true);
    window.addEventListener("keydown", gate);
    window.addEventListener("keyup", gate);

    setStartError(null);
    (async () => {
      if (!emulatorRef.current) return;
      // let dockview size the panel before js-dos measures the canvas
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      if (cancelled || !emulatorRef.current) return;
      try {
        // Preload already-compiled .h files so Load works right away.
        simHandleRef.current = await startSimulator(
          emulatorRef.current,
          compiledHexFiles(),
        );
        if (!cancelled) setSimReady(true);
      } catch (e) {
        // A dead emulator used to leave the badge on "Starting Z80sim…"
        // forever, with the reason only in the devtools console.
        if (!cancelled) setStartError((e as Error).message);
        // eslint-disable-next-line no-console
        console.error("Z80sim failed to start", e);
      }
    })();

    return () => {
      cancelled = true;
      setSimRunning(false);
      setSimReady(false);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("focusin", onFocusIn, true);
      window.removeEventListener("keydown", gate);
      window.removeEventListener("keyup", gate);
      simHandleRef.current?.stop().catch(() => {});
      simHandleRef.current = null;
    };
    // run once per boot attempt
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootAttempt]);

  // useMediaQuery settles after the first paint, so pick the default up then.
  useEffect(() => {
    if (touch) setKeyboardOpen(true);
  }, [touch]);

  // Bridge the device's own keyboard into the emulator.
  //
  // A phone keyboard does not report usable keydowns for characters — iOS and
  // Android both send key "Unidentified" / keyCode 229 and deliver the actual
  // text through `beforeinput` instead. So characters are read there, and
  // keydown is left to handle only the keys that produce no input event
  // (Enter, Escape, arrows, and the function keys off a hardware keyboard).
  // Splitting it that way is what stops a physical keyboard, which fires both,
  // from typing everything twice.
  useEffect(() => {
    const field = typeFieldRef.current;
    if (!field) return;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));
    const send = (strokes: KeyStroke[]) => {
      const ci = simHandleRef.current?.ci();
      if (ci && strokes.length) void sendStrokes(ci, strokes, wait);
    };

    const onBeforeInput = (event: Event) => {
      const e = event as InputEvent;
      // Never let the field actually accumulate text: it is a keyboard
      // trigger, not somewhere to compose. Keeping it empty also means no
      // stale caret position for the OS to argue with.
      e.preventDefault();
      if (e.inputType === "insertText" && e.data) {
        const strokes = strokesForText(e.data);
        if (strokes) send(strokes);
      } else if (e.inputType === "deleteContentBackward") {
        send([{ code: KBD.backspace }]);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing || e.key === "Unidentified") return;
      // Backspace is handled in beforeinput; taking it here as well would
      // delete twice on a hardware keyboard.
      if (e.key === "Backspace") return;
      const stroke = strokeForKeyName(e.key);
      if (!stroke) return; // printable — beforeinput has it
      e.preventDefault();
      send([stroke]);
    };

    const onFocus = () => {
      typingNativeRef.current = true;
      setNativeKeyboard(true);
    };
    const onBlur = () => {
      typingNativeRef.current = false;
      setNativeKeyboard(false);
    };
    // Belt and braces for IMEs that ignore preventDefault on beforeinput.
    const onInput = () => {
      field.value = "";
    };

    field.addEventListener("beforeinput", onBeforeInput);
    field.addEventListener("keydown", onKeyDown);
    field.addEventListener("input", onInput);
    field.addEventListener("focus", onFocus);
    field.addEventListener("blur", onBlur);
    return () => {
      field.removeEventListener("beforeinput", onBeforeInput);
      field.removeEventListener("keydown", onKeyDown);
      field.removeEventListener("input", onInput);
      field.removeEventListener("focus", onFocus);
      field.removeEventListener("blur", onBlur);
    };
  }, [simHandleRef]);

  const toggleNativeKeyboard = useCallback(() => {
    const field = typeFieldRef.current;
    if (!field) return;
    // focus()/blur() must happen inside the user gesture or iOS ignores it.
    if (typingNativeRef.current) field.blur();
    else field.focus();
  }, []);

  const focusSimulator = () => {
    hostRef.current?.focus();
  };

  // A tap on our keyboard is a real key press as far as DOSBox is concerned:
  // the emulator samples the keyboard per frame, so down and up have to be
  // separated in time or the press is dropped.
  const pressKey = useCallback((stroke: KeyStroke) => {
    const ci = simHandleRef.current?.ci();
    if (!ci) return;
    // Our keys go straight to the emulator, so they work whether or not the
    // host has DOM focus — but taking focus keeps the "keyboard → Z80sim"
    // badge honest and dismisses the click-to-control overlay.
    hostRef.current?.focus();
    void sendStrokes(ci, [stroke], (ms) => new Promise((r) => setTimeout(r, ms)));
  }, [simHandleRef]);

  // The whole reason the old soft keyboard was unusable: loading a program
  // meant typing a filename on a keyboard with no letters. We already know the
  // name, so type it for them.
  const loadHex = useCallback(() => {
    const ci = simHandleRef.current?.ci();
    const strokes = loadCommandStrokes(`${baseName}.h`);
    if (!ci || !strokes || typing) return;
    setTyping(true);
    hostRef.current?.focus();
    clearSimHexUpdate();
    void sendStrokes(ci, strokes, (ms) => new Promise((r) => setTimeout(r, ms)))
      .finally(() => setTyping(false));
  }, [baseName, clearSimHexUpdate, simHandleRef, typing]);

  const badge = startError
    ? "Z80sim could not start"
    : simReady
      ? guidance.badge
      : "Starting Z80sim…";

  return (
    <div className="panel-fill sim-panel">
      <div className="sim-uxbar">
        <span
          className={`sim-focus-badge ${startError ? "failed" : simActiveState ? "active" : ""}`}
          role="status"
        >
          {badge}
        </span>
        <code>{startError ?? guidance.instruction}</code>
        {simReady && !startError && !keyboardOpen && (
          <button
            className="tbtn sim-kbd-toggle"
            onClick={() => setKeyboardOpen(true)}
            title="Show the Z80sim keyboard"
            type="button"
          >
            <Icon name="terminal" size={14} />
            Keys
          </button>
        )}
      </div>
      {simHexUpdate && simReady && !startError && (
        // Z80sim reads the hex once, at Load. A rebuild lands on C: silently,
        // so the running machine keeps executing the old program until the
        // user loads it again — which is now one tap rather than a filename
        // typed by hand.
        <div className="sim-reload-note" role="status">
          <Icon name="refresh" size={14} />
          <span>New build copied to C: — reload {simHexUpdate} to run it</span>
          <button
            className="tbtn primary sim-reload-btn"
            disabled={typing}
            onClick={loadHex}
            type="button"
          >
            <Icon name="refresh" size={13} />
            Reload
          </button>
          <button
            className="icon-btn"
            onClick={clearSimHexUpdate}
            title="Dismiss"
            type="button"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}
      <div
        aria-label="Z80sim screen"
        className="sim-host sim-wrap jsdos-scope"
        ref={hostRef}
        tabIndex={0}
      >
        <div className="sim-emulator" ref={emulatorRef} />
        {startError && (
          <div className="sim-focus-overlay sim-error-overlay">
            <strong>Z80sim could not start</strong>
            <span>{startError}</span>
            <button
              className="tbtn primary"
              onClick={() => setBootAttempt((attempt) => attempt + 1)}
              type="button"
            >
              <Icon name="refresh" size={15} />
              Try again
            </button>
          </div>
        )}
        {!simActiveState && !startError && !keyboardOpen && (
          <div className="sim-focus-overlay">
            <button
              className="tbtn primary"
              onClick={focusSimulator}
              type="button"
            >
              {touch ? "Tap to control Z80sim" : "Click to control Z80sim"}
            </button>
            <span>{guidance.instruction}</span>
          </div>
        )}
      </div>
      {/* Outside .sim-host on purpose: as a flex sibling it takes height from
          the screen, so js-dos's ResizeObserver shrinks the canvas to fit
          rather than the keyboard painting over the DOS display. */}
      {/* Off-screen, but focusable — that is what raises the device keyboard.
          It must not be display:none or hidden, or focus() is a no-op. */}
      <input
        aria-label="Type into Z80sim"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        className="sim-type-field"
        ref={typeFieldRef}
        spellCheck={false}
        tabIndex={-1}
        type="text"
      />
      {keyboardOpen && simReady && !startError && (
        <SimKeyboard
          loadName={`${baseName}.h`}
          nativeKeyboard={nativeKeyboard}
          onClose={() => setKeyboardOpen(false)}
          onKey={pressKey}
          onLoad={buildReady && !typing ? loadHex : undefined}
          onToggleNativeKeyboard={toggleNativeKeyboard}
        />
      )}
    </div>
  );
}
