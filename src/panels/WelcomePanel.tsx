import { Icon } from "../Icon";
import { useApp } from "../state/AppState";
import {
  TUTORIAL_STEPS,
  WELCOME_UI,
  textFor,
} from "../tutorial/tutorialContent";
import { TUTORIAL_LANGS } from "../settings/store";

export default function WelcomePanel() {
  const { settings, updateSettings, startTour } = useApp();
  const lang = settings.tutorialLang;
  const ui = WELCOME_UI[lang];

  return (
    <section aria-label="Welcome and tutorial" className="welcome-panel">
      <header className="welcome-header">
        <div>
          <span className="welcome-eyebrow">{ui.eyebrow}</span>
          <h1>{ui.title}</h1>
          <p>{ui.lead}</p>
        </div>
        <div className="welcome-controls">
          <div
            aria-label={ui.languageLabel}
            className="welcome-lang"
            role="group"
          >
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
          <button
            className="tbtn primary welcome-tour-btn"
            onClick={startTour}
            type="button"
          >
            <Icon name="compass" size={16} />
            <span>{ui.startTour}</span>
          </button>
        </div>
      </header>

      <ol className="welcome-steps">
        {TUTORIAL_STEPS.map((step) => {
          const text = textFor(step, lang);
          return (
            <li className="welcome-step" key={step.id}>
              <span aria-hidden="true" className="welcome-step-icon">
                <Icon name={step.icon} size={18} />
              </span>
              <div className="welcome-step-text">
                <h2>{text.title}</h2>
                <p>{text.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
