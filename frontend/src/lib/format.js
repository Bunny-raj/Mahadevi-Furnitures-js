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
