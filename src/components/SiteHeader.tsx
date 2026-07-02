/* SiteHeader.tsx — fixed top bar. RTL: wordmark on the right, nav flows R→L.
 * In scrub mode the nav scrolls to a point on the pinned timeline; in stacked
 * (mobile) mode it jumps to the section anchor. */
import { useEffect, useState } from "react";
import { scrubLenPx } from "../copy";

const NAV = [
  { label: "מי אנחנו", anchor: "about", at: 0.47 },
  { label: "עבודות", anchor: "works", at: 0.79 },
  { label: "צור קשר", anchor: "contact", at: 0.93 },
];

export default function SiteHeader({ scrub }: { scrub: boolean }) {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (e: React.MouseEvent, item: (typeof NAV)[number]) => {
    if (!scrub) return; // let the anchor href handle stacked mode
    e.preventDefault();
    const top = scrubLenPx() * item.at;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <header className={"site-header" + (solid ? " is-solid" : "")}>
      <div className="site-header__inner wrap">
        <a href="#top" className="wordmark" aria-label="IDB — לראש הדף">IDB</a>
        <nav className="site-nav" aria-label="ניווט ראשי">
          {NAV.map((item) => (
            <a key={item.anchor} href={"#" + item.anchor} onClick={(e) => go(e, item)}>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
