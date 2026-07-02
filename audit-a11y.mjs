/* Accessibility audit (axe-core, WCAG 2.0 A+AA) at several scrub positions and
 * on the static + legal views. Automated only — manual keyboard/SR still required. */
import { chromium, devices } from "playwright";
import { readFileSync } from "node:fs";

const URL = process.env.URL || "http://localhost:5181/";
const axeSrc = readFileSync("./node_modules/axe-core/axe.min.js", "utf8");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(page, label) {
  await page.evaluate(axeSrc);
  const res = await page.evaluate(async () => {
    return await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } });
  });
  const v = res.violations;
  console.log(`\n=== ${label} — ${v.length} violation(s) ===`);
  for (const x of v) {
    console.log(`  [${x.impact}] ${x.id}: ${x.help}  (${x.nodes.length} node${x.nodes.length > 1 ? "s" : ""})`);
    for (const n of x.nodes.slice(0, 3)) console.log(`      → ${n.target.join(" ")}  ${(n.failureSummary || "").replace(/\n/g, " ")}`.slice(0, 200));
  }
  return v;
}

const b = await chromium.launch({ channel: "chrome", headless: true });
let total = 0;

// desktop scrub, sampled at the content holds
const d = await b.newContext({ viewport: { width: 1440, height: 900 } }).then((c) => c.newPage());
await d.goto(URL + "?hq", { waitUntil: "networkidle" });
await sleep(3500);
total += (await run(d, "scrub @rest")).length;
for (const [p, name] of [[0.49, "about hold"], [0.81, "works hold"], [0.98, "contact hold"]]) {
  await d.evaluate((pr) => window.scrollTo({ top: pr * innerHeight * 9, behavior: "instant" }), p);
  await sleep(1800);
  total += (await run(d, `scrub @${name}`)).length;
}

// static/stacked (reduced-motion path)
const s = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }).then((c) => c.newPage());
await s.goto(URL, { waitUntil: "networkidle" });
await sleep(2500);
total += (await run(s, "static (reduced-motion)")).length;

// mobile
const m = await b.newContext({ ...devices["iPhone 13"] }).then((c) => c.newPage());
await m.goto(URL, { waitUntil: "networkidle" });
await sleep(3000);
total += (await run(m, "mobile scrub @rest")).length;

// legal pages (if routing is live)
for (const path of ["privacy", "accessibility", "terms"]) {
  try {
    await d.goto(URL + path, { waitUntil: "networkidle" });
    await sleep(800);
    if (await d.$(".legal")) total += (await run(d, `/${path}`)).length;
    else console.log(`\n(/${path} not routed yet — skipped)`);
  } catch { console.log(`\n(/${path} unavailable — skipped)`); }
}

await b.close();
console.log(`\nTOTAL violations across views: ${total}`);
process.exit(total === 0 ? 0 : 1);
