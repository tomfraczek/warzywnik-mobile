import {
  TaskItem,
  TaskMetaDto,
  WarningDayPart,
  WarningHorizon,
} from "@/src/api/queries/users/meTypes";
import {
  getTodayKey,
  getTomorrowKey,
  isoToLocalDateKey,
} from "@/src/utils/date";

type TaskRecord = Record<string, unknown>;

const asNonEmptyString = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

type PlantingTaskLookup = {
  id: string;
  bedId: string | null;
  bedName: string | null;
  vegetableName: string | null;
};

export type TaskTargetType = "user" | "bed" | "planting";

export type TaskPresentation = {
  targetType: TaskTargetType;
  bedId: string | null;
  bedName: string | null;
  plantingId: string | null;
  vegetableName: string | null;
  horizon: WarningHorizon | null;
  dayPart: WarningDayPart | null;
  dayLabel: string | null;
  locationLabel: string;
  cropLabel: string | null;
};

export type TaskTechnicalDetails = {
  targetType: TaskTargetType;
  scope: string | null;
  horizon: WarningHorizon | null;
  dayPart: WarningDayPart | null;
};

const asRecord = (value: unknown): TaskRecord | null => {
  return typeof value === "object" && value !== null
    ? (value as TaskRecord)
    : null;
};

export const getTaskMeta = (task: TaskItem, ...keys: string[]) => {
  const containers = [
    task,
    asRecord(task.details),
    asRecord(task.meta),
    asRecord(task.context),
    asRecord(task.payload),
  ].filter((item): item is TaskRecord => Boolean(item));

  for (const container of containers) {
    for (const key of keys) {
      const value = container[key];
      const normalized = asNonEmptyString(value);
      if (normalized) return normalized;
    }
  }

  return null;
};

const normalizeTargetType = (raw: string | null): TaskTargetType | null => {
  const normalized = raw?.trim().toUpperCase();
  if (normalized === "USER") return "user";
  if (normalized === "BED") return "bed";
  if (normalized === "PLANTING") return "planting";
  return null;
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

const resolveTaskHorizon = (task: TaskItem): WarningHorizon | null => {
  return normalizeHorizon(getTaskMeta(task, "horizon", "warningHorizon"));
};

const resolveTaskDayPart = (task: TaskItem): WarningDayPart | null => {
  return normalizeDayPart(getTaskMeta(task, "dayPart", "day_part"));
};

const resolveTaskDayLabel = (task: TaskItem) => {
  const raw = getTaskMeta(task, "day", "timeBucket", "period", "window");
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper === "TODAY") return "Dziś";
  if (upper === "TOMORROW") return "Jutro";
  return raw;
};

const resolveUserTaskLocationLabel = (task: TaskItem) => {
  const locationHint = getTaskMeta(
    task,
    "locationLabel",
    "location",
    "locationName",
    "areaLabel",
  );

  if (!locationHint) {
    return "(wszystkie grządki)";
  }

  return `(lokalizacja: ${locationHint})`;
};

export const resolveTaskTargetType = (task: TaskItem): TaskTargetType => {
  const explicitTarget = normalizeTargetType(
    getTaskMeta(task, "targetType", "target_type", "scope"),
  );

  if (explicitTarget) return explicitTarget;

  const plantingId = getTaskMeta(task, "plantingId", "planting_id");
  if (plantingId) return "planting";

  const bedId = getTaskMeta(task, "bedId", "bed_id");
  if (bedId) return "bed";

  return "user";
};

export const isTaskPending = (task: TaskItem) => {
  return (task.status ?? "").trim().toLowerCase() === "pending";
};

export const isTaskSuppressed = (task: TaskItem) => {
  return Boolean(task.suppressedAt ?? getTaskMeta(task, "suppressedAt"));
};

export const isTaskActive = (task: TaskItem) => {
  return isTaskPending(task) && !isTaskSuppressed(task);
};

