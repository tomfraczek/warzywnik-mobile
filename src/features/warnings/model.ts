import {
  TaskItem,
  WarningDayPart,
  WarningHorizon,
  WarningItem,
  WarningScope,
} from "@/src/api/queries/users/meTypes";

type WarningRelations = {
  scope: WarningScope;
  horizon: WarningHorizon | null;
  dayPart: WarningDayPart | null;
  dayLabel: string | null;
  bedId: string | null;
  bedName: string | null;
  plantingId: string | null;
  vegetableName: string | null;
  dedupeKey: string | null;
};

type PlantingLookup = {
  id: string;
  bedId: string | null;
  bedName: string | null;
  vegetableName: string | null;
};

const TOKEN_PATTERN = /\{[^{}]+\}/g;
const TOKEN_EXISTS_PATTERN = /\{[^{}]+\}/;
const UNKNOWN_BED_NAME_PATTERN = /nieznana\s+grz[aą]dka|unknown\s+bed/i;

export const asNonEmptyString = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const interpolateText = (
  text: string | null | undefined,
  values?: Record<string, unknown> | null,
) => {
  if (!text || !values) return text ?? "";
  return Object.entries(values).reduce((acc, [key, value]) => {
    const safeKey = escapeRegExp(key);
    const replacement =
      value == null || String(value).trim().length === 0
        ? `{${key}}`
        : String(value);
    return acc.replace(new RegExp(`\\{${safeKey}\\}`, "g"), replacement);
  }, text);
};

const stripTokens = (text: string | null | undefined) => {
  const withoutTokens = (text ?? "").replace(TOKEN_PATTERN, "");
  return withoutTokens.replace(/\s{2,}/g, " ").trim();
};

const detailsFromWarning = (warning: WarningItem) => {
  if (!warning.details || typeof warning.details !== "object") {
    return null;
  }
  return warning.details as Record<string, unknown>;
};

const inferScope = (
  warning: WarningItem,
  details: Record<string, unknown> | null,
): WarningScope => {
  const explicitScope =
    asNonEmptyString(warning.scope) ?? asNonEmptyString(details?.scope);

  if (
    explicitScope === "USER" ||
    explicitScope === "BED" ||
    explicitScope === "PLANTING"
  ) {
    return explicitScope;
  }

  const hasPlanting =
    asNonEmptyString(warning.plantingId) ??
    asNonEmptyString(details?.plantingId);
  if (hasPlanting) return "PLANTING";

  const hasBed =
    asNonEmptyString(warning.bedId) ?? asNonEmptyString(details?.bedId);
  if (hasBed) return "BED";

  return "USER";
};

const normalizeHorizon = (raw: string | null): WarningHorizon | null => {
  const normalized = raw?.trim().toUpperCase();
  if (normalized === "RADAR") return "RADAR";
  if (normalized === "OPERATIONAL") return "OPERATIONAL";
  return null;
};

const normalizeDayPart = (raw: string | null): WarningDayPart | null => {
  const normalized = raw?.trim().toUpperCase();
  if (normalized === "DAY") return "DAY";
  if (normalized === "NIGHT") return "NIGHT";
  return null;
};

const resolveWarningHorizon = (
  warning: WarningItem,
  details: Record<string, unknown> | null,
) => {
  return normalizeHorizon(
    asNonEmptyString(warning.horizon) ?? asNonEmptyString(details?.horizon),
  );
};

const resolveWarningDayPart = (
  warning: WarningItem,
  details: Record<string, unknown> | null,
) => {
  return normalizeDayPart(
    asNonEmptyString(warning.dayPart) ?? asNonEmptyString(details?.dayPart),
  );
};

const resolveWarningDayLabel = (
  warning: WarningItem,
  details: Record<string, unknown> | null,
) => {
  const raw =
    asNonEmptyString((warning as Record<string, unknown>).day) ??
    asNonEmptyString(details?.day) ??
    asNonEmptyString((warning as Record<string, unknown>).timeBucket) ??
    asNonEmptyString(details?.timeBucket);

  if (!raw) return null;
  const normalized = raw.toUpperCase();
  if (normalized === "TODAY") return "Dziś";
  if (normalized === "TOMORROW") return "Jutro";
  return raw;
};

const normalizeBedName = (value: string | null) => {
  if (!value) return null;
  if (UNKNOWN_BED_NAME_PATTERN.test(value)) return null;
  return value;
};

