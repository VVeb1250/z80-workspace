import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../Icon";
import { useApp } from "../state/AppState";
import { TOUR_STEPS, textFor } from "./tutorialContent";

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;
const TOOLTIP_W = 320;
const TOOLTIP_H = 190;
const GAP = 12;

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(v, max));

export default function GuidedTour() {
  const { tourActive, tourStep, nextTourStep, prevTourStep, stopTour, settings } =
    useApp();
  const [rect, setRect] = useState<Rect | null>(null);

  const step = TOUR_STEPS[tourStep];

  // Measure the anchored element for the current step, and keep it in sync
  // while the window resizes or scrolls.
  useLayoutEffect(() => {
    if (!tourActive || !step) return;
    const measure = () => {
      const el = document.querySelector<HTMLElement>(
        `[data-tour="${step.anchor}"]`,
      );
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [tourActive, step]);

  // Esc closes; arrows navigate.
  useEffect(() => {
    if (!tourActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") stopTour();
      else if (e.key === "ArrowRight") nextTourStep();
      else if (e.key === "ArrowLeft") prevTourStep();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tourActive, stopTour, nextTourStep, prevTourStep]);

  if (!tourActive || !step) return null;

  const lang = settings.tutorialLang;
  const text = textFor(step, lang);
  const isLast = tourStep === TOUR_STEPS.length - 1;

  // Spotlight box (or a centered fallback when the anchor is missing).
  const spot: Rect = rect ?? {
    top: window.innerHeight / 2,
    left: window.innerWidth / 2,
    width: 0,
    height: 0,
  };

  // Position the tooltip so it stays on-screen regardless of the anchor's size:
  // beside a tall element (e.g. the full-height Explorer), centered over a large
  // area (e.g. the editor/output region), otherwise above/below a small button.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxLeft = vw - TOOLTIP_W - GAP;
  const maxTop = vh - TOOLTIP_H - GAP;
  const centeredLeft = clamp(
    spot.left + spot.width / 2 - TOOLTIP_W / 2,
    GAP,
    maxLeft,
  );
  let tooltipLeft = centeredLeft;
  let tooltipTop: number;

  if (spot.width > vw * 0.45) {
    // Large region: center within the viewport.
    tooltipTop = clamp(vh / 2 - TOOLTIP_H / 2, GAP, maxTop);
  } else if (spot.height > vh * 0.45) {
    // Tall, narrow: place to the side, vertically centered on the element.
    const rightOf = spot.left + spot.width + GAP;
    tooltipLeft =
      rightOf <= maxLeft ? rightOf : clamp(spot.left - TOOLTIP_W - GAP, GAP, maxLeft);
    tooltipTop = clamp(spot.top + spot.height / 2 - TOOLTIP_H / 2, GAP, maxTop);
  } else {
    // Small element: below if it fits, otherwise above.
    const below = spot.top + spot.height + GAP;
    tooltipTop = below <= maxTop ? below : clamp(spot.top - TOOLTIP_H - GAP, GAP, maxTop);
  }

  return createPortal(
    <div className="tour-overlay" role="dialog" aria-modal="true" aria-label={text.title}>
      <div
        className="tour-spotlight"
        style={{
          top: spot.top - PAD,
          left: spot.left - PAD,
          width: spot.width + PAD * 2,
          height: spot.height + PAD * 2,
        }}
      />
      <div
        className="tour-tooltip"
        style={{
          top: tooltipTop,
          left: tooltipLeft,
          width: TOOLTIP_W,
        }}
      >
        <div className="tour-tooltip-head">
          <span className="tour-step-icon" aria-hidden="true">
            <Icon name={step.icon} size={16} />
          </span>
          <h2>{text.title}</h2>
          <button
            aria-label={lang === "en" ? "Close tour" : "ปิดทัวร์"}
            className="icon-btn tour-close"
            onClick={stopTour}
            type="button"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
        <p>{text.body}</p>
        <div className="tour-tooltip-foot">
          <span className="tour-progress">
            {tourStep + 1} / {TOUR_STEPS.length}
          </span>
          <div className="tour-nav">
            {tourStep > 0 && (
              <button className="tbtn" onClick={prevTourStep} type="button">
                <Icon name="arrow-left" size={15} />
                <span>{lang === "en" ? "Back" : "ก่อนหน้า"}</span>
              </button>
            )}
            {isLast ? (
              <button className="tbtn primary" onClick={stopTour} type="button">
                <span>{lang === "en" ? "Done" : "จบ"}</span>
              </button>
            ) : (
              <button
                className="tbtn primary"
                onClick={nextTourStep}
                type="button"
              >
                <span>{lang === "en" ? "Next" : "ถัดไป"}</span>
                <Icon name="arrow-right" size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
