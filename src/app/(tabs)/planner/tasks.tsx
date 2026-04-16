import { getResponseError } from "@/src/api/axios";
import { useUpdateActionTask } from "@/src/api/queries/actionTasks/useUpdateActionTask";
import { OFFLINE_MUTATION_MESSAGE } from "@/src/features/network/offline";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { TaskItem as MeTaskItem } from "@/src/api/queries/users/meTypes";
import { useGetMyTasks } from "@/src/api/queries/users/useGetMyTasks";
import { Screen } from "@/src/components/Screen";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import {
  getTaskAffectedBedsCount,
  getTaskAffectsAllBeds,
  getTaskLocationLabel,
  getTaskMeta,
  getTaskWarningCode,
  getTasksForLater,
  getTasksForToday,
  getTasksForTomorrow,
  getTasksWithNoDueDate,
  isWeatherWarningTask,
} from "@/src/features/tasks/model";
import { radius, spacing } from "@/src/theme/ui";
import { formatIsoDateTime, isoToLocalDateKey } from "@/src/utils/date";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, MD3Theme, Surface, Text, useTheme } from "react-native-paper";

const asParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

type TaskCardProps = {
  task: MeTaskItem;
  onDone?: (id: string) => void;
  isDoneLoading?: boolean;
};

function WeatherTaskCard({ task, onDone, isDoneLoading }: TaskCardProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeCardStyles(theme);

  const warningCode = getTaskWarningCode(task);
  const affectsAllBeds = getTaskAffectsAllBeds(task);
  const affectedBedsCount = getTaskAffectedBedsCount(task);
  const locationLabel = getTaskLocationLabel(task);
  const dueAt = getTaskMeta(task, "dueAt", "due_at");

  const targetLabel =
    task.targetType === "PLANTING"
      ? "Uprawa"
      : task.targetType === "BED"
        ? "Grządka"
        : "Wszystkie grządki";

  const scopeDetail = (() => {
    if (affectsAllBeds) return locationLabel ?? "Cały ogród";
    if (affectedBedsCount != null)
      return String(affectedBedsCount) + " grządek";
    if (locationLabel) return locationLabel;
    if (task.bedId) return "Grządka " + String(task.bedId).slice(0, 6);
    if (task.plantingId) return "Uprawa " + String(task.plantingId).slice(0, 6);
    return null;
  })();

  return (
    <Surface style={styles.card} elevation={0}>
      <View style={styles.header}>
        <Text style={styles.title}>{task.title}</Text>
        <MaterialCommunityIcons
          name="weather-partly-cloudy"
          size={16}
          color={theme.colors.primary}
        />
      </View>

      {typeof task.description === "string" && task.description.trim() ? (
        <Text style={styles.description}>{task.description}</Text>
      ) : null}

      <View style={styles.metaRow}>
        {dueAt ? (
          <Text style={styles.meta}>
            <Text style={styles.metaLabel}>{"Termin: "}</Text>
            {formatIsoDateTime(dueAt) ?? isoToLocalDateKey(dueAt) ?? dueAt}
          </Text>
        ) : null}
        <Text style={styles.meta}>
          <Text style={styles.metaLabel}>{"Zakres: "}</Text>
          {targetLabel}
          {scopeDetail ? " (" + scopeDetail + ")" : ""}
        </Text>
      </View>

      {warningCode ? (
        <StatusBadge label={warningCode.replace(/_/g, " ")} tone="info" />
      ) : null}

      <View style={styles.actions}>
        {onDone ? (
          <Button
            mode="contained"
            onPress={() => onDone(task.id)}
            disabled={isDoneLoading}
            compact
          >
            Wykonane
          </Button>
        ) : null}
      </View>
    </Surface>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  const theme = useTheme<MD3Theme>();
  const styles = makeSectionHeaderStyles(theme);
  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <Text style={styles.label}>{label}</Text>
      {count > 0 ? (
        <Text style={styles.count}>{"(" + String(count) + ")"}</Text>
      ) : null}
    </View>
  );
}

