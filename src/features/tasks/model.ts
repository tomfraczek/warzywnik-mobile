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

export type TaskTargetType = "user" | "bed" | "planting" | "space";
export type TaskOwnerScopeType = TaskTargetType;
export type TaskRelationType = "direct" | "related" | "aggregated" | "none";

export type TaskNavigationTarget =
  | { type: "planting"; plantingId: string; bedId?: string | null }
  | { type: "bed"; bedId: string }
  | null;

type OwnershipTaskLike = {
  ownerScopeType?: string | null;
  ownerScopeId?: string | null;
  relationType?: string | null;
  targetType?: string | null;
  bedId?: string | null;
  plantingId?: string | null;
  meta?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
} & Record<string, unknown>;

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

type AggregationScope = "bed" | "space" | "user" | "none";

const asRecord = (value: unknown): TaskRecord | null => {
  return typeof value === "object" && value !== null
    ? (value as TaskRecord)
    : null;
};

export const getTaskMeta = (task: TaskItem, ...keys: string[]) => {
  const containers = [
    task,
    asRecord(task.metadata),
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

const getTaskMetaStringArray = (task: TaskItem, ...keys: string[]) => {
  const containers = [
    task,
    asRecord(task.metadata),
    asRecord(task.details),
    asRecord(task.meta),
    asRecord(task.context),
    asRecord(task.payload),
  ].filter((item): item is TaskRecord => Boolean(item));

  for (const container of containers) {
    for (const key of keys) {
      const value = container[key];
      if (!Array.isArray(value)) continue;
      const normalized = value
        .map((item) => asNonEmptyString(item))
        .filter((item): item is string => Boolean(item));
      if (normalized.length > 0) {
        return normalized;
      }
    }
  }

  return [] as string[];
};

const normalizeTargetType = (raw: string | null): TaskTargetType | null => {
  const normalized = raw?.trim().toUpperCase();
  if (normalized === "USER") return "user";
  if (normalized === "BED") return "bed";
  if (normalized === "PLANTING") return "planting";
  if (normalized === "SPACE") return "space";
  return null;
};

const normalizeRelationType = (raw: string | null): TaskRelationType | null => {
  const normalized = raw?.trim().toUpperCase();
  if (normalized === "DIRECT") return "direct";
  if (normalized === "RELATED") return "related";
  if (normalized === "AGGREGATED") return "aggregated";
  if (normalized === "NONE") return "none";
  return null;
};

export const getTaskOwnerScope = (
  task: OwnershipTaskLike,
): TaskOwnerScopeType => {
  const ownerScope = normalizeTargetType(
    getTaskMeta(
      task as TaskItem,
      "ownerScopeType",
      "owner_scope_type",
      "targetType",
      "target_type",
      "scope",
    ),
  );
  if (ownerScope) return ownerScope;

  if (task.plantingId) return "planting";
  if (task.bedId) return "bed";
  return "user";
};

export const getTaskOwnerId = (task: OwnershipTaskLike): string | null => {
  const explicitOwnerId = getTaskMeta(
    task as TaskItem,
    "ownerScopeId",
    "owner_scope_id",
  );
  if (explicitOwnerId) return explicitOwnerId;

  const ownerScope = getTaskOwnerScope(task);
  if (ownerScope === "planting") {
    return getTaskMeta(task as TaskItem, "plantingId", "planting_id");
  }
  if (ownerScope === "bed") {
    return getTaskMeta(task as TaskItem, "bedId", "bed_id");
  }
  return null;
};

export const getTaskRelationType = (
  task: OwnershipTaskLike,
): TaskRelationType => {
  const explicitRelation = normalizeRelationType(
    getTaskMeta(task as TaskItem, "relationType", "relation_type"),
  );
  if (explicitRelation) return explicitRelation;

  if (task.plantingId) return "direct";
  if (getTaskAffectedPlantingIds(task as TaskItem).length > 0) return "related";
  return "none";
};

export const isTaskRelatedToPlanting = (
  task: OwnershipTaskLike,
  plantingId: string | null | undefined,
) => {
  if (!plantingId) return false;

  const ownerScope = getTaskOwnerScope(task);
  const ownerId = getTaskOwnerId(task);
  if (ownerScope === "planting" && ownerId === plantingId) return true;
  if (task.plantingId === plantingId) return true;
  return getTaskAffectedPlantingIds(task as TaskItem).includes(plantingId);
};

export const getTaskNavigationTarget = (
  task: OwnershipTaskLike,
): TaskNavigationTarget => {
  const ownerScope = getTaskOwnerScope(task);
  const ownerId = getTaskOwnerId(task);

  if (ownerScope === "planting") {
    const plantingId = ownerId ?? task.plantingId ?? null;
    if (!plantingId) return null;
    return {
      type: "planting",
      plantingId,
      bedId: task.bedId ?? null,
    };
  }

  if (ownerScope === "bed") {
    const bedId = ownerId ?? task.bedId ?? null;
    if (!bedId) return null;
    return { type: "bed", bedId };
  }

  const affectedPlantingId = getTaskAffectedPlantingIds(task as TaskItem)[0];
  if (affectedPlantingId) {
    return {
      type: "planting",
      plantingId: affectedPlantingId,
      bedId: task.bedId ?? null,
    };
  }

  if (task.bedId) {
    return { type: "bed", bedId: task.bedId };
  }

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
  return getTaskOwnerScope(task);
};

export const getTaskAggregationScope = (
  task: OwnershipTaskLike,
): AggregationScope => {
  const raw = getTaskMeta(
    task as TaskItem,
    "aggregationScope",
    "aggregation_scope",
  );
  const normalized = raw?.trim().toLowerCase();
  if (normalized === "bed") return "bed";
  if (normalized === "space") return "space";
  if (normalized === "user") return "user";
  return "none";
};

export const getTaskAffectedPlantingIds = (
  task: OwnershipTaskLike,
): string[] => {
  return getTaskMetaStringArray(
    task as TaskItem,
    "affectedPlantingIds",
    "affected_planting_ids",
  );
};

export const getTaskAffectedVegetables = (
  task: OwnershipTaskLike,
): string[] => {
  return getTaskMetaStringArray(
    task as TaskItem,
    "affectedVegetables",
    "affected_vegetables",
  );
};

export const getTaskAffectedVegetablesLabel = (
  task: OwnershipTaskLike,
  maxExplicitVegetables = 3,
) => {
  const vegetables = getTaskAffectedVegetables(task);
  if (vegetables.length === 0) return null;

  if (vegetables.length > maxExplicitVegetables) {
    return `Dotyczy ${vegetables.length} upraw na grządce`;
  }

  return `Dotyczy: ${vegetables.join(", ")}`;
};

export const getTaskContextLabel = (
  task: TaskItem,
  presentation?: Pick<
    TaskPresentation,
    "targetType" | "bedName" | "vegetableName" | "locationLabel"
  >,
) => {
  const targetType = presentation?.targetType ?? getTaskOwnerScope(task);

  if (targetType === "planting") {
    return (
      presentation?.vegetableName ??
      getTaskMeta(task, "vegetableName", "vegetable_name") ??
      "Uprawa"
    );
  }

  if (targetType === "bed") {
    return (
      presentation?.bedName ??
      getTaskMeta(task, "bedName", "bed_name") ??
      "Grządka"
    );
  }

  if (targetType === "space") {
    return (
      getTaskMeta(task, "spaceName", "space_name", "locationLabel") ??
      "Przestrzeń"
    );
  }

  return presentation?.locationLabel ?? "Cały ogród";
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
  if (targetType === "space") return "Przestrzeń";
  return "Uprawa";
};

export const formatTaskScope = (scope: string | null) => {
  const normalized = scope?.trim().toUpperCase();
  if (normalized === "USER") return "Użytkownik";
  if (normalized === "BED") return "Grządka";
  if (normalized === "PLANTING") return "Uprawa";
  if (normalized === "SPACE") return "Przestrzeń";
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
    const affectedVegetablesLabel = getTaskAffectedVegetablesLabel(task);

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
      cropLabel: affectedVegetablesLabel,
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
  (task.meta as TaskMetaDto | null)?.warningCode ??
  (task.metadata as TaskMetaDto | null)?.warningCode ??
  null;

/** Returns the affectsAllBeds flag from task.meta. */
export const getTaskAffectsAllBeds = (task: TaskItem): boolean =>
  (task.meta as TaskMetaDto | null)?.affectsAllBeds ??
  (task.metadata as TaskMetaDto | null)?.affectsAllBeds ??
  false;

/** Returns the affectedBedsCount from task.meta, or null. */
export const getTaskAffectedBedsCount = (task: TaskItem): number | null =>
  (task.meta as TaskMetaDto | null)?.affectedBedsCount ??
  (task.metadata as TaskMetaDto | null)?.affectedBedsCount ??
  null;

/** Returns the locationLabel from task.meta, or null. */
export const getTaskLocationLabel = (task: TaskItem): string | null =>
  (task.meta as TaskMetaDto | null)?.locationLabel ??
  (task.metadata as TaskMetaDto | null)?.locationLabel ??
  null;
