import { useEffect, useRef } from "react";
import { startSimulator } from "../dosbox/simulator";
import { useApp } from "../state/AppState";

// The panel's existence == the simulator running. Mounting starts z80sim;
// closing the tab (or Stop) removes the panel -> unmount -> stop.
export default function SimulatorPanel() {
  const { setSimRunning, simHandleRef, compiledHexFiles } = useApp();
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setSimRunning(true);

    // js-dos preventDefault()s almost every key via a window listener, eating
    // editor keystrokes. Gate it: registered before js-dos, `gate` runs first
    // in the bubble phase and hides keys from js-dos unless the sim is active.
    let simActive = false;
    const withinSim = (t: EventTarget | null) =>
      t instanceof Node && !!elRef.current?.contains(t);
    const onPointerDown = (e: PointerEvent) => {
      simActive = withinSim(e.target);
    };
    const onFocusIn = (e: FocusEvent) => {
      simActive = withinSim(e.target);
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

    (async () => {
      if (!elRef.current) return;
      // let dockview size the panel before js-dos measures the canvas
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      if (cancelled || !elRef.current) return;
      try {
        // Preload already-compiled .h files so Load works right away.
        simHandleRef.current = await startSimulator(
          elRef.current,
          compiledHexFiles(),
        );
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("z80sim failed to start", e);
      }
    })();

    return () => {
      cancelled = true;
      setSimRunning(false);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("focusin", onFocusIn, true);
      window.removeEventListener("keydown", gate);
      window.removeEventListener("keyup", gate);
      simHandleRef.current?.stop().catch(() => {});
      simHandleRef.current = null;
    };
    // run once for this panel instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // tabIndex makes the container focusable so the gate counts it as active.
  return (
    <div ref={elRef} className="panel-fill sim-wrap jsdos-scope" tabIndex={-1} />
  );
}