export const resolveTaskSourceType = (
  task: TaskItem,
): "MANUAL" | "AUTOMATION" | "SUGGESTION" | null => {
  const sourceType =
    asNonEmptyString(task.sourceType) ?? getTaskMeta(task, "sourceType");
  const normalizedSourceType = sourceType?.toUpperCase();

  if (
    normalizedSourceType === "MANUAL" ||
    normalizedSourceType === "AUTOMATION" ||
    normalizedSourceType === "SUGGESTION"
  ) {
    return normalizedSourceType;
  }

  const source =
    asNonEmptyString(task.source) ?? getTaskMeta(task, "source", "taskSource");
  const normalizedSource = source?.toUpperCase();
  if (normalizedSource === "MANUAL") return "MANUAL";
  if (normalizedSource === "AUTOMATION") return "AUTOMATION";
  if (normalizedSource === "SUGGESTION") return "SUGGESTION";
  if (normalizedSource === "VEGETABLE_RULE") return "AUTOMATION";
  return null;
};

export const getTaskSourceTypeLabel = (
  sourceType: "MANUAL" | "AUTOMATION" | "SUGGESTION" | null,
) => {
  if (sourceType === "MANUAL") return "Ręczne";
  if (sourceType === "AUTOMATION") return "Automatyczne";
  if (sourceType === "SUGGESTION") return "Sugestia";
  return null;
};

const getDueAtValue = (task: TaskItem) => {
  return getTaskMeta(task, "dueAt", "due_at");
};

export const sortTasksByDueAt = (tasks: TaskItem[]) => {
  return [...tasks].sort((a, b) => {
    const aDue = getDueAtValue(a);
    const bDue = getDueAtValue(b);

    if (!aDue && !bDue) return 0;
    if (!aDue) return 1;
    if (!bDue) return -1;

    return aDue.localeCompare(bDue);
  });
};

export const isWeatherWarningTask = (task: TaskItem) => {
  // Prefer the new direct field; fall back to meta-based lookup for compat.
  const source =
    asNonEmptyString(task.source) ??
    getTaskMeta(task, "source", "taskSource", "task_source");
  return source?.toUpperCase() === "WEATHER_WARNING";
};

export const getTaskTechnicalDetails = (
  task: TaskItem,
): TaskTechnicalDetails => {
  return {
    targetType: resolveTaskTargetType(task),
    scope: getTaskMeta(task, "scope", "targetType", "target_type"),
    horizon: resolveTaskHorizon(task),
    dayPart: resolveTaskDayPart(task),
  };
};

export const formatTaskTargetType = (targetType: TaskTargetType) => {
  if (targetType === "user") return "Użytkownik";
  if (targetType === "bed") return "Grządka";
  return "Uprawa";
};

export const formatTaskScope = (scope: string | null) => {
  const normalized = scope?.trim().toUpperCase();
  if (normalized === "USER") return "Użytkownik";
  if (normalized === "BED") return "Grządka";
  if (normalized === "PLANTING") return "Uprawa";
  return "Brak";
};

export const formatTaskHorizon = (horizon: WarningHorizon | null) => {
  if (horizon === "RADAR") return "Radarowy";
  if (horizon === "OPERATIONAL") return "Operacyjny";
  return "Brak";
};

export const formatTaskDayPart = (dayPart: WarningDayPart | null) => {
  if (dayPart === "DAY") return "Dzień";
  if (dayPart === "NIGHT") return "Noc";
  return "Brak";
};