export const getWarningRelations = (
  warning: WarningItem,
  bedsById: Map<string, string>,
  plantingsById?: Map<string, PlantingLookup>,
): WarningRelations => {
  const details = detailsFromWarning(warning);
  const bedId =
    asNonEmptyString(warning.bedId) ??
    asNonEmptyString(warning.bed_id) ??
    asNonEmptyString(details?.bedId) ??
    asNonEmptyString(details?.bed_id);

  const directBedName =
    asNonEmptyString(warning.bedName) ??
    asNonEmptyString(warning.bed_name) ??
    asNonEmptyString(details?.bedName) ??
    asNonEmptyString(details?.bed_name);

  const bedName = normalizeBedName(
    directBedName ?? (bedId ? (bedsById.get(bedId) ?? null) : null),
  );

  const plantingId =
    asNonEmptyString(warning.plantingId) ??
    asNonEmptyString(warning.planting_id) ??
    asNonEmptyString(details?.plantingId) ??
    asNonEmptyString(details?.planting_id);

  const planting = plantingId ? (plantingsById?.get(plantingId) ?? null) : null;

  const vegetableName =
    asNonEmptyString(warning.vegetableName) ??
    asNonEmptyString(warning.vegetable_name) ??
    asNonEmptyString(details?.vegetableName) ??
    asNonEmptyString(details?.vegetable_name) ??
    planting?.vegetableName ??
    null;

  const resolvedBedId = bedId ?? planting?.bedId ?? null;
  const resolvedBedName =
    normalizeBedName(bedName) ??
    planting?.bedName ??
    (resolvedBedId ? (bedsById.get(resolvedBedId) ?? null) : null);

  const dedupeKey =
    asNonEmptyString(warning.dedupeKey) ??
    asNonEmptyString(warning.dedupe_key) ??
    asNonEmptyString(details?.dedupeKey) ??
    asNonEmptyString(details?.dedupe_key);

  return {
    scope: inferScope(warning, details),
    horizon: resolveWarningHorizon(warning, details),
    dayPart: resolveWarningDayPart(warning, details),
    dayLabel: resolveWarningDayLabel(warning, details),
    bedId: resolvedBedId,
    bedName: resolvedBedName,
    plantingId,
    vegetableName,
    dedupeKey,
  };
};

const resolveWarningScopeLabel = (relations: WarningRelations) => {
  if (relations.horizon === "RADAR") return "Radar";
  if (relations.horizon === "OPERATIONAL") return "Operacyjne";
  return relations.scope === "USER"
    ? "Globalne"
    : relations.scope === "BED"
      ? "Grządka"
      : "Uprawa";
};

const resolveWarningContextLabel = (relations: WarningRelations) => {
  const dayPartLabel =
    relations.dayPart === "DAY"
      ? "w dzień"
      : relations.dayPart === "NIGHT"
        ? "w nocy"
        : null;

  const timingLabel =
    relations.horizon === "OPERATIONAL"
      ? [relations.dayLabel, dayPartLabel].filter(Boolean).join(" • ") ||
        "Dziś/Jutro"
      : null;

  if (relations.scope === "USER") {
    const locationLabel = "Dotyczy wszystkich grządek";
    return timingLabel ? `${locationLabel} • ${timingLabel}` : locationLabel;
  }

  if (relations.scope === "BED") {
    const bedLabel = relations.bedName ?? "Grządka";
    return timingLabel ? `${bedLabel} • ${timingLabel}` : bedLabel;
  }

  if (relations.vegetableName && relations.bedName) {
    const base = `${relations.vegetableName} • ${relations.bedName}`;
    return timingLabel ? `${base} • ${timingLabel}` : base;
  }

  const base =
    relations.vegetableName ?? relations.bedName ?? "Uprawa • Grządka";
  return timingLabel ? `${base} • ${timingLabel}` : base;
};

const fallbackMessageByScope = (relations: WarningRelations) => {
  if (relations.scope === "PLANTING") {
    if (relations.vegetableName) {
      return `Warunki pogodowe mogą wpłynąć na uprawę ${relations.vegetableName}.`;
    }
    return "Warunki pogodowe mogą wpłynąć na tę uprawę.";
  }

  if (relations.scope === "BED") {
    if (relations.bedName) {
      return `Warunki pogodowe wymagają uwagi dla grządki ${relations.bedName}.`;
    }
    return "Warunki pogodowe wymagają uwagi dla jednej z Twoich grządek.";
  }

  return "Warunki pogodowe w Twojej lokalizacji wymagają uwagi.";
};

