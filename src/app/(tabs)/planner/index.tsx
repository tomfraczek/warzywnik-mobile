import { getResponseError } from "@/src/api/axios";
import { useDeleteActionTask } from "@/src/api/queries/actionTasks/useDeleteActionTask";
import { useUpdateActionTask } from "@/src/api/queries/actionTasks/useUpdateActionTask";
import { Bed } from "@/src/api/queries/beds/types";
import { useGetBeds } from "@/src/api/queries/beds/useGetBeds";
import { CalendarTaskItem } from "@/src/api/queries/calendar/types";
import {
  useGetCalendar,
  useGetCalendarWithOptions,
} from "@/src/api/queries/calendar/useGetCalendar";
import { Planting } from "@/src/api/queries/plantings/types";
import { useGetPlantings } from "@/src/api/queries/plantings/useGetPlantings";
import { TaskItem as MeTaskItem } from "@/src/api/queries/users/meTypes";
import { useGetMyTasks } from "@/src/api/queries/users/useGetMyTasks";
import { Screen } from "@/src/components/Screen";
import { Card } from "@/src/components/ui/Card";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { TaskItem } from "@/src/components/ui/TaskItem";
import {
  formatTaskDayPart,
  formatTaskHorizon,
  formatTaskScope,
  formatTaskTargetType,
  getTaskTechnicalDetails,
  getTaskMeta,
  resolveTaskPresentation,
} from "@/src/features/tasks/model";
import { asNonEmptyString } from "@/src/features/warnings/model";
import { radius, spacing } from "@/src/theme/ui";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import {
  Button,
  MD3Theme,
  Surface,
  Switch,
  Text,
  useTheme,
} from "react-native-paper";

const pad = (value: number) => String(value).padStart(2, "0");
const formatDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const getHistoryDate = (task: CalendarTaskItem, fallbackDate: string) =>
  task.doneAt ?? task.dueAt ?? task.createdAt ?? fallbackDate;

const toEpoch = (value: string) => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const asPlannerTaskItem = (task: CalendarTaskItem): MeTaskItem => {
  return {
    ...task,
    dueAt: task.dueAt ?? undefined,
    status: task.status ?? "pending",
  };
};

