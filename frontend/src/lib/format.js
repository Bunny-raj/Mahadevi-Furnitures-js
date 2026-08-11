export const inr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export const discountPct = (p) =>
  p && Number(p.mrp) > Number(p.price)
    ? Math.round((1 - Number(p.price) / Number(p.mrp)) * 100)
    : 0;

const COLOR_MAP = {
  "walnut": "#5D4037", "walnut brown": "#5D4037", "brown": "#795548", "dark brown": "#4E342E",
  "light brown": "#A1887F", "teak": "#8B5A2B", "mahogany": "#67322E", "oak": "#C8A165",
  "honey": "#B8860B", "natural": "#A97442", "natural wood": "#A97442", "tan": "#C19A6B",
  "beige": "#D9C9BA", "cream": "#F3EAD9", "ivory": "#F6F1E7", "white": "#FAFAFA",
  "off white": "#F5F0E8", "grey": "#8D8D8D", "gray": "#8D8D8D", "dark grey": "#4A4A4A",
  "dark gray": "#4A4A4A", "light grey": "#C4C4C4", "light gray": "#C4C4C4",
  "charcoal": "#36322F", "black": "#1A1817", "blue": "#3F5F8A", "navy": "#27394F",
  "navy blue": "#27394F", "sky blue": "#7FA8C9", "green": "#4F6F52", "olive": "#6B6B3A",
  "emerald": "#2E6F5E", "red": "#A63A3A", "maroon": "#6E2B2B", "wine": "#722F37",
  "mustard": "#C9A227", "yellow": "#D9B23D", "orange": "#C9722E", "pink": "#C98A9A",
  "purple": "#6D5AA0", "silver": "#BFBFBF", "gold": "#C9A227",
};

export const colorHex = (name) => COLOR_MAP[String(name || "").trim().toLowerCase()] || "#B8AFA3";

export const colorSlug = (name) => String(name || "").trim().toLowerCase().replace(/\s+/g, "-");
