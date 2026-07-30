import { useMemo, useState } from "react";
import { Icon } from "../Icon";
import SimScreenMap from "../simguide/SimScreenMap";
import {
  filterSimCommands,
  SIM_COMMANDS,
  SIM_GROUPS,
  SIM_GUIDE_UI,
  SIM_NOTES,
  SIM_SCREEN_REGIONS,
  SIM_STEPS,
  simTextFor,
  type SimGroupId,
} from "../simguide/z80simGuide";
import { TUTORIAL_LANGS } from "../settings/store";
import { useApp } from "../state/AppState";

// Same shape as the Z80 instruction reference — searchable index on the left,
// detail on the right — so the two toolchain docs read the same way. The
// index's first entry is an overview: workflow, screen map, workspace notes.
export default function SimGuidePanel() {
  const { settings, updateSettings } = useApp();
  const lang = settings.tutorialLang;
  const ui = SIM_GUIDE_UI[lang];

  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<SimGroupId | "all">("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const matches = useMemo(
    () => filterSimCommands(query, group, lang),
    [query, group, lang],
  );
  const selected = matches.find((command) => command.key === selectedKey);
  const selectedText = selected ? simTextFor(selected, lang) : null;

  return (
    <section aria-label="Z80sim guide" className="instruction-reference sim-guide">
      <header className="instruction-reference-header">
        <div>
          <span className="instruction-reference-eyebrow">{ui.eyebrow}</span>
          <h1>{ui.title}</h1>
          <p>{ui.lead}</p>
        </div>
        <div className="sim-guide-controls">
          <div aria-label={ui.languageLabel} className="welcome-lang" role="group">
            {TUTORIAL_LANGS.map((code) => (
              <button
                aria-pressed={lang === code}
                key={code}
                onClick={() => updateSettings({ tutorialLang: code })}
                type="button"
              >
                {code === "th" ? "ไทย" : "EN"}
              </button>
            ))}
          </div>
          <div className="instruction-search">
            <Icon name="search" size={15} />
            <input
              aria-label={ui.searchLabel}
              autoComplete="off"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={ui.searchPlaceholder}
              spellCheck={false}
              type="search"
              value={query}
            />
            {query && (
              <button
                aria-label={ui.clearSearch}
                className="instruction-search-clear"
                onClick={() => setQuery("")}
                type="button"
              >
                <Icon name="x" size={13} />
              </button>
            )}
          </div>
        </div>
      </header>

      <nav aria-label={ui.commands} className="instruction-categories">
        <button
          aria-pressed={group === "all"}
          onClick={() => setGroup("all")}
          type="button"
        >
          {ui.all}
        </button>
        {SIM_GROUPS.map((item) => (
          <button
            aria-pressed={group === item.id}
            key={item.id}
            onClick={() => setGroup(item.id)}
            type="button"
          >
            {lang === "en" ? item.en : item.th}
          </button>
        ))}
      </nav>

      <div className="instruction-reference-body">
        <aside aria-label={ui.commands} className="instruction-index">
          <div className="instruction-result-count" role="status">
            {ui.count(matches.length, SIM_COMMANDS.length)}
          </div>
          <div className="instruction-index-list">
            <button
              aria-current={selected ? undefined : "true"}
              className={selected ? "" : "active"}
              onClick={() => setSelectedKey(null)}
              type="button"
            >
              <strong className="sim-key">
                <Icon name="compass" size={13} />
              </strong>
              <span>{ui.quickStart}</span>
            </button>
            {matches.map((command) => {
              const text = simTextFor(command, lang);
              return (
                <button
                  aria-current={command.key === selected?.key ? "true" : undefined}
                  className={command.key === selected?.key ? "active" : ""}
                  key={command.key}
                  onClick={() => setSelectedKey(command.key)}
                  type="button"
                >
                  <strong className="sim-key">{command.key}</strong>
                  <span>{text.name}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {selected && selectedText ? (
          <article className="instruction-detail">
            <header className="instruction-detail-header">
              <span className="instruction-group-badge">{selected.label}</span>
              <h2>
                <kbd className="sim-key-large">{selected.key}</kbd>
                {selectedText.name}
              </h2>
              <p>{selectedText.body}</p>
            </header>

            {selected.screen && (
              <section aria-labelledby="sim-screen-title">
                <h3 id="sim-screen-title">{ui.whatYouSee}</h3>
                <pre className="sim-screen-block">
                  <code>{selected.screen.join("\n")}</code>
                </pre>
              </section>
            )}

            <footer className="instruction-source">{ui.source}</footer>
          </article>
        ) : (
          <article className="instruction-detail">
            <header className="instruction-detail-header">
              <span className="instruction-group-badge">{ui.quickStart}</span>
              <h2>{ui.title}</h2>
              <p>{ui.lead}</p>
            </header>

            <section aria-labelledby="sim-steps-title">
              <h3 id="sim-steps-title">{ui.quickStart}</h3>
              <ol className="sim-steps">
                {SIM_STEPS.map((step) => {
                  const text = simTextFor(step, lang);
                  return (
                    <li key={text.name}>
                      <strong>{text.name}</strong>
                      <span>{text.body}</span>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section aria-labelledby="sim-map-title">
              <h3 id="sim-map-title">{ui.screenMap}</h3>
              <div className="sim-map-wrap">
                <SimScreenMap label={ui.screenMap} />
                <ol className="sim-legend">
                  {SIM_SCREEN_REGIONS.map((region) => {
                    const text = simTextFor(region, lang);
                    return (
                      <li key={region.id}>
                        <strong>{text.name}</strong>
                        <span>{text.body}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </section>

            <section aria-labelledby="sim-notes-title">
              <h3 id="sim-notes-title">{ui.notes}</h3>
              <ul className="sim-notes">
                {SIM_NOTES.map((note) => {
                  const text = simTextFor(note, lang);
                  return (
                    <li key={text.name}>
                      <strong>{text.name}</strong>
                      <span>{text.body}</span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <footer className="instruction-source">{ui.source}</footer>
          </article>
        )}
      </div>

      {!matches.length && (
        <div className="instruction-empty" role="status">
          <Icon name="search" size={20} />
          <strong>{ui.empty}</strong>
          <span>{ui.emptyHint}</span>
        </div>
      )}
    </section>
  );
}
