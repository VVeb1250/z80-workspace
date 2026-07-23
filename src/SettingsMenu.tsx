import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import {
  isZ80ThemeId,
  Z80_THEME_OPTIONS,
} from "./editor/z80Theme";
import { Icon } from "./Icon";
import {
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  TAB_SIZES,
} from "./settings/store";
import { useApp } from "./state/AppState";

interface FontSizeInputProps {
  id: string;
  inputRef?: Ref<HTMLInputElement>;
  onCommit: (value: number) => void;
  value: number;
}

interface ToggleSettingProps {
  checked: boolean;
  description?: string;
  id: string;
  label: string;
  onChange: (checked: boolean) => void;
}

function ToggleSetting({
  checked,
  description,
  id,
  label,
  onChange,
}: ToggleSettingProps) {
  return (
    <label
      className={`setting-toggle${description ? " setting-toggle-detailed" : ""}`}
      htmlFor={id}
    >
      <span className="setting-toggle-copy">
        <span>{label}</span>
        {description && <small>{description}</small>}
      </span>
      <input
        checked={checked}
        id={id}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

function FontSizeInput({ id, inputRef, onCommit, value }: FontSizeInputProps) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const parsed = Number(draft);
    const next = Number.isFinite(parsed)
      ? Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, Math.round(parsed)))
      : value;
    setDraft(String(next));
    onCommit(next);
  };

  return (
    <input
      id={id}
      inputMode="numeric"
      max={MAX_FONT_SIZE}
      min={MIN_FONT_SIZE}
      onBlur={commit}
      onChange={(event) => {
        const nextDraft = event.target.value;
        setDraft(nextDraft);
        const parsed = Number(nextDraft);
        if (
          nextDraft !== "" &&
          Number.isInteger(parsed) &&
          parsed >= MIN_FONT_SIZE &&
          parsed <= MAX_FONT_SIZE
        ) {
          onCommit(parsed);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      ref={inputRef}
      step={1}
      type="number"
      value={draft}
    />
  );
}

export default function SettingsMenu() {
  const { settings, updateSettings, resetSettings } = useApp();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstControlRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const editorFontId = useId();
  const editorThemeId = useId();
  const tabSizeId = useId();
  const insertSpacesId = useId();
  const outputFontId = useId();
  const wordWrapId = useId();
  const minimapId = useId();
  const quickSuggestionsId = useId();
  const parameterHintsId = useId();
  const hoverInformationId = useId();
  const renderWhitespaceId = useId();
  const tabAcceptsSuggestionId = useId();
  const diagnosticsId = useId();
  const lineNumbersId = useId();

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const toggle = () => {
    if (open) {
      close();
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const width = 300;
      setPosition({
        left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
        top: rect.bottom + 4,
      });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    firstControlRef.current?.focus();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        close();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        aria-controls={open ? `${titleId}-panel` : undefined}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Open settings"
        className="icon-btn settings-trigger"
        onClick={toggle}
        ref={triggerRef}
        title="Settings"
      >
        <Icon name="settings" size={16} />
      </button>
      {open &&
        createPortal(
          <div
            aria-labelledby={titleId}
            className="settings-panel"
            id={`${titleId}-panel`}
            ref={panelRef}
            role="dialog"
            style={position}
          >
            <div className="settings-header">
              <h2 id={titleId}>Settings</h2>
              <button
                aria-label="Close settings"
                className="icon-btn"
                onClick={() => close(true)}
                title="Close"
              >
                <Icon name="x" size={15} />
              </button>
            </div>

            <section aria-labelledby={`${titleId}-editor`} className="settings-section">
              <h3 id={`${titleId}-editor`}>Editor</h3>
              <div className="setting-row">
                <label htmlFor={editorFontId}>
                  Font size <small>min {MIN_FONT_SIZE}px</small>
                </label>
                <FontSizeInput
                  id={editorFontId}
                  inputRef={firstControlRef}
                  onCommit={(editorFontSize) =>
                    updateSettings({ editorFontSize })
                  }
                  value={settings.editorFontSize}
                />
              </div>
              <div className="setting-row">
                <label htmlFor={editorThemeId}>Color theme</label>
                <select
                  id={editorThemeId}
                  onChange={(event) => {
                    const editorTheme = event.target.value;
                    if (isZ80ThemeId(editorTheme)) {
                      updateSettings({ editorTheme });
                    }
                  }}
                  value={settings.editorTheme}
                >
                  {Z80_THEME_OPTIONS.map(({ id, label }) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="setting-row">
                <label htmlFor={tabSizeId}>Tab width</label>
                <select
                  id={tabSizeId}
                  onChange={(event) =>
                    updateSettings({ tabSize: Number(event.target.value) })
                  }
                  value={settings.tabSize}
                >
                  {TAB_SIZES.map((size) => (
                    <option key={size} value={size}>{size} spaces</option>
                  ))}
                </select>
              </div>
              <ToggleSetting
                checked={settings.insertSpaces}
                description="Off uses tab characters"
                id={insertSpacesId}
                label="Insert spaces"
                onChange={(insertSpaces) => updateSettings({ insertSpaces })}
              />
              <ToggleSetting
                checked={settings.wordWrap}
                id={wordWrapId}
                label="Word wrap"
                onChange={(wordWrap) => updateSettings({ wordWrap })}
              />
              <ToggleSetting
                checked={settings.minimap}
                id={minimapId}
                label="Minimap"
                onChange={(minimap) => updateSettings({ minimap })}
              />
              <ToggleSetting
                checked={settings.lineNumbers}
                id={lineNumbersId}
                label="Line numbers"
                onChange={(lineNumbers) => updateSettings({ lineNumbers })}
              />
            </section>

            <section
              aria-labelledby={`${titleId}-assistance`}
              className="settings-section"
            >
              <h3 id={`${titleId}-assistance`}>Editor assistance</h3>
              <ToggleSetting
                checked={settings.quickSuggestions}
                id={quickSuggestionsId}
                label="Suggestions while typing"
                onChange={(quickSuggestions) =>
                  updateSettings({ quickSuggestions })
                }
              />
              <ToggleSetting
                checked={settings.tabAcceptsSuggestion}
                description="Accept once; the next Tab indents"
                id={tabAcceptsSuggestionId}
                label="Tab accepts suggestion"
                onChange={(tabAcceptsSuggestion) =>
                  updateSettings({ tabAcceptsSuggestion })
                }
              />
              <ToggleSetting
                checked={settings.parameterHints}
                id={parameterHintsId}
                label="Parameter hints"
                onChange={(parameterHints) =>
                  updateSettings({ parameterHints })
                }
              />
              <ToggleSetting
                checked={settings.hoverInformation}
                id={hoverInformationId}
                label="Hover information"
                onChange={(hoverInformation) =>
                  updateSettings({ hoverInformation })
                }
              />
              <ToggleSetting
                checked={settings.renderWhitespace}
                id={renderWhitespaceId}
                label="Show whitespace"
                onChange={(renderWhitespace) =>
                  updateSettings({ renderWhitespace })
                }
              />
              <ToggleSetting
                checked={settings.diagnostics}
                description="Flag unknown mnemonics and undefined labels"
                id={diagnosticsId}
                label="Live error checking"
                onChange={(diagnostics) => updateSettings({ diagnostics })}
              />
            </section>

            <section aria-labelledby={`${titleId}-output`} className="settings-section">
              <h3 id={`${titleId}-output`}>Output</h3>
              <div className="setting-row">
                <label htmlFor={outputFontId}>
                  Font size <small>min {MIN_FONT_SIZE}px</small>
                </label>
                <FontSizeInput
                  id={outputFontId}
                  onCommit={(outputFontSize) =>
                    updateSettings({ outputFontSize })
                  }
                  value={settings.outputFontSize}
                />
              </div>
            </section>

            <div className="settings-footer">
              <span>Saved in this browser</span>
              <button className="settings-reset" onClick={resetSettings} type="button">
                Reset defaults
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
