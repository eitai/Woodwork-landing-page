/* Mobile verification — the full scrub experience on phone-sized touch devices.
 * Runs twice: Chromium (Android-like) and WebKit (the actual Safari engine).
 * Checks: scrub mode active, lq tier auto-picked, pin holds, SCREEN animates,
 * panels at holds, loop bookends, tap targets. */
import { chromium, webkit, devices } from "playwright";
import { mkdirSync } from "node:fs";

const URL = process.env.URL || "http://localhost:5181/";
const OUT = "./_verify";
mkdirSync(OUT, { recursive: true });

const MOBILE_VH = 7; // must match copy.ts SCRUB_VH_MOBILE
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const iphone = devices["iPhone 13"];

async function imageVec(page, url) {
  return page.evaluate(async ([u, gw, gh]) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = u; });
    const off = document.createElement("canvas"); off.width = gw; off.height = gh;
    const g = off.getContext("2d"); g.drawImage(img, 0, 0, gw, gh);
    const d = g.getImageData(0, 0, gw, gh).data; const v = [];
    for (let i = 0; i < d.length; i += 4) v.push(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]);
    return v;
  }, [url, 36, 48]);
}
const mad = (a, b) => { if (!a || !b) return 255; let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; };

async function runEngine(label, browserType, launchOpts) {
  console.log(`\n===== ${label} =====`);
  const results = [];
  const check = (name, pass, detail) => { results.push(pass); console.log(`${pass ? "PASS" : "FAIL"}  ${name}  ${detail ?? ""}`); };
  const b = await browserType.launch(launchOpts);
  const ctx = await b.newContext({ ...iphone });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));

  await p.goto(URL + "?debug", { waitUntil: "networkidle" });
  await sleep(4500);
  const vh = await p.evaluate(() => window.innerHeight);
  const scrollTo = async (prog) => {
    await p.evaluate(([y]) => window.scrollTo({ top: y, behavior: "instant" }), [prog * vh * MOBILE_VH]);
    await sleep(1900); // scrub easing settle
  };
  const opacity = (sel) => p.evaluate((s) => { const el = document.querySelector(s); return el ? parseFloat(getComputedStyle(el).opacity) : null; }, sel);
  const reelTop = () => p.evaluate(() => Math.round(document.querySelector(".reel").getBoundingClientRect().top));
  // screen sampling below the debug HUD (clip avoids header + HUD text noise)
  const screenVec = async () => {
    const buf = await p.screenshot({ clip: { x: 10, y: 150, width: 370, height: 440 } });
    return imageVec(p, "data:image/png;base64," + buf.toString("base64"));
  };

  // 1. scrub mode + auto lq tier on a phone
  const hud = await p.evaluate(() => document.querySelector(".debug-hud")?.textContent ?? "");
  check("mobile runs the SCRUB (not static fallback)", await p.evaluate(() => !!document.querySelector(".c-assemble")), `canvas=${await p.evaluate(() => !!document.querySelector(".c-assemble"))}`);
  check("tier auto-picked = lq (phone memory budget)", hud.startsWith("lq"), JSON.stringify(hud));
  check("rest: loop visible", (await opacity(".layer--loop")) === 1, `loopOp=${await opacity(".layer--loop")}`);
  await p.screenshot({ path: `${OUT}/m_${label}_rest.png` });

  // 2. pin holds mid-scrub
  await scrollTo(0.3);
  const t1 = await reelTop();
  check("pin holds mid-scrub", Math.abs(t1) <= 6, `reelTop=${t1}`);

  // 3. SCREEN animates across the build beat
  const s18 = (await scrollTo(0.18), await screenVec());
  const s30 = (await scrollTo(0.3), await screenVec());
  await p.screenshot({ path: `${OUT}/m_${label}_build.png` });
  const s40 = (await scrollTo(0.4), await screenVec());
  check("SCREEN animates across build beat", mad(s18, s30) > 2 && mad(s30, s40) > 2, `Δ1=${mad(s18, s30).toFixed(1)} Δ2=${mad(s30, s40).toFixed(1)}`);

  // 4. content panels at their holds
  await scrollTo(0.49);
  check("מי אנחנו panel at hold", (await opacity(".panel--about")) > 0.5, `op=${await opacity(".panel--about")}`);
  await p.screenshot({ path: `${OUT}/m_${label}_about.png` });
  await scrollTo(0.81);
  check("עבודות panel at hold", (await opacity(".panel--works")) > 0.5, `op=${await opacity(".panel--works")}`);
  await p.screenshot({ path: `${OUT}/m_${label}_works.png` });
  await scrollTo(0.97);
  check("צור קשר + loop returns at end", (await opacity(".panel--contact")) > 0.5 && (await opacity(".layer--loop")) > 0.6, `contact=${await opacity(".panel--contact")} loop=${await opacity(".layer--loop")}`);
  await p.screenshot({ path: `${OUT}/m_${label}_contact.png` });

  // 5. WhatsApp tap target ≥ 44px (Apple HIG)
  const btnH = await p.evaluate(() => Math.round(document.querySelector(".btn--primary")?.getBoundingClientRect().height ?? 0));
  check("WhatsApp tap target ≥ 44px", btnH >= 44, `h=${btnH}px`);

  // 6. release after end
  await p.evaluate(([y]) => window.scrollTo({ top: y, behavior: "instant" }), [(MOBILE_VH + 1.5) * vh]);
  await sleep(1200);
  check("pin releases after end", (await reelTop()) < -50, `topAfter=${await reelTop()}`);

  check("no page errors", errs.length === 0, errs.slice(0, 3).join(" | ") || "clean");
  await b.close();
  const passed = results.filter(Boolean).length;
  console.log(`${label}: ${passed}/${results.length} passed`);
  return passed === results.length;
}

const okChromium = await runEngine("chromium", chromium, { channel: "chrome", headless: true });
const okWebkit = await runEngine("webkit", webkit, { headless: true });
console.log(`\nTOTAL: chromium=${okChromium ? "OK" : "FAIL"} webkit=${okWebkit ? "OK" : "FAIL"}`);
process.exit(okChromium && okWebkit ? 0 : 1);
