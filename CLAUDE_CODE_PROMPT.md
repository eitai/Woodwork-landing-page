# CLAUDE_CODE_PROMPT — אתר IDB (פרגולות ודקים) עם scroll-scrub

בנה אתר תדמית ל-**IDB** (בניית פרגולות ודקים) באותו stack ובאותן קונבנציות של אתר התדמית / אתר המוזיקה שלי: **Vite + React + TypeScript + GSAP ScrollTrigger + canvas scroll-scrub**, עברית RTL.
קרא את `BUILD_SPEC.md` — הוא מקור האמת. השתמש ב-`SequenceCanvas.tsx` (מצורף) ל-Hero. אל תמציא מחדש את מנוע ה-scrub.

## שלב 0 — frames
המשתמש הוריד 3 קליפים ל-`clips/`: `0_loop.mp4`, `1_assembly.mp4`, `2_furnish.mp4`.
הרץ `./build-frames.sh ./clips ./public/seq`. ודא:
- `public/seq/assemble/` — frames + manifest.json
- `public/seq/furnish/` — frames + manifest.json
- `public/seq/loop/loop.mp4` + `poster.webp`
אל תמשיך עד שכל תיקייה מלאה (הסקריפט מדפיס ספירה).

## שלב 1 — Hero (de-risk לפי הסקיל)
1. הכנס את `SequenceCanvas.tsx` כ-Hero. הוכח קודם **סגמנט אחד** (`assemble`): ה-pin נאחז, scrub לשני הכיוונים (הפוך=פיצוץ, ישר=הרכבה), poster מיידי בלי הבזק שחור.
2. הוסף `furnish` + cross-dissolve.
3. חבר את וידאו הלופ בקצוות (dissolve in/out), לפי §5.
בדוק את מלכודות ה-pin מהסקיל: אין `overflow:hidden` על html/body/#root; אין `transform/filter` על אב של ה-stage; `ScrollTrigger.refresh()` אחרי טעינת פונטים ו-frames.

## שלב 2 — Overlay של ה-Hero
ב-`reel-overlay`: לוגו **IDB** (wordmark) בימין, כותרת גדולה ב-Frank Ruhl Libre + טאגליין, וחץ "גלול". הכותרת נעלמת בעדינות כשמתחילים לגלול (opacity לפי progress). טאגליין הצעה: **"מהשרטוט ועד הצל."** (או נסח 2 חלופות ותן לי לבחור.)

## שלב 3 — סקשנים (עברית RTL)
- **מי אנחנו** — כותרת "בונים לכם את החוץ." 2–3 פסקאות: IDB בונים פרגולות ודקים בהתאמה אישית, תכנון + נגרות מדויקת + חומרים עמידים, מהרעיון למבנה מוגמר. שלושה יתרונות קצרים בסגנון spec (mono): `תכנון בהתאמה` · `חומרים איכותיים` · `התקנה מקצועית`.
- **עבודות שלנו** — גריד 6–9 כרטיסים בגריד wood-framed. עכשיו placeholder (השתמש ב-anchor המרוהט ובסטילים הריקים/מרוהטים כזמניים; אשלח תמונות אמת בהמשך — בנה שיהיה קל להחליף: מערך `works.ts`). כל כרטיס: תמונה + כיתוב קצר.
- **צור קשר** — כותרת "רוצים פרגולה כזאת?". שני CTA בלבד:
  - וואטסאפ (ראשי): `https://wa.me/972XXXXXXXXX` — **מלא מספר** (השאר placeholder ברור).
  - מייל: `mailto:info@idb.co.il` — **מלא כתובת**.
  אין טופס, אין טלפון.

## שלב 4 — עיצוב (design tokens מ-§7)
צבעים: `--espresso #2A1E15`, `--cedar #B5763F`, `--amber #E3A85C`, `--bone #F2EADD`, `--olive #6E7355`, `--ink #1C1712`.
טיפוגרפיה: Display **Frank Ruhl Libre**, Body **Assistant**, Utility **IBM Plex Mono** (מידות/spec). טען מ-Google Fonts (עברית).
Signature: קווי מידה דקים + מספרים ב-mono על הפרגולה במנוחה (שרטוט אדריכל) — עדין, opacity נמוך, נעלם עם הגלילה. אלמנט בולט אחד (ה-scrub); השאר שקט ומדויק. אל תיפול ל-cream-serif-terracotta גנרי — עץ אמיתי, אור חם.

## שלב 5 — quality floor
- mobile (<768px): החלף frame-scrub ב-poster/וידאו לופ קצר; הורד frame count. הסקשנים נערמים.
- `prefers-reduced-motion`: static + לופ רגוע.
- keyboard focus גלוי; alt לכל תמונה; RTL תקין (`dir="rtl"`, לוגו ימין).
- SEO: כותרות אמת, meta, schema `LocalBusiness`+`Service`, `<title>`: "IDB — פרגולות ודקים בהתאמה אישית".

## Definition of done
אף פעם לא שני סגמנטים גלויים; אין תפר; ה-canvas נשאר קבוע בזמן scrub; אין וידאו scrub ב-runtime (רק הלופ ה-ambient); אין מסך שחור בטעינה; הגלילה משוקללת; 60fps בדסקטופ; RTL מלא; רספונסיבי למובייל.

---
### נכסים (Higgsfield job ids — ל-reference)
A מרוהט `5a7dc33a` · B אנשים `bc7bd983` · C ריק `13db9a1c` · D מפורק `aedfba38`
loop `873e4672` · assembly `64ae3ee3` · furnish `be078c28`
