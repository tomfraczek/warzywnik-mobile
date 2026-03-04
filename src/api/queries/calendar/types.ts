export type CalendarTaskItem = {
  id: string;
  title: string;
  status?: "pending" | "done" | "canceled";
  dueAt?: string | null;
  doneAt?: string | null;
  createdAt?: string;
  bedId?: string | null;
  plantingId?: string | null;
  source?: string;
  actionTemplate?: {
    id: string;
    name: string;
    scope?: string;
    type?: string;
  } | null;
};

export type CalendarHarvestWindowItem = {
  plantingId: string;
  title: string;
  start: string;
  end: string;
  bedId?: string | null;
};

export type CalendarDayItem = {
  date: string;
  tasks: CalendarTaskItem[];
  harvestWindows: CalendarHarvestWindowItem[];
};

export type CalendarResponse = {
  days: CalendarDayItem[];
};

export const resolveCalendarDays = (payload: unknown): CalendarDayItem[] => {
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
