/* AccessibilityWidget.tsx — floating accessibility control panel (Hebrew, RTL).
 * Adapted from the israeli-web-compliance skill template to this project.
 * Controls: text size, high contrast, stop animations, highlight links — all
 * persisted to localStorage. A common Israeli expectation; it AUGMENTS the
 * in-code WCAG AA work (see /accessibility) and is not a legal substitute.
 *
 * "stop animations" also flips the site to the static layout via App (a CSS
 * rule cannot halt the JS-driven canvas scrub). */
import { useCallback, useEffect, useRef, useState } from "react";
import { type A11yState, A11Y_DEFAULT, A11Y_MAX_FONT, readA11y, writeA11y, applyA11y } from "../a11y";
import "../styles/a11y-widget.css";

const T = {
  open: "תפריט נגישות",
  title: "נגישות",
  text: "גודל טקסט",
  dec: "הקטן טקסט",
  inc: "הגדל טקסט",
  contrast: "ניגודיות גבוהה",
  motion: "עצירת אנימציות",
  links: "הדגשת קישורים",
  reset: "איפוס הגדרות",
  statement: "להצהרת הנגישות המלאה",
  close: "סגירה",
};

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<A11yState>(A11Y_DEFAULT);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const s = readA11y();
    setState(s);
    applyA11y(s);
  }, []);

  const update = useCallback((patch: Partial<A11yState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      applyA11y(next);
      writeA11y(next);
      // "stop animations" flips the whole layout (scrub ↔ static). GSAP's pin
      // moves DOM nodes outside React, so a live swap corrupts the tree — reload
      // instead: the preference is persisted and App re-decides cleanly on boot.
      if (patch.motion !== undefined && patch.motion !== prev.motion) window.location.reload();
      return next;
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const toggleRow = (label: string, on: boolean, onClick: () => void) => (
    <button type="button" className="a11yw__toggle" aria-pressed={on} onClick={onClick}>
      <span>{label}</span>
      <span className={"a11yw__sw" + (on ? " is-on" : "")} aria-hidden="true" />
    </button>
  );

  return (
    <div className="a11yw">
      <button
        ref={btnRef}
        type="button"
        className="a11yw__fab"
        aria-label={T.open}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="3.6" r="1.9" />
          <path d="M20 6.4c-2.4.9-5 1.4-8 1.4S6.4 7.3 4 6.4L3.4 8.3c1.9.7 3.9 1.2 5.9 1.4l-.7 4.2-1.7 6.4 2 .5 2-6.9h.2l2 6.9 2-.5-1.7-6.4-.7-4.2c2-.2 4-.7 5.9-1.4L20 6.4z" />
        </svg>
      </button>
      {open && (
        <div className="a11yw__panel" role="dialog" aria-label={T.title}>
          <div className="a11yw__head">
            <strong>{T.title}</strong>
            <button type="button" className="a11yw__x" aria-label={T.close} onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>
          <div className="a11yw__row a11yw__row--text">
            <span>{T.text}</span>
            <div className="a11yw__steps">
              <button type="button" aria-label={T.dec} disabled={state.font <= 0} onClick={() => update({ font: Math.max(0, state.font - 1) })}>
                A−
              </button>
              <span className="a11yw__level" aria-hidden="true">{state.font}</span>
              <button type="button" aria-label={T.inc} disabled={state.font >= A11Y_MAX_FONT} onClick={() => update({ font: Math.min(A11Y_MAX_FONT, state.font + 1) })}>
                A+
              </button>
            </div>
          </div>
          {toggleRow(T.contrast, state.contrast, () => update({ contrast: !state.contrast }))}
          {toggleRow(T.motion, state.motion, () => update({ motion: !state.motion }))}
          {toggleRow(T.links, state.links, () => update({ links: !state.links }))}
          <button type="button" className="a11yw__reset" onClick={() => update(A11Y_DEFAULT)}>
            {T.reset}
          </button>
          <a className="a11yw__statement" href="/accessibility" onClick={() => setOpen(false)}>
            {T.statement}
          </a>
        </div>
      )}
    </div>
  );
}
