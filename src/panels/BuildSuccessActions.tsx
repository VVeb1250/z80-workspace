import { Icon } from "../Icon";
import { useApp } from "../state/AppState";

export default function BuildSuccessActions() {
  const {
    activeArtifacts,
    activeFile,
    buildState,
    // download,
    // focusOutput,
    simRunning,
    toggleSimulator,
  } = useApp();

  if (buildState.kind !== "ok") return null;

  return (
    <section aria-label="Build ready actions" className="build-ready">
      <div className="build-ready-copy">
        <Icon name="check-circle" size={18} />
        <div>
          <strong>{activeFile} · build outputs</strong>
        </div>
      </div>
      <div className="build-ready-actions">
        <button className="tbtn primary" onClick={toggleSimulator} type="button">
          <Icon name={simRunning ? "stop" : "play"} size={15} />
          {simRunning ? "Close Z80sim" : "Open Z80sim"}
        </button>
        {activeArtifacts.map((artifact) => {
          // const ready = artifact.state === "ready" && !!artifact.text;
          return (
            <span className="build-artifact-actions" key={artifact.kind}>
              {/* <button
                className="tbtn"
                disabled={!ready}
                onClick={() =>
                  focusOutput(
                    artifact.kind === "hex" ? "hex" : "listing",
                    true,
                  )
                }
                type="button"
              >
                View {artifact.fileName}
              </button>
              <button
                aria-label={`Download ${artifact.fileName}`}
                className="icon-btn"
                disabled={!ready}
                onClick={() =>
                  artifact.text && download(artifact.fileName, artifact.text)
                }
                title={`Download ${artifact.fileName}`}
                type="button"
              >
                <Icon name="download" size={14} />
              </button> */}
            </span>
          );
        })}
      </div>
    </section>
  );
}
