import { TaskItem } from "@/src/api/queries/users/meTypes";
import { useGetMyTasks } from "@/src/api/queries/users/useGetMyTasks";
import { Screen } from "@/src/components/Screen";
import {
  getTaskMeta,
  isTaskActive,
  isWeatherWarningTask,
} from "@/src/features/tasks/model";
import {
  getTaskOwnerScope,
  getTaskRelationType,
} from "@/src/features/tasks/taskOwnership";
import { getTaskNavigationTarget } from "@/src/features/tasks/taskRouting";
import { spacing } from "@/src/theme/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";
import { PlannerEmptyState } from "./_components/PlannerEmptyState";
import { PlannerSection } from "./_components/PlannerSection";
import { PlannerTaskCard } from "./_components/PlannerTaskCard";
import { usePlannerActions } from "./_hooks/usePlannerActions";
import { groupPlannerTasks } from "./_utils/plannerGrouping";
import { normalizeTaskStatus } from "./_utils/plannerPresentation";

type PlannerTasksFilter =
  | "all"
  | "pending"
  | "done"
  | "today"
  | "overdue"
  | "tomorrow"
  | "week"
  | "manual"
  | "weather"
  | "planting"
  | "bed"
  | "space"
  | "related";

const FILTER_LABELS: Record<PlannerTasksFilter, string> = {
  all: "Wszystkie",
  pending: "Do zrobienia",
  done: "Wykonane",
  today: "Do zrobienia dzisiaj",
  overdue: "Zaległe",
  tomorrow: "Jutro",
  week: "Ten tydzień",
  manual: "Ręczne",
  weather: "Pogoda",
  planting: "Z upraw",
  bed: "Z grządek",
  space: "Z przestrzeni",
  related: "Powiązane",
};

const toInitialFilter = (
  value: string | string[] | undefined,
): PlannerTasksFilter => {
  const param = Array.isArray(value) ? value[0] : value;
  if (!param) return "all";
  if (
    param === "all" ||
    param === "pending" ||
    param === "done" ||
    param === "today" ||
    param === "overdue" ||
    param === "tomorrow" ||
    param === "week" ||
    param === "manual" ||
    param === "weather" ||
    param === "planting" ||
    param === "bed" ||
    param === "space" ||
    param === "related"
  ) {
    return param;
  }
  return "all";
};

