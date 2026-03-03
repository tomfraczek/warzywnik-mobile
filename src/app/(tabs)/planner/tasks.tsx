import { getResponseError } from "@/src/api/axios";
import { useDeleteActionTask } from "@/src/api/queries/actionTasks/useDeleteActionTask";
import { useUpdateActionTask } from "@/src/api/queries/actionTasks/useUpdateActionTask";
import { Bed } from "@/src/api/queries/beds/types";
import { useGetBeds } from "@/src/api/queries/beds/useGetBeds";
import { Planting } from "@/src/api/queries/plantings/types";
import { useGetPlantings } from "@/src/api/queries/plantings/useGetPlantings";
import { TaskItem as MeTaskItem } from "@/src/api/queries/users/meTypes";
import { useGetMyTasks } from "@/src/api/queries/users/useGetMyTasks";
import { Screen } from "@/src/components/Screen";
import {
  getTaskMeta,
  getTaskTechnicalDetails,
  isWeatherWarningTask,
  resolveTaskPresentation,
  sortTasksByDueAt,
} from "@/src/features/tasks/model";
import { asNonEmptyString } from "@/src/features/warnings/model";
import { radius, spacing } from "@/src/theme/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Button, MD3Theme, Surface, Text, useTheme } from "react-native-paper";

const asParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function PlannerTasksScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();
  const params = useLocalSearchParams<{
    taskId?: string | string[];
    source?: string | string[];
    scope?: string | string[];
    scopeHint?: string | string[];
    operationalOnly?: string | string[];
  }>();
  const focusedTaskId = asParam(params.taskId);
  const sourceFilter = asParam(params.source)?.toUpperCase() ?? "";
  const scopeHint =
    asParam(params.scopeHint) ??
    (asParam(params.scope)?.toUpperCase() === "USER"
      ? "Zadanie dotyczy wszystkich grządek"
      : "");
  const operationalOnly = asParam(params.operationalOnly) === "1";

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

  const tasks = useMemo(() => {
    const filteredBySource = sourceFilter
      ? (tasksQuery.data?.items ?? []).filter((task) =>
          sourceFilter === "WEATHER_WARNING"
            ? isWeatherWarningTask(task)
            : getTaskMeta(
                task,
                "source",
                "taskSource",
                "task_source",
              )?.toUpperCase() === sourceFilter,
        )
      : (tasksQuery.data?.items ?? []);

    const filtered = operationalOnly
      ? filteredBySource.filter((task) => {
          const technical = getTaskTechnicalDetails(task);
          return technical.horizon === "OPERATIONAL";
        })
      : filteredBySource;

    const sorted = sortTasksByDueAt(filtered);
    if (!focusedTaskId) return sorted;

    const focusedIndex = sorted.findIndex((task) => task.id === focusedTaskId);
    if (focusedIndex <= 0) return sorted;

    const focusedTask = sorted[focusedIndex];
    return [
      focusedTask,
      ...sorted.slice(0, focusedIndex),
      ...sorted.slice(focusedIndex + 1),
    ];
  }, [tasksQuery.data?.items, focusedTaskId, sourceFilter, operationalOnly]);

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

  if (tasksQuery.isLoading) {
    return (
      <Screen safeAreaEdges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (tasksQuery.error) {
    return (
      <Screen safeAreaEdges={["top", "left", "right"]}>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {String(getResponseError(tasksQuery.error))}
          </Text>
          <Button mode="outlined" onPress={() => tasksQuery.refetch()}>
            Spróbuj ponownie
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeAreaEdges={["top", "left", "right"]}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Lista zadań</Text>
            <Text style={styles.subtitle}>
              {operationalOnly
                ? "Operacyjne zadania pogodowe (dziś/jutro)"
                : "Twoje bieżące zadania do wykonania"}
            </Text>
            {scopeHint ? (
              <Text style={styles.scopeHint}>{scopeHint}</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <Surface style={styles.emptyCard} elevation={0}>
            <Text style={styles.emptyText}>Brak aktywnych zadań.</Text>
          </Surface>
        }
        renderItem={({ item }) => {
          const presentation = resolveTaskPresentation(item, {
            bedsById,
            plantingsById,
          });
          const dueAt = getTaskMeta(item, "dueAt", "due_at");
          const highlighted = focusedTaskId === item.id;

          return (
            <Surface
              style={[
                styles.taskCard,
                highlighted ? styles.taskCardFocused : null,
              ]}
              elevation={0}
            >
              <Text style={styles.taskTitle}>{item.title}</Text>

              {typeof item.description === "string" &&
              item.description.trim().length > 0 ? (
                <Text style={styles.taskDescription}>{item.description}</Text>
              ) : null}

              <Text style={styles.taskMeta}>
                Termin: {dueAt ? dueAt.split("T")[0] : "Brak"}
              </Text>
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
                  onPress={() => handleDelete(item.id)}
                  disabled={deleteActionTask.isPending}
                >
                  Usuń
                </Button>
                <Button
                  mode="contained"
                  onPress={() => handleDone(item.id)}
                  disabled={updateActionTask.isPending}
                >
                  Done
                </Button>
              </View>

              {__DEV__ ? <TaskTechnicalDetails item={item} /> : null}
            </Surface>
          );
        }}
      />
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
            targetType: {technical.targetType}
          </Text>
          <Text style={styles.technicalText}>
            scope: {technical.scope ?? "-"}
          </Text>
          <Text style={styles.technicalText}>
            horizon: {technical.horizon ?? "-"}
          </Text>
          <Text style={styles.technicalText}>
            dayPart: {technical.dayPart ?? "-"}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    content: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.sm,
    },
    header: {
      marginBottom: spacing.sm,
      gap: spacing.xs,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.colors.onBackground,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    scopeHint: {
      marginTop: spacing.xs,
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.primary,
    },
    taskCard: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      padding: spacing.sm,
      marginBottom: spacing.sm,
      gap: spacing.xs,
    },
    taskCardFocused: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
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
    emptyCard: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      padding: spacing.md,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      padding: spacing.lg,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: "center",
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
  });
