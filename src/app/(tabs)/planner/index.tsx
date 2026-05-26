import { Screen } from "@/src/components/Screen";
import { PrimaryActionButton } from "@/src/components/ui/PrimaryActionButton";
import { getTaskNavigationTarget } from "@/src/features/tasks/taskRouting";
import { spacing } from "@/src/theme/ui";
import { pluralize } from "@/src/utils/pluralize";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, MD3Theme, Text, useTheme } from "react-native-paper";
import { PlannerDayGroup } from "./_components/PlannerDayGroup";
import { PlannerEmptyState } from "./_components/PlannerEmptyState";
import { PlannerHarvestCard } from "./_components/PlannerHarvestCard";
import { PlannerHeader } from "./_components/PlannerHeader";
import { PlannerOfflineBanner } from "./_components/PlannerOfflineBanner";
import { PlannerSection } from "./_components/PlannerSection";
import { PlannerSummaryCard } from "./_components/PlannerSummaryCard";
import { PlannerTaskCard } from "./_components/PlannerTaskCard";
import { usePlannerActions } from "./_hooks/usePlannerActions";
import { usePlannerOverview } from "./_hooks/usePlannerOverview";
import { formatPlannerDate } from "./_utils/plannerDateUtils";

const PREVIEW_LIMIT = 5;

