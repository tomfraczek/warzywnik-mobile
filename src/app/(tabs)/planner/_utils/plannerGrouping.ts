import { CalendarHarvestWindowItem } from "@/src/api/queries/calendar/types";
import { TaskItem } from "@/src/api/queries/users/meTypes";
import { isTaskActive } from "@/src/features/tasks/model";
import {
  addDays,
  formatPlannerDate,
  getStartOfToday,
  parsePlannerDate,
  toLocalDateKey,
} from "./plannerDateUtils";
import { getTaskDueAt, normalizeTaskStatus } from "./plannerPresentation";

export type PlannerWeekGroup = {
  dateKey: string;
  label: string;
  tasks: TaskItem[];
  harvestEvents: CalendarHarvestWindowItem[];
};

const sortTasksByDue = (tasks: TaskItem[]) => {
  return [...tasks].sort((a, b) => {
    const dueA = parsePlannerDate(getTaskDueAt(a));
    const dueB = parsePlannerDate(getTaskDueAt(b));

    if (!dueA && !dueB) return 0;
    if (!dueA) return 1;
    if (!dueB) return -1;

    return dueA.getTime() - dueB.getTime();
  });
};

export const getOverdueTasks = (tasks: TaskItem[], now = new Date()) => {
  const startOfToday = getStartOfToday(now).getTime();
  return sortTasksByDue(
    tasks.filter((task) => {
      if (!isTaskActive(task)) return false;
      const due = parsePlannerDate(getTaskDueAt(task));
      if (!due) return false;
      return due.getTime() < startOfToday;
    }),
  );
};

export const getTodayTasks = (tasks: TaskItem[], now = new Date()) => {
  const start = getStartOfToday(now).getTime();
  const end = addDays(getStartOfToday(now), 1).getTime();

  return sortTasksByDue(
    tasks.filter((task) => {
      if (!isTaskActive(task)) return false;
      const due = parsePlannerDate(getTaskDueAt(task));
      if (!due) return false;
      const at = due.getTime();
      return at >= start && at < end;
    }),
  );
};

export const getTomorrowTasks = (tasks: TaskItem[], now = new Date()) => {
  const start = addDays(getStartOfToday(now), 1).getTime();
  const end = addDays(getStartOfToday(now), 2).getTime();

  return sortTasksByDue(
    tasks.filter((task) => {
      if (!isTaskActive(task)) return false;
      const due = parsePlannerDate(getTaskDueAt(task));
      if (!due) return false;
      const at = due.getTime();
      return at >= start && at < end;
    }),
  );
};

export const getWeekTasks = (tasks: TaskItem[], now = new Date()) => {
  const start = addDays(getStartOfToday(now), 2).getTime();
  const end = addDays(getStartOfToday(now), 8).getTime();

  return sortTasksByDue(
    tasks.filter((task) => {
      if (!isTaskActive(task)) return false;
      const due = parsePlannerDate(getTaskDueAt(task));
      if (!due) return false;
      const at = due.getTime();
      return at >= start && at < end;
    }),
  );
};

export const getNoDueDateTasks = (tasks: TaskItem[]) => {
  return tasks.filter((task) => isTaskActive(task) && !getTaskDueAt(task));
};

export const getRecentCompletedTasks = (tasks: TaskItem[], limit = 5) => {
  return [...tasks]
    .filter((task) => normalizeTaskStatus(task.status) === "done")
    .sort((a, b) => {
      const aDone = parsePlannerDate(
        (a.doneAt as string | undefined) ?? (a.updatedAt as string | undefined),
      );
      const bDone = parsePlannerDate(
        (b.doneAt as string | undefined) ?? (b.updatedAt as string | undefined),
      );
      return (bDone?.getTime() ?? 0) - (aDone?.getTime() ?? 0);
    })
    .slice(0, limit);
};

export const getUpcomingHarvestMoments = (
  harvestEvents: CalendarHarvestWindowItem[],
  now = new Date(),
) => {
  const from = getStartOfToday(now).getTime();
  const to = addDays(getStartOfToday(now), 30).getTime();

  return harvestEvents
    .filter((event) => !event.harvestedAt)
    .filter((event) => {
      const start =
        parsePlannerDate(event.start)?.getTime() ?? Number.POSITIVE_INFINITY;
      const end =
        parsePlannerDate(event.end)?.getTime() ?? Number.POSITIVE_INFINITY;
      const isCurrent = start <= from && end >= from;
      const startsSoon = start >= from && start <= to;
      const endsSoon = end >= from && end <= to;
      return isCurrent || startsSoon || endsSoon;
    })
    .sort((a, b) => {
      const aStart =
        parsePlannerDate(a.start)?.getTime() ?? Number.POSITIVE_INFINITY;
      const bStart =
        parsePlannerDate(b.start)?.getTime() ?? Number.POSITIVE_INFINITY;
      return aStart - bStart;
    });
};

export const getWeekGroups = (
  weekTasks: TaskItem[],
  harvestEvents: CalendarHarvestWindowItem[],
  now = new Date(),
): PlannerWeekGroup[] => {
  const taskMap = new Map<string, TaskItem[]>();
  weekTasks.forEach((task) => {
    const key = toLocalDateKey(getTaskDueAt(task));
    if (!key) return;
    const items = taskMap.get(key) ?? [];
    items.push(task);
    taskMap.set(key, items);
  });

  const harvestMap = new Map<string, CalendarHarvestWindowItem[]>();
  harvestEvents.forEach((event) => {
    const key = toLocalDateKey(event.start) ?? toLocalDateKey(event.end);
    if (!key) return;
    const items = harvestMap.get(key) ?? [];
    items.push(event);
    harvestMap.set(key, items);
  });

  const keys = new Set<string>([...taskMap.keys(), ...harvestMap.keys()]);
  const horizonStart = addDays(getStartOfToday(now), 2).getTime();
  const horizonEnd = addDays(getStartOfToday(now), 8).getTime();

  return [...keys]
    .filter((key) => {
      const date = parsePlannerDate(key);
      if (!date) return false;
      const at = date.getTime();
      return at >= horizonStart && at < horizonEnd;
    })
    .sort((a, b) => {
      const aTime = parsePlannerDate(a)?.getTime() ?? 0;
      const bTime = parsePlannerDate(b)?.getTime() ?? 0;
      return aTime - bTime;
    })
    .map((dateKey) => ({
      dateKey,
      label: formatPlannerDate(dateKey),
      tasks: sortTasksByDue(taskMap.get(dateKey) ?? []),
      harvestEvents: harvestMap.get(dateKey) ?? [],
    }));
};

export const groupPlannerTasks = (tasks: TaskItem[], now = new Date()) => {
  const overdueTasks = getOverdueTasks(tasks, now);
  const todayTasks = getTodayTasks(tasks, now);
  const tomorrowTasks = getTomorrowTasks(tasks, now);
  const weekTasks = getWeekTasks(tasks, now);
  const noDueDateTasks = getNoDueDateTasks(tasks);

  return {
    overdueTasks,
    todayTasks,
    tomorrowTasks,
    weekTasks,
    noDueDateTasks,
  };
};
