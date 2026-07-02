import { useEffect, useState, type ReactElement } from "react";
import SiteHeader from "./components/SiteHeader";
import PergolaReel from "./components/PergolaReel";
import { StaticHero, About, Works, Contact, Footer } from "./components/Sections";
import { PrivacyPage, AccessibilityPage, TermsPage } from "./components/LegalPages";
import AccessibilityWidget from "./components/AccessibilityWidget";
import { pickTier, canScrub, type Tier } from "./tier";
import { motionReduced } from "./a11y";
import "./styles/sections.css";

/* Minimal path router (legal pages are separate views). Plain <a href> links do
 * a normal navigation; on a static host the SPA fallback serves index.html and
 * this reads the path on boot. */
const LEGAL: Record<string, () => ReactElement> = {
  "/privacy": PrivacyPage,
  "/accessibility": AccessibilityPage,
  "/terms": TermsPage,
};

/* The pinned scroll-scrub runs on desktop AND mobile. It is replaced by the
 * fully-accessible static stacked layout when the user asks for reduced motion
 * (OS setting OR the accessibility widget's "stop animations", which reloads),
 * forces ?static, or is on a very-low-memory device. Decided once at boot —
 * GSAP's pin rewrites the DOM, so we never live-swap the layout. */
function useMode() {
  const [mode, setMode] = useState<{ scrub: boolean; tier: Tier } | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const scrub = canScrub() && !motionReduced();
      const tier = scrub ? await pickTier() : "lq";
      if (alive) setMode({ scrub, tier });
    })();
    return () => {
      alive = false;
    };
  }, []);
  return mode;
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const mode = useMode();
  const LegalView = LEGAL[path];

  // the widget is available everywhere (legal pages too)
  const widget = <AccessibilityWidget />;

  if (LegalView)
    return (
      <>
        <LegalView />
        {widget}
      </>
    );

  if (!mode) return null; // avoid a flash of the wrong layout

  return (
    <>
      <a href="#top" className="skip-link">דלג לתוכן</a>
      <SiteHeader scrub={mode.scrub} />
      <main id="top">
        {mode.scrub ? (
          <PergolaReel tier={mode.tier} />
        ) : (
          <>
            <StaticHero />
            <About />
            <Works />
            <Contact />
          </>
        )}
      </main>
      <Footer />
      {widget}
    </>
  );
}