export default function PlannerScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();

  const overview = usePlannerOverview(30);
  const actions = usePlannerActions();

  const headerSubtitle = (() => {
    if (overview.isOffline) return "Pokazujemy ostatnio zapisany plan";
    if (overview.summary.todayCount > 0) {
      return `Masz dziś ${overview.summary.todayCount} ${pluralize("pracę", "prace", "prac", overview.summary.todayCount)} w ogrodzie`;
    }
    return "Na dziś ogród nie wymaga pilnych działań";
  })();

  const navigateToTaskContext = (task: {
    ownerScopeType?: string | null;
    ownerScopeId?: string | null;
    plantingId?: string | null;
    bedId?: string | null;
  }) => {
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

  const weekItemsCount = overview.weekGroups.reduce(
    (count, group) => count + group.tasks.length + group.harvestEvents.length,
    0,
  );

  const weekPreviewGroups = (() => {
    let remaining = PREVIEW_LIMIT;

    return overview.weekGroups
      .map((group) => {
        if (remaining <= 0) {
          return {
            ...group,
            tasks: [],
            harvestEvents: [],
          };
        }

        const tasks = group.tasks.slice(0, remaining);
        remaining -= tasks.length;

        const harvestEvents = group.harvestEvents.slice(0, remaining);
        remaining -= harvestEvents.length;

        return {
          ...group,
          tasks,
          harvestEvents,
        };
      })
      .filter(
        (group) => group.tasks.length > 0 || group.harvestEvents.length > 0,
      );
  })();

  if (overview.isError) {
    return (
      <Screen safeAreaEdges={["top", "left", "right"]}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>
            Nie udało się pobrać planu ogrodu
          </Text>
          <Button mode="outlined" onPress={() => void overview.refetchAll()}>
            Spróbuj ponownie
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeAreaEdges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <PlannerHeader
          subtitle={headerSubtitle}
          dateLabel={formatPlannerDate(new Date())}
        />

        {overview.isOffline ? <PlannerOfflineBanner /> : null}

        <PlannerSummaryCard
          todayCount={overview.summary.todayCount}
          overdueCount={overview.summary.overdueCount}
          harvestCount={overview.summary.harvestCount}
        />

        <PrimaryActionButton
          onPress={() => router.push("/(tabs)/planner/create-task")}
          icon="plus"
          label="Dodaj własne zadanie"
          color={theme.colors.primary}
          style={styles.addOwnTaskButton}
        />

        <PlannerSection title="Do zrobienia dzisiaj">
          {overview.isLoading ? (
            <PlannerEmptyState
              title="Ładujemy plan dnia"
              description="Jeszcze chwila, przygotowujemy listę prac."
              icon="timer-sand"
            />
          ) : overview.todayTasks.length === 0 ? (
            <PlannerEmptyState
              title="Na dziś wszystko gotowe"
              description="Nie masz zaplanowanych prac w ogrodzie. Możesz sprawdzić nadchodzące zadania albo odpocząć."
              icon="check-circle-outline"
            />
          ) : (
            <>
              {overview.todayTasks.slice(0, PREVIEW_LIMIT).map((task) => (
                <PlannerTaskCard
                  key={task.id}
                  task={task}
                  onDone={actions.completeTask}
                  onNavigate={() => navigateToTaskContext(task)}
                  onDelete={actions.removeTask}
                  showDelete
                  disableActions={actions.isTaskBusy(task.id)}
                />
              ))}
              {overview.todayTasks.length > PREVIEW_LIMIT ? (
                <Button
                  mode="text"
                  onPress={() =>
                    router.push("/(tabs)/planner/tasks?filter=today")
                  }
                >
                  Pokaż wszystkie
                </Button>
              ) : null}
            </>
          )}
        </PlannerSection>

        {overview.overdueTasks.length > 0 ? (
          <PlannerSection
            title="Zaległe"
            subtitle="Zadania zaległe są automatycznie usuwane następnego dnia."
          >
            {overview.overdueTasks.slice(0, PREVIEW_LIMIT).map((task) => (
              <PlannerTaskCard
                key={task.id}
                task={task}
                isOverdue
                onDone={actions.completeTask}
                disableDoneAction
                onNavigate={() => navigateToTaskContext(task)}
                onDelete={actions.removeTask}
                showDelete
                disableActions={actions.isTaskBusy(task.id)}
              />
            ))}
            {overview.overdueTasks.length > PREVIEW_LIMIT ? (
              <Button
                mode="text"
                onPress={() =>
                  router.push("/(tabs)/planner/tasks?filter=overdue")
                }
              >
                Pokaż wszystkie
              </Button>
            ) : null}
          </PlannerSection>
        ) : null}

        <PlannerSection title="Jutro">
          {overview.tomorrowTasks.length === 0 ? (
            <PlannerEmptyState
              title="Spokojne jutro"
              description="Jutro nie masz zaplanowanych prac."
              icon="weather-night"
            />
          ) : (
            overview.tomorrowTasks
              .slice(0, PREVIEW_LIMIT)
              .map((task) => (
                <PlannerTaskCard
                  key={task.id}
                  task={task}
                  onDone={actions.completeTask}
                  onNavigate={() => navigateToTaskContext(task)}
                  onDelete={actions.removeTask}
                  showDelete
                  disableActions={actions.isTaskBusy(task.id)}
                />
              ))
          )}
          {overview.tomorrowTasks.length > PREVIEW_LIMIT ? (
            <Button
              mode="text"
              onPress={() =>
                router.push("/(tabs)/planner/tasks?filter=tomorrow")
              }
            >
              Pokaż wszystkie
            </Button>
          ) : null}
        </PlannerSection>

        <PlannerSection title="Ten tydzień">
          {overview.weekGroups.length === 0 ? (
            <PlannerEmptyState
              title="Spokojny tydzień"
              description="Na najbliższe dni nie ma zaplanowanych większych prac."
            />
          ) : (
            weekPreviewGroups.map((group) => (
              <PlannerDayGroup
                key={group.dateKey}
                title={group.label}
                tasks={group.tasks}
                harvestEvents={group.harvestEvents}
                onTaskDone={actions.completeTask}
                onTaskNavigate={(task) => navigateToTaskContext(task)}
                onHarvestNavigate={(event) => {
                  if (!event.plantingId) return;
                  router.push(`/plantings/${event.plantingId}`);
                }}
                disableTaskActions={(task) => actions.isTaskBusy(task.id)}
              />
            ))
          )}
          {weekItemsCount > PREVIEW_LIMIT ? (
            <Button
              mode="text"
              onPress={() => router.push("/(tabs)/planner/tasks?filter=week")}
            >
              Pokaż wszystkie
            </Button>
          ) : null}
        </PlannerSection>

        {overview.upcomingHarvestMoments.length > 0 ? (
          <PlannerSection title="Nadchodzące ważne momenty">
            {overview.upcomingHarvestMoments
              .slice(0, PREVIEW_LIMIT)
              .map((event) => (
                <PlannerHarvestCard
                  key={`${event.plantingId}-${event.start}`}
                  event={event}
                  onPress={(item) => {
                    if (!item.plantingId) return;
                    router.push(`/plantings/${item.plantingId}`);
                  }}
                />
              ))}
          </PlannerSection>
        ) : null}

        <PlannerSection title="Ostatnio wykonane">
          {overview.recentCompletedTasks.length === 0 ? (
            <PlannerEmptyState
              title="Brak ostatnich wpisów"
              description="Gdy oznaczysz zadanie jako wykonane, pojawi się tutaj historia."
              icon="history"
            />
          ) : (
            overview.recentCompletedTasks
              .slice(0, PREVIEW_LIMIT)
              .map((task) => (
                <PlannerTaskCard
                  key={task.id}
                  task={task}
                  onNavigate={() => navigateToTaskContext(task)}
                />
              ))
          )}
          {overview.recentCompletedTasks.length > PREVIEW_LIMIT ? (
            <Button
              mode="text"
              onPress={() =>
                router.push("/(tabs)/planner/tasks?filter=recent-completed")
              }
            >
              Pokaż wszystkie
            </Button>
          ) : null}
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
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.lg,
      gap: spacing.md,
    },
    errorTitle: {
      fontSize: 16,
      color: theme.colors.onSurface,
      textAlign: "center",
    },
    addOwnTaskButton: {
      marginHorizontal: spacing.md,
    },
  });
