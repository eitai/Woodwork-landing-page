/* a11y.ts — shared state for the accessibility widget.
 * The widget augments (does NOT replace) the in-code WCAG AA work.
 * "motion off" here + prefers-reduced-motion both switch the site to the static,
 * fully-accessible layout (CSS can't stop the JS-driven scrub — App gates on this). */

export type A11yState = { font: number; contrast: boolean; motion: boolean; links: boolean };
export const A11Y_KEY = "idb.a11y";
export const A11Y_DEFAULT: A11yState = { font: 0, contrast: false, motion: false, links: false };
export const A11Y_MAX_FONT = 2;

export function readA11y(): A11yState {
  try {
    const raw = localStorage.getItem(A11Y_KEY);
    if (raw) return { ...A11Y_DEFAULT, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return A11Y_DEFAULT;
}

export function writeA11y(s: A11yState) {
  try {
    localStorage.setItem(A11Y_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function applyA11y(s: A11yState) {
  const r = document.documentElement;
  r.setAttribute("data-a11y-font", String(s.font));
  s.contrast ? r.setAttribute("data-a11y-contrast", "on") : r.removeAttribute("data-a11y-contrast");
  s.motion ? r.setAttribute("data-a11y-motion", "off") : r.removeAttribute("data-a11y-motion");
  s.links ? r.setAttribute("data-a11y-links", "on") : r.removeAttribute("data-a11y-links");
}

/* true when the user asked for reduced motion via the OS OR the widget toggle */
export function motionReduced(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches || readA11y().motion;
}
