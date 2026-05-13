import {
  WarningDayPart,
  WarningItem,
  WarningScope,
  WarningSeverity,
} from "@/src/api/queries/users/meTypes";
import {
  formatDayPart,
  formatLocalDate,
  getLocalDayLabel,
  isLocalDateToday,
  isLocalDateTomorrow,
} from "@/src/utils/date";

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const TOKEN_PATTERN = /\{[^{}]+\}/g;
const TOKEN_EXISTS_PATTERN = /\{[^{}]+\}/;

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const interpolateText = (
  text: string | null | undefined,
  values?: Record<string, unknown> | null,
): string => {
  if (!text) return "";
  if (!values) return text;
  return Object.entries(values).reduce((acc, [key, value]) => {
    const safeKey = escapeRegExp(key);
    const replacement =
      value == null || String(value).trim().length === 0
        ? `{${key}}`
        : String(value);
    return acc.replace(new RegExp(`\\{${safeKey}\\}`, "g"), replacement);
  }, text);
};

const stripTokens = (text: string | null | undefined): string => {
  const withoutTokens = (text ?? "").replace(TOKEN_PATTERN, "");
  return withoutTokens.replace(/\s{2,}/g, " ").trim();
};

// ---------------------------------------------------------------------------
// Radar vs. operational classification
// ---------------------------------------------------------------------------

/**
 * Known radar (cross-period) warning codes.
 * Codes matching /_NEXT_/i are also treated as radar regardless of being
 * listed here.
 */
const KNOWN_RADAR_CODES = new Set<string>([
  "FROST_RISK_NEXT_7_DAYS",
  "HARD_FROST_RISK_NEXT_7_DAYS",
  "DROUGHT_RISK_NEXT_7_DAYS",
  "HEAVY_RAIN_RISK_NEXT_48H",
  "WIND_DAMAGE_RISK_NEXT_48H",
  "FUNGAL_DISEASE_PRESSURE_HIGH",
  "OVERWATERING_RISK",
  "GERMINATION_TOO_COLD",
]);

const isRadarCode = (code: string): boolean =>
  KNOWN_RADAR_CODES.has(code) || /_NEXT_/i.test(code);

/**
 * Returns true when a warning should be displayed in the radar section.
 *
 * Rules (in priority order):
 * 1. Code is a known radar code or matches *_NEXT_* → radar.
 * 2. `localDate` is null → radar (no specific day target).
 * 3. `localDate` is neither today nor tomorrow → treat as radar / future.
 */
export const isRadarWarning = (warning: WarningItem): boolean => {
  if (isRadarCode(warning.code)) return true;
  if (!warning.localDate) return true;
  return (
    !isLocalDateToday(warning.localDate) &&
    !isLocalDateTomorrow(warning.localDate)
  );
};

// ---------------------------------------------------------------------------
// Severity sorting
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: Record<WarningSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const DAY_PART_ORDER: Record<WarningDayPart, number> = {
  DAY: 0,
  NIGHT: 1,
  ANY: 2,
};

/**
 * Sorts warnings by:
 * 1. severity descending (CRITICAL → HIGH → MEDIUM → LOW)
 * 2. dayPart (DAY → NIGHT → ANY)
 * 3. title alphabetically
 */
export const sortWarningsBySeverity = (
  warnings: WarningItem[],
): WarningItem[] =>
  [...warnings].sort((a, b) => {
    const sevA = SEVERITY_ORDER[a.severity as WarningSeverity] ?? 4;
    const sevB = SEVERITY_ORDER[b.severity as WarningSeverity] ?? 4;
    if (sevA !== sevB) return sevA - sevB;

    const dpA = DAY_PART_ORDER[a.dayPart as WarningDayPart] ?? 3;
    const dpB = DAY_PART_ORDER[b.dayPart as WarningDayPart] ?? 3;
    if (dpA !== dpB) return dpA - dpB;

    return (a.title ?? "").localeCompare(b.title ?? "", "pl");
  });

// ---------------------------------------------------------------------------
// Grouping selectors
// ---------------------------------------------------------------------------

/**
 * Returns operational warnings whose `localDate` matches today.
 * Sorted by severity descending.
 */
