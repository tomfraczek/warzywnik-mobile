import { TaskItem } from "@/src/api/queries/users/meTypes";
import { useGetMyTasks } from "@/src/api/queries/users/useGetMyTasks";
import { Screen } from "@/src/components/Screen";
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
import {
  getRecentCompletedTasks,
  groupPlannerTasks,
} from "./_utils/plannerGrouping";
import { normalizeTaskStatus } from "./_utils/plannerPresentation";

type PlannerTasksFilter =
  | "all"
  | "pending"
  | "done"
  | "today"
  | "overdue"
  | "tomorrow"
  | "week"
  | "recent-completed"
  | "manual"
  | "weather"
  | "vegetable-rule";

const FILTER_LABELS: Record<PlannerTasksFilter, string> = {
  all: "Wszystkie",
  pending: "Do zrobienia",
  done: "Wykonane",
  today: "Do zrobienia dzisiaj",
  overdue: "Zaległe",
  tomorrow: "Jutro",
  week: "Ten tydzień",
  "recent-completed": "Ostatnio wykonane",
  manual: "Ręczne",
  weather: "Pogoda",
  "vegetable-rule": "Z upraw",
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
    param === "recent-completed" ||
    param === "manual" ||
    param === "weather" ||
    param === "vegetable-rule"
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

  const tasksQuery = useGetMyTasks("all");
  const actions = usePlannerActions();

  const groupedTasks = useMemo(
    () => groupPlannerTasks(tasksQuery.data?.items ?? []),
    [tasksQuery.data?.items],
  );

  const recentCompletedTasks = useMemo(
    () =>
      getRecentCompletedTasks(
        tasksQuery.data?.items ?? [],
        Number.MAX_SAFE_INTEGER,
      ),
    [tasksQuery.data?.items],
  );

  const filteredTasks = useMemo(() => {
    const items = tasksQuery.data?.items ?? [];

    const sorted = [...items].sort((a, b) => {
      const aDue = a.dueAt ? Date.parse(a.dueAt) : Number.MAX_SAFE_INTEGER;
      const bDue = b.dueAt ? Date.parse(b.dueAt) : Number.MAX_SAFE_INTEGER;
      return aDue - bDue;
    });

    return sorted.filter((task) => {
      const source = (task.source ?? "").toUpperCase();
      const status = normalizeTaskStatus(task.status);

      if (filter === "pending") return status === "pending";
      if (filter === "done") return status === "done";
      if (filter === "manual") return source === "MANUAL";
      if (filter === "weather") return source === "WEATHER_WARNING";
      if (filter === "vegetable-rule") return source === "VEGETABLE_RULE";

      return status !== "canceled";
    });
  }, [filter, tasksQuery.data?.items]);

  const calendarFilteredTasks = useMemo(() => {
    if (filter === "today") return groupedTasks.todayTasks;
    if (filter === "overdue") return groupedTasks.overdueTasks;
    if (filter === "tomorrow") return groupedTasks.tomorrowTasks;
    if (filter === "week") return groupedTasks.weekTasks;
    if (filter === "recent-completed") return recentCompletedTasks;
    return null;
  }, [filter, groupedTasks, recentCompletedTasks]);

  const tasksToRender = calendarFilteredTasks ?? filteredTasks;

  const navigateToTaskContext = (task: TaskItem) => {
    if (task.plantingId) {
      router.push(`/plantings/${task.plantingId}`);
      return;
    }
    if (task.bedId) {
      router.push(`/(tabs)/beds/${task.bedId}`);
    }
  };

  return (
    <Screen safeAreaEdges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={tasksQuery.isRefetching}
            onRefresh={() => void tasksQuery.refetch()}
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
                {FILTER_LABELS[key]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <PlannerSection title={FILTER_LABELS[filter]}>
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
                isOverdue={false}
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
      paddingTop: spacing.sm,
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
