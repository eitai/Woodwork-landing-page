/* works.ts — gallery data. Placeholder images are frames from the hero clips
 * (public/works/*.webp). Swap `src` for real photos when they arrive; keep the
 * shape and the grid renders them as-is. */

export type Work = {
  src: string;
  alt: string;
  type: string; // project kind
  place: string; // location
};

export const works: Work[] = [
  { src: "/works/01.webp", alt: "פרגולת עץ מרוהטת עם תאורה חמה בשעת בין הערביים", type: "פרגולת מגורים", place: "הרצליה פיתוח" },
  { src: "/works/02.webp", alt: "פינת ישיבה מוצללת תחת פרגולה בערב", type: "פינת אירוח", place: "רמת השרון" },
  { src: "/works/03.webp", alt: "פרגולה מעל דק עץ בגינה פרטית", type: "פרגולה + דק", place: "כפר סבא" },
  { src: "/works/04.webp", alt: "מבנה פרגולה עם קורות ארז וגג מוצל", type: "פרגולת צל", place: "סביון" },
  { src: "/works/05.webp", alt: "שלד פרגולת עץ לפני גימור, נגרות מדויקת", type: "מבנה בהתאמה", place: "מודיעין" },
  { src: "/works/06.webp", alt: "פרגולת עץ נקייה בקו אדריכלי מודרני", type: "פרגולה מודרנית", place: "רעננה" },
];
