export type CalendarTaskItem = {
  id: string;
  title: string;
  status?: "pending" | "done" | "canceled";
  dueAt?: string | null;
  doneAt?: string | null;
  createdAt?: string;
  bedId?: string | null;
  plantingId?: string | null;
  targetType?:
    | "user"
    | "bed"
    | "planting"
    | "space"
    | "growing_space"
    | "USER"
    | "BED"
    | "PLANTING"
    | "SPACE"
    | "GROWING_SPACE";
  ownerScopeType?:
    | "user"
    | "bed"
    | "planting"
    | "space"
    | "growing_space"
    | "USER"
    | "BED"
    | "PLANTING"
    | "SPACE"
    | "GROWING_SPACE";
  ownerScopeId?: string | null;
  relationType?:
    | "direct"
    | "bed"
    | "space"
    | "related_from_bed"
    | "related_from_space"
    | "DIRECT"
    | "BED"
    | "SPACE"
    | "RELATED_FROM_BED"
    | "RELATED_FROM_SPACE"
    | "RELATED"
    | "AGGREGATED";
  affectedPlantingIds?: string[];
  growingSpaceId?: string | null;
  bedName?: string | null;
  vegetableName?: string | null;
  source?: string;
  sourceType?: "MANUAL" | "AUTOMATION" | "SUGGESTION" | string;
  sourceKey?: string | null;
  isUserModified?: boolean;
  suppressedAt?: string | null;
  actionTemplate?: {
    id: string;
    slug?: string;
    name: string;
    target?: string;
    scope?: string;
    type?: string;
    description?: string | null;
    defaultDueOffsetDays?: number | null;
  } | null;
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

export type CalendarHarvestWindowItem = {
  plantingId: string;
  title: string;
  start: string;
  end: string;
  bedId?: string | null;
  bedName?: string | null;
  harvestedAt?: string | null;
  vegetable?: {
    id?: string;
    name?: string;
  } | null;
};

export type CalendarReminderItem = {
  id: string;
  title: string;
  date?: string | null;
  dueAt?: string | null;
  description?: string | null;
};

export type CalendarDayItem = {
  date: string;
  tasks: CalendarTaskItem[];
  harvestWindows: CalendarHarvestWindowItem[];
};

export type CalendarResponse = {
  days: CalendarDayItem[];
  tasks: CalendarTaskItem[];
  harvestEvents: CalendarHarvestWindowItem[];
  reminders: CalendarReminderItem[];
};

const asArray = <T>(value: unknown): T[] => {
  return Array.isArray(value) ? (value as T[]) : [];
};

const coerceDays = (payload: unknown): CalendarDayItem[] => {
  if (Array.isArray(payload)) {
    return payload as CalendarDayItem[];
  }

  if (typeof payload === "object" && payload !== null) {
    const response = payload as {
      days?: unknown;
      items?: unknown;
      data?: unknown;
    };
    if (Array.isArray(response.days)) {
      return response.days as CalendarDayItem[];
    }
    if (Array.isArray(response.items)) {
      return response.items as CalendarDayItem[];
    }
    if (Array.isArray(response.data)) {
      return response.data as CalendarDayItem[];
    }
  }

  return [];
};

const coerceFlatResponse = (payload: unknown) => {
  if (typeof payload !== "object" || payload === null) {
    return {
      tasks: [] as CalendarTaskItem[],
      harvestEvents: [] as CalendarHarvestWindowItem[],
      reminders: [] as CalendarReminderItem[],
    };
  }

  const response = payload as {
    tasks?: unknown;
    harvestEvents?: unknown;
    reminders?: unknown;
  };

  return {
    tasks: asArray<CalendarTaskItem>(response.tasks),
    harvestEvents: asArray<CalendarHarvestWindowItem>(response.harvestEvents),
    reminders: asArray<CalendarReminderItem>(response.reminders),
  };
};

export const resolveCalendarResponse = (payload: unknown): CalendarResponse => {
  const days = coerceDays(payload);
  const flat = coerceFlatResponse(payload);

  const tasksFromDays = days.flatMap((day) => day.tasks ?? []);
  const harvestFromDays = days.flatMap((day) => day.harvestWindows ?? []);

  return {
    days,
    tasks: flat.tasks.length > 0 ? flat.tasks : tasksFromDays,
    harvestEvents:
      flat.harvestEvents.length > 0 ? flat.harvestEvents : harvestFromDays,
    reminders: flat.reminders,
  };
};