export const getOperationalWarningsToday = (
  warnings: WarningItem[],
): WarningItem[] =>
  sortWarningsBySeverity(
    warnings.filter((w) => !isRadarWarning(w) && isLocalDateToday(w.localDate)),
  );

/**
 * Returns operational warnings whose `localDate` matches tomorrow.
 * Sorted by severity descending.
 */
export const getOperationalWarningsTomorrow = (
  warnings: WarningItem[],
): WarningItem[] =>
  sortWarningsBySeverity(
    warnings.filter(
      (w) => !isRadarWarning(w) && isLocalDateTomorrow(w.localDate),
    ),
  );

/**
 * Returns radar / cross-period warnings.
 * Sorted by severity descending.
 */
export const getRadarWarnings = (warnings: WarningItem[]): WarningItem[] =>
  sortWarningsBySeverity(warnings.filter(isRadarWarning));

// ---------------------------------------------------------------------------
// Presentation helpers
// ---------------------------------------------------------------------------

const fallbackMessageByScope = (
  scope: WarningScope,
  bedName: string | null,
  vegetableName: string | null,
): string => {
  if (scope === "PLANTING") {
    return vegetableName
      ? `Warunki pogodowe mogą wpłynąć na uprawę ${vegetableName}.`
      : "Warunki pogodowe mogą wpłynąć na tę uprawę.";
  }
  if (scope === "BED") {
    return bedName
      ? `Warunki pogodowe wymagają uwagi dla grządki ${bedName}.`
      : "Warunki pogodowe wymagają uwagi dla jednej z Twoich grządek.";
  }
  return "Warunki pogodowe w Twojej lokalizacji wymagają uwagi.";
};

const resolveScopeLabel = (
  scope: WarningScope,
  horizon: "RADAR" | "OPERATIONAL",
): string => {
  if (horizon === "RADAR") return "Radar";
  if (scope === "USER") return "Globalne";
  if (scope === "BED") return "Grządka";
  return "Uprawa";
};

const resolveContextLabel = (
  warning: WarningItem,
  horizon: "RADAR" | "OPERATIONAL",
  dayLabel: string | null,
): string => {
  const dayPartLabel = formatDayPart(warning.dayPart);
  const timingLabel =
    horizon === "OPERATIONAL"
      ? [dayLabel, dayPartLabel].filter(Boolean).join(" \u2022 ") || null
      : null;

  if (warning.scope === "USER") {
    const locationLabel = "Dotyczy wszystkich grz\u0105dek";
    return timingLabel
      ? `${locationLabel} \u2022 ${timingLabel}`
      : locationLabel;
  }

  if (warning.scope === "BED") {
    const bedLabel = warning.bedName ?? "Grz\u0105dka";
    return timingLabel ? `${bedLabel} \u2022 ${timingLabel}` : bedLabel;
  }

  // PLANTING scope
  if (warning.vegetableName && warning.bedName) {
    const base = `${warning.vegetableName} \u2022 ${warning.bedName}`;
    return timingLabel ? `${base} \u2022 ${timingLabel}` : base;
  }
  const base = warning.vegetableName ?? warning.bedName ?? "Uprawa";
  return timingLabel ? `${base} \u2022 ${timingLabel}` : base;
};

// ---------------------------------------------------------------------------
// Main presentation builder
// ---------------------------------------------------------------------------

export type WarningPresentation = {
  scope: WarningScope;
  bedId: string | null;
  bedName: string | null;
  plantingId: string | null;
  vegetableName: string | null;
  localDate: string | null;
  dayPart: WarningDayPart | null;
  validFrom: string | null;
  validTo: string | null;
  horizon: "RADAR" | "OPERATIONAL";
  dayLabel: string | null;
  isActionable: boolean;
  scopeLabel: string;
  contextLabel: string;
  title: string;
  message: string;
  hint: string | null;
};

/**
 * Builds the full presentation object for a warning.
 *
 * Uses `localDate`, `dayPart`, `scope`, `bedName`, and `vegetableName`
 * directly from the new API contract.  `details` is used only for
 * template-variable interpolation in title/message/hint.
 *
 * NO `bedsById` / `plantingsById` lookups required – the backend now
 * provides all fields directly.
 */
