import { Screen } from "@/src/components/Screen";
import { spacing } from "@/src/theme/ui";
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
import {
  formatPlannerDate,
  formatPlannerTime,
} from "./_utils/plannerDateUtils";

const PREVIEW_LIMIT = 5;

export default function PlannerScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();

  const overview = usePlannerOverview(30);
  const actions = usePlannerActions();

  const headerSubtitle = (() => {
    if (overview.isOffline) return "Pokazujemy ostatnio zapisany plan";
    if (overview.summary.overdueCount > 0) {
      return `Masz ${overview.summary.overdueCount} zaległych zadań`;
    }
    if (overview.summary.todayCount > 0) {
      return `Masz dziś ${overview.summary.todayCount} prac w ogrodzie`;
    }
    return "Na dziś ogród nie wymaga pilnych działań";
  })();

  const navigateToTaskContext = (task: {
    plantingId?: string | null;
    bedId?: string | null;
  }) => {
    if (task.plantingId) {
      router.push(`/plantings/${task.plantingId}`);
      return;
    }

    if (task.bedId) {
      router.push(`/(tabs)/beds/${task.bedId}`);
    }
  };

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
          computedAtLabel={formatPlannerTime(overview.computedAt)}
        />

        {overview.isOffline ? <PlannerOfflineBanner /> : null}

        <PlannerSummaryCard
          todayCount={overview.summary.todayCount}
          overdueCount={overview.summary.overdueCount}
          harvestCount={overview.summary.harvestCount}
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
                  onPress={() => router.push("/(tabs)/planner/tasks")}
                >
                  Pokaż wszystkie
                </Button>
              ) : null}
            </>
          )}
        </PlannerSection>

        {overview.overdueTasks.length > 0 ? (
          <PlannerSection title="Zaległe">
            {overview.overdueTasks.slice(0, PREVIEW_LIMIT).map((task) => (
              <PlannerTaskCard
                key={task.id}
                task={task}
                isOverdue
                onDone={actions.completeTask}
                onNavigate={() => navigateToTaskContext(task)}
                onDelete={actions.removeTask}
                showDelete
                disableActions={actions.isTaskBusy(task.id)}
              />
            ))}
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
            overview.tomorrowTasks.map((task) => (
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
        </PlannerSection>

        <PlannerSection title="Ten tydzień">
          {overview.weekGroups.length === 0 ? (
            <PlannerEmptyState
              title="Spokojny tydzień"
              description="Na najbliższe dni nie ma zaplanowanych większych prac."
            />
          ) : (
            overview.weekGroups.map((group) => (
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

        <PlannerSection
          title="Ostatnio wykonane"
          rightSlot={
            <Button
              mode="text"
              compact
              onPress={() => router.push("/(tabs)/planner/tasks?filter=done")}
            >
              Pokaż historię
            </Button>
          }
        >
          {overview.recentCompletedTasks.length === 0 ? (
            <PlannerEmptyState
              title="Brak ostatnich wpisów"
              description="Gdy oznaczysz zadanie jako wykonane, pojawi się tutaj historia."
              icon="history"
            />
          ) : (
            overview.recentCompletedTasks.map((task) => (
              <PlannerTaskCard
                key={task.id}
                task={task}
                onNavigate={() => navigateToTaskContext(task)}
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
  });