export default function PlannerTasksScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: string | string[] }>();

  const [filter, setFilter] = useState<PlannerTasksFilter>(
    toInitialFilter(params.filter),
  );

  const shouldFetchPendingTasks = filter !== "done";
  const shouldFetchDoneTasks = filter === "done" || filter === "all";

  const pendingTasksQuery = useGetMyTasks("pending", {
    enabled: shouldFetchPendingTasks,
  });
  const doneTasksQuery = useGetMyTasks("done", {
    enabled: shouldFetchDoneTasks,
  });
  const actions = usePlannerActions();

  const groupedTasks = useMemo(
    () => groupPlannerTasks(pendingTasksQuery.data?.items ?? []),
    [pendingTasksQuery.data?.items],
  );

  const filterItemsMap = useMemo(() => {
    const items = pendingTasksQuery.data?.items ?? [];
    const doneItems = doneTasksQuery.data?.items ?? [];
    const overdueTaskIdSet = new Set(
      groupedTasks.overdueTasks.map((task) => task.id),
    );

    const isDoneTask = (task: TaskItem) => {
      const normalized = normalizeTaskStatus(task.status);
      if (normalized === "done") return true;

      const doneAt =
        task.doneAt ??
        getTaskMeta(
          task,
          "doneAt",
          "done_at",
          "completedAt",
          "completed_at",
          "finishedAt",
          "finished_at",
        );

      return Boolean(doneAt);
    };

    const allItems = [...items, ...doneItems];

    const sortedByDue = [...allItems].sort((a, b) => {
      const aDue = a.dueAt ? Date.parse(a.dueAt) : Number.MAX_SAFE_INTEGER;
      const bDue = b.dueAt ? Date.parse(b.dueAt) : Number.MAX_SAFE_INTEGER;
      return aDue - bDue;
    });

    const activeSorted = sortedByDue
      .filter((task) => normalizeTaskStatus(task.status) !== "canceled")
      .sort((a, b) => {
        const statusA = normalizeTaskStatus(a.status);
        const statusB = normalizeTaskStatus(b.status);
        const overdueA = overdueTaskIdSet.has(a.id);
        const overdueB = overdueTaskIdSet.has(b.id);

        const rankA =
          statusA === "pending" && !overdueA
            ? 0
            : statusA === "pending" && overdueA
              ? 1
              : 2;
        const rankB =
          statusB === "pending" && !overdueB
            ? 0
            : statusB === "pending" && overdueB
              ? 1
              : 2;

        if (rankA !== rankB) return rankA - rankB;

        const aDue = a.dueAt ? Date.parse(a.dueAt) : Number.MAX_SAFE_INTEGER;
        const bDue = b.dueAt ? Date.parse(b.dueAt) : Number.MAX_SAFE_INTEGER;
        return aDue - bDue;
      });

    const plantingTasks = sortedByDue.filter((task) => {
      return getTaskOwnerScope(task) === "planting";
    });

    const bedTasks = sortedByDue.filter((task) => {
      return getTaskOwnerScope(task) === "bed";
    });

    const spaceTasks = sortedByDue.filter((task) => {
      return getTaskOwnerScope(task) === "growing_space";
    });

    const relatedTasks = sortedByDue.filter((task) => {
      const relation = getTaskRelationType(task);
      return (
        relation === "related_from_bed" || relation === "related_from_space"
      );
    });

    const weekWithNearHorizon = [
      ...groupedTasks.todayTasks,
      ...groupedTasks.tomorrowTasks,
      ...groupedTasks.weekTasks,
    ];

    const uniqueById = (list: TaskItem[]) => {
      const seen = new Set<string>();
      return list.filter((task) => {
        if (seen.has(task.id)) return false;
        seen.add(task.id);
        return true;
      });
    };

    const doneTaskMap = new Map<string, TaskItem>();
    for (const task of sortedByDue) {
      if (isDoneTask(task)) doneTaskMap.set(task.id, task);
    }
    for (const task of doneItems) {
      if (isDoneTask(task)) doneTaskMap.set(task.id, task);
    }

    const doneTasks = [...doneTaskMap.values()].sort((a, b) => {
      const aDoneAt =
        Date.parse(
          (a.doneAt as string | undefined) ??
            getTaskMeta(
              a,
              "doneAt",
              "done_at",
              "completedAt",
              "completed_at",
              "finishedAt",
              "finished_at",
            ) ??
            (a.updatedAt as string | undefined) ??
            "",
        ) || 0;
      const bDoneAt =
        Date.parse(
          (b.doneAt as string | undefined) ??
            getTaskMeta(
              b,
              "doneAt",
              "done_at",
              "completedAt",
              "completed_at",
              "finishedAt",
              "finished_at",
            ) ??
            (b.updatedAt as string | undefined) ??
            "",
        ) || 0;
      return bDoneAt - aDoneAt;
    });

    return {
      all: activeSorted,
      pending: sortedByDue.filter(
        (task) => isTaskActive(task) && !overdueTaskIdSet.has(task.id),
      ),
      done: doneTasks,
      today: groupedTasks.todayTasks,
      overdue: groupedTasks.overdueTasks,
      tomorrow: groupedTasks.tomorrowTasks,
      week: uniqueById(weekWithNearHorizon),
      manual: sortedByDue.filter(
        (task) => (task.source ?? "").toUpperCase() === "MANUAL",
      ),
      weather: sortedByDue.filter((task) => isWeatherWarningTask(task)),
      planting: plantingTasks,
      bed: bedTasks,
      space: spaceTasks,
      related: relatedTasks,
    } satisfies Record<PlannerTasksFilter, TaskItem[]>;
  }, [
    doneTasksQuery.data?.items,
    groupedTasks.overdueTasks,
    groupedTasks.todayTasks,
    groupedTasks.tomorrowTasks,
    groupedTasks.weekTasks,
    pendingTasksQuery.data?.items,
  ]);

  const filterCounts = useMemo(
    () =>
      Object.fromEntries(
        (Object.keys(FILTER_LABELS) as PlannerTasksFilter[]).map((key) => [
          key,
          filterItemsMap[key].length,
        ]),
      ) as Record<PlannerTasksFilter, number>,
    [filterItemsMap],
  );

  const tasksToRender = filterItemsMap[filter];
  const overdueTaskIds = useMemo(
    () => new Set(groupedTasks.overdueTasks.map((task) => task.id)),
    [groupedTasks.overdueTasks],
  );

  const navigateToTaskContext = (task: TaskItem) => {
    const target = getTaskNavigationTarget(task);
    if (!target) return;
    if (target.type === "planting") {
      if (target.bedId) {
        router.push(
          `/(tabs)/beds/${target.bedId}/plantings/${target.plantingId}`,
        );
        return;
      }
      router.push(`/plantings/${target.plantingId}`);
      return;
    }

    if (target.type === "space") {
      router.push("/(tabs)/planner/tasks?filter=space");
      return;
    }

    router.push(`/(tabs)/beds/${target.bedId}`);
  };

  return (
    <Screen safeAreaEdges={["left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={
              pendingTasksQuery.isRefetching || doneTasksQuery.isRefetching
            }
            onRefresh={() => {
              const refetchers: Array<Promise<unknown>> = [];

              if (shouldFetchPendingTasks) {
                refetchers.push(pendingTasksQuery.refetch());
              }

              if (shouldFetchDoneTasks) {
                refetchers.push(doneTasksQuery.refetch());
              }

              void Promise.all(refetchers);
            }}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Wszystkie zadania</Text>
          <Text style={styles.subtitle}>
            Filtruj i planuj bieżące działania
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {(Object.keys(FILTER_LABELS) as PlannerTasksFilter[]).map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.filterChip,
                filter === key ? styles.filterChipActive : null,
              ]}
              onPress={() => setFilter(key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === key ? styles.filterChipTextActive : null,
                ]}
              >
                {FILTER_LABELS[key]} ({filterCounts[key]})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <PlannerSection
          title={`${FILTER_LABELS[filter]} (${tasksToRender.length})`}
        >
          {tasksToRender.length === 0 ? (
            <PlannerEmptyState
              title="Brak zadań"
              description="Dla wybranego filtra nie ma żadnych pozycji."
              icon="check-circle-outline"
            />
          ) : (
            tasksToRender.map((task) => (
              <PlannerTaskCard
                key={task.id}
                task={task}
                onDone={
                  normalizeTaskStatus(task.status) === "pending"
                    ? actions.completeTask
                    : undefined
                }
                onNavigate={navigateToTaskContext}
                onDelete={
                  normalizeTaskStatus(task.status) === "pending"
                    ? actions.removeTask
                    : undefined
                }
                showDelete={normalizeTaskStatus(task.status) === "pending"}
                disableActions={actions.isTaskBusy(task.id)}
                isOverdue={overdueTaskIds.has(task.id)}
                disableDoneAction={overdueTaskIds.has(task.id)}
              />
            ))
          )}
        </PlannerSection>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      paddingBottom: spacing.xl,
      paddingTop: 0,
      gap: spacing.sm,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
    },
    title: {
      fontSize: 30,
      fontWeight: "700",
      color: theme.colors.onBackground,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    filtersRow: {
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
      paddingVertical: spacing.sm,
    },
    filterChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    filterChipActive: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primaryContainer,
    },
    filterChipText: {
      fontSize: 13,
      color: theme.colors.onSurface,
      fontWeight: "600",
    },
    filterChipTextActive: {
      color: theme.colors.onPrimaryContainer,
    },
  });
