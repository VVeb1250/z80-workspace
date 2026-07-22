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
      simHandleRef.current?.stop().catch(() => {});
      simHandleRef.current = null;
    };
    // run once for this panel instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={elRef} className="panel-fill sim-wrap jsdos-scope" />;
}
