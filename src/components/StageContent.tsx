/* StageContent.tsx — presentational content blocks, style-agnostic.
 * Reused by the desktop scroll overlays (PergolaReel) and the mobile stacked
 * sections (Sections). Visuals are driven by the parent wrapper's class. */
import { about, worksCopy, contact } from "../copy";
import { works } from "../data/works";
import { whatsappUrl, mailtoUrl, site } from "../config";

export function AboutContent() {
  return (
    <>
      <p className="eyebrow">{about.eyebrow}</p>
      <h2 className="block-title">{about.title}</h2>
      {about.body.map((p, i) => (
        <p key={i} className="block-p">
          {p}
        </p>
      ))}
      <ul className="spec-list" aria-label="יתרונות">
        {about.specs.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </>
  );
}

export function WorksContent() {
  return (
    <>
      <p className="eyebrow">{worksCopy.eyebrow}</p>
      <h2 className="block-title">{worksCopy.title}</h2>
      <div className="works__grid">
        {works.map((w, i) => (
          <figure className="work-card" key={i}>
            <div className="work-card__frame">
              <img src={w.src} alt={w.alt} loading="lazy" decoding="async" />
            </div>
            <figcaption className="work-card__cap">
              <span className="work-card__type">{w.type}</span>
              <span className="work-card__place">{w.place}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}

export function ContactContent() {
  return (
    <>
      <p className="eyebrow">{contact.eyebrow}</p>
      <h2 className="block-title">{contact.title}</h2>
      <p className="block-sub">{contact.sub}</p>
      <div className="contact__cta">
        <a className="btn btn--primary" href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              fill="currentColor"
              d="M17.5 14.4c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5 4.5.7.3 1.3.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3M12 21.5a9.4 9.4 0 0 1-4.8-1.3l-.3-.2-3.6.9.9-3.5-.2-.4A9.4 9.4 0 1 1 12 21.5m0-20.5A11 11 0 0 0 2.6 17.4L1 23l5.8-1.5A11 11 0 1 0 12 1"
            />
          </svg>
          {contact.whatsapp}
        </a>
        <a className="btn btn--ghost" href={mailtoUrl()}>
          {site.email}
        </a>
      </div>
      <p className="block-note">{contact.note}</p>
    </>
  );
}