export const resolveWarningPresentation = (
  warning: WarningItem,
): WarningPresentation => {
  const horizon: "RADAR" | "OPERATIONAL" = isRadarWarning(warning)
    ? "RADAR"
    : "OPERATIONAL";

  const values: Record<string, unknown> = {
    ...(warning.details ?? {}),
    bedId: warning.bedId,
    bedName: warning.bedName,
    plantingId: warning.plantingId,
    vegetableName: warning.vegetableName,
    scope: warning.scope,
  };

  const rawTitle = interpolateText(warning.title, values);
  const rawMessage = interpolateText(warning.message, values);
  const rawHint = interpolateText(warning.hint, values);

  const hasBrokenPlaceholder =
    TOKEN_EXISTS_PATTERN.test(rawTitle) ||
    TOKEN_EXISTS_PATTERN.test(rawMessage) ||
    TOKEN_EXISTS_PATTERN.test(rawHint);

  const fallback = fallbackMessageByScope(
    warning.scope,
    warning.bedName,
    warning.vegetableName,
  );

  const title = hasBrokenPlaceholder
    ? stripTokens(rawTitle) || "Alert pogodowy"
    : rawTitle || "Alert pogodowy";

  let message = hasBrokenPlaceholder ? fallback : rawMessage || fallback;

  if (
    warning.scope === "USER" &&
    !warning.bedId &&
    /w\s+grz[a\u0105]dce/i.test(message)
  ) {
    message = fallback;
  }

  const hint = hasBrokenPlaceholder
    ? stripTokens(rawHint) || null
    : rawHint || null;

  const dayLabel = getLocalDayLabel(warning.localDate);

  return {
    scope: warning.scope,
    bedId: warning.bedId,
    bedName: warning.bedName,
    plantingId: warning.plantingId,
    vegetableName: warning.vegetableName,
    localDate: warning.localDate,
    dayPart: warning.dayPart,
    validFrom: warning.validFrom,
    validTo: warning.validTo,
    horizon,
    dayLabel,
    isActionable: horizon === "OPERATIONAL",
    scopeLabel: resolveScopeLabel(warning.scope, horizon),
    contextLabel: resolveContextLabel(warning, horizon, dayLabel),
    title,
    message,
    hint,
  };
};

// ---------------------------------------------------------------------------
// Legacy helpers (backward compatibility)
// ---------------------------------------------------------------------------

/**
 * @deprecated `localDate` is now a direct API field.
 * Kept to avoid import errors in code that still uses this function.
 */
export const getWarningRelations = (warning: WarningItem) => ({
  scope: warning.scope,
  horizon: isRadarWarning(warning)
    ? ("RADAR" as const)
    : ("OPERATIONAL" as const),
  dayPart: warning.dayPart,
  dayLabel: getLocalDayLabel(warning.localDate),
  bedId: warning.bedId,
  bedName: warning.bedName,
  plantingId: warning.plantingId,
  vegetableName: warning.vegetableName,
  dedupeKey: warning.dedupeKey,
  localDate: warning.localDate,
});

/**
 * @deprecated Use `meta.warningCode` and direct task fields instead of
 * dedupeKey matching.
 */
export const findMatchingWeatherTask = (
  warning: WarningItem,
  _bedsById: unknown,
  _plantingsById: unknown,
  tasks: {
    id: string;
    source?: string;
    plantingId?: string | null;
    bedId?: string | null;
    status?: string;
  }[],
) => {
  const isPending = (t: (typeof tasks)[number]) =>
    (t.status ?? "").toLowerCase() === "pending";
  const isWeatherTask = (t: (typeof tasks)[number]) =>
    t.source?.toUpperCase() === "WEATHER_WARNING";

  const pending = tasks.filter((t) => isPending(t) && isWeatherTask(t));

  if (warning.plantingId) {
    const match = pending.find((t) => t.plantingId === warning.plantingId);
    if (match) return match;
  }

  if (warning.bedId) {
    const match = pending.find((t) => t.bedId === warning.bedId);
    if (match) return match;
  }

  return null;
};

export { formatDayPart, formatLocalDate, getLocalDayLabel };
