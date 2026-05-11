import {
  CalendarHarvestWindowItem,
  CalendarReminderItem,
} from "@/src/api/queries/calendar/types";
import { useGetCalendarWithOptions } from "@/src/api/queries/calendar/useGetCalendar";
import { TaskItem } from "@/src/api/queries/users/meTypes";
import { useGetMyTasks } from "@/src/api/queries/users/useGetMyTasks";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { useMemo } from "react";
import {
  getPlannerRange,
  parsePlannerDate,
  toLocalDateKey,
} from "../_utils/plannerDateUtils";
import {
  getRecentCompletedTasks,
  getUpcomingHarvestMoments,
  getWeekGroups,
  groupPlannerTasks,
} from "../_utils/plannerGrouping";

const toHarvestTitle = (event: CalendarHarvestWindowItem) => {
  return event.vegetable?.name ?? event.title ?? "Zbiór";
};

const normalizeHarvestEvents = (
  events: CalendarHarvestWindowItem[],
): CalendarHarvestWindowItem[] => {
  return events.map((event) => ({
    ...event,
    title: toHarvestTitle(event),
  }));
};

export type PlannerOverviewModel = {
  isLoading: boolean;
  isError: boolean;
  isOffline: boolean;
  computedAt: string | null;
  summary: {
    todayCount: number;
    overdueCount: number;
    harvestCount: number;
  };
  overdueTasks: TaskItem[];
  todayTasks: TaskItem[];
  tomorrowTasks: TaskItem[];
  weekGroups: ReturnType<typeof getWeekGroups>;
  noDueDateTasks: TaskItem[];
  upcomingHarvestMoments: CalendarHarvestWindowItem[];
  recentCompletedTasks: TaskItem[];
  reminders: CalendarReminderItem[];
  refetchAll: () => Promise<unknown>;
};

export function usePlannerOverview(rangeDays = 30): PlannerOverviewModel {
  const isOffline = useIsOffline();
  const range = useMemo(() => getPlannerRange(rangeDays), [rangeDays]);

  const pendingTasksQuery = useGetMyTasks("pending");
  const doneTasksQuery = useGetMyTasks("done");
  const calendarQuery = useGetCalendarWithOptions(range, {
    includeReminders: true,
    includeDoneTasks: false,
  });

  const pendingTasks = useMemo(
    () => pendingTasksQuery.data?.items ?? [],
    [pendingTasksQuery.data?.items],
  );
  const doneTasks = useMemo(
    () => doneTasksQuery.data?.items ?? [],
    [doneTasksQuery.data?.items],
  );
  const rawHarvest = useMemo(
    () => calendarQuery.data?.harvestEvents ?? [],
    [calendarQuery.data?.harvestEvents],
  );
  const harvestEvents = useMemo(
    () => normalizeHarvestEvents(rawHarvest),
    [rawHarvest],
  );

  const grouped = useMemo(
    () => groupPlannerTasks(pendingTasks),
    [pendingTasks],
  );

  const upcomingHarvestMoments = useMemo(
    () => getUpcomingHarvestMoments(harvestEvents),
    [harvestEvents],
  );

  const weekGroups = useMemo(
    () => getWeekGroups(grouped.weekTasks, harvestEvents),
    [grouped.weekTasks, harvestEvents],
  );

  const recentCompletedTasks = useMemo(
    () => getRecentCompletedTasks(doneTasks, 5),
    [doneTasks],
  );

  const reminders = useMemo(() => {
    return [...(calendarQuery.data?.reminders ?? [])]
      .filter((reminder) => Boolean(reminder?.id))
      .sort((a, b) => {
        const aDate = parsePlannerDate(a.dueAt ?? a.date)?.getTime() ?? 0;
        const bDate = parsePlannerDate(b.dueAt ?? b.date)?.getTime() ?? 0;
        return aDate - bDate;
      });
  }, [calendarQuery.data?.reminders]);

  const computedAt =
    pendingTasksQuery.data?.computedAt ??
    doneTasksQuery.data?.computedAt ??
    null;

  const refetchAll = () =>
    Promise.all([
      pendingTasksQuery.refetch(),
      doneTasksQuery.refetch(),
      calendarQuery.refetch(),
    ]);

  return {
    isLoading:
      pendingTasksQuery.isLoading ||
      doneTasksQuery.isLoading ||
      calendarQuery.isLoading,
    isError:
      Boolean(pendingTasksQuery.error) ||
      Boolean(doneTasksQuery.error) ||
      Boolean(calendarQuery.error),
    isOffline,
    computedAt,
    summary: {
      todayCount: grouped.todayTasks.length,
      overdueCount: grouped.overdueTasks.length,
      harvestCount: upcomingHarvestMoments.length,
    },
    overdueTasks: grouped.overdueTasks,
    todayTasks: grouped.todayTasks,
    tomorrowTasks: grouped.tomorrowTasks,
    weekGroups,
    noDueDateTasks: grouped.noDueDateTasks,
    upcomingHarvestMoments,
    recentCompletedTasks,
    reminders,
    refetchAll,
  };
}

export const getAgendaGroups = (
  tasks: TaskItem[],
  harvestEvents: CalendarHarvestWindowItem[],
  reminders: CalendarReminderItem[],
) => {
  const map = new Map<
    string,
    {
      dateKey: string;
      label: string;
      tasks: TaskItem[];
      harvestEvents: CalendarHarvestWindowItem[];
      reminders: CalendarReminderItem[];
    }
  >();

  tasks.forEach((task) => {
    const key = toLocalDateKey(task.dueAt) ?? null;
    if (!key) return;
    const existing = map.get(key);
    if (existing) {
      existing.tasks.push(task);
      return;
    }

    map.set(key, {
      dateKey: key,
      label: key,
      tasks: [task],
      harvestEvents: [],
      reminders: [],
    });
  });

  harvestEvents.forEach((event) => {
    const key = toLocalDateKey(event.start) ?? toLocalDateKey(event.end);
    if (!key) return;
    const existing = map.get(key);
    if (existing) {
      existing.harvestEvents.push(event);
      return;
    }

    map.set(key, {
      dateKey: key,
      label: key,
      tasks: [],
      harvestEvents: [event],
      reminders: [],
    });
  });

  reminders.forEach((reminder) => {
    const key = toLocalDateKey(reminder.dueAt ?? reminder.date);
    if (!key) return;
    const existing = map.get(key);
    if (existing) {
      existing.reminders.push(reminder);
      return;
    }

    map.set(key, {
      dateKey: key,
      label: key,
      tasks: [],
      harvestEvents: [],
      reminders: [reminder],
    });
  });

  return [...map.values()]
    .sort((a, b) => {
      const aTime = parsePlannerDate(a.dateKey)?.getTime() ?? 0;
      const bTime = parsePlannerDate(b.dateKey)?.getTime() ?? 0;
      return aTime - bTime;
    })
    .map((item) => ({
      ...item,
      label: new Intl.DateTimeFormat("pl-PL", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(parsePlannerDate(item.dateKey) ?? new Date()),
    }));
};
