import { getResponseError } from "@/src/api/axios";
import { useDeleteActionTask } from "@/src/api/queries/actionTasks/useDeleteActionTask";
import { useUpdateActionTask } from "@/src/api/queries/actionTasks/useUpdateActionTask";
import { Bed } from "@/src/api/queries/beds/types";
import { useGetBeds } from "@/src/api/queries/beds/useGetBeds";
import { CalendarTaskItem } from "@/src/api/queries/calendar/types";
import { useGetCalendar } from "@/src/api/queries/calendar/useGetCalendar";
import { Planting } from "@/src/api/queries/plantings/types";
import { useGetPlantings } from "@/src/api/queries/plantings/useGetPlantings";
import { TaskItem as MeTaskItem } from "@/src/api/queries/users/meTypes";
import { Screen } from "@/src/components/Screen";
import {
  formatTaskDayPart,
  formatTaskHorizon,
  formatTaskScope,
  formatTaskTargetType,
  getTaskMeta,
  getTaskTechnicalDetails,
  resolveTaskPresentation,
} from "@/src/features/tasks/model";
import { asNonEmptyString } from "@/src/features/warnings/model";
import { radius, spacing } from "@/src/theme/ui";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, MD3Theme, Surface, Text, useTheme } from "react-native-paper";

const pad2 = (n: number) => String(n).padStart(2, "0");

const formatDateOnly = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const asPlannerTaskItem = (task: CalendarTaskItem): MeTaskItem => {
  return {
    ...task,
    status: task.status ?? "pending",
  };
};

