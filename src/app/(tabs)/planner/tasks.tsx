import { getResponseError } from "@/src/api/axios";
import { useDeleteActionTask } from "@/src/api/queries/actionTasks/useDeleteActionTask";
import { useUpdateActionTask } from "@/src/api/queries/actionTasks/useUpdateActionTask";
import { TaskItem as MeTaskItem } from "@/src/api/queries/users/meTypes";
import { useGetMyTasks } from "@/src/api/queries/users/useGetMyTasks";
import { Screen } from "@/src/components/Screen";
import { radius, spacing } from "@/src/theme/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  View,
} from "react-native";
import { Button, MD3Theme, Surface, Text, useTheme } from "react-native-paper";

const asParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const asField = (task: MeTaskItem, ...keys: string[]) => {
  for (const key of keys) {
    const value = task[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return null;
};

const isPendingTask = (task: MeTaskItem) => {
  const normalized = task.status.toLowerCase();
  return (
    normalized !== "done" &&
    normalized !== "canceled" &&
    normalized !== "cancelled"
  );
};

export default function PlannerTasksScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId?: string | string[] }>();
  const focusedTaskId = asParam(params.taskId);

  const tasksQuery = useGetMyTasks();
  const updateActionTask = useUpdateActionTask();
  const deleteActionTask = useDeleteActionTask();

  const tasks = useMemo(() => {
    const items = (tasksQuery.data?.items ?? []).filter(isPendingTask);
    return [...items].sort((a, b) => {
      if (focusedTaskId && a.id === focusedTaskId) return -1;
      if (focusedTaskId && b.id === focusedTaskId) return 1;

      const aDue = asField(a, "dueAt", "due_at") ?? "9999-12-31";
      const bDue = asField(b, "dueAt", "due_at") ?? "9999-12-31";
      return aDue.localeCompare(bDue);
    });
  }, [tasksQuery.data?.items, focusedTaskId]);

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
              Twoje bieżące zadania do wykonania
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Surface style={styles.emptyCard} elevation={0}>
            <Text style={styles.emptyText}>Brak aktywnych zadań.</Text>
          </Surface>
        }
        renderItem={({ item }) => {
          const bedId = asField(item, "bedId", "bed_id");
          const bedName = asField(item, "bedName", "bed_name");
          const plantingId = asField(item, "plantingId", "planting_id");
          const cropName = asField(item, "cropName", "crop_name");
          const dueAt = asField(item, "dueAt", "due_at");
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
                {bedName ?? "Nieznana grządka"}
                {cropName ? ` • ${cropName}` : ""}
              </Text>

              <View style={styles.actionsRow}>
                {plantingId ? (
                  <Button
                    mode="outlined"
                    onPress={() => router.push(`/plantings/${plantingId}`)}
                  >
                    Uprawa
                  </Button>
                ) : null}
                {!plantingId && bedId ? (
                  <Button
                    mode="outlined"
                    onPress={() => router.push(`/(tabs)/beds/${bedId}`)}
                  >
                    Grządka
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
            </Surface>
          );
        }}
      />
    </Screen>
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
  });
