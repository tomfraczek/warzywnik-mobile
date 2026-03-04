import { getResponseError } from "@/src/api/axios";
import { ActionTask } from "@/src/api/queries/actionTasks/types";
import { useGetBedActionTasks } from "@/src/api/queries/actionTasks/useGetBedActionTasks";
import { useUpdateActionTask } from "@/src/api/queries/actionTasks/useUpdateActionTask";
import {
  ActionTemplate,
  CreateBedActionTaskItemDto,
  HarvestPromptItem,
} from "@/src/api/queries/beds/harvestTypes";
import { Bed } from "@/src/api/queries/beds/types";
import { useCreateBedActionTasksBulk } from "@/src/api/queries/beds/useCreateBedActionTasksBulk";
import { useGetBed } from "@/src/api/queries/beds/useGetBed";
import { useGetBedHarvestPrompts } from "@/src/api/queries/beds/useGetBedHarvestPrompts";
import { Planting } from "@/src/api/queries/plantings/types";
import { useGetPlantings } from "@/src/api/queries/plantings/useGetPlantings";
import { usePostHarvestConfirmation } from "@/src/api/queries/plantings/usePostHarvestConfirmation";
import { useGetVegetable } from "@/src/api/queries/vegetables/useGetVegetable";
import { HarvestConfirmationModal } from "@/src/app/(tabs)/beds/_components/HarvestConfirmationModal";
import { PostHarvestActionsModal } from "@/src/app/(tabs)/beds/_components/PostHarvestActionsModal";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Button,
  IconButton,
  MD3Theme,
  SegmentedButtons,
  Snackbar,
  useTheme,
} from "react-native-paper";

const getSoilLabel = (bed: Bed) =>
  bed.soil?.name ??
  ("soilName" in bed && typeof bed.soilName === "string"
    ? bed.soilName
    : null) ??
  "Brak wybranej gleby";

const formatDate = (value?: string | null) => {
  if (!value) return "Brak";
  return value.split("T")[0];
};

const sortTasksByDueAt = (tasks: ActionTask[]) =>
  [...tasks].sort((a, b) => {
    const aDue = a.dueAt ?? "9999-12-31";
    const bDue = b.dueAt ?? "9999-12-31";
    return aDue.localeCompare(bDue);
  });

const getTaskRecordDate = (task: ActionTask) =>
  task.doneAt ?? task.dueAt ?? task.createdAt ?? task.updatedAt ?? null;

const sortTaskHistoryDesc = (tasks: ActionTask[]) =>
  [...tasks].sort((a, b) => {
    const aDate = getTaskRecordDate(a) ?? "0000-01-01";
    const bDate = getTaskRecordDate(b) ?? "0000-01-01";
    return bDate.localeCompare(aDate);
  });

const getTaskSourceLabel = (source?: ActionTask["source"]) => {
  if (source === "MANUAL") return "Manualne";
  if (source === "VEGETABLE_RULE") return "Automatyczne";
  if (source === "WEATHER_WARNING") return "Pogodowe";
  return "Nieznane";
};

const getTaskStatusLabel = (status: ActionTask["status"]) => {
  if (status === "done") return "Wykonane";
  if (status === "canceled") return "Anulowane";
  return "Oczekujące";
};

const getTaskStatusTone = (status: ActionTask["status"]) => {
  if (status === "done") return "success" as const;
  if (status === "canceled") return "inactive" as const;
  return "warning" as const;
};

type HistoryStatusFilter = "all" | "done" | "canceled" | "pending";
type HistorySourceFilter = "all" | "manual" | "automatyczne" | "pogodowe";

type PlantingRowProps = {
  planting: Planting;
  onPress: () => void;
};

const PlantingRow = memo(function PlantingRow({
  planting,
  onPress,
}: PlantingRowProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const {
    data: vegetable,
    isLoading: isVegetableLoading,
    error: vegetableError,
  } = useGetVegetable(planting.vegetableId ?? null);

  const vegetableName = isVegetableLoading
    ? "Ładowanie..."
    : (vegetable?.name ?? (vegetableError ? "Brak nazwy" : "Brak nazwy"));

  return (
    <Pressable style={styles.plantingRow} onPress={onPress}>
      <View style={styles.plantingMain}>
        <Text style={styles.plantingTitle}>{vegetableName}</Text>
        <Text style={styles.plantingMeta}>
          Start: {formatDate(planting.plannedStartDate)}
        </Text>
      </View>
      <Text style={styles.plantingStatus}>{planting.status}</Text>
    </Pressable>
  );
});