export default function PlannerTasksScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  const params = useLocalSearchParams<{ source?: string | string[] }>();
  const sourceFilter = asParam(params.source)?.toUpperCase() ?? "";

  const tasksQuery = useGetMyTasks("pending");
  const updateActionTask = useUpdateActionTask();

  const allTasks = useMemo(
    () => tasksQuery.data?.items ?? [],
    [tasksQuery.data?.items],
  );

  const filteredTasks = useMemo(() => {
    if (sourceFilter === "WEATHER_WARNING") {
      return allTasks.filter(isWeatherWarningTask);
    }
    return allTasks;
  }, [allTasks, sourceFilter]);

  const todayTasks = useMemo(
    () => getTasksForToday(filteredTasks),
    [filteredTasks],
  );
  const tomorrowTasks = useMemo(
    () => getTasksForTomorrow(filteredTasks),
    [filteredTasks],
  );
  const laterTasks = useMemo(
    () => getTasksForLater(filteredTasks),
    [filteredTasks],
  );
  const noDueDateTasks = useMemo(
    () => getTasksWithNoDueDate(filteredTasks),
    [filteredTasks],
  );

  const hasAny =
    todayTasks.length > 0 ||
    tomorrowTasks.length > 0 ||
    laterTasks.length > 0 ||
    noDueDateTasks.length > 0;

  const isOffline = useIsOffline();

  const handleDone = (taskId: string) => {
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }
    updateActionTask
      .mutateAsync({ id: taskId, payload: { status: "done" } })
      .catch((error: unknown) => {
        Alert.alert("Błąd", String(getResponseError(error)));
      });
  };

  const screenTitle =
    sourceFilter === "WEATHER_WARNING" ? "Zadania pogodowe" : "Lista zadań";
  const screenSubtitle =
    sourceFilter === "WEATHER_WARNING"
      ? "Zadania wygenerowane na podstawie alertów pogodowych"
      : "Wszystkie bieżące zadania do wykonania";

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
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={40}
            color={theme.colors.error}
          />
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
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={tasksQuery.isRefetching}
            onRefresh={() => tasksQuery.refetch()}
          />
        }
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{screenTitle}</Text>
          <Text style={styles.pageSubtitle}>{screenSubtitle}</Text>
        </View>

        {!hasAny ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={48}
              color={theme.colors.primary}
            />
            <Text style={styles.emptyTitle}>Brak zadań</Text>
            <Text style={styles.emptySubtitle}>
              Nie masz żadnych oczekujących zadań. Sprawdź ponownie po kolejnym
              pobraniu pogody.
            </Text>
          </View>
        ) : (
          <>
            {todayTasks.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader label="Na dziś" count={todayTasks.length} />
                <View style={styles.list}>
                  {todayTasks.map((task) => (
                    <WeatherTaskCard
                      key={task.id}
                      task={task}
                      onDone={handleDone}
                      isDoneLoading={updateActionTask.isPending || isOffline}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {tomorrowTasks.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader label="Na jutro" count={tomorrowTasks.length} />
                <View style={styles.list}>
                  {tomorrowTasks.map((task) => (
                    <WeatherTaskCard
                      key={task.id}
                      task={task}
                      onDone={handleDone}
                      isDoneLoading={updateActionTask.isPending || isOffline}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {laterTasks.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader label="Później" count={laterTasks.length} />
                <View style={styles.list}>
                  {laterTasks.map((task) => (
                    <WeatherTaskCard
                      key={task.id}
                      task={task}
                      onDone={handleDone}
                      isDoneLoading={updateActionTask.isPending || isOffline}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {noDueDateTasks.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader
                  label="Bez terminu"
                  count={noDueDateTasks.length}
                />
                <View style={styles.list}>
                  {noDueDateTasks.map((task) => (
                    <WeatherTaskCard
                      key={task.id}
                      task={task}
                      onDone={handleDone}
                      isDoneLoading={updateActionTask.isPending || isOffline}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      padding: spacing.lg,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: "center",
      fontSize: 14,
    },
    pageHeader: { gap: spacing.xs },
    pageTitle: {
      fontSize: 26,
      fontWeight: "700",
      color: theme.colors.onBackground,
    },
    pageSubtitle: { fontSize: 13, color: theme.colors.onSurfaceVariant },
    emptyWrap: {
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.xl,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    emptySubtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      paddingHorizontal: spacing.lg,
    },
    section: { gap: spacing.sm },
    list: { gap: spacing.sm },
  });

const makeSectionHeaderStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    dot: {
      width: 10,
      height: 10,
      borderRadius: radius.pill,
      backgroundColor: theme.colors.primary,
    },
    label: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    count: { fontSize: 13, color: theme.colors.onSurfaceVariant },
  });

const makeCardStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    card: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      padding: spacing.sm,
      gap: spacing.xs,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: 15,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    description: { fontSize: 13, color: theme.colors.onSurface },
    metaRow: { gap: 2 },
    meta: { fontSize: 12, color: theme.colors.onSurfaceVariant },
    metaLabel: { fontWeight: "700" },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
  });
