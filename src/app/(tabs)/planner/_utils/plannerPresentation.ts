import { CalendarHarvestWindowItem } from "@/src/api/queries/calendar/types";
import { TaskItem } from "@/src/api/queries/users/meTypes";
import {
  getTaskMeta,
  getTaskNavigationTarget,
  getTaskOwnerScope,
} from "@/src/features/tasks/model";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import {
  formatPlannerDate,
  formatRelativeDayDistance,
  parsePlannerDate,
} from "./plannerDateUtils";
import {
  getSourceLabel,
  getSourceTone,
  targetTypeLabelMap,
} from "./plannerLabels";

export type PlannerTaskContext = {
  title: string;
  subtitle: string | null;
  canNavigate: boolean;
};

export const normalizeTaskStatus = (status: string | null | undefined) => {
  const normalized = status?.trim().toLowerCase();
  if (
    normalized === "done" ||
    normalized === "completed" ||
    normalized === "complete" ||
    normalized === "finished"
  ) {
    return "done" as const;
  }
  if (normalized === "canceled" || normalized === "cancelled") {
    return "canceled" as const;
  }
  return "pending" as const;
};

export const getTaskDueAt = (task: TaskItem) => {
  return getTaskMeta(task, "dueAt", "due_at");
};

export const getTaskContext = (task: TaskItem): PlannerTaskContext => {
  const targetType = getTaskOwnerScope(task);
  const bedName =
    getTaskMeta(task, "bedName", "bed_name") ?? task.bedName ?? null;
  const vegetableName =
    getTaskMeta(task, "vegetableName", "vegetable_name") ??
    task.vegetableName ??
    null;

  if (targetType === "planting") {
    const navTarget = getTaskNavigationTarget(task);
    return {
      title: vegetableName ?? "Uprawa",
      subtitle: bedName ? `Grządka: ${bedName}` : null,
      canNavigate: navTarget?.type === "planting",
    };
  }

  if (targetType === "bed") {
    const affectedVegetables = getTaskMeta(task, "affectedVegetables");
    const navTarget = getTaskNavigationTarget(task);
    return {
      title: bedName ?? "Grządka",
      subtitle: affectedVegetables ? `Dotyczy: ${affectedVegetables}` : null,
      canNavigate: navTarget?.type === "bed",
    };
  }

  if (targetType === "space") {
    return {
      title: targetTypeLabelMap.space,
      subtitle: getTaskMeta(task, "locationLabel", "location"),
      canNavigate: false,
    };
  }

  const affectedBedsCount = getTaskMeta(task, "affectedBedsCount");
  return {
    title: targetTypeLabelMap.user,
    subtitle: affectedBedsCount ? `Dotyczy ${affectedBedsCount} grządek` : null,
    canNavigate: false,
  };
};

export const getTaskSourceChip = (task: TaskItem) => {
  const source = task.source ?? getTaskMeta(task, "source") ?? null;
  const sourceType = task.sourceType ?? getTaskMeta(task, "sourceType") ?? null;
  return {
    label: getSourceLabel({ source, sourceType }),
    tone: getSourceTone(source),
  };
};

const hasToken = (value: string | null | undefined, token: string) =>
  (value ?? "").toUpperCase().includes(token);

export const getTaskIconName = (
  task: TaskItem,
): ComponentProps<typeof MaterialCommunityIcons>["name"] => {
  const actionKind = getTaskMeta(task, "actionKind", "decisionType") ?? "";
  const actionType = task.actionTemplate?.type ?? "";
  const title = task.title ?? "";

  if (
    hasToken(actionKind, "WATERING") ||
    hasToken(actionType, "WATER") ||
    hasToken(title, "podlej")
  ) {
    return "water-outline";
  }

  if (hasToken(actionKind, "MOISTURE_CHECK")) return "water-check-outline";
  if (hasToken(actionKind, "FERTILIZATION")) return "leaf";
  if (hasToken(actionKind, "PEST_CHECK")) return "ladybug";
  if (hasToken(actionKind, "DISEASE_CHECK")) return "shield-alert-outline";
  if (hasToken(actionKind, "WEEDING")) return "shovel";
  if (hasToken(actionKind, "HARVEST")) return "basket-outline";

  const source = (task.source ?? "").toUpperCase();
  if (source === "WEATHER_WARNING") return "weather-partly-rainy";
  if (source === "MANUAL") return "check-circle-outline";

  return "sprout-outline";
};

export const getHarvestMomentLabel = (
  event: CalendarHarvestWindowItem,
  now = new Date(),
) => {
  const start = parsePlannerDate(event.start);
  const end = parsePlannerDate(event.end);

  if (!start || !end) return "Nadchodzący zbiór";

  const startDiff = formatRelativeDayDistance(start, now);
  const endDiff = formatRelativeDayDistance(end, now);

  if (startDiff <= 0 && endDiff >= 0) {
    if (endDiff <= 2) {
      return endDiff === 0 ? "Kończy się dziś" : `Kończy się za ${endDiff} dni`;
    }
    return "Zbiór trwa";
  }

  if (startDiff > 0) {
    return startDiff === 1 ? "Zbiór jutro" : `Zbiór za ${startDiff} dni`;
  }

  return "Okno zbioru minęło";
};

export const getHarvestRangeLabel = (event: CalendarHarvestWindowItem) => {
  const start = formatPlannerDate(event.start, {
    day: "numeric",
    month: "long",
  });
  const end = formatPlannerDate(event.end, { day: "numeric", month: "long" });

  if (!start && !end) return "";
  if (!start) return `Do ${end}`;
  if (!end) return `Od ${start}`;
  return `${start} – ${end}`;
};
