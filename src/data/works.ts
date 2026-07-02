/* works.ts — gallery data. Real project photos from public/works/ (sourced from
 * public/"woodwork imgs", converted to WebP). Order matters: mobile shows only
 * the first 6 (CSS hides the rest), so the strongest go first.
 * To add/replace: drop a WebP in public/works/ and add an entry here. */

export type Work = {
  src: string;
  alt: string;
  type: string; // what was built
  place: string; // context line (shown opposite the type)
};

export const works: Work[] = [
  { src: "/works/w01.webp", alt: "פרגולת הצללה מודרנית — פסי עץ עם מסגרת פלדה שחורה ומחיצת מתכת דקורטיבית", type: "פרגולה מודרנית", place: "חצר פרטית" },
  { src: "/works/w02.webp", alt: "דק אורן חדש עם מעקות עץ ורמפת גישה", type: "דק אורן + מעקות", place: "חצר פרטית" },
  { src: "/works/w03.webp", alt: "פרגולת עץ בגינה — מבט מלמטה על רשת הקורות", type: "פרגולת גינה", place: "מרחב ציבורי" },
  { src: "/works/w04.webp", alt: "הקמת פרגולה חופשית עם קירוי פוליקרבונט, נגר על סולם בעבודה", type: "פרגולה מקורה", place: "בהקמה" },
  { src: "/works/w05.webp", alt: "דק עץ עם מעקה שנבנה סביב עץ קיים", type: "דק סביב עץ", place: "חצר פרטית" },
  { src: "/works/w06.webp", alt: "פרגולה ארוכה מקורה מעל שולחנות ישיבה", type: "הצללת פינת ישיבה", place: "מרחב קהילתי" },
  { src: "/works/w07.webp", alt: "פרגולת צל עם גג משופע בין עצים ושיחים", type: "פרגולת צל", place: "גינה" },
  { src: "/works/w08.webp", alt: "קירוי שקוף על שלד עץ שנבנה סביב גזע עץ חי", type: "קירוי משולב בעץ", place: "נגרות בהתאמה" },
  { src: "/works/w09.webp", alt: "בניית דק ומעקה עץ — שלב העבודה עם כלים על הדק", type: "בניית דק ומעקה", place: "בעבודה" },
  { src: "/works/w10.webp", alt: "חידוש והברקה של דק עץ רחב תחת פרגולה", type: "חידוש דק", place: "חצר פרטית" },
  { src: "/works/w11.webp", alt: "נדנדת עץ מעוצבת בהתאמה אישית על מסד אבן", type: "נדנדת עץ בהתאמה", place: "פרויקט מיוחד" },
  { src: "/works/w12.webp", alt: "קירוי עץ צמוד בית מעל פטיו אחורי", type: "קירוי צמוד בית", place: "חצר אחורית" },
];
