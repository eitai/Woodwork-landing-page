/* Headless verification of the cinematic all-in-hero scrub.
 * Beat map: LOOP (people) → exploded D → ★ASSEMBLE (unobstructed) → hold C + מי אנחנו
 *           → ★FURNISH (unobstructed) → hold A + עבודות → LOOP returns + צור קשר.
 * Key guarantee: content panels NEVER cover a running build beat. */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const URL = process.env.URL || "http://localhost:5181/";
const OUT = process.env.OUT || "./_verify";
mkdirSync(OUT, { recursive: true });

const SCRUB_VH = 9; // must match copy.ts SCRUB_VH
const GW = 64, GH = 36;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function canvasVec(page, selector) {
  return page.evaluate(([sel, gw, gh]) => {
    const c = document.querySelector(sel);
    if (!c || !c.width) return null;
    const off = document.createElement("canvas");
    off.width = gw; off.height = gh;
    const g = off.getContext("2d");
    g.drawImage(c, 0, 0, gw, gh);
    const d = g.getImageData(0, 0, gw, gh).data;
    const v = []; let lum = 0;
    for (let i = 0; i < d.length; i += 4) { const y = 0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]; v.push(y); lum += y; }
    return { v, lum: lum / v.length };
  }, [selector, GW, GH]);
}
async function imageVec(page, url) {
  return page.evaluate(async ([u, gw, gh]) => {
    const img = new Image(); img.crossOrigin = "anonymous";
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = u; });
    const off = document.createElement("canvas"); off.width = gw; off.height = gh;
    const g = off.getContext("2d"); g.drawImage(img, 0, 0, gw, gh);
    const d = g.getImageData(0, 0, gw, gh).data; const v = [];
    for (let i = 0; i < d.length; i += 4) v.push(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]);
    return v;
  }, [url, GW, GH]);
}
const mad = (a, b) => { const va = a?.v ?? a, vb = b?.v ?? b; if (!va || !vb) return 255; let s = 0; for (let i = 0; i < va.length; i++) s += Math.abs(va[i] - vb[i]); return s / va.length; };

async function settleAt(page, p, sel) {
  await page.evaluate(([p, vh]) => window.scrollTo(0, p * window.innerHeight * vh), [p, SCRUB_VH]);
  let prev = null, stable = 0;
  for (let i = 0; i < 24; i++) {
    await sleep(250);
    const s = await canvasVec(page, sel);
    if (s && prev && mad(s, prev) < 1.5) { if (++stable >= 2) return s; } else stable = 0;
    prev = s;
  }
  return prev || {};
}
async function scrollTo(page, p) {
  await page.evaluate(([p, vh]) => window.scrollTo(0, p * window.innerHeight * vh), [p, SCRUB_VH]);
  await sleep(1800);
}
const reelTop = (page) => page.evaluate(() => Math.round(document.querySelector(".reel").getBoundingClientRect().top));
const opacity = (page, sel) => page.evaluate((s) => { const el = document.querySelector(s); return el ? parseFloat(getComputedStyle(el).opacity) : null; }, sel);

const results = [];
const check = (name, pass, detail) => { results.push({ name, pass }); console.log(`${pass ? "PASS" : "FAIL"}  ${name}  ${detail ?? ""}`); };

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newContext({ viewport: { width: 1440, height: 900 } }).then((c) => c.newPage());
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

await page.goto(URL + "?hq&debug", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts?.ready);
await sleep(4500);

const ASM = ".c-assemble", FUR = ".c-furnish";
// manifest-driven frame refs (hq has 121 frames — last frame is not 0061!)
const manA = await (await fetch(`${URL}seq/hq/assemble/manifest.json`)).json();
const manF = await (await fetch(`${URL}seq/hq/furnish/manifest.json`)).json();
const fname = (i) => `frame_${String(i).padStart(4, "0")}.webp`;
const parts = await imageVec(page, `${URL}seq/hq/assemble/${fname(1)}`);            // D exploded
const struct = await imageVec(page, `${URL}seq/hq/assemble/${fname(manA.count)}`);  // C structure
const furnEmpty = await imageVec(page, `${URL}seq/hq/furnish/${fname(1)}`);         // C
const furnFull = await imageVec(page, `${URL}seq/hq/furnish/${fname(manF.count)}`); // A furnished
console.log(`manifests: assemble ${manA.count}f @${manA.fps}fps ${manA.w}px · furnish ${manF.count}f @${manF.fps}fps`);
check("smooth: hq has every native frame (≥100 @24fps)", manA.count >= 100 && manA.fps === 24 && manF.count >= 100, `asm=${manA.count}@${manA.fps} fur=${manF.count}@${manF.fps}`);
// lq tier exists for slow connections
const manLq = await (await fetch(`${URL}seq/lq/assemble/manifest.json`)).json();
check("tier: lq fallback exists (960px)", manLq.count > 0 && manLq.w <= 1000, `lq=${manLq.count}f ${manLq.w}px`);

// --- 1. rest: LOOP (people) plays, intro visible ---
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(700);
check("rest: LOOP (people) visible first", (await opacity(page, ".layer--loop")) === 1, `loopOp=${await opacity(page, ".layer--loop")}`);
check("rest: intro overlay visible", (await opacity(page, ".panel--intro")) > 0.9, `introOp=${await opacity(page, ".panel--intro")}`);
await page.screenshot({ path: `${OUT}/s0_loop_rest.png` });

