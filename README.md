# IDB — פרגולות ודקים (scroll-scrub site)

אתר תדמית ל-IDB. **כל האתר הוא Hero אחד** — stage מוצמד (pinned) של scroll-scrub:
מתחילים ב**פירוק** (חלקים צפים באוויר), וככל שגוללים הפרגולה **מתרכבת** ואז **מתרהטת**
ומתמלאת בחיים. התוכן (מי אנחנו / עבודות / צור קשר) **צף מעל** כ-overlays שמופיעים
ונעלמים לפי מיקום הגלילה. במובייל / `prefers-reduced-motion` → hero סטטי + סקשנים נערמים.
Stack: **Vite + React + TypeScript + GSAP ScrollTrigger + canvas frame-scrub**, עברית RTL.

זמני הגלילה (progress 0..1): פירוק→הרכבה `0.08–0.55`, ריהוט `0.55–0.85`, סצנת חיים `0.90–1.0`.
Overlays: intro `0–0.10`, מי אנחנו `0.13–0.35`, עבודות `0.40–0.63`, צור קשר `0.80–1.0`.
לכוונון — `T` ו-`PANEL` ב-`src/components/PergolaReel.tsx`, ו-`SCRUB_VH` ב-`src/copy.ts`.

## הרצה

```bash
npm install
npm run dev        # פיתוח
npm run build      # בנייה ל-dist/
npm run preview    # תצוגת ה-build
npm run verify     # בדיקת headless של ה-Hero (Playwright + Chrome מערכת)
```

## פייפליין ה-frames

הקליפים (3) יושבים ב-`clips/`. `build-frames.sh` מחלץ frames+manifest לסגמנטים המ-scrub-ים
ו-poster/loop ל-bookend:

```bash
./build-frames.sh ./clips ./public/seq
```

תוצאה ב-`public/seq/`:
- `assemble/` — frames + `manifest.json` (פיצוץ↔הרכבה, ping-pong)
- `furnish/` — frames + `manifest.json` (ריהוט נכנס)
- `loop/loop.mp4` + `poster.webp` (וידאו ה-bookend, לא עובר scrub)

> **שים לב — שני הקליפים היו שמורים בשמות מוחלפים.** התוכן שהתגלה:
> `1_assembly.mp4` הכיל בפועל את צילום ה-**furnish** (מבנה ריק → מרוהט), ו-`2_furnish.mp4`
> הכיל את צילום ה-**assembly** (חלקים צפים באוויר → מבנה). כדי שהסגמנטים יתאימו לתוכן
> (assemble = חלקים צפים, לפי §5 ב-BUILD_SPEC) — **החלפתי בין שני הקבצים ב-`clips/`.**
> אם תוריד אותם מחדש מ-Higgsfield, ודא שהתוכן תואם לשם (או פשוט החלף שוב).

`ffprobe` ב-ffmpeg 8.x דחה את `-of csv=...:s=' '` (מפריד רווח); תיקנתי את השורה ל-`s=x`+`tr`.

## מה למלא לפני עלייה לאוויר

`src/config.ts`:
- `whatsapp` — מספר וואטסאפ מלא (`972...`), כרגע `972XXXXXXXXX`.
- `email` — כתובת מייל, כרגע `info@idb.co.il`.

`src/data/works.ts` — גלריית "עבודות שלנו". כרגע placeholder-ים (frames מהקליפים ב-`public/works/`).
כשמגיעות תמונות אמת: החלף `src`/`alt`/`type`/`place` באותו מבנה.

## מבנה

- `src/components/PergolaReel.tsx` — החוויה כולה (desktop): stage מוצמד, שתי canvas layers
  (assemble D→C, furnish C→A) + loop video לסיום, overlays מתוזמנים, ו-progress rail.
- `src/components/StageContent.tsx` — בלוקי התוכן (מי אנחנו / עבודות / צור קשר), משותפים
  לגרסת ה-overlay ולגרסה הנערמת.
- `src/components/Sections.tsx` — hero סטטי + סקשנים נערמים (מובייל / reduced-motion) + footer.
- `src/components/SiteHeader.tsx` — לוגו + ניווט (גולל למיקום ה-stage המתאים בגרסת ה-scrub).
- `src/copy.ts` — כל הטקסטים + `SCRUB_VH` + שלבי ה-rail. `src/data/works.ts` — הגלריה. `src/config.ts` — יצירת קשר.
- `src/styles/` — `global.css` (tokens), `reel.css` (stage + overlays + rail), `sections.css` (נערם + header/footer).

## הערות ביצועים

- ה-scrub עובד רק בדסקטופ. frames נטענים lazy ומפוענחים ב-`createImageBitmap` (off-main-thread).
- ה-frames מחולצים ב-`WIDTH=1600` (ראש `build-frames.sh`). זהו הכפתור העיקרי לזיכרון/משקל —
  אפשר להוריד ל-1280 כדי להקל על מכשירים חלשים, במחיר חדות קלה.
