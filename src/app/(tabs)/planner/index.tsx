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
import { OFFLINE_MUTATION_MESSAGE } from "@/src/features/network/offline";
import {
  formatTaskDayPart,
  formatTaskHorizon,
  formatTaskScope,
  formatTaskTargetType,
  getTaskMeta,
  getTaskSourceTypeLabel,
  getTaskTechnicalDetails,
  isTaskActive,
  resolveTaskPresentation,
  resolveTaskSourceType,
} from "@/src/features/tasks/model";
import { asNonEmptyString } from "@/src/features/warnings/model";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
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

const toLocalDateKey = (value: string | null | undefined) => {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return formatDate(parsed);
};

const normalizeTaskStatus = (
  status: string | null | undefined,
): "pending" | "done" | "canceled" => {
  const normalized = status?.trim().toLowerCase();
  if (normalized === "done") return "done";
  if (normalized === "canceled") return "canceled";
  return "pending";
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
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const todayKey = formatDate(todayDate);
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowKey = formatDate(tomorrowDate);

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
    from.setDate(from.getDate() - 30);
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
            const status = normalizeTaskStatus(task.status);
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

  const todayTomorrowBuckets = useMemo(() => {
    const toDateValue = (task: MeTaskItem) => {
      const raw = getTaskMeta(
        task,
        "dueAt",
        "due_at",
        "createdAt",
        "created_at",
      );
      if (!raw) return 0;
      const value = Date.parse(raw);
      return Number.isNaN(value) ? 0 : value;
    };

    const today: MeTaskItem[] = [];
    const tomorrow: MeTaskItem[] = [];

    [...(tasksQuery.data?.items ?? [])]
      .filter((task) => isTaskActive(task))
      .sort((a, b) => toDateValue(a) - toDateValue(b))
      .forEach((task) => {
        const dueAt = getTaskMeta(task, "dueAt", "due_at");
        const localDueDate = toLocalDateKey(dueAt);
        if (!localDueDate) return;

        if (localDueDate === todayKey) {
          today.push(task);
          return;
        }

        if (localDueDate === tomorrowKey) {
          tomorrow.push(task);
        }
      });

    const limit = 4;
    const todayPreview = today.slice(0, limit);
    const tomorrowPreview = tomorrow.slice(
      0,
      Math.max(limit - todayPreview.length, 0),
    );

    return {
      today,
      tomorrow,
      todayPreview,
      tomorrowPreview,
      total: today.length + tomorrow.length,
      limit,
    };
  }, [tasksQuery.data?.items, todayKey, tomorrowKey]);

  const upcomingTimeline = useMemo(() => {
    return timeline
      .map((day) => {
        const tasks = day.tasks.filter((task) => {
          if (!isTaskActive(asPlannerTaskItem(task))) return false;
          const localDueDate = toLocalDateKey(task.dueAt ?? day.date);
          if (!localDueDate) return true;
          return localDueDate !== todayKey && localDueDate !== tomorrowKey;
        });

        return {
          ...day,
          tasks,
        };
      })
      .filter((day) => day.tasks.length > 0 || day.harvestWindows.length > 0);
  }, [timeline, todayKey, tomorrowKey]);

  const shouldShowTasksCta = useMemo(() => {
    const hasTasksListScreen = true;
    return (
      hasTasksListScreen ||
      todayTomorrowBuckets.total > todayTomorrowBuckets.limit
    );
  }, [todayTomorrowBuckets.limit, todayTomorrowBuckets.total]);

  const hasUpcomingEvents = useMemo(() => {
    return upcomingTimeline.some(
      (day) => day.tasks.length > 0 || day.harvestWindows.length > 0,
    );
  }, [upcomingTimeline]);

  const formatDueDateText = (task: MeTaskItem, fallback?: string) => {
    const raw = getTaskMeta(task, "dueAt", "due_at") ?? fallback;
    const localDate = toLocalDateKey(raw);
    return localDate ?? "Brak";
  };

  const isOffline = useIsOffline();

  const handleDone = (taskId: string) => {
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }
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
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }
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
        <Text style={styles.title}>Dziś i jutro</Text>
        {tasksQuery.isLoading ? (
          <Card>
            <View style={styles.inlineLoader}>
              <ActivityIndicator />
            </View>
          </Card>
        ) : todayTomorrowBuckets.total === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Brak zadań na dziś i jutro.</Text>
          </Card>
        ) : (
          <View style={styles.stack}>
            {todayTomorrowBuckets.todayPreview.length > 0 ? (
              <View style={styles.dayBlock}>
                <View style={styles.timelineHeader}>
                  <View style={styles.timelineDot} />
                  <Text style={styles.dayLabel}>Dziś</Text>
                </View>
                <View style={styles.dayContent}>
                  {todayTomorrowBuckets.todayPreview.map((task) => {
                    const presentation = resolveTaskPresentation(task, {
                      bedsById,
                      plantingsById,
                    });
                    const sourceLabel = getTaskSourceTypeLabel(
                      resolveTaskSourceType(task),
                    );

                    return (
                      <Surface
                        key={task.id}
                        style={styles.taskCard}
                        elevation={0}
                      >
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <Text style={styles.taskMeta}>
                          Termin: {formatDueDateText(task)}
                        </Text>
                        <Text style={styles.taskMeta}>
                          {presentation.locationLabel}
                          {presentation.cropLabel
                            ? ` • ${presentation.cropLabel}`
                            : ""}
                        </Text>
                        {sourceLabel ? (
                          <StatusBadge label={sourceLabel} tone="neutral" />
                        ) : null}

                        <View style={styles.actionsRow}>
                          <Button
                            mode="outlined"
                            onPress={() => handleDelete(task.id)}
                            disabled={deleteActionTask.isPending || isOffline}
                          >
                            Usuń
                          </Button>
                          <Button
                            mode="contained"
                            onPress={() => handleDone(task.id)}
                            disabled={updateActionTask.isPending || isOffline}
                          >
                            Done
                          </Button>
                        </View>
                      </Surface>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {todayTomorrowBuckets.tomorrowPreview.length > 0 ? (
              <View style={styles.dayBlock}>
                <View style={styles.timelineHeader}>
                  <View style={styles.timelineDot} />
                  <Text style={styles.dayLabel}>Jutro</Text>
                </View>
                <View style={styles.dayContent}>
                  {todayTomorrowBuckets.tomorrowPreview.map((task) => {
                    const presentation = resolveTaskPresentation(task, {
                      bedsById,
                      plantingsById,
                    });
                    const sourceLabel = getTaskSourceTypeLabel(
                      resolveTaskSourceType(task),
                    );

                    return (
                      <Surface
                        key={task.id}
                        style={styles.taskCard}
                        elevation={0}
                      >
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <Text style={styles.taskMeta}>
                          Termin: {formatDueDateText(task)}
                        </Text>
                        <Text style={styles.taskMeta}>
                          {presentation.locationLabel}
                          {presentation.cropLabel
                            ? ` • ${presentation.cropLabel}`
                            : ""}
                        </Text>
                        {sourceLabel ? (
                          <StatusBadge label={sourceLabel} tone="neutral" />
                        ) : null}

                        <View style={styles.actionsRow}>
                          <Button
                            mode="outlined"
                            onPress={() => handleDelete(task.id)}
                            disabled={deleteActionTask.isPending || isOffline}
                          >
                            Usuń
                          </Button>
                          <Button
                            mode="contained"
                            onPress={() => handleDone(task.id)}
                            disabled={updateActionTask.isPending || isOffline}
                          >
                            Done
                          </Button>
                        </View>
                      </Surface>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {shouldShowTasksCta ? (
              <Pressable onPress={() => router.push("/(tabs)/planner/tasks")}>
                <Text style={styles.smallCta}>Zobacz wszystkie zadania →</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        <Text style={styles.title}>Nadchodzące wydarzenia</Text>
        <Text style={styles.subtitle}>Zdarzenia generowane automatycznie</Text>
        {!hasUpcomingEvents ? (
          <Card>
            <Text style={styles.emptyText}>
              Brak zaplanowanych wydarzeń w najbliższych 30 dniach.
            </Text>
          </Card>
        ) : (
          upcomingTimeline.map((day) => (
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
                  const sourceLabel = getTaskSourceTypeLabel(
                    resolveTaskSourceType(plannerTask),
                  );

                  return (
                    <Surface
                      key={task.id}
                      style={styles.taskCard}
                      elevation={0}
                    >
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <Text style={styles.taskMeta}>
                        Termin:{" "}
                        {formatDueDateText(plannerTask, task.dueAt ?? day.date)}
                      </Text>
                      <Text style={styles.taskMeta}>
                        {presentation.locationLabel}
                        {presentation.cropLabel
                          ? ` • ${presentation.cropLabel}`
                          : ""}
                      </Text>
                      {sourceLabel ? (
                        <StatusBadge label={sourceLabel} tone="neutral" />
                      ) : null}

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
                          disabled={deleteActionTask.isPending || isOffline}
                        >
                          Usuń
                        </Button>
                        <Button
                          mode="contained"
                          onPress={() => handleDone(task.id)}
                          disabled={updateActionTask.isPending || isOffline}
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
    smallCta: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.primary,
      marginTop: spacing.xs,
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
