import { useEffect, useState } from "react";
import SiteHeader from "./components/SiteHeader";
import PergolaReel from "./components/PergolaReel";
import { StaticHero, About, Works, Contact, Footer } from "./components/Sections";
import { pickTier, canScrub, type Tier } from "./tier";
import "./styles/sections.css";

/* The cinematic pinned scroll-scrub runs on ALL devices — desktop and mobile.
 * Quality tier (hq/lq) is picked by device + connection speed (src/tier.ts).
 * The static stacked layout remains only as a safety net: ?static override or
 * very-low-memory devices (navigator.deviceMemory ≤ 2GB). */
export default function App() {
  const [mode, setMode] = useState<{ scrub: boolean; tier: Tier } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const scrub = canScrub();
      const tier = scrub ? await pickTier() : "lq";
      if (alive) setMode({ scrub, tier });
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!mode) return null; // avoid a flash of the wrong layout

  return (
    <>
      <a href="#about" className="skip-link">דלג לתוכן</a>
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
    </>
  );
}
