/* SequenceCanvas.tsx — IDB pergola scrub
 *
 * Single pinned stage. Two scrubbed canvas layers (assemble, furnish) + one
 * ambient <video> bookend (loop). The scroll bar is the play head; nothing in the
 * scrub autoplays. Frame mapping matches BUILD_SPEC §3 & §5 (assemble is
 * ping-ponged: reverse = explode, forward = assemble).
 *
 * Requires: gsap + ScrollTrigger. Frames from build-frames.sh at /seq/<seg>/.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

type Manifest = { count: number; w: number; h: number; ext: string; fps: number };

/* ---- frame loader (off-main-thread decode, lazy) ---- */
export function useSequence(base: string) {
  const frames = useRef<(ImageBitmap | null)[]>([]);
  const man = useRef<Manifest | null>(null);
  const loaded = useRef(false);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    if (loaded.current) return;
    loaded.current = true;
    const m: Manifest = await fetch(`${base}/manifest.json`).then((r) => r.json());
    man.current = m;
    frames.current = new Array(m.count).fill(null);
    for (let i = 1; i <= m.count; i++) {
      const n = String(i).padStart(4, "0");
      fetch(`${base}/frame_${n}.${m.ext}`)
        .then((r) => r.blob())
        .then(createImageBitmap)
        .then((b) => {
          frames.current[i - 1] = b;
          if (i === 1) setReady(true);
        })
        .catch(() => {});
    }
  }, [base]);

  const unload = useCallback(() => {
    frames.current.forEach((b) => b?.close());
    frames.current = [];
    man.current = null;
    loaded.current = false;
    setReady(false);
  }, []);

  // draw by explicit frame index (we compute the index ourselves for ping-pong)
  const drawIndex = useCallback((ctx: CanvasRenderingContext2D, idx: number) => {
    const m = man.current;
    if (!m) return;
    const i = Math.min(m.count - 1, Math.max(0, Math.round(idx)));
    const b = frames.current[i] ?? frames.current.find(Boolean);
    if (b) ctx.drawImage(b, 0, 0, m.w, m.h);
  }, []);

  return { load, unload, drawIndex, ready, manifest: man };
}

/* ---- progress -> frame index, per BUILD_SPEC §5 ---- */
function assembleIndex(p: number, count: number) {
  const last = count - 1;
  if (p < 0.3) {
    // explode: C -> D (reverse)
    const t = clamp01((p - 0.06) / (0.3 - 0.06));
    return (1 - t) * last;
  }
  // assemble: D -> C (forward)
  const t = clamp01((p - 0.3) / (0.72 - 0.3));
  return t * last;
}
function furnishIndex(p: number, count: number) {
  const t = clamp01((p - 0.72) / (0.94 - 0.72));
  return t * (count - 1);
}
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
// smooth cross-dissolve ramp
const ramp = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

/* ---- the pinned reel ---- */
export default function PergolaReel() {
  const stage = useRef<HTMLDivElement>(null);
  const cAssemble = useRef<HTMLCanvasElement>(null);
  const cFurnish = useRef<HTMLCanvasElement>(null);
  const layAssemble = useRef<HTMLDivElement>(null);
  const layFurnish = useRef<HTMLDivElement>(null);
  const layLoop = useRef<HTMLDivElement>(null);

  const assemble = useSequence("/seq/assemble");
  const furnish = useSequence("/seq/furnish");

  useEffect(() => {
    assemble.load();
    furnish.load();
  }, [assemble, furnish]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;

    const ctxA = cAssemble.current?.getContext("2d") ?? null;
    const ctxF = cFurnish.current?.getContext("2d") ?? null;

    // size canvases to the manifest once ready
    const fit = () => {
      const ma = assemble.manifest.current;
      const mf = furnish.manifest.current;
      if (ma && cAssemble.current) {
        cAssemble.current.width = ma.w;
        cAssemble.current.height = ma.h;
      }
      if (mf && cFurnish.current) {
        cFurnish.current.width = mf.w;
        cFurnish.current.height = mf.h;
      }
    };

    const render = (p: number) => {
      const ma = assemble.manifest.current;
      const mf = furnish.manifest.current;
      if (ctxA && ma) {
        ctxA.clearRect(0, 0, ma.w, ma.h);
        assemble.drawIndex(ctxA, assembleIndex(p, ma.count));
      }
      if (ctxF && mf) {
        ctxF.clearRect(0, 0, mf.w, mf.h);
        furnish.drawIndex(ctxF, furnishIndex(p, mf.count));
      }
      // opacities (BUILD_SPEC §5)
      if (layLoop.current)
        layLoop.current.style.opacity = String(
          Math.max(1 - ramp(p, 0.0, 0.06), ramp(p, 0.94, 1.0))
        );
      if (layAssemble.current)
        layAssemble.current.style.opacity = String(
          ramp(p, 0.04, 0.08) * (1 - ramp(p, 0.72, 0.76))
        );
      if (layFurnish.current)
        layFurnish.current.style.opacity = String(
          ramp(p, 0.7, 0.74) * (1 - ramp(p, 0.94, 0.97))
        );
    };

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      // total scrub distance — assemble gets the most room, furnish less.
      end: "+=" + window.innerHeight * 6,
      pin: true,
      scrub: 1.5,
      onUpdate: (self) => render(self.progress),
      onRefresh: () => {
        fit();
        render(0);
      },
    });

    // refresh once first frames decode + fonts load
    const onReady = () => {
      fit();
      ScrollTrigger.refresh();
      render(0);
    };
    const t = setInterval(() => {
      if (assemble.ready && furnish.ready) {
        clearInterval(t);
        onReady();
      }
    }, 100);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      clearInterval(t);
      st.kill();
    };
  }, [assemble, furnish]);

  return (
    <section
      ref={stage}
      className="reel"
      style={{ position: "relative", height: "100vh", overflow: "hidden", background: "var(--ink)" }}
    >
      {/* ambient bookend video (NOT scrubbed) */}
      <div ref={layLoop} className="layer" style={LAYER}>
        <video
          src="/seq/loop/loop.mp4"
          poster="/seq/loop/poster.webp"
          autoPlay
          muted
          loop
          playsInline
          style={COVER}
        />
      </div>

      {/* scrubbed layers */}
      <div ref={layAssemble} className="layer" style={{ ...LAYER, opacity: 0 }}>
        <canvas ref={cAssemble} style={COVER} />
      </div>
      <div ref={layFurnish} className="layer" style={{ ...LAYER, opacity: 0 }}>
        <canvas ref={cFurnish} style={COVER} />
      </div>

      {/* hero overlay — wordmark + tagline live here; fade out on scroll if desired */}
      <div className="reel-overlay" style={OVERLAY}>
        {/* <IdbWordmark /> <h1>…</h1> <ScrollCue/> */}
      </div>
    </section>
  );
}

const LAYER: React.CSSProperties = { position: "absolute", inset: 0 };
const COVER: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };
const OVERLAY: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "flex-end",
  padding: "clamp(24px,6vw,80px)",
  pointerEvents: "none",
};