export const resolveTaskPresentation = (
  task: TaskItem,
  lookups: {
    bedsById: Map<string, string>;
    plantingsById: Map<string, PlantingTaskLookup>;
  },
): TaskPresentation => {
  const targetType = resolveTaskTargetType(task);
  const horizon = resolveTaskHorizon(task);
  const dayPart = resolveTaskDayPart(task);
  const dayLabel = resolveTaskDayLabel(task);

  const directBedId = getTaskMeta(task, "bedId", "bed_id");
  const directPlantingId = getTaskMeta(task, "plantingId", "planting_id");
  const planting = directPlantingId
    ? (lookups.plantingsById.get(directPlantingId) ?? null)
    : null;

  const bedId = directBedId ?? planting?.bedId ?? null;

  const directBedName = getTaskMeta(task, "bedName", "bed_name");
  const directVegetableName = getTaskMeta(
    task,
    "vegetableName",
    "vegetable_name",
    "cropName",
    "crop_name",
  );

  const bedName =
    directBedName ?? (bedId ? (lookups.bedsById.get(bedId) ?? null) : null);

  const vegetableName = directVegetableName ?? planting?.vegetableName ?? null;

  if (targetType === "user") {
    return {
      targetType,
      bedId,
      bedName,
      plantingId: directPlantingId,
      vegetableName,
      horizon,
      dayPart,
      dayLabel,
      locationLabel: resolveUserTaskLocationLabel(task),
      cropLabel: null,
    };
  }

  if (targetType === "bed") {
    return {
      targetType,
      bedId,
      bedName,
      plantingId: directPlantingId,
      vegetableName,
      horizon,
      dayPart,
      dayLabel,
      locationLabel: bedName ?? "Grządka",
      cropLabel: null,
    };
  }

  return {
    targetType,
    bedId,
    bedName,
    plantingId: directPlantingId,
    vegetableName,
    horizon,
    dayPart,
    dayLabel,
    locationLabel: bedName ?? "Grządka",
    cropLabel: vegetableName ?? "Uprawa",
  };
};

// ---------------------------------------------------------------------------
// Day-based grouping selectors (use dueAt as the primary day source)
// ---------------------------------------------------------------------------

/**
 * Returns tasks whose `dueAt` converts to today's local date.
 * The standard for "today" is the device's local timezone.
 */
export const getTasksForToday = (tasks: TaskItem[]): TaskItem[] => {
  const todayKey = getTodayKey();
  return sortTasksByDueAt(
    tasks.filter(
      (t) => isoToLocalDateKey(getTaskMeta(t, "dueAt", "due_at")) === todayKey,
    ),
  );
};

/**
 * Returns tasks whose `dueAt` converts to tomorrow's local date.
 */
export const getTasksForTomorrow = (tasks: TaskItem[]): TaskItem[] => {
  const tomorrowKey = getTomorrowKey();
  return sortTasksByDueAt(
    tasks.filter(
      (t) =>
        isoToLocalDateKey(getTaskMeta(t, "dueAt", "due_at")) === tomorrowKey,
    ),
  );
};

/**
 * Returns tasks whose `dueAt` is after tomorrow, or tasks with no `dueAt`.
 */
export const getTasksForLater = (tasks: TaskItem[]): TaskItem[] => {
  const todayKey = getTodayKey();
  const tomorrowKey = getTomorrowKey();
  return sortTasksByDueAt(
    tasks.filter((t) => {
      const localDate = isoToLocalDateKey(getTaskMeta(t, "dueAt", "due_at"));
      if (!localDate) return false; // no dueAt – omit from "later"
      return localDate !== todayKey && localDate !== tomorrowKey;
    }),
  );
};

/** Returns tasks with no `dueAt` value. */
export const getTasksWithNoDueDate = (tasks: TaskItem[]): TaskItem[] =>
  tasks.filter((t) => !getTaskMeta(t, "dueAt", "due_at"));

// ---------------------------------------------------------------------------
// Meta helpers (new API: task.meta: TaskMetaDto)
// ---------------------------------------------------------------------------

/** Returns the warning code from task.meta, or null. */
export const getTaskWarningCode = (task: TaskItem): string | null =>
  (task.meta as TaskMetaDto | null)?.warningCode ?? null;

/** Returns the affectsAllBeds flag from task.meta. */
export const getTaskAffectsAllBeds = (task: TaskItem): boolean =>
  (task.meta as TaskMetaDto | null)?.affectsAllBeds ?? false;

/** Returns the affectedBedsCount from task.meta, or null. */
export const getTaskAffectedBedsCount = (task: TaskItem): number | null =>
  (task.meta as TaskMetaDto | null)?.affectedBedsCount ?? null;

/** Returns the locationLabel from task.meta, or null. */
export const getTaskLocationLabel = (task: TaskItem): string | null =>
  (task.meta as TaskMetaDto | null)?.locationLabel ?? null;