export default function PlannerCalendarScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();

  const range = useMemo(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 30);
    return {
      from: formatDateOnly(from),
      to: formatDateOnly(to),
    };
  }, []);

  const calendarQuery = useGetCalendar(range);
  const bedsQuery = useGetBeds({ limit: 100 });
  const plantingsQuery = useGetPlantings({ limit: 100 });
  const updateActionTask = useUpdateActionTask();
  const deleteActionTask = useDeleteActionTask();
  const days = useMemo(
    () => calendarQuery.data?.days ?? [],
    [calendarQuery.data?.days],
  );

  const bedsById = useMemo(() => {
    const map = new Map<string, string>();
    const beds = bedsQuery.data?.pages.flatMap((page) => page.items) ?? [];
    beds.forEach((bed: Bed) => {
      if (!bed?.id) return;
      const name = asNonEmptyString(bed.name);
      if (!name) return;
      map.set(bed.id, name);
    });
    return map;
  }, [bedsQuery.data?.pages]);

  const plantingsById = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        bedId: string | null;
        bedName: string | null;
        vegetableName: string | null;
      }
    >();
    const plantings =
      plantingsQuery.data?.pages.flatMap((page) => page.items) ?? [];

    plantings.forEach((planting: Planting) => {
      if (!planting?.id) return;
      const bedId = asNonEmptyString(planting.bedId);
      const bedName =
        asNonEmptyString(planting.bedName) ??
        (bedId ? (bedsById.get(bedId) ?? null) : null);
      const vegetableName =
        asNonEmptyString(planting.vegetableName) ??
        asNonEmptyString(planting.name) ??
        asNonEmptyString(planting.vegetable?.name);

      map.set(planting.id, {
        id: planting.id,
        bedId,
        bedName,
        vegetableName,
      });
    });

    return map;
  }, [bedsById, plantingsQuery.data?.pages]);

  const handleDone = (taskId: string) => {
    updateActionTask
      .mutateAsync({
        id: taskId,
        payload: { status: "done" },
      })
      .catch((error: unknown) => {
        Alert.alert("Błąd", String(getResponseError(error)));
      });
  };

  const handleDelete = (taskId: string) => {
    Alert.alert("Usunąć zadanie?", "Tej operacji nie można cofnąć.", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: () => {
          deleteActionTask.mutate(taskId, {
            onError: (error) => {
              Alert.alert("Błąd", String(getResponseError(error)));
            },
          });
        },
      },
    ]);
  };

  if (calendarQuery.isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (calendarQuery.error) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {String(getResponseError(calendarQuery.error))}
          </Text>
          <Button mode="outlined" onPress={() => calendarQuery.refetch()}>
            Spróbuj ponownie
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>
          Zakres: {range.from} → {range.to}
        </Text>

        {days.length === 0 ? (
          <Text style={styles.emptyText}>
            Brak wydarzeń w wybranym zakresie.
          </Text>
        ) : (
          days.map((day) => (
            <Surface key={day.date} style={styles.daySection} elevation={0}>
              <Text style={styles.dayTitle}>{day.date}</Text>

              {day.harvestWindows.length > 0 ? (
                <View style={styles.groupSection}>
                  <Text style={styles.groupTitle}>Harvest windows</Text>
                  {day.harvestWindows.map((windowItem) => (
                    <Pressable
                      key={`${windowItem.plantingId}-${windowItem.start}`}
                      style={styles.harvestItem}
                      onPress={() => {
                        if (!windowItem.plantingId) return;
                        router.push(`/plantings/${windowItem.plantingId}`);
                      }}
                    >
                      <Text style={styles.itemTitle}>{windowItem.title}</Text>
                      <Text style={styles.itemMeta}>
                        {windowItem.start} - {windowItem.end}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {day.tasks.length > 0 ? (
                <View style={styles.groupSection}>
                  <Text style={styles.groupTitle}>Tasks</Text>
                  {day.tasks.map((task) => {
                    const plannerTask = asPlannerTaskItem(task);
                    const presentation = resolveTaskPresentation(plannerTask, {
                      bedsById,
                      plantingsById,
                    });
                    const dueAt =
                      getTaskMeta(plannerTask, "dueAt", "due_at") ??
                      task.dueAt ??
                      day.date;

                    return (
                      <Surface
                        key={task.id}
                        style={styles.taskCard}
                        elevation={0}
                      >
                        <Text style={styles.itemTitle}>{task.title}</Text>
                        <Text style={styles.itemMeta}>Termin: {dueAt}</Text>
                        <Text style={styles.itemMeta}>
                          {presentation.locationLabel}
                          {presentation.cropLabel
                            ? ` • ${presentation.cropLabel}`
                            : ""}
                        </Text>

                        {presentation.horizon === "OPERATIONAL" ? (
                          <Text style={styles.taskMetaStrong}>
                            {presentation.dayLabel ?? "Dziś/Jutro"}
                            {presentation.dayPart === "DAY"
                              ? " • w dzień"
                              : presentation.dayPart === "NIGHT"
                                ? " • w nocy"
                                : ""}
                          </Text>
                        ) : null}

                        <View style={styles.actionsRow}>
                          {presentation.targetType === "planting" &&
                          presentation.plantingId ? (
                            <Button
                              mode="outlined"
                              onPress={() =>
                                router.push(
                                  `/plantings/${presentation.plantingId}`,
                                )
                              }
                            >
                              Uprawa
                            </Button>
                          ) : null}
                          {presentation.targetType === "bed" &&
                          presentation.bedId ? (
                            <Button
                              mode="outlined"
                              onPress={() =>
                                router.push(
                                  `/(tabs)/beds/${presentation.bedId}`,
                                )
                              }
                            >
                              Grządka
                            </Button>
                          ) : null}
                          {presentation.targetType === "user" ? (
                            <Button
                              mode="outlined"
                              onPress={() =>
                                router.push("/(tabs)/home/weather")
                              }
                            >
                              Lokalizacja
                            </Button>
                          ) : null}
                          <Button
                            mode="outlined"
                            onPress={() => handleDelete(task.id)}
                            disabled={deleteActionTask.isPending}
                          >
                            Usuń
                          </Button>
                          <Button
                            mode="contained"
                            onPress={() => handleDone(task.id)}
                            disabled={updateActionTask.isPending}
                          >
                            Done
                          </Button>
                        </View>

                        {__DEV__ ? (
                          <TaskTechnicalDetails item={plannerTask} />
                        ) : null}
                      </Surface>
                    );
                  })}
                </View>
              ) : null}
            </Surface>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function TaskTechnicalDetails({ item }: { item: MeTaskItem }) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const [open, setOpen] = useState(false);
  const technical = getTaskTechnicalDetails(item);

  return (
    <View style={styles.technicalBox}>
      <Pressable onPress={() => setOpen((prev) => !prev)}>
        <Text style={styles.technicalToggle}>Szczegóły techniczne</Text>
      </Pressable>
      {open ? (
        <View style={styles.technicalContent}>
          <Text style={styles.technicalText}>
            Typ celu: {formatTaskTargetType(technical.targetType)}
          </Text>
          <Text style={styles.technicalText}>
            Zakres: {formatTaskScope(technical.scope)}
          </Text>
          <Text style={styles.technicalText}>
            Horyzont: {formatTaskHorizon(technical.horizon)}
          </Text>
          <Text style={styles.technicalText}>
            Pora dnia: {formatTaskDayPart(technical.dayPart)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.onBackground,
    },
    subtitle: {
      marginTop: 6,
      marginBottom: 12,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.lg,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: "center",
    },
    daySection: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginBottom: spacing.sm,
      backgroundColor: theme.colors.surface,
      gap: spacing.sm,
    },
    dayTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    groupSection: {
      gap: spacing.xs,
    },
    groupTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.onSurfaceVariant,
    },
    harvestItem: {
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.tertiary,
      backgroundColor: theme.colors.surfaceVariant,
      padding: spacing.xs,
      gap: spacing.xs,
    },
    taskCard: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      padding: spacing.sm,
      gap: spacing.xs,
    },
    itemTitle: {
      fontSize: 14,
      color: theme.colors.onSurface,
      fontWeight: "600",
    },
    itemMeta: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    taskMetaStrong: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    actionsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    technicalBox: {
      marginTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      paddingTop: spacing.xs,
      gap: spacing.xs,
    },
    technicalToggle: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.primary,
    },
    technicalContent: {
      gap: spacing.xs,
    },
    technicalText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    emptyText: {
      marginTop: spacing.sm,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
  });
