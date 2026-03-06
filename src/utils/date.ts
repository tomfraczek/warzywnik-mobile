const pad = (v: number) => String(v).padStart(2, "0");

/**
 * Returns YYYY-MM-DD string in the LOCAL timezone of the device.
 *
 * IMPORTANT: Do NOT use `new Date().toISOString().slice(0, 10)` – that
 * produces a UTC date, not the user's local date, which can be off by a day.
 */
export const getLocalDateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Today's YYYY-MM-DD in local timezone. */
export const getTodayKey = (): string => getLocalDateKey(new Date());

/** Tomorrow's YYYY-MM-DD in local timezone. */
export const getTomorrowKey = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return getLocalDateKey(d);
};

/** Returns true when the YYYY-MM-DD string equals today's local date. */
export const isLocalDateToday = (
  localDate: string | null | undefined,
): boolean => {
  if (!localDate) return false;
  return localDate === getTodayKey();
};

/** Returns true when the YYYY-MM-DD string equals tomorrow's local date. */
export const isLocalDateTomorrow = (
  localDate: string | null | undefined,
): boolean => {
  if (!localDate) return false;
  return localDate === getTomorrowKey();
};

/**
 * Converts an ISO 8601 UTC timestamp ("2025-06-10T14:30:00Z") or a plain
 * YYYY-MM-DD string to a local YYYY-MM-DD date key.
 *
 * Uses the device's local timezone, so this is correct for `dueAt` fields.
 */
export const isoToLocalDateKey = (
  iso: string | null | undefined,
): string | null => {
  if (!iso) return null;
  // Already a date-only string – return as-is (treat as local date).
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return getLocalDateKey(d);
};

/** Polish display label for a dayPart enum value. */
export const formatDayPart = (
  dayPart: string | null | undefined,
): string | null => {
  if (dayPart === "DAY") return "dzień";
  if (dayPart === "NIGHT") return "noc";
  if (dayPart === "ANY") return "cały dzień";
  return null;
};

/**
 * Formats a YYYY-MM-DD string as a Polish date, e.g. "10 czerwca".
 * Uses noon local time to avoid DST edge cases.
 */
export const formatLocalDate = (
  localDate: string | null | undefined,
): string | null => {
  if (!localDate) return null;
  const d = new Date(`${localDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
};

/** Formats an ISO 8601 timestamp as a Polish locale string, e.g. "10 czerwca, 14:30". */
export const formatIsoDateTime = (
  iso: string | null | undefined,
): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("pl-PL", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Returns "Dziś", "Jutro", or a formatted date label for a YYYY-MM-DD string.
 * Returns null when the input is null or unparseable.
 */
export const getLocalDayLabel = (
  localDate: string | null | undefined,
): string | null => {
  if (!localDate) return null;
  if (isLocalDateToday(localDate)) return "Dziś";
  if (isLocalDateTomorrow(localDate)) return "Jutro";
  return formatLocalDate(localDate);
};
