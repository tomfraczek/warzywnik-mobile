const DAY_MS = 24 * 60 * 60 * 1000;

const toStartOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const parsePlannerDate = (value: string | null | undefined) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getStartOfToday = (base = new Date()) => toStartOfDay(base);

export const getEndOfToday = (base = new Date()) => {
  const end = toStartOfDay(base);
  end.setHours(23, 59, 59, 999);
  return end;
};

export const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const isTodayLocal = (value: string | Date | null | undefined) => {
  const date = value instanceof Date ? value : parsePlannerDate(value ?? null);
  if (!date) return false;
  return toStartOfDay(date).getTime() === getStartOfToday().getTime();
};

export const isTomorrowLocal = (value: string | Date | null | undefined) => {
  const date = value instanceof Date ? value : parsePlannerDate(value ?? null);
  if (!date) return false;
  const tomorrow = addDays(getStartOfToday(), 1);
  return toStartOfDay(date).getTime() === tomorrow.getTime();
};

export const isBeforeTodayLocal = (value: string | Date | null | undefined) => {
  const date = value instanceof Date ? value : parsePlannerDate(value ?? null);
  if (!date) return false;
  return toStartOfDay(date).getTime() < getStartOfToday().getTime();
};

export const formatPlannerDate = (
  value: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
) => {
  const date = value instanceof Date ? value : parsePlannerDate(value ?? null);
  if (!date) return "";

  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...options,
  }).format(date);
};

export const formatPlannerTime = (value: string | Date | null | undefined) => {
  const date = value instanceof Date ? value : parsePlannerDate(value ?? null);
  if (!date) return null;

  return new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const formatRelativeDayDistance = (date: Date, now = new Date()) => {
  const start = toStartOfDay(now).getTime();
  const target = toStartOfDay(date).getTime();
  return Math.round((target - start) / DAY_MS);
};

export const formatRelativeDueLabel = (
  value: string | Date | null | undefined,
  now = new Date(),
) => {
  const date = value instanceof Date ? value : parsePlannerDate(value ?? null);
  if (!date) return "Bez terminu";

  const timeLabel = formatPlannerTime(date);
  const dayDiff = formatRelativeDayDistance(date, now);

  if (dayDiff === 0) {
    return timeLabel ? `Dzisiaj, ${timeLabel}` : "Dzisiaj";
  }

  if (dayDiff === 1) {
    return timeLabel ? `Jutro, ${timeLabel}` : "Jutro";
  }

  if (dayDiff === -1) {
    return "Zaległe od wczoraj";
  }

  if (dayDiff < 0) {
    return `Termin minął ${Math.abs(dayDiff)} dni temu`;
  }

  return `Za ${dayDiff} dni`;
};

export const toLocalDateKey = (value: string | Date | null | undefined) => {
  const date = value instanceof Date ? value : parsePlannerDate(value ?? null);
  if (!date) return null;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const getPlannerRange = (days: number) => {
  const from = getStartOfToday();
  const to = addDays(from, days);
  return {
    from: toLocalDateKey(from) ?? "",
    to: toLocalDateKey(to) ?? "",
  };
};
