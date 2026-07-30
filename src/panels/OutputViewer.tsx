import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../Icon";
import { forDisplay, highlightSegments } from "./outputText";
import { useApp } from "../state/AppState";

/** A build product (listing / hex) with find, wrap and copy. */
export default function OutputViewer({
  fileName,
  text,
}: {
  fileName: string;
  text: string;
}) {
  const { settings } = useApp();
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState(0);
  const [wrap, setWrap] = useState(false);
  const [copied, setCopied] = useState(false);
  const activeRef = useRef<HTMLElement>(null);

  const body = useMemo(() => forDisplay(text), [text]);
  const segments = useMemo(
    () => highlightSegments(body, query),
    [body, query],
  );
  const total = segments.filter((s) => s.match).length;

  useEffect(() => setCurrent(0), [query, fileName]);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center" });
  }, [current, query]);

  const step = (delta: number) => {
    if (!total) return;
    setCurrent((index) => (index + delta + total) % total);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the download button still works */
    }
  };

  let seen = -1;

  return (
    <div className="panel-fill viewer">
      <div className="viewer-bar">
        <span className="viewer-find">
          <Icon name="search" size={13} />
          <input
            aria-label={`Find in ${fileName}`}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              step(event.shiftKey ? -1 : 1);
            }}
            placeholder="Find"
            spellCheck={false}
            value={query}
          />
          {query && (
            <span className="viewer-count">
              {total ? `${current + 1} / ${total}` : "no matches"}
            </span>
          )}
        </span>
        <button
          aria-label="Previous match"
          className="icon-btn"
          disabled={!total}
          onClick={() => step(-1)}
          title="Previous match"
          type="button"
        >
          <Icon name="chevron-up" size={14} />
        </button>
        <button
          aria-label="Next match"
          className="icon-btn"
          disabled={!total}
          onClick={() => step(1)}
          title="Next match"
          type="button"
        >
          <Icon name="chevron-down" size={14} />
        </button>
        <span className="viewer-spacer" />
        <button
          aria-pressed={wrap}
          className={`tbtn viewer-toggle${wrap ? " on" : ""}`}
          onClick={() => setWrap((on) => !on)}
          title="Wrap long lines"
          type="button"
        >
          <Icon name="wrap" size={14} />
          Wrap
        </button>
        <button
          className="tbtn"
          onClick={() => void copy()}
          title={`Copy ${fileName}`}
          type="button"
        >
          <Icon name={copied ? "check-circle" : "copy"} size={14} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        className={`output viewer-body${wrap ? " wrap" : ""}`}
        style={{ fontSize: `${settings.outputFontSize}px` }}
      >
        {segments.map((segment, index) => {
          if (!segment.match) return segment.text;
          seen += 1;
          const active = seen === current;
          return (
            <mark
              className={active ? "hit active" : "hit"}
              key={index}
              ref={active ? activeRef : undefined}
            >
              {segment.text}
            </mark>
          );
        })}
      </pre>
    </div>
  );
}
