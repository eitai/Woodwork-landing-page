/* config.ts — fill these in before launch.
 * WhatsApp number must be full international format, digits only (972...). */
export const site = {
  // TODO(IDB): replace with the real WhatsApp number, e.g. "972501234567"
  whatsapp: "972XXXXXXXXX",
  whatsappText: "היי, אשמח לפרטים ולהצעת מחיר לפרגולה",
  // TODO(IDB): replace with the real inbox address
  email: "info@idb.co.il",
};

export const whatsappUrl = () =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(site.whatsappText)}`;

export const mailtoUrl = () => `mailto:${site.email}`;
