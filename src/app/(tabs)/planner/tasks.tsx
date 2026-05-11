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
import { Button, MD3Theme, Text, useTheme } from "react-native-paper";
import { PlannerEmptyState } from "./_components/PlannerEmptyState";
import { PlannerSection } from "./_components/PlannerSection";
import { PlannerTaskCard } from "./_components/PlannerTaskCard";
import { usePlannerActions } from "./_hooks/usePlannerActions";

type PlannerTasksFilter =
  | "all"
  | "pending"
  | "done"
  | "manual"
  | "weather"
  | "vegetable-rule";

const FILTER_LABELS: Record<PlannerTasksFilter, string> = {
  all: "Wszystkie",
  pending: "Do zrobienia",
  done: "Wykonane",
  manual: "Ręczne",
  weather: "Pogoda",
  "vegetable-rule": "Z upraw",
};

const normalizeStatus = (status: string | null | undefined) => {
  const normalized = status?.trim().toLowerCase();
  if (normalized === "done") return "done";
  if (normalized === "canceled") return "canceled";
  return "pending";
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

  const filteredTasks = useMemo(() => {
    const items = tasksQuery.data?.items ?? [];

    const sorted = [...items].sort((a, b) => {
      const aDue = a.dueAt ? Date.parse(a.dueAt) : Number.MAX_SAFE_INTEGER;
      const bDue = b.dueAt ? Date.parse(b.dueAt) : Number.MAX_SAFE_INTEGER;
      return aDue - bDue;
    });

    return sorted.filter((task) => {
      const source = (task.source ?? "").toUpperCase();
      const status = normalizeStatus(task.status);

      if (filter === "pending") return status === "pending";
      if (filter === "done") return status === "done";
      if (filter === "manual") return source === "MANUAL";
      if (filter === "weather") return source === "WEATHER_WARNING";
      if (filter === "vegetable-rule") return source === "VEGETABLE_RULE";

      return status !== "canceled";
    });
  }, [filter, tasksQuery.data?.items]);

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
          {filteredTasks.length === 0 ? (
            <PlannerEmptyState
              title="Brak zadań"
              description="Dla wybranego filtra nie ma żadnych pozycji."
              icon="check-circle-outline"
            />
          ) : (
            filteredTasks.map((task) => (
              <PlannerTaskCard
                key={task.id}
                task={task}
                onDone={
                  normalizeStatus(task.status) === "pending"
                    ? actions.completeTask
                    : undefined
                }
                onNavigate={navigateToTaskContext}
                onDelete={
                  normalizeStatus(task.status) === "pending"
                    ? actions.removeTask
                    : undefined
                }
                showDelete={normalizeStatus(task.status) === "pending"}
                disableActions={actions.isTaskBusy(task.id)}
                isOverdue={false}
              />
            ))
          )}
        </PlannerSection>

        <View style={styles.footerActions}>
          <Button
            mode="outlined"
            onPress={() => router.push("/(tabs)/planner")}
          >
            Wróć do planu dnia
          </Button>
        </View>
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
    footerActions: {
      paddingHorizontal: spacing.md,
      marginTop: spacing.md,
    },
  });