export default function PlannerScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();
  const [showCanceledHistory, setShowCanceledHistory] = useState(false);

  const range = useMemo(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 30);
    return {
      from: formatDate(from),
      to: formatDate(to),
    };
  }, []);

  const historyRange = useMemo(() => {
    const to = new Date();
    to.setHours(0, 0, 0, 0);
    const from = new Date(to);
    from.setDate(from.getDate() - 90);
    return {
      from: formatDate(from),
      to: formatDate(to),
    };
  }, []);

  const calendarQuery = useGetCalendar(range);
  const calendarHistoryQuery = useGetCalendarWithOptions(historyRange, {
    includeDoneTasks: true,
    includeReminders: false,
  });
  const tasksQuery = useGetMyTasks("pending");
  const bedsQuery = useGetBeds({ limit: 100 });
  const plantingsQuery = useGetPlantings({ limit: 100 });
  const updateActionTask = useUpdateActionTask();
  const deleteActionTask = useDeleteActionTask();

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

  const timeline = useMemo(
    () => calendarQuery.data?.days ?? [],
    [calendarQuery.data?.days],
  );
  const historyTimeline = useMemo(() => {
    const days = calendarHistoryQuery.data?.days ?? [];
    const grouped = days
      .map((day) => {
        const items = day.tasks
          .filter((task) => {
            const status = task.status ?? "pending";
            if (status === "done") return true;
            if (status === "canceled") return showCanceledHistory;
            return false;
          })
          .sort(
            (a, b) =>
              toEpoch(getHistoryDate(b, day.date)) -
              toEpoch(getHistoryDate(a, day.date)),
          );

        return {
          date: day.date,
          items,
        };
      })
      .filter((day) => day.items.length > 0)
      .sort((a, b) => toEpoch(b.date) - toEpoch(a.date));

    return grouped;
  }, [calendarHistoryQuery.data?.days, showCanceledHistory]);

  const latestTasks = useMemo(() => {
    const toDateValue = (task: MeTaskItem) => {
      const raw = getTaskMeta(
        task,
        "createdAt",
        "created_at",
        "dueAt",
        "due_at",
      );
      if (!raw) return 0;
      const value = Date.parse(raw);
      return Number.isNaN(value) ? 0 : value;
    };

    return [...(tasksQuery.data?.items ?? [])]
      .sort((a, b) => toDateValue(b) - toDateValue(a))
      .slice(0, 3);
  }, [tasksQuery.data?.items]);

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
      <Screen safeAreaEdges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (calendarQuery.error) {
    return (
      <Screen safeAreaEdges={["top", "left", "right"]}>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {String(getResponseError(calendarQuery.error))}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeAreaEdges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.dayBlock}>
          <View style={styles.timelineHeader}>
            <View style={styles.timelineDot} />
            <Text style={styles.dayLabel}>Lista zadań</Text>
          </View>

          <View style={styles.dayContent}>
            <View style={styles.stack}>
              {tasksQuery.isLoading ? (
                <View style={styles.inlineLoader}>
                  <ActivityIndicator />
                </View>
              ) : latestTasks.length === 0 ? (
                <Card>
                  <Text style={styles.emptyText}>Brak aktywnych zadań.</Text>
                </Card>
              ) : (
                latestTasks.map((task) => {
                  const presentation = resolveTaskPresentation(task, {
                    bedsById,
                    plantingsById,
                  });
                  const dueAt = getTaskMeta(task, "dueAt", "due_at");

                  return (
                    <Surface key={task.id} style={styles.taskCard} elevation={0}>
                      <Text style={styles.taskTitle}>{task.title}</Text>

                      {typeof task.description === "string" &&
                      task.description.trim().length > 0 ? (
                        <Text style={styles.taskDescription}>
                          {task.description}
                        </Text>
                      ) : null}

                      <Text style={styles.taskMeta}>
                        Termin: {dueAt ? dueAt.split("T")[0] : "Brak"}
                      </Text>
                      <Text style={styles.taskMeta}>
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
                              router.push(`/plantings/${presentation.plantingId}`)
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
                              router.push(`/(tabs)/beds/${presentation.bedId}`)
                            }
                          >
                            Grządka
                          </Button>
                        ) : null}
                        {presentation.targetType === "user" ? (
                          <Button
                            mode="outlined"
                            onPress={() => router.push("/(tabs)/home/weather")}
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

                      {__DEV__ ? <TaskTechnicalDetails item={task} /> : null}
                    </Surface>
                  );
                })
              )}

              <Button
                mode="outlined"
                onPress={() => router.push("/(tabs)/planner/tasks")}
              >
                Pokaż wszystkie
              </Button>
            </View>
          </View>
        </View>

        <Text style={styles.title}>Kalendarz zadań</Text>
        <Text style={styles.subtitle}>
          Dynamiczna oś czasu zadań systemowych i zbiorów
        </Text>
        {timeline.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>
              Brak zaplanowanych wydarzeń w najbliższych 30 dniach.
            </Text>
          </Card>
        ) : (
          timeline.map((day) => (
            <View key={day.date} style={styles.dayBlock}>
              <View style={styles.timelineHeader}>
                <View style={styles.timelineDot} />
                <Text style={styles.dayLabel}>{day.date}</Text>
              </View>

              <View style={styles.dayContent}>
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
                    <Surface key={task.id} style={styles.taskCard} elevation={0}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <Text style={styles.taskMeta}>Termin: {dueAt}</Text>
                      <Text style={styles.taskMeta}>
                        {presentation.locationLabel}
                        {presentation.cropLabel ? ` • ${presentation.cropLabel}` : ""}
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
                              router.push(`/plantings/${presentation.plantingId}`)
                            }
                          >
                            Uprawa
                          </Button>
                        ) : null}
                        {presentation.targetType === "bed" && presentation.bedId ? (
                          <Button
                            mode="outlined"
                            onPress={() =>
                              router.push(`/(tabs)/beds/${presentation.bedId}`)
                            }
                          >
                            Grządka
                          </Button>
                        ) : null}
                        {presentation.targetType === "user" ? (
                          <Button
                            mode="outlined"
                            onPress={() => router.push("/(tabs)/home/weather")}
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

                      {__DEV__ ? <TaskTechnicalDetails item={plannerTask} /> : null}
                    </Surface>
                  );
                })}

                {day.harvestWindows.map((window) => (
                  <Pressable
                    key={`${window.plantingId}-${window.start}`}
                    style={styles.harvestCard}
                    onPress={() =>
                      router.push(`/plantings/${window.plantingId}`)
                    }
                  >
                    <View style={styles.harvestTop}>
                      <Text style={styles.harvestTitle}>{window.title}</Text>
                      <StatusBadge label="Zbiory" tone="success" />
                    </View>
                    <Text style={styles.harvestMeta}>
                      {window.start} → {window.end}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}

        <Card>
          <View style={styles.footerHint}>
            <MaterialCommunityIcons
              name="robot-outline"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.hintText}>
              Widok generowany automatycznie przez silnik planowania Warzywnik.
            </Text>
          </View>
        </Card>

        <Text style={styles.title}>Historia</Text>
        <View style={styles.historyFilterRow}>
          <Text style={styles.historyFilterLabel}>Pokaż anulowane</Text>
          <Switch
            value={showCanceledHistory}
            onValueChange={setShowCanceledHistory}
          />
        </View>

        {calendarHistoryQuery.isLoading ? (
          <Card>
            <View style={styles.inlineLoader}>
              <ActivityIndicator />
            </View>
          </Card>
        ) : calendarHistoryQuery.error ? (
          <Card>
            <Text style={styles.errorText}>
              {String(getResponseError(calendarHistoryQuery.error))}
            </Text>
            <Button
              mode="outlined"
              onPress={() => calendarHistoryQuery.refetch()}
            >
              Spróbuj ponownie
            </Button>
          </Card>
        ) : historyTimeline.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Brak historii w tym zakresie.</Text>
          </Card>
        ) : (
          historyTimeline.map((day) => (
            <View key={`history-${day.date}`} style={styles.dayBlock}>
              <View style={styles.timelineHeader}>
                <View style={styles.timelineDot} />
                <Text style={styles.dayLabel}>{day.date}</Text>
              </View>

              <View style={styles.dayContent}>
                {day.items.map((task) => (
                  <TaskItem
                    key={`history-task-${task.id}`}
                    title={task.title}
                    bed={
                      task.bedId ? `Grządka ${task.bedId.slice(0, 6)}` : null
                    }
                    crop={
                      task.plantingId
                        ? `Uprawa ${task.plantingId.slice(0, 6)}`
                        : null
                    }
                    status={
                      task.status === "canceled" ? "Anulowane" : "Wykonane"
                    }
                    iconName={
                      task.status === "canceled"
                        ? "close-circle-outline"
                        : "check-circle-outline"
                    }
                    onPress={() => {
                      if (task.plantingId) {
                        router.push(`/plantings/${task.plantingId}`);
                        return;
                      }
                      if (task.bedId) {
                        router.push(`/(tabs)/beds/${task.bedId}`);
                      }
                    }}
                  />
                ))}
              </View>
            </View>
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
      gap: spacing.md,
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      color: theme.colors.onBackground,
    },
    subtitle: {
      marginTop: spacing.xs,
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
    },
    stack: {
      gap: spacing.sm,
    },
    inlineLoader: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.sm,
    },
    dayBlock: {
      gap: spacing.sm,
    },
    timelineHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    timelineDot: {
      width: 10,
      height: 10,
      borderRadius: radius.pill,
      backgroundColor: theme.colors.primary,
    },
    dayLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    dayContent: {
      marginLeft: 4,
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.outlineVariant,
      paddingLeft: spacing.md,
      gap: spacing.sm,
    },
    taskCard: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      padding: spacing.sm,
      gap: spacing.xs,
    },
    taskTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    taskDescription: {
      fontSize: 13,
      color: theme.colors.onSurface,
    },
    taskMeta: {
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
    harvestCard: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      padding: spacing.sm,
      gap: spacing.xs,
    },
    harvestTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm,
    },
    harvestTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    harvestMeta: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    footerHint: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "center",
    },
    hintText: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    historyFilterRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: -4,
    },
    historyFilterLabel: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.lg,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: "center",
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
  });
