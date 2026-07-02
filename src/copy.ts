/* copy.ts — all marketing text in one place (Hebrew, RTL).
 * Shared by the desktop scroll-scrub overlays and the mobile stacked layout. */

export const hero = {
  mark: "IDB",
  title: ["מהשרטוט", "ועד הצל."],
  tagline: "פרגולות ודקים בהתאמה אישית — נבנות מול העיניים שלכם.",
  cue: "גלול",
};

export const about = {
  eyebrow: "מי אנחנו",
  title: "בונים לכם את החוץ.",
  body: [
    "ב־IDB מתכננים ובונים פרגולות ודקים בהתאמה אישית. כל פרויקט מתחיל בשרטוט מדויק של המרחב — מידות, כיוון השמש וקו הרקיע — וממשיך אל בחירת העץ, החיבורים והגימור.",
    "זו נגרות אמיתית: קורות ארז ואורן ממויין, חיבורים שנעשים כמו שצריך, וגימור שעומד בשמש ובגשם. מהרעיון הראשון ועד המבנה המוגמר — ואחראים עליו גם אחרי.",
  ],
  specs: ["תכנון בהתאמה", "חומרים איכותיים", "התקנה מקצועית"],
};

export const worksCopy = {
  eyebrow: "עבודות שלנו",
  title: "כמה מהמבנים שבנינו",
};

export const contact = {
  eyebrow: "צור קשר",
  title: "רוצים פרגולה כזאת?",
  sub: "ספרו לנו על החצר שלכם ונחזור אליכם עם רעיון והצעת מחיר. הכי מהיר בוואטסאפ.",
  whatsapp: "שלחו הודעה בוואטסאפ",
  note: "אין טפסים ואין טלפונים — רק הודעה, ואנחנו חוזרים.",
};

/* length of the pinned scrub, in viewport heights (shared by reel + header nav).
 * Phones get a shorter runway — thumb-flings cover more viewport-heights than
 * wheel notches, so 9vh on mobile would feel endless. */
export const SCRUB_VH = 9;
export const SCRUB_VH_MOBILE = 7;
export const isSmallScreen = () => window.matchMedia("(max-width: 767px)").matches;
export const scrubLenPx = () => window.innerHeight * (isSmallScreen() ? SCRUB_VH_MOBILE : SCRUB_VH);

/* scroll-scrub stages, for the progress rail / nav */
export const stages = [
  { key: "assemble", label: "הרכבה", at: 0.2 },
  { key: "about", label: "מי אנחנו", at: 0.47 },
  { key: "furnish", label: "ריהוט", at: 0.62 },
  { key: "works", label: "עבודות", at: 0.79 },
  { key: "contact", label: "צור קשר", at: 0.93 },
];
