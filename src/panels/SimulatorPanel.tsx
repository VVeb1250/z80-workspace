import { useEffect, useRef, useState } from "react";
import { startSimulator } from "../dosbox/simulator";
import { simulatorGuidance } from "../dosbox/simulatorUi";
import { Icon } from "../Icon";
import { useApp } from "../state/AppState";

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
  const [simActiveState, setSimActiveState] = useState(false);
  const [simReady, setSimReady] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  // Bumping this re-runs the boot effect, which is how Retry works.
  const [bootAttempt, setBootAttempt] = useState(0);
  const buildReady = statusOf(activeFile) === "fresh";
  const guidance = simulatorGuidance(
    simActiveState,
    `${baseName}.h`,
    buildReady,
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

  const focusSimulator = () => {
    hostRef.current?.focus();
  };

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
      </div>
      {simHexUpdate && simReady && !startError && (
        // Z80sim reads the hex once, at Load. A rebuild lands on C: silently,
        // so the running machine keeps executing the old program until the
        // user loads it again.
        <div className="sim-reload-note" role="status">
          <Icon name="refresh" size={14} />
          <span>
            New build copied to C: — press L → {simHexUpdate} → Enter to reload
          </span>
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
        {!simActiveState && !startError && (
          <div className="sim-focus-overlay">
            <button
              className="tbtn primary"
              onClick={focusSimulator}
              type="button"
            >
              Click to control Z80sim
            </button>
            <span>{guidance.instruction}</span>
          </div>
        )}
      </div>
    </div>
  );
}
