/* PergolaReel.tsx — IDB cinematic scroll-scrub (desktop).
 *
 * The WHOLE experience lives in one pinned stage. It starts DISASSEMBLED
 * (parts floating in mid-air, D) and as you scroll it ASSEMBLES into the
 * structure (D→C) and then FURNISHES (C→A), settling into a living scene.
 * The content — intro / מי אנחנו / עבודות / צור קשר — floats ON TOP as timed
 * overlays that fade in and out at their scroll windows.
 *
 * Frames from build-frames.sh at /seq/<seg>/. Requires gsap + ScrollTrigger.
 */
import { useEffect, useRef, useCallback, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AboutContent, WorksContent, ContactContent } from "./StageContent";
import { hero, stages, scrubLenPx } from "../copy";
import "../styles/reel.css";

gsap.registerPlugin(ScrollTrigger);

/* iOS/Android: the address bar collapsing on scroll fires resize events that
 * would re-measure (and visually jump) the pin — ignore them. */
ScrollTrigger.config({ ignoreMobileResize: true });

type Manifest = { count: number; w: number; h: number; ext: string; fps: number };

/* ---- frame loader (off-main-thread decode, lazy) ----
 * Coarse-to-fine fetch order (every 8th frame, then 4th, 2nd, rest) so the whole
 * motion is scrubbable within ~a second even on a cold load; onDecode fires per
 * decoded frame so the reel can repaint frames that arrive AFTER the user
 * scrolled (otherwise a mid-load scrub freezes on the nearest decoded frame).
 *
 * CRITICAL: returns a STABLE object and never calls setState. Any re-render here
 * would re-run the reel's effect, killing/re-creating the pinned ScrollTrigger —
 * and killing a pin collapses its spacer, which CLAMPS the user's scroll position
 * back to the top mid-scrub (the "assembly stays static / I got thrown back" bug). */
type SeqState = {
  frames: (ImageBitmap | null)[];
  man: Manifest | null;
  decoded: number;
  ready: boolean;
  loaded: boolean;
};

function useSequence(base: string, onDecode?: () => void) {
  const onDecodeRef = useRef(onDecode);
  onDecodeRef.current = onDecode;

  const apiRef = useRef<{
    state: SeqState;
    load: () => Promise<void>;
    drawIndex: (ctx: CanvasRenderingContext2D, idx: number) => void;
  } | null>(null);

  if (!apiRef.current) {
    const state: SeqState = { frames: [], man: null, decoded: 0, ready: false, loaded: false };
    const load = async () => {
      if (state.loaded) return;
      state.loaded = true;
      const m: Manifest = await fetch(`${base}/manifest.json`).then((r) => r.json());
      state.man = m;
      state.frames = new Array(m.count).fill(null);
      onDecodeRef.current?.(); // manifest known → canvases can be sized
      // coarse-to-fine order; frame 0 and the last (hold) frame first
      const order: number[] = [0, m.count - 1];
      const seen = new Set(order);
      for (const step of [8, 4, 2, 1])
        for (let i = 0; i < m.count; i += step)
          if (!seen.has(i)) {
            seen.add(i);
            order.push(i);
          }
      for (const idx of order) {
        const n = String(idx + 1).padStart(4, "0");
        fetch(`${base}/frame_${n}.${m.ext}`)
          .then((r) => r.blob())
          .then(createImageBitmap)
          .then((b) => {
            state.frames[idx] = b;
            state.decoded++;
            if (idx === 0) state.ready = true;
            onDecodeRef.current?.(); // repaint with the newly available frame
          })
          .catch(() => {});
      }
    };
    const drawIndex = (ctx: CanvasRenderingContext2D, idx: number) => {
      const m = state.man;
      if (!m) return;
      const i = Math.min(m.count - 1, Math.max(0, Math.round(idx)));
      const b = state.frames[i] ?? nearestDecoded(state.frames, i);
      if (b) ctx.drawImage(b, 0, 0, m.w, m.h);
    };
    apiRef.current = { state, load, drawIndex };
  }
  return apiRef.current;
}

