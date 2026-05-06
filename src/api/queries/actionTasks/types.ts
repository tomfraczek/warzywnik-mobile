export type ActionTaskStatus = "pending" | "done" | "canceled";

export type ActionTaskSourceType = "MANUAL" | "AUTOMATION" | "SUGGESTION";

export type TaskListStatusFilter = "pending" | "done" | "canceled" | "all";

export type TaskEntityStatusLike = ActionTaskStatus | "canceled";

export type ActionTask = {
  id: string;
  title: string;
  description?: string | null;
  dueAt?: string | null;
  doneAt?: string | null;
  status: ActionTaskStatus;
  sourceType?: ActionTaskSourceType;
  sourceKey?: string | null;
  isUserModified?: boolean;
  suppressedAt?: string | null;
  source?:
    | "MANUAL"
    | "VEGETABLE_RULE"
    | "WEATHER_WARNING"
    | "AUTOMATION"
    | "SUGGESTION";
  targetType?:
    | "user"
    | "bed"
    | "planting"
    | "space"
    | "USER"
    | "BED"
    | "PLANTING"
    | "SPACE";
  bedId?: string | null;
  plantingId?: string | null;
  bedName?: string | null;
  vegetableName?: string | null;
  actionTemplateId?: string | null;
  actionTemplate?: {
    id: string;
    slug?: string;
    name: string;
    target?: string;
    type?: string;
    scope?: string;
    description?: string | null;
    defaultDueOffsetDays?: number | null;
  } | null;
  createdAt?: string;
  updatedAt?: string;
  isManuallyRescheduled?: boolean;
  meta?: {
    aggregationScope?: "bed" | "space" | "user" | "none";
    affectedPlantingIds?: string[];
    affectedVegetables?: string[];
    originPlantingTaskCount?: number;
    [key: string]: unknown;
  } | null;
  metadata?: {
    aggregationScope?: "bed" | "space" | "user" | "none";
    affectedPlantingIds?: string[];
    affectedVegetables?: string[];
    originPlantingTaskCount?: number;
    [key: string]: unknown;
  } | null;
};

export type ActionTaskListResponse = {
  items: ActionTask[];
};

export type UpdateActionTaskDto = {
  status?: ActionTaskStatus;
  dueAt?: string;
};

export const resolveActionTaskSourceType = (
  task: Pick<ActionTask, "sourceType" | "source">,
): ActionTaskSourceType | null => {
  const sourceType = task.sourceType?.trim().toUpperCase();
  if (
    sourceType === "MANUAL" ||
    sourceType === "AUTOMATION" ||
    sourceType === "SUGGESTION"
  ) {
    return sourceType;
  }

  const legacySource = task.source?.trim().toUpperCase();
  if (legacySource === "MANUAL") return "MANUAL";
  if (legacySource === "AUTOMATION") return "AUTOMATION";
  if (legacySource === "SUGGESTION") return "SUGGESTION";
  if (legacySource === "VEGETABLE_RULE") return "AUTOMATION";
  return null;
};

export const getActionTaskSourceLabel = (
  sourceType: ActionTaskSourceType | null | undefined,
) => {
  if (sourceType === "MANUAL") return "Ręczne";
  if (sourceType === "AUTOMATION") return "Automatyczne";
  if (sourceType === "SUGGESTION") return "Sugestia";
  return "Nieznane";
};

export const resolveActionTaskList = (payload: unknown): ActionTask[] => {
  if (Array.isArray(payload)) {
    return payload as ActionTask[];
  }

  if (typeof payload === "object" && payload !== null) {
    const response = payload as { items?: unknown; data?: unknown };
    if (Array.isArray(response.items)) {
      return response.items as ActionTask[];
    }
    if (Array.isArray(response.data)) {
      return response.data as ActionTask[];
    }
  }

  return [];
};

export const mapEntityStatusToTaskListFilter = (
  status: TaskEntityStatusLike,
): TaskListStatusFilter => {
  if (status === "pending") return "pending";
  if (status === "done") return "done";
  return "canceled";
};

export const normalizeTaskListStatusFilter = (
  status?: TaskListStatusFilter | TaskEntityStatusLike | "planned",
): TaskListStatusFilter | undefined => {
  if (!status) return undefined;
  if (
    status === "pending" ||
    status === "done" ||
    status === "canceled" ||
    status === "all"
  ) {
    return status;
  }
  if (status === "planned") return "pending";
  return mapEntityStatusToTaskListFilter(status);
};