export default function BedDetailsScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const { bedId, actionTaskId } = useLocalSearchParams<{
    bedId?: string | string[];
    actionTaskId?: string | string[];
  }>();
  const resolvedBedId = Array.isArray(bedId) ? bedId[0] : bedId;
  const highlightedActionTaskId = Array.isArray(actionTaskId)
    ? actionTaskId[0]
    : actionTaskId;
  const router = useRouter();
  const { data, isLoading, error, refetch } = useGetBed(resolvedBedId ?? null);
  const { data: harvestPromptsResponse, refetch: refetchHarvestPrompts } =
    useGetBedHarvestPrompts(resolvedBedId ?? null);
  const {
    data: plantingPages,
    isLoading: isPlantingsLoading,
    error: plantingsError,
    refetch: refetchPlantings,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetPlantings(
    { bedId: resolvedBedId ?? undefined, limit: 10 },
    { enabled: Boolean(resolvedBedId) },
  );
  const {
    data: bedTasksResponse,
    refetch: refetchBedTasks,
    isLoading: isBedTasksLoading,
    error: bedTasksError,
  } = useGetBedActionTasks(resolvedBedId ?? null, "all");
  const updateActionTask = useUpdateActionTask();

  const bed = data as Bed | undefined;
  const plantings = useMemo(
    () => plantingPages?.pages.flatMap((page) => page.items) ?? [],
    [plantingPages?.pages],
  );
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [promptQueue, setPromptQueue] = useState<HarvestPromptItem[]>([]);
  const [lastPromptSignature, setLastPromptSignature] = useState("");
  const [postHarvestModalVisible, setPostHarvestModalVisible] = useState(false);
  const [historyStatusFilter, setHistoryStatusFilter] =
    useState<HistoryStatusFilter>("all");
  const [historySourceFilter, setHistorySourceFilter] =
    useState<HistorySourceFilter>("all");

  const [postHarvestActions, setPostHarvestActions] = useState<
    ActionTemplate[]
  >([]);

  const harvestPrompts = useMemo(
    () => harvestPromptsResponse?.items ?? [],
    [harvestPromptsResponse?.items],
  );
  const bedTasks = useMemo(
    () => bedTasksResponse?.items ?? [],
    [bedTasksResponse?.items],
  );
  const pendingTasks = useMemo(
    () =>
      sortTasksByDueAt(bedTasks.filter((task) => task.status === "pending")),
    [bedTasks],
  );
  const historyTasks = useMemo(() => {
    const statusFiltered = bedTasks.filter((task) => {
      if (historyStatusFilter === "all") return true;
      return task.status === historyStatusFilter;
    });

    const sourceFiltered = statusFiltered.filter((task) => {
      if (historySourceFilter === "all") return true;
      if (historySourceFilter === "manual") return task.source === "MANUAL";
      if (historySourceFilter === "automatyczne") {
        return task.source === "VEGETABLE_RULE";
      }
      return task.source === "WEATHER_WARNING";
    });

    return sortTaskHistoryDesc(sourceFiltered);
  }, [bedTasks, historySourceFilter, historyStatusFilter]);
  const harvestPromptSignature = useMemo(
    () =>
      harvestPrompts
        .map((item) => `${item.plantingId}:${item.title}`)
        .join("|"),
    [harvestPrompts],
  );

  useEffect(() => {
    if (harvestPromptSignature === lastPromptSignature) {
      return;
    }

    setPromptQueue(harvestPrompts);
    setLastPromptSignature(harvestPromptSignature);
  }, [harvestPrompts, harvestPromptSignature, lastPromptSignature]);

  const activeHarvestPrompt = promptQueue[0] ?? null;
  const confirmationMutation = usePostHarvestConfirmation(
    activeHarvestPrompt?.plantingId ?? null,
  );
  const createBedActionTasksBulk = useCreateBedActionTasksBulk(
    resolvedBedId ?? null,
  );

  const harvestConfirmationVisible =
    !!activeHarvestPrompt && !postHarvestModalVisible;
  const activePlantings = useMemo(
    () => plantings.filter((planting) => planting.status !== "CANCELLED"),
    [plantings],
  );
  const cancelledPlantings = useMemo(
    () => plantings.filter((planting) => planting.status === "CANCELLED"),
    [plantings],
  );

  const hasAttentionItems =
    harvestPrompts.length > 0 || pendingTasks.length > 0;

  const handleHarvestNo = async () => {
    if (!activeHarvestPrompt) return;

    try {
      await confirmationMutation.mutateAsync({ answer: "no" });
      setPromptQueue((prev) => prev.slice(1));
      await refetchHarvestPrompts();
    } catch (err) {
      Alert.alert("Błąd", String(getResponseError(err)));
    }
  };

  const handleHarvestYes = async () => {
    if (!activeHarvestPrompt) return;

    try {
      const response = await confirmationMutation.mutateAsync({
        answer: "yes",
      });
      setPromptQueue((prev) => prev.slice(1));
      setPostHarvestActions(response.proposals ?? []);
      setPostHarvestModalVisible(true);
    } catch (err) {
      Alert.alert("Błąd", String(getResponseError(err)));
    }
  };

  const handleCreatePostHarvestTasks = async (
    tasks: CreateBedActionTaskItemDto[],
  ) => {
    if (!resolvedBedId) return;

    try {
      await createBedActionTasksBulk.mutateAsync({
        items: tasks,
      });
      setPostHarvestModalVisible(false);
      setPostHarvestActions([]);
      setSnackbarMessage("Dodano zadania po zbiorach");
      await refetchHarvestPrompts();
      await refetchBedTasks();
    } catch (err) {
      Alert.alert("Błąd", String(getResponseError(err)));
    }
  };

  const handleMarkTaskDone = async (taskId: string) => {
    try {
      await updateActionTask.mutateAsync({
        id: taskId,
        payload: { status: "done" },
      });
      setSnackbarMessage("Zadanie oznaczone jako wykonane.");
      await refetchBedTasks();
    } catch (err) {
      Alert.alert("Błąd", String(getResponseError(err)));
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      await updateActionTask.mutateAsync({
        id: taskId,
        payload: { status: "canceled" },
      });
      setSnackbarMessage("Zadanie zostało anulowane.");
      await refetchBedTasks();
    } catch (err) {
      Alert.alert("Błąd", String(getResponseError(err)));
    }
  };

  const dimensions = useMemo(() => {
    if (!bed) return null;
    const parts = [
      bed.lengthCm != null ? `${bed.lengthCm} cm` : null,
      bed.widthCm != null ? `${bed.widthCm} cm` : null,
      bed.depthCm != null ? `${bed.depthCm} cm` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" × ") : "Brak danych";
  }, [bed]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !bed) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{String(getResponseError(error))}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => refetch()}>
          <Text style={styles.secondaryButtonText}>Spróbuj ponownie</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{bed.name}</Text>
              {hasAttentionItems ? <View style={styles.harvestDot} /> : null}
            </View>
            {bed.locationLabel ? (
              <Text style={styles.subtitle}>{bed.locationLabel}</Text>
            ) : null}
          </View>
          <IconButton
            icon="pencil"
            onPress={() => router.push(`/(tabs)/beds/${bed.id}/edit`)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gleba</Text>
        <Text style={styles.valueText}>{getSoilLabel(bed)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wymiary</Text>
        <Text style={styles.valueText}>{dimensions}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badanie gleby</Text>
        <Text style={styles.valueText}>
          {bed.soilTestingEnabled ? "Włączone" : "Wyłączone"}
        </Text>
        {bed.soilTestingEnabled ? (
          <View style={styles.metrics}>
            {bed.measuredN != null ? (
              <Text style={styles.metricRow}>N: {bed.measuredN}</Text>
            ) : null}
            {bed.measuredP != null ? (
              <Text style={styles.metricRow}>P: {bed.measuredP}</Text>
            ) : null}
            {bed.measuredK != null ? (
              <Text style={styles.metricRow}>K: {bed.measuredK}</Text>
            ) : null}
            {bed.measuredPh != null ? (
              <Text style={styles.metricRow}>pH: {bed.measuredPh}</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Uprawy</Text>
            {hasAttentionItems ? <View style={styles.harvestDotSmall} /> : null}
          </View>
          <Pressable
            style={styles.linkButton}
            onPress={() => router.push(`/(tabs)/beds/${bed.id}/plantings/new`)}
          >
            <Text style={styles.linkButtonText}>+ Dodaj uprawę</Text>
          </Pressable>
        </View>

        {isPlantingsLoading && activePlantings.length === 0 ? (
          <ActivityIndicator style={styles.inlineLoader} />
        ) : null}

        {plantingsError && activePlantings.length === 0 ? (
          <View style={styles.inlineErrorBox}>
            <Text style={styles.errorText}>
              {String(getResponseError(plantingsError))}
            </Text>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => refetchPlantings()}
            >
              <Text style={styles.secondaryButtonText}>Spróbuj ponownie</Text>
            </Pressable>
          </View>
        ) : null}

        {!isPlantingsLoading &&
        activePlantings.length === 0 &&
        !plantingsError ? (
          <Text style={styles.valueText}>Brak upraw w tej grządce.</Text>
        ) : null}

        {activePlantings.map((planting: Planting) => (
          <PlantingRow
            key={planting.id}
            planting={planting}
            onPress={() =>
              router.push(`/(tabs)/beds/${bed.id}/plantings/${planting.id}`)
            }
          />
        ))}

        {hasNextPage ? (
          <Pressable
            style={styles.secondaryButton}
            onPress={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.secondaryButtonText}>Wczytaj więcej</Text>
            )}
          </Pressable>
        ) : null}
      </View>

      {harvestPrompts.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gotowe do zbioru</Text>
          {harvestPrompts.map((prompt) => (
            <Pressable
              key={prompt.plantingId}
              onPress={() => setPromptQueue([prompt])}
              style={styles.harvestPromptRow}
            >
              <Text style={styles.harvestPromptTitle}>{prompt.title}</Text>
              <Text style={styles.harvestPromptMeta}>Wymaga potwierdzenia</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tasks to do</Text>
        {isBedTasksLoading ? <ActivityIndicator /> : null}

        {bedTasksError ? (
          <View style={styles.inlineErrorBox}>
            <Text style={styles.errorText}>
              {String(getResponseError(bedTasksError))}
            </Text>
            <Button mode="outlined" onPress={() => refetchBedTasks()}>
              Spróbuj ponownie
            </Button>
          </View>
        ) : null}

        {!isBedTasksLoading && !bedTasksError && pendingTasks.length === 0 ? (
          <Text style={styles.valueText}>Brak zadań do wykonania.</Text>
        ) : null}

        {pendingTasks.map((task) => {
          const isHighlighted = highlightedActionTaskId === task.id;
          return (
            <View
              key={task.id}
              style={[
                styles.taskRow,
                isHighlighted ? styles.taskRowHighlighted : null,
              ]}
            >
              <View style={styles.taskMain}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                {task.description ? (
                  <Text style={styles.taskDescription}>{task.description}</Text>
                ) : null}
                <Text style={styles.taskMeta}>
                  Termin: {formatDate(task.dueAt)}
                </Text>
              </View>

              <View style={styles.taskActions}>
                <Button
                  mode="outlined"
                  compact
                  onPress={() => handleCancelTask(task.id)}
                  disabled={updateActionTask.isPending}
                >
                  Anuluj
                </Button>
                <Button
                  mode="contained"
                  compact
                  onPress={() => handleMarkTaskDone(task.id)}
                  disabled={updateActionTask.isPending}
                >
                  Done
                </Button>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historia zabiegów</Text>

        <Text style={styles.filterLabel}>Status</Text>
        <SegmentedButtons
          value={historyStatusFilter}
          onValueChange={(value) =>
            setHistoryStatusFilter(value as HistoryStatusFilter)
          }
          buttons={[
            { value: "all", label: "Wszystkie" },
            { value: "done", label: "Wykonane" },
            { value: "canceled", label: "Anulowane" },
            { value: "pending", label: "Oczekujące" },
          ]}
          style={styles.filterButtons}
        />

        <Text style={styles.filterLabel}>Typ</Text>
        <SegmentedButtons
          value={historySourceFilter}
          onValueChange={(value) =>
            setHistorySourceFilter(value as HistorySourceFilter)
          }
          buttons={[
            { value: "all", label: "Wszystkie" },
            { value: "manual", label: "Manualne" },
            { value: "automatyczne", label: "Automatyczne" },
            { value: "pogodowe", label: "Pogodowe" },
          ]}
          style={styles.filterButtons}
        />

        {isBedTasksLoading ? <ActivityIndicator /> : null}

        {bedTasksError ? (
          <View style={styles.inlineErrorBox}>
            <Text style={styles.errorText}>
              {String(getResponseError(bedTasksError))}
            </Text>
            <Button mode="outlined" onPress={() => refetchBedTasks()}>
              Spróbuj ponownie
            </Button>
          </View>
        ) : null}

        {!isBedTasksLoading && !bedTasksError && historyTasks.length === 0 ? (
          <Text style={styles.valueText}>Brak historii zabiegów.</Text>
        ) : null}

        {historyTasks.map((task) => (
          <View key={`history-${task.id}`} style={styles.historyRow}>
            <View style={styles.taskMain}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              {task.description ? (
                <Text style={styles.taskDescription}>{task.description}</Text>
              ) : null}
              <Text style={styles.taskMeta}>
                Data: {formatDate(getTaskRecordDate(task))}
              </Text>
              <Text style={styles.taskMeta}>
                Źródło: {getTaskSourceLabel(task.source)}
              </Text>
            </View>

            <StatusBadge
              label={getTaskStatusLabel(task.status)}
              tone={getTaskStatusTone(task.status)}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historia upraw</Text>
        {cancelledPlantings.length === 0 ? (
          <Text style={styles.valueText}>Brak zakończonych upraw.</Text>
        ) : (
          cancelledPlantings.map((planting: Planting) => (
            <PlantingRow
              key={planting.id}
              planting={planting}
              onPress={() =>
                router.push(`/(tabs)/beds/${bed.id}/plantings/${planting.id}`)
              }
            />
          ))
        )}
      </View>

      <HarvestConfirmationModal
        visible={harvestConfirmationVisible}
        plantingTitle={activeHarvestPrompt?.title ?? ""}
        isSubmitting={confirmationMutation.isPending}
        onNo={handleHarvestNo}
        onYes={handleHarvestYes}
      />

      <PostHarvestActionsModal
        visible={postHarvestModalVisible}
        actions={postHarvestActions}
        isSubmitting={createBedActionTasksBulk.isPending}
        onCancel={() => {
          setPostHarvestModalVisible(false);
          setPostHarvestActions([]);
        }}
        onSubmit={handleCreatePostHarvestTasks}
      />

      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage(null)}
        duration={2400}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: 16,
      paddingBottom: 32,
      backgroundColor: theme.colors.background,
    },
    header: {
      marginBottom: 16,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerText: {
      flex: 1,
      paddingRight: 8,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.colors.onBackground,
    },
    harvestDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      backgroundColor: theme.colors.error,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    section: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 12,
      padding: 12,
      marginBottom: 14,
      backgroundColor: theme.colors.surface,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 8,
      color: theme.colors.onSurface,
    },
    harvestDotSmall: {
      width: 8,
      height: 8,
      borderRadius: 999,
      marginBottom: 8,
      backgroundColor: theme.colors.error,
    },
    linkButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    linkButtonText: {
      color: theme.colors.primary,
      fontWeight: "600",
    },
    valueText: {
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    inlineLoader: {
      marginVertical: 8,
    },
    inlineErrorBox: {
      marginTop: 8,
    },
    plantingRow: {
      borderTopWidth: 1,
      borderColor: theme.colors.outline,
      paddingVertical: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    plantingMain: {
      flex: 1,
      paddingRight: 12,
    },
    plantingTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    plantingMeta: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    plantingStatus: {
      fontSize: 11,
      color: theme.colors.primary,
    },
    harvestPromptRow: {
      borderTopWidth: 1,
      borderColor: theme.colors.outline,
      paddingVertical: 10,
    },
    harvestPromptTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    harvestPromptMeta: {
      marginTop: 4,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    metrics: {
      marginTop: 8,
    },
    metricRow: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: theme.colors.background,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: "center",
    },
    secondaryButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    secondaryButtonText: {
      color: theme.colors.onSurface,
      fontWeight: "600",
    },
    taskRow: {
      borderTopWidth: 1,
      borderColor: theme.colors.outline,
      paddingVertical: 10,
      gap: 8,
    },
    taskRowHighlighted: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
      paddingHorizontal: 8,
    },
    taskMain: {
      gap: 4,
    },
    taskTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    taskDescription: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    taskMeta: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    taskActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
    },
    filterLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 6,
      marginTop: 2,
    },
    filterButtons: {
      marginBottom: 10,
      alignSelf: "flex-start",
    },
    historyRow: {
      borderTopWidth: 1,
      borderColor: theme.colors.outline,
      paddingVertical: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 10,
    },
  });