function nearestDecoded(frames: (ImageBitmap | null)[], i: number): ImageBitmap | null {
  for (let d = 1; d < frames.length; d++) {
    if (frames[i - d]) return frames[i - d]!;
    if (frames[i + d]) return frames[i + d]!;
  }
  return frames.find(Boolean) ?? null;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ramp = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

/* ---- scrub timeline (progress 0..1 across the pinned stage) ----
 * Alternating BEATS so the build is never hidden behind content:
 *   animation beats run UNOBSTRUCTED; content panels appear only over HELD frames.
 *
 *   0.00–0.08  loop (people) + intro title
 *   0.08–0.12  dissolve loop → exploded D
 *   0.12–0.42  ★ ASSEMBLE D→C — clean, nothing on top
 *   0.42–0.56  hold structure C → panel: מי אנחנו
 *   0.56–0.74  ★ FURNISH C→A — clean
 *   0.74–0.88  hold furnished A → panel: עבודות
 *   0.88–1.00  dissolve → loop (people) → panel: צור קשר
 */
const T = {
  assembleStart: 0.12, // exploded D fully visible; start building here
  assembleEnd: 0.42, //   reaches structure C (last frame), then HOLDS under מי אנחנו
  furnishStart: 0.56, //  begins furnishing C
  furnishEnd: 0.74, //    reaches furnished A (last frame), then HOLDS under עבודות
};

// D (frame 0, exploded) → C (last frame, structure)
function assembleIndex(p: number, count: number) {
  const t = ramp(p, T.assembleStart, T.assembleEnd);
  return t * (count - 1);
}
// C (frame 0) → A (last frame, furnished)
function furnishIndex(p: number, count: number) {
  const t = ramp(p, T.furnishStart, T.furnishEnd);
  return t * (count - 1);
}

// overlay windows — content ONLY over held frames, never over a running build
const PANEL = {
  intro: (p: number) => 1 - ramp(p, 0.04, 0.09), // over the opening loop, fades as we scroll
  about: (p: number) => ramp(p, 0.43, 0.47) * (1 - ramp(p, 0.52, 0.56)), // over held structure C
  works: (p: number) => ramp(p, 0.75, 0.79) * (1 - ramp(p, 0.85, 0.89)), // over held furnished A
  contact: (p: number) => ramp(p, 0.9, 0.95), // over the returning loop
};

export default function PergolaReel({ tier }: { tier: "hq" | "lq" }) {
  const stage = useRef<HTMLDivElement>(null);
  const cAssemble = useRef<HTMLCanvasElement>(null);
  const cFurnish = useRef<HTMLCanvasElement>(null);
  const layAssemble = useRef<HTMLDivElement>(null);
  const layFurnish = useRef<HTMLDivElement>(null);
  const layLoop = useRef<HTMLDivElement>(null);
  const ovIntro = useRef<HTMLDivElement>(null);
  const ovAbout = useRef<HTMLDivElement>(null);
  const ovWorks = useRef<HTMLDivElement>(null);
  const ovContact = useRef<HTMLDivElement>(null);
  const railFill = useRef<HTMLDivElement>(null);
  const railDots = useRef<(HTMLLIElement | null)[]>([]);
  const hud = useRef<HTMLDivElement>(null);

  // repaint pipeline: frames that finish decoding AFTER the user scrolled must
  // still appear — schedule a repaint of the current progress via rAF.
  const progRef = useRef(0);
  const renderRef = useRef<(p: number) => void>(() => {});
  const rafId = useRef(0);
  const requestRender = useCallback(() => {
    if (rafId.current) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = 0;
      renderRef.current(progRef.current);
    });
  }, []);

  const assemble = useSequence(`/seq/${tier}/assemble`, requestRender);
  const furnish = useSequence(`/seq/${tier}/furnish`, requestRender);

  useEffect(() => {
    assemble.load();
    furnish.load();
  }, [assemble, furnish]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ctxA = cAssemble.current?.getContext("2d") ?? null;
    const ctxF = cFurnish.current?.getContext("2d") ?? null;

    // size canvases lazily — manifests arrive async, so fit runs inside render
    const fit = () => {
      const ma = assemble.state.man;
      const mf = furnish.state.man;
      if (ma && cAssemble.current && cAssemble.current.width !== ma.w) {
        cAssemble.current.width = ma.w;
        cAssemble.current.height = ma.h;
      }
      if (mf && cFurnish.current && cFurnish.current.width !== mf.w) {
        cFurnish.current.width = mf.w;
        cFurnish.current.height = mf.h;
      }
    };

    const setPanel = (ref: RefObject<HTMLDivElement>, op: number, interactive = false) => {
      const node = ref.current;
      if (!node) return;
      node.style.opacity = String(op);
      node.style.transform = `translateY(${(1 - op) * 22}px)`;
      node.style.pointerEvents = interactive && op > 0.5 ? "auto" : "none";
      node.style.visibility = op < 0.01 ? "hidden" : "visible";
    };

    const render = (p: number) => {
      fit();
      const ma = assemble.state.man;
      const mf = furnish.state.man;
      if (ctxA && ma) {
        ctxA.clearRect(0, 0, ma.w, ma.h);
        assemble.drawIndex(ctxA, assembleIndex(p, ma.count));
      }
      if (ctxF && mf) {
        ctxF.clearRect(0, 0, mf.w, mf.h);
        furnish.drawIndex(ctxF, furnishIndex(p, mf.count));
      }
      // debug HUD (open the site with ?debug)
      if (hud.current && ma)
        hud.current.textContent =
          `${tier} · p=${p.toFixed(3)} · frame=${Math.round(assembleIndex(p, ma.count)) + 1}/${ma.count}` +
          ` · asm ${assemble.state.decoded}/${ma.count} · fur ${furnish.state.decoded}/${mf?.count ?? "?"}`;
      // LOOP (people) is the bookend — plays at the very start and returns at the end
      if (layLoop.current)
        layLoop.current.style.opacity = String(Math.max(1 - ramp(p, 0.02, 0.08), ramp(p, 0.88, 0.97)));
      // exploded D → structure C, then HOLDS C under מי אנחנו before handing off to furnish
      if (layAssemble.current)
        layAssemble.current.style.opacity = String(ramp(p, 0.05, 0.11) * (1 - ramp(p, 0.54, 0.59)));
      // structure C → furnished A, HOLDS A under עבודות, then dissolves into the returning loop
      if (layFurnish.current)
        layFurnish.current.style.opacity = String(ramp(p, 0.52, 0.57) * (1 - ramp(p, 0.88, 0.94)));

      // timed content overlays
      setPanel(ovIntro, PANEL.intro(p));
      setPanel(ovAbout, PANEL.about(p));
      setPanel(ovWorks, PANEL.works(p));
      setPanel(ovContact, PANEL.contact(p), true);

      // progress rail
      if (railFill.current) railFill.current.style.transform = `scaleY(${clamp01(p)})`;
      railDots.current.forEach((d, i) => {
        if (d) d.classList.toggle("is-active", p >= stages[i].at - 0.03);
      });
    };

    renderRef.current = render;

    // Touch devices: take over native scrolling so the pin can't jitter or
    // rubber-band (iOS Safari async compositing + elastic overscroll).
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (touch) ScrollTrigger.normalizeScroll(true);

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: () => "+=" + scrubLenPx(),
      pin: true,
      scrub: 1.2,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        progRef.current = self.progress;
        render(self.progress);
      },
      onRefresh: (self) => {
        progRef.current = self.progress;
        render(self.progress);
      },
    });

    const onReady = () => {
      ScrollTrigger.refresh();
      requestRender();
    };
    const t = setInterval(() => {
      if (assemble.state.ready && furnish.state.ready) {
        clearInterval(t);
        onReady();
      }
    }, 100);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener("load", onReady);

    return () => {
      clearInterval(t);
      window.removeEventListener("load", onReady);
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = 0;
      if (touch) ScrollTrigger.normalizeScroll(false);
      st.kill();
    };
  }, [assemble, furnish, requestRender]);

  return (
    <section ref={stage} className="reel" aria-label="IDB — פרגולה נבנית מפירוק להרכבה מלאה">
      {/* LOOP (people) — the bookend: visible at rest, returns at the end */}
      <div ref={layLoop} className="layer layer--loop" style={{ opacity: 1 }}>
        <video className="cover" src="/seq/loop/loop.mp4" poster="/seq/loop/poster.webp" autoPlay muted loop playsInline />
      </div>
      {/* assemble layer — exploded D → structure C (poster prevents any black flash) */}
      <div ref={layAssemble} className="layer" style={{ opacity: 0 }}>
        <img className="cover poster" src={`/seq/${tier}/assemble/frame_0001.webp`} alt="" aria-hidden="true" />
        <canvas ref={cAssemble} className="cover c-assemble" aria-hidden="true" />
      </div>
      {/* furnish layer — structure C → furnished A */}
      <div ref={layFurnish} className="layer" style={{ opacity: 0 }}>
        <canvas ref={cFurnish} className="cover c-furnish" aria-hidden="true" />
      </div>

      <div className="reel-scrim" aria-hidden="true" />

      {/* ---- timed content overlays ---- */}
      <div ref={ovIntro} className="stage-panel panel--intro">
        <Signature />
        <div className="hero-copy">
          <p className="hero-mark" aria-hidden="true">{hero.mark}</p>
          <h1 className="hero-title">
            {hero.title[0]}
            <br />
            {hero.title[1]}
          </h1>
          <p className="hero-tag">{hero.tagline}</p>
        </div>
        <div className="scroll-cue" aria-hidden="true">
          <span>{hero.cue}</span>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M12 4v14M6 13l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div ref={ovAbout} className="stage-panel panel--about">
        <div className="panel-inner">
          <AboutContent />
        </div>
      </div>

      <div ref={ovWorks} className="stage-panel panel--works">
        <div className="panel-inner">
          <WorksContent />
        </div>
      </div>

      <div ref={ovContact} className="stage-panel panel--contact">
        <div className="panel-inner">
          <ContactContent />
        </div>
      </div>

      {/* debug HUD — open with ?debug */}
      {typeof window !== "undefined" && window.location.search.includes("debug") && (
        <div ref={hud} className="debug-hud" aria-hidden="true" />
      )}

      {/* ---- progress rail ---- */}
      <div className="stage-rail" aria-hidden="true">
        <div className="stage-rail__track">
          <div ref={railFill} className="stage-rail__fill" />
        </div>
        <ul className="stage-rail__labels">
          {stages.map((s, i) => (
            <li key={s.key} ref={(n) => { railDots.current[i] = n; }} className="stage-rail__dot">
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* architect signature — thin dimension lines + mono measures, fades with the intro */
function Signature() {
  return (
    <svg className="signature" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g className="sig-dim">
        <line x1="180" y1="470" x2="820" y2="470" />
        <line x1="180" y1="458" x2="180" y2="482" />
        <line x1="820" y1="458" x2="820" y2="482" />
      </g>
      <text className="sig-num" x="500" y="462" textAnchor="middle">6.0m</text>
      <g className="sig-dim">
        <line x1="856" y1="150" x2="856" y2="470" />
        <line x1="844" y1="150" x2="868" y2="150" />
        <line x1="844" y1="470" x2="868" y2="470" />
      </g>
      <text className="sig-num" x="884" y="315" transform="rotate(90 884 315)" textAnchor="middle">4.0m</text>
      <text className="sig-num sig-note" x="180" y="150">40mm · ארז</text>
    </svg>
  );
}
