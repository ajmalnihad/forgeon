export function toISODate(date = new Date()) {
  const d = new Date(date);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}

export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateShort(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Period keys used by dashboard + reports: today | week | month | year */
export const PERIODS = ["today", "week", "month", "year"];

export const PERIOD_LABEL = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  year: "This Year",
  custom: "Custom Range",
};

export function periodRange(period, today = toISODate()) {
  const end = today;
  switch (period) {
    case "today":
      return { from: today, to: end };
    case "week":
      return { from: addDays(today, -6), to: end };
    case "month":
      return { from: addDays(today, -29), to: end };
    case "year":
      return { from: addDays(today, -364), to: end };
    default:
      return { from: addDays(today, -29), to: end };
  }
}

export function isWithin(iso, from, to) {
  if (!iso) return false;
  if (from && iso < from) return false;
  if (to && iso > to) return false;
  return true;
}
