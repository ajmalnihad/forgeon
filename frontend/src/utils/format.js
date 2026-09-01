export const CURRENCY = "₹";

export function formatMoney(value, { compact = false } = {}) {
  const n = Number(value || 0);
  if (compact && Math.abs(n) >= 100000) {
    return `${CURRENCY}${(n / 100000).toFixed(1)}L`;
  }
  if (compact && Math.abs(n) >= 1000) {
    return `${CURRENCY}${(n / 1000).toFixed(1)}k`;
  }
  return `${CURRENCY}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

export function ordinal(n) {
  const num = Number(n);
  const s = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return num + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}
