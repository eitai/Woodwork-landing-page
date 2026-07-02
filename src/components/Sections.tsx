/* Sections.tsx — mobile / reduced-motion fallback: a static hero followed by
 * stacked, readable sections. Same content blocks as the desktop overlays. */
import { AboutContent, WorksContent, ContactContent } from "./StageContent";
import { hero } from "../copy";

export function StaticHero() {
  return (
    <section className="reel reel--static" aria-label="IDB — פרגולות ודקים">
      <div className="layer layer--loop">
        <video className="cover" src="/seq/loop/loop.mp4" poster="/seq/loop/poster.webp" autoPlay muted loop playsInline />
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
        <span className="wordmark wordmark--sm">IDB</span>
        <span className="site-footer__tag">פרגולות ודקים בהתאמה אישית</span>
        <span className="site-footer__copy">© 2026 IDB · כל הזכויות שמורות</span>
      </div>
    </footer>
  );
}
