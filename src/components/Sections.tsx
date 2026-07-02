/* Sections.tsx — mobile / reduced-motion fallback: a static hero followed by
 * stacked, readable sections. Same content blocks as the desktop overlays. */
import { AboutContent, WorksContent, ContactContent } from "./StageContent";
import { hero } from "../copy";
import { whatsappUrl, mailtoUrl, site } from "../config";

export function StaticHero() {
  // reduced-motion users get the still poster instead of the looping video (WCAG 2.2.2)
  const reduce =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <section className="reel reel--static" aria-label="IDB — פרגולות ודקים">
      <div className="layer layer--loop">
        {reduce ? (
          <img className="cover" src="/seq/loop/poster.webp" alt="פרגולת עץ מוארת בשעת בין הערביים עם פינת ישיבה" />
        ) : (
          <video className="cover" src="/seq/loop/loop.mp4" poster="/seq/loop/poster.webp" autoPlay muted loop playsInline />
        )}
      </div>
      <div className="reel-scrim" aria-hidden="true" />
      <div className="stage-panel panel--intro is-static">
        <div className="hero-copy">
          <p className="hero-mark" aria-hidden="true">{hero.mark}</p>
          <h1 className="hero-title">
            {hero.title[0]} {hero.title[1]}
          </h1>
          <p className="hero-tag">{hero.tagline}</p>
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section id="about" className="section sec sec--about" aria-labelledby="about-h">
      <div className="wrap block-narrow">
        <div id="about-h">
          <AboutContent />
        </div>
      </div>
    </section>
  );
}

export function Works() {
  return (
    <section id="works" className="section sec sec--works" aria-labelledby="works-h">
      <div className="wrap" id="works-h">
        <WorksContent />
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contact" className="section sec sec--contact" aria-labelledby="contact-h">
      <div className="wrap block-narrow center" id="contact-h">
        <ContactContent />
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__inner">
        <div className="site-footer__brand">
          <span className="wordmark wordmark--sm">IDB</span>
          <span className="site-footer__tag">פרגולות ודקים בהתאמה אישית</span>
        </div>
        {/* contact — always reachable (keyboard/screen-reader path to the CTA) */}
        <nav className="site-footer__contact" aria-label="יצירת קשר">
          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">וואטסאפ</a>
          <a href={mailtoUrl()}>{site.email}</a>
        </nav>
        {/* legal — required links, reachable from every view */}
        <nav className="site-footer__legal" aria-label="עמודים משפטיים">
          <a href="/privacy">מדיניות פרטיות</a>
          <a href="/accessibility">הצהרת נגישות</a>
          <a href="/terms">תנאי שימוש</a>
        </nav>
        <span className="site-footer__copy">
          © 2026 IDB · כל הזכויות שמורות
          <span className="site-footer__credit">נבנה ע״י E&amp;M STUDIO</span>
        </span>
      </div>
    </footer>
  );
}
