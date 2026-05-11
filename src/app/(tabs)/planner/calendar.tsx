import { useGetCalendarWithOptions } from "@/src/api/queries/calendar/useGetCalendar";
import { TaskItem } from "@/src/api/queries/users/meTypes";
import { Screen } from "@/src/components/Screen";
import { spacing } from "@/src/theme/ui";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, MD3Theme, Text, useTheme } from "react-native-paper";
import { PlannerEmptyState } from "./_components/PlannerEmptyState";
import { PlannerHarvestCard } from "./_components/PlannerHarvestCard";
import { PlannerOfflineBanner } from "./_components/PlannerOfflineBanner";
import { PlannerSection } from "./_components/PlannerSection";
import { PlannerTaskCard } from "./_components/PlannerTaskCard";
import { usePlannerActions } from "./_hooks/usePlannerActions";
import { getAgendaGroups } from "./_hooks/usePlannerOverview";
import { formatPlannerDate, getPlannerRange } from "./_utils/plannerDateUtils";

export default function PlannerCalendarScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();
  const actions = usePlannerActions();

  const range = useMemo(() => getPlannerRange(14), []);
  const calendarQuery = useGetCalendarWithOptions(range, {
    includeDoneTasks: false,
    includeReminders: true,
  });

  const agendaGroups = useMemo(() => {
    const tasks = (calendarQuery.data?.tasks ?? []).filter(
      (task): task is TaskItem => task.status === "pending",
    );
    const harvestEvents = calendarQuery.data?.harvestEvents ?? [];
    const reminders = calendarQuery.data?.reminders ?? [];
    return getAgendaGroups(tasks, harvestEvents, reminders);
  }, [
    calendarQuery.data?.harvestEvents,
    calendarQuery.data?.reminders,
    calendarQuery.data?.tasks,
  ]);

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
      >
        <View style={styles.header}>
          <Text style={styles.title}>Agenda ogrodu</Text>
          <Text style={styles.subtitle}>Plan działań na najbliższe dni</Text>
        </View>

        {actions.isOffline ? <PlannerOfflineBanner /> : null}

        {calendarQuery.isLoading ? (
          <PlannerSection title="Najbliższe dni">
            <PlannerEmptyState
              title="Ładujemy agendę"
              description="Pobieramy zaplanowane działania i ważne momenty."
              icon="timer-sand"
            />
          </PlannerSection>
        ) : calendarQuery.isError ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>
              Nie udało się pobrać planu ogrodu
            </Text>
            <Button
              mode="outlined"
              onPress={() => void calendarQuery.refetch()}
            >
              Spróbuj ponownie
            </Button>
          </View>
        ) : agendaGroups.length === 0 ? (
          <PlannerSection title="Najbliższe dni">
            <PlannerEmptyState
              title="Brak wydarzeń"
              description="W tym zakresie nie ma zaplanowanych zadań ani zbiorów."
              icon="calendar-blank-outline"
            />
          </PlannerSection>
        ) : (
          agendaGroups.map((group) => (
            <PlannerSection
              key={group.dateKey}
              title={formatPlannerDate(group.dateKey)}
            >
              {group.tasks.map((task) => (
                <PlannerTaskCard
                  key={task.id}
                  task={task}
                  onDone={actions.completeTask}
                  onNavigate={navigateToTaskContext}
                  onDelete={actions.removeTask}
                  showDelete
                  disableActions={actions.isTaskBusy(task.id)}
                />
              ))}

              {group.harvestEvents.map((event) => (
                <PlannerHarvestCard
                  key={`${event.plantingId}-${event.start}`}
                  event={event}
                  onPress={(item) => {
                    if (!item.plantingId) return;
                    router.push(`/plantings/${item.plantingId}`);
                  }}
                />
              ))}

              {group.reminders.map((reminder) => (
                <View key={reminder.id} style={styles.reminderCard}>
                  <Text style={styles.reminderTitle}>{reminder.title}</Text>
                  {reminder.description ? (
                    <Text style={styles.reminderMeta}>
                      {reminder.description}
                    </Text>
                  ) : null}
                </View>
              ))}
            </PlannerSection>
          ))
        )}
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
      marginBottom: spacing.sm,
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
    errorWrap: {
      marginHorizontal: spacing.md,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: spacing.lg,
      gap: spacing.sm,
      backgroundColor: theme.colors.surface,
    },
    errorText: {
      fontSize: 15,
      color: theme.colors.onSurface,
    },
    reminderCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 16,
      gap: 4,
      backgroundColor: theme.colors.surface,
    },
    reminderTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    reminderMeta: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
  });
