/* tier.ts — pick the frame-sequence quality by device + measured connection speed.
 *   hq — 24fps, 1600px (smoothest, heavy)
 *   lq — 12fps, 960px  (light)
 *
 * Decision order:
 *   1. URL override (?hq / ?lq) — always wins, for testing
 *   2. Phones → lq. Not a bandwidth call — a memory one: 242 decoded hq frames
 *      at 1600px ≈ 1.4GB of bitmaps, which kills mobile Safari tabs. lq at 960px
 *      is native-resolution for phone screens anyway.
 *   3. Save-Data / slow effective connection → lq
 *   4. Network Information API downlink (Chromium) → hq/lq by Mbps
 *   5. Timed probe (Firefox/Safari): download one small frame, measure real Mbps
 */
import { isSmallScreen } from "./copy";

export type Tier = "hq" | "lq";

const THRESHOLD_MBPS = 5;

export async function pickTier(): Promise<Tier> {
  const params = new URLSearchParams(window.location.search);
  if (params.has("hq")) return "hq";
  if (params.has("lq")) return "lq";

  if (isSmallScreen()) return "lq"; // phone memory budget (see header comment)

  // Network Information API — instant, Chromium-only
  const conn = (navigator as unknown as { connection?: { downlink?: number; effectiveType?: string; saveData?: boolean } }).connection;
  if (conn) {
    if (conn.saveData) return "lq"; // user asked to save data — respect it
    if (typeof conn.downlink === "number" && conn.downlink > 0) {
      const slowType = conn.effectiveType === "2g" || conn.effectiveType === "slow-2g" || conn.effectiveType === "3g";
      return conn.downlink >= THRESHOLD_MBPS && !slowType ? "hq" : "lq";
    }
  }

  // Fallback probe (Firefox/Safari): time a real ~40KB download
  try {
    const t0 = performance.now();
    const blob = await fetch("/seq/lq/assemble/frame_0001.webp", { cache: "no-store" }).then((r) => r.blob());
    const secs = Math.max((performance.now() - t0) / 1000, 0.001);
    const mbps = (blob.size * 8) / 1e6 / secs;
    return mbps >= THRESHOLD_MBPS ? "hq" : "lq";
  } catch {
    return "lq"; // can't measure → be safe
  }
}

/* very-low-memory devices get the static stacked layout instead of the scrub */
export function canScrub(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.has("static")) return false;
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  return !(typeof mem === "number" && mem <= 2);
}