export const resolveWarningPresentation = (
  warning: WarningItem,
  bedsById: Map<string, string>,
  plantingsById?: Map<string, PlantingLookup>,
) => {
  const details = detailsFromWarning(warning);
  const relations = getWarningRelations(warning, bedsById, plantingsById);

  const values: Record<string, unknown> = {
    ...(warning as Record<string, unknown>),
    ...(details ?? {}),
    bedId: relations.bedId,
    bedName: relations.bedName,
    plantingId: relations.plantingId,
    vegetableName: relations.vegetableName,
    scope: relations.scope,
  };

  const rawTitle = interpolateText(warning.title, values);
  const rawMessage = interpolateText(warning.message, values);
  const rawHint = interpolateText(
    asNonEmptyString((warning as Record<string, unknown>).hint) ?? warning.hint,
    values,
  );

  const hasBrokenPlaceholder =
    TOKEN_EXISTS_PATTERN.test(rawTitle) ||
    TOKEN_EXISTS_PATTERN.test(rawMessage) ||
    TOKEN_EXISTS_PATTERN.test(rawHint);

  const title = hasBrokenPlaceholder
    ? stripTokens(rawTitle) || "Alert pogodowy"
    : rawTitle || "Alert pogodowy";

  let message = hasBrokenPlaceholder
    ? fallbackMessageByScope(relations)
    : rawMessage || fallbackMessageByScope(relations);

  if (
    relations.scope === "USER" &&
    !relations.bedId &&
    /w\s+grz[aą]dce/i.test(message)
  ) {
    message = fallbackMessageByScope(relations);
  }

  const hint =
    hasBrokenPlaceholder || !rawHint ? stripTokens(rawHint) || null : rawHint;

  return {
    ...relations,
    isActionable: relations.horizon === "OPERATIONAL",
    scopeLabel: resolveWarningScopeLabel(relations),
    contextLabel: resolveWarningContextLabel(relations),
    title,
    message,
    hint,
    hasBrokenPlaceholder,
  };
};

const getTaskField = (task: TaskItem, ...keys: string[]) => {
  for (const key of keys) {
    const value = task[key];
    const normalized = asNonEmptyString(value);
    if (normalized) return normalized;
  }
  return null;
};

const isTaskPending = (task: TaskItem) => {
  const normalized = (task.status ?? "").toLowerCase();
  return (
    normalized !== "done" &&
    normalized !== "canceled" &&
    normalized !== "cancelled"
  );
};

const isWeatherWarningTask = (task: TaskItem) => {
  const source = getTaskField(task, "source", "taskSource", "task_source");
  return source?.toUpperCase() === "WEATHER_WARNING";
};

export const findMatchingWeatherTask = (
  warning: WarningItem,
  bedsById: Map<string, string>,
  plantingsById: Map<string, PlantingLookup> | undefined,
  tasks: TaskItem[],
) => {
  const relations = getWarningRelations(warning, bedsById, plantingsById);

  if (relations.horizon === "RADAR") return null;

  const weatherPendingTasks = tasks.filter(
    (task) => isTaskPending(task) && isWeatherWarningTask(task),
  );

  if (relations.plantingId) {
    const matchByPlanting = weatherPendingTasks.find(
      (task) =>
        getTaskField(task, "plantingId", "planting_id") ===
        relations.plantingId,
    );
    if (matchByPlanting) return matchByPlanting;
  }

  if (relations.bedId) {
    const matchByBed = weatherPendingTasks.find(
      (task) => getTaskField(task, "bedId", "bed_id") === relations.bedId,
    );
    if (matchByBed) return matchByBed;
  }

  const warningDedupeKey = relations.dedupeKey;
  const warningCode = asNonEmptyString(warning.code);

  if (
    warningDedupeKey ||
    warningCode ||
    relations.bedId ||
    relations.plantingId
  ) {
    const referenceParts = [
      warningDedupeKey,
      warningCode,
      relations.bedId,
      relations.plantingId,
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase());

    const dedupeMatch = weatherPendingTasks.find((task) => {
      const taskDedupe =
        getTaskField(task, "dedupeKey", "dedupe_key")?.toLowerCase() ?? "";
      if (!taskDedupe) return false;
      return referenceParts.some(
        (part) => taskDedupe.includes(part) || part.includes(taskDedupe),
      );
    });

    if (dedupeMatch) return dedupeMatch;
  }

  return null;
};