// --- 2. pin ---
await page.evaluate(() => window.scrollTo(0, window.innerHeight * 4));
await sleep(500);
const tMid = await reelTop(page);
check("pin: reel fixed mid-scrub", Math.abs(tMid) <= 6, `top@4vh=${tMid}`);
await page.evaluate((vh) => window.scrollTo({ top: window.innerHeight * (vh + 2), behavior: "instant" }), SCRUB_VH);
await sleep(1200);
check("pin: releases after end", (await reelTop(page)) < -50, `topAfter=${await reelTop(page)}`);

// --- 3. exploded handoff (~0.13) ---
const cExpl = await settleAt(page, 0.13, ASM);
check("handoff@0.13: loop gone, canvas = EXPLODED (D)", (await opacity(page, ".layer--loop")) < 0.05 && mad(cExpl, parts) < mad(cExpl, struct) - 0.5, `loopOp=${await opacity(page, ".layer--loop")} mad(parts)=${mad(cExpl,parts).toFixed(1)} mad(struct)=${mad(cExpl,struct).toFixed(1)}`);
await page.screenshot({ path: `${OUT}/s1_exploded.png` });

// --- 4. ★ ASSEMBLE beat is UNOBSTRUCTED and actually animates ON SCREEN ---
// screenVec: what the USER SEES (screenshot pixels), not canvas internals —
// a canvas can animate underneath an overlapping element and hash checks
// on the canvas alone will lie ("all frames look the same" bug).
const CLIP = { x: 240, y: 100, width: 960, height: 700 }; // center of stage, avoids header/rail/cue
const screenVec = async () => {
  const buf = await page.screenshot({ clip: CLIP });
  return imageVec(page, "data:image/png;base64," + buf.toString("base64"));
};
const beatPts = [0.18, 0.27, 0.36];
const beatVecs = [];
const beatScreens = [];
for (const bp of beatPts) {
  beatVecs.push(await settleAt(page, bp, ASM));
  beatScreens.push(await screenVec());
  const aboutOp = await opacity(page, ".panel--about");
  const worksOp = await opacity(page, ".panel--works");
  check(`build beat@${bp}: NO panel covering the build`, aboutOp < 0.05 && worksOp < 0.05, `aboutOp=${aboutOp} worksOp=${worksOp}`);
}
check("build beat: canvas ANIMATES across 0.18→0.27→0.36", mad(beatVecs[0], beatVecs[1]) > 2 && mad(beatVecs[1], beatVecs[2]) > 2, `Δ1=${mad(beatVecs[0],beatVecs[1]).toFixed(1)} Δ2=${mad(beatVecs[1],beatVecs[2]).toFixed(1)}`);
check("build beat: SCREEN pixels change across 0.18→0.27→0.36", mad(beatScreens[0], beatScreens[1]) > 2 && mad(beatScreens[1], beatScreens[2]) > 2, `Δscreen1=${mad(beatScreens[0],beatScreens[1]).toFixed(1)} Δscreen2=${mad(beatScreens[1],beatScreens[2]).toFixed(1)}`);
await page.screenshot({ path: `${OUT}/s2_mid_assemble.png` });

// --- 5. hold C + מי אנחנו ---
const cHold = await settleAt(page, 0.49, ASM);
check("hold@0.49: canvas = structure (C)", mad(cHold, struct) < mad(cHold, parts) - 1, `mad(struct)=${mad(cHold,struct).toFixed(1)} mad(parts)=${mad(cHold,parts).toFixed(1)}`);
// the SCREEN must show the built structure too — not a poster stuck on exploded
const holdScreen = await screenVec();
check("hold@0.49: SCREEN closer to structure than to exploded", mad(holdScreen, struct) < mad(holdScreen, parts), `madS(struct)=${mad(holdScreen,struct).toFixed(1)} madS(parts)=${mad(holdScreen,parts).toFixed(1)}`);
check("hold@0.49: מי אנחנו panel over held frame", (await opacity(page, ".panel--about")) > 0.5, `aboutOp=${await opacity(page, ".panel--about")}`);
await page.screenshot({ path: `${OUT}/s3_about_hold.png` });

// --- 6. furnish beat clean + reaches A ---
await scrollTo(page, 0.65);
check("furnish beat@0.65: no panel covering", (await opacity(page, ".panel--about")) < 0.05 && (await opacity(page, ".panel--works")) < 0.05, `aboutOp=${await opacity(page, ".panel--about")} worksOp=${await opacity(page, ".panel--works")}`);
const cFurn = await settleAt(page, 0.74, FUR);
check("furnish@0.74 = furnished (A)", mad(cFurn, furnFull) < mad(cFurn, furnEmpty) - 1, `mad(full)=${mad(cFurn,furnFull).toFixed(1)} mad(empty)=${mad(cFurn,furnEmpty).toFixed(1)}`);

// --- 7. hold A + עבודות ---
await scrollTo(page, 0.81);
check("hold@0.81: עבודות panel over held furnished frame", (await opacity(page, ".panel--works")) > 0.5, `worksOp=${await opacity(page, ".panel--works")}`);
await page.screenshot({ path: `${OUT}/s4_works_hold.png` });

// --- 8. loop returns + צור קשר ---
await scrollTo(page, 0.99);
check("end: LOOP (people) returns", (await opacity(page, ".layer--loop")) > 0.8, `loopOp=${await opacity(page, ".layer--loop")}`);
check("end: צור קשר visible", (await opacity(page, ".panel--contact")) > 0.5, `contactOp=${await opacity(page, ".panel--contact")}`);
await page.screenshot({ path: `${OUT}/s5_loop_contact.png` });

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
