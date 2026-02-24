export type CalendarTaskItem = {
  id: string;
  title: string;
  dueAt?: string | null;
  bedId?: string | null;
  plantingId?: string | null;
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
