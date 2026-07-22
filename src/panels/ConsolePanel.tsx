import { useApp, type OutputTab } from "../state/AppState";

export default function ConsolePanel() {
  const { result, tab, setTab } = useApp();

  return (
    <div className="panel-fill">
      <div className="tabbar">
        {(["console", "listing", "hex"] as OutputTab[]).map((t) => (
          <button
            key={t}
            className={"otab " + (tab === t ? "active" : "")}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <pre className="output">
        {tab === "console" && (result?.stdout || "Press Assemble to run C16.")}
        {tab === "listing" && (result?.listing || "(no listing yet)")}
        {tab === "hex" && (result?.hex || "(no hex output yet)")}
      </pre>
    </div>
  );
}
