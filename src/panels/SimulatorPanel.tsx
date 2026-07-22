import { useEffect, useRef } from "react";
import { startSimulator, type SimulatorHandle } from "../dosbox/simulator";
import { useApp } from "../state/AppState";

// The panel's existence == the simulator running. Mounting starts z80sim;
// closing the tab (or Stop) removes the panel -> unmount -> stop.
export default function SimulatorPanel() {
  const { setSimRunning } = useApp();
  const elRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SimulatorHandle | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSimRunning(true);
    (async () => {
      if (!elRef.current) return;
      // let dockview size the panel before js-dos measures the canvas
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      if (cancelled || !elRef.current) return;
      try {
        handleRef.current = await startSimulator(elRef.current);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("z80sim failed to start", e);
      }
    })();

    return () => {
      cancelled = true;
      setSimRunning(false);
      handleRef.current?.stop().catch(() => {});
      handleRef.current = null;
    };
    // run once for this panel instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={elRef} className="panel-fill sim-wrap" />;
}
