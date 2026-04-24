import { getResponseError } from "@/src/api/axios";
import { ActionTask } from "@/src/api/queries/actionTasks/types";
import { useGetBedActionTasks } from "@/src/api/queries/actionTasks/useGetBedActionTasks";
import { useUpdateActionTask } from "@/src/api/queries/actionTasks/useUpdateActionTask";
import { bedKeys } from "@/src/api/queries/beds/bedKeys";
import {
  ActionTemplate,
  CreateBedActionTaskItemDto,
  HarvestPromptItem,
} from "@/src/api/queries/beds/harvestTypes";
import { Bed } from "@/src/api/queries/beds/types";
import { useCreateBedActionTasksBulk } from "@/src/api/queries/beds/useCreateBedActionTasksBulk";
import { useDeleteBed } from "@/src/api/queries/beds/useDeleteBed";
import { useGetBed } from "@/src/api/queries/beds/useGetBed";
import { useGetBedHarvestPrompts } from "@/src/api/queries/beds/useGetBedHarvestPrompts";
import { useUpdateBed } from "@/src/api/queries/beds/useUpdateBed";
import { Planting } from "@/src/api/queries/plantings/types";
import { useGetPlantings } from "@/src/api/queries/plantings/useGetPlantings";
import { usePostHarvestConfirmation } from "@/src/api/queries/plantings/usePostHarvestConfirmation";
import { useGetVegetable } from "@/src/api/queries/vegetables/useGetVegetable";
import { BedSeasonHistorySection } from "@/src/app/(tabs)/beds/_components/BedSeasonHistorySection";
import { HarvestConfirmationModal } from "@/src/app/(tabs)/beds/_components/HarvestConfirmationModal";
import { PostHarvestActionsModal } from "@/src/app/(tabs)/beds/_components/PostHarvestActionsModal";
import { Screen } from "@/src/components/Screen";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { OFFLINE_MUTATION_MESSAGE } from "@/src/features/network/offline";
import {
  getPlantingStatusLabel,
  getPlantingStatusTone,
  isPlantingActiveLifecycleStatus,
} from "@/src/features/plantings/status";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
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
  Icon,
  IconButton,
  MD3Theme,
  Modal,
  Portal,
  Snackbar,
  Switch,
  useTheme,
} from "react-native-paper";

const getSoilLabel = (bed: Bed) =>
  bed.soil?.name ??
  ("soilName" in bed && typeof bed.soilName === "string"
    ? bed.soilName
    : null) ??
  "Brak wybranej gleby";

function buildPalette(dark: boolean) {
  return {
    background: dark ? "#141816" : "#F7F8F5",
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "#252D29" : "#E8ECE7",
    innerBg: dark ? "#161C19" : "#F3F6F2",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
    meta: dark ? "#7A8880" : "#97A29B",
    accent: dark ? "#7AB88A" : "#4A7C59",
    accentBg: dark ? "#1A2E1F" : "#EBF5EE",
    accentBorder: dark ? "#2A4A32" : "#C5DFC9",
    statusActiveBg: dark ? "#1A2E1F" : "#E6F4E9",
    statusActiveText: dark ? "#7AB88A" : "#2E6B3E",
    statusInactiveBg: dark ? "#2A2E2B" : "#F1F1F0",
    statusInactiveText: dark ? "#7A8880" : "#7A7E7B",
    warning: dark ? "#D66C63" : "#B6473D",
  };
}

const CULTIVATION_ENVIRONMENT_LABELS: Record<string, string> = {
  GROUND_OUTDOOR: "W gruncie",
  RAISED_BED_OUTDOOR: "Podwyższona grządka",
  POT_OUTDOOR: "Donica na zewnątrz",
  POT_INDOOR: "Donica w domu",
  GREENHOUSE: "Szklarnia",
  TUNNEL: "Tunel",
};

const formatSlug = (slug: string) =>
  slug.replace(/-/g, " ").replace(/(^|\s)\p{L}/gu, (m) => m.toUpperCase());

const formatMetaDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const getSoilSlugLabel = (bed: Bed) => {
  if (!("soilSlug" in bed)) return null;
  const soilSlug = (bed as Record<string, unknown>).soilSlug;
  return typeof soilSlug === "string" ? formatSlug(soilSlug) : null;
};

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

type PlantingRowProps = {
  planting: Planting;
  onPress: () => void;
  hasAttention: boolean;
};

const PlantingRow = memo(function PlantingRow({
  planting,
  onPress,
  hasAttention,
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
  const plantingStatusTone = getPlantingStatusTone(planting.status, theme.dark);

  return (
    <Pressable style={styles.plantingRow} onPress={onPress}>
      <View style={styles.plantingThumbWrap}>
        {vegetable?.imageUrl ? (
          <Image
            source={{ uri: vegetable.imageUrl }}
            style={styles.plantingThumb}
          />
        ) : (
          <View style={styles.plantingThumbFallback}>
            <Icon
              source="sprout-outline"
              size={16}
              color={theme.colors.onSurfaceVariant}
            />
          </View>
        )}
      </View>
      <View style={styles.plantingMain}>
        <View style={styles.plantingTitleRow}>
          <Text style={styles.plantingTitle}>{vegetableName}</Text>
          {hasAttention ? (
            <Icon source="alert" size={15} color="#B6473D" />
          ) : null}
        </View>
        <Text style={styles.plantingMeta}>
          Start: {formatDate(planting.plannedStartDate)}
        </Text>
      </View>
      <View
        style={[
          styles.plantingStatusBadge,
          {
            backgroundColor: plantingStatusTone.backgroundColor,
            borderColor: plantingStatusTone.borderColor,
          },
        ]}
      >
        <Text
          style={[
            styles.plantingStatus,
            { color: plantingStatusTone.textColor },
          ]}
        >
          {getPlantingStatusLabel(planting.status)}
        </Text>
      </View>
    </Pressable>
  );
});

export default function BedDetailsScreen() {
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);
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
  const queryClient = useQueryClient();
  const [isBedDeleted, setIsBedDeleted] = useState(false);
  const { data, isLoading, error, refetch } = useGetBed(
    !isBedDeleted ? (resolvedBedId ?? null) : null,
  );
  const { data: harvestPromptsResponse, refetch: refetchHarvestPrompts } =
    useGetBedHarvestPrompts(!isBedDeleted ? (resolvedBedId ?? null) : null);
  const {
    data: plantingPages,
    isLoading: isPlantingsLoading,
    error: plantingsError,
    refetch: refetchPlantings,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetPlantings(
    {
      bedId: !isBedDeleted ? (resolvedBedId ?? undefined) : undefined,
      limit: 10,
    },
    { enabled: Boolean(resolvedBedId) && !isBedDeleted },
  );
  const {
    data: bedTasksResponse,
    refetch: refetchBedTasks,
    isLoading: isBedTasksLoading,
    error: bedTasksError,
  } = useGetBedActionTasks(
    !isBedDeleted ? (resolvedBedId ?? null) : null,
    "all",
  );
  const deleteBed = useDeleteBed();
  const updateBed = useUpdateBed(resolvedBedId ?? "");
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
  const [actionsVisible, setActionsVisible] = useState(false);

  const [postHarvestActions, setPostHarvestActions] = useState<
    ActionTemplate[]
  >([]);
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState(false);

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
  const historyTasks = useMemo(
    () =>
      sortTaskHistoryDesc(
        bedTasks.filter(
          (task) => task.status === "done" || task.status === "canceled",
        ),
      ),
    [bedTasks],
  );
  const historyPreviewTasks = useMemo(
    () => historyTasks.slice(0, 4),
    [historyTasks],
  );
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
    () =>
      plantings.filter((planting) =>
        isPlantingActiveLifecycleStatus(planting.status),
      ),
    [plantings],
  );

  const hasAttentionItems =
    harvestPrompts.length > 0 || pendingTasks.length > 0;

  const attentionPlantingIds = useMemo(() => {
    const ids = new Set<string>();
    harvestPrompts.forEach((prompt) => ids.add(prompt.plantingId));
    bedTasks.forEach((task) => {
      if (task.status === "pending" && task.plantingId) {
        ids.add(task.plantingId);
      }
    });
    return ids;
  }, [bedTasks, harvestPrompts]);

  const isOffline = useIsOffline();

  const handleHarvestNo = async () => {
    if (!activeHarvestPrompt) return;
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }

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
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }

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
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }

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
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }
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
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }
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

  const handleToggleBedActive = async (value: boolean) => {
    if (!resolvedBedId) return;
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }

    try {
      await updateBed.mutateAsync({ isActive: value });
      setSnackbarMessage(
        value ? "Grządka została aktywowana." : "Grządka została wyłączona.",
      );
    } catch (err) {
      Alert.alert("Błąd", String(getResponseError(err)));
    }
  };

  const handleDeleteBed = async () => {
    if (!bed?.id) return;
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }

    try {
      setIsBedDeleted(true);
      await queryClient.cancelQueries({
        queryKey: bedKeys.detail(bed.id),
      });
      await queryClient.cancelQueries({
        queryKey: bedKeys.seasons(bed.id),
      });
      await deleteBed.mutateAsync(bed.id);
      queryClient.removeQueries({ queryKey: bedKeys.detail(bed.id) });
      queryClient.removeQueries({ queryKey: bedKeys.seasons(bed.id) });
      setActionsVisible(false);
      setDeleteConfirmationStep(false);
      setSnackbarMessage("Grządka została usunięta.");
      router.replace("/(tabs)/beds");
    } catch (err) {
      setIsBedDeleted(false);
      Alert.alert("Błąd usuwania grządki", String(getResponseError(err)));
    }
  };

  const dimensions = useMemo(() => {
    if (!bed) return null;
    const parts = [
      bed.lengthCm != null ? `${bed.lengthCm} cm` : null,
      bed.widthCm != null ? `${bed.widthCm} cm` : null,
      bed.depthCm != null ? `${bed.depthCm} cm` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" × ") : null;
  }, [bed]);

  const cultivationEnvironmentLabel = useMemo(() => {
    if (!bed?.cultivationEnvironment) return null;
    return (
      CULTIVATION_ENVIRONMENT_LABELS[bed.cultivationEnvironment] ??
      bed.cultivationEnvironment
    );
  }, [bed?.cultivationEnvironment]);

  const soilSlugLabel = useMemo(
    () => (bed ? getSoilSlugLabel(bed) : null),
    [bed],
  );

  const hasSoilAnalysisData =
    (typeof bed?.measuredN === "number" && bed.measuredN > 0) ||
    (typeof bed?.measuredP === "number" && bed.measuredP > 0) ||
    (typeof bed?.measuredK === "number" && bed.measuredK > 0) ||
    (typeof bed?.measuredPh === "number" && bed.measuredPh > 0);

  if (isBedDeleted || isLoading) {
    return (
      <Screen
        style={{ backgroundColor: palette.background }}
        safeAreaEdges={["left", "right"]}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.heroCard}>
            <View style={styles.skeletonPill} />
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonLine} />
            <View style={styles.quickChipsRow}>
              <View style={styles.skeletonChip} />
              <View style={styles.skeletonChip} />
            </View>
          </View>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.section}>
              <View style={styles.skeletonHeader} />
              <View style={styles.skeletonLine} />
            </View>
          ))}
        </ScrollView>
      </Screen>
    );
  }

  if (error || !bed) {
    return (
      <Screen
        style={{ backgroundColor: palette.background }}
        safeAreaEdges={["top", "left", "right"]}
      >
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {String(getResponseError(error))}
          </Text>
          <Pressable style={styles.secondaryButton} onPress={() => refetch()}>
            <Text style={styles.secondaryButtonText}>Spróbuj ponownie</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      style={{ backgroundColor: palette.background }}
      safeAreaEdges={["left", "right"]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View
              style={[styles.entityTag, { backgroundColor: palette.accentBg }]}
            >
              <Text style={[styles.entityTagText, { color: palette.accent }]}>
                Grządka
              </Text>
            </View>
            <IconButton
              icon="cog-outline"
              size={20}
              iconColor={palette.secondary}
              onPress={() => {
                setDeleteConfirmationStep(false);
                setActionsVisible(true);
              }}
              style={styles.heroSettingsButton}
            />
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.title}>{bed.name}</Text>
          </View>

          {bed.locationLabel || bed.description ? (
            <Text style={styles.subtitle}>
              {bed.locationLabel ?? bed.description}
            </Text>
          ) : null}

          <View style={styles.heroStatusRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    bed.isActive !== true
                      ? palette.statusInactiveBg
                      : palette.statusActiveBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color:
                      bed.isActive !== true
                        ? palette.statusInactiveText
                        : palette.statusActiveText,
                  },
                ]}
              >
                {bed.isActive !== true ? "Nieaktywna" : "Aktywna"}
              </Text>
            </View>
          </View>

          <View style={styles.quickChipsRow}>
            {cultivationEnvironmentLabel ? (
              <View style={styles.quickChip}>
                <Icon
                  source="sprout-outline"
                  size={14}
                  color={palette.accent}
                />
                <Text style={[styles.quickChipText, { color: palette.accent }]}>
                  {cultivationEnvironmentLabel}
                </Text>
              </View>
            ) : null}
            {soilSlugLabel ? (
              <View style={styles.quickChip}>
                <Icon
                  source="layers-outline"
                  size={14}
                  color={palette.secondary}
                />
                <Text style={styles.quickChipText}>{soilSlugLabel}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informacje o grządce</Text>

          <Text style={styles.subsectionTitle}>Podstawowe informacje</Text>
          <View style={styles.infoRows}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nazwa</Text>
              <Text style={styles.infoValue}>{bed.name}</Text>
            </View>
            {bed.locationLabel ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Lokalizacja</Text>
                <Text style={styles.infoValue}>{bed.locationLabel}</Text>
              </View>
            ) : null}
            {bed.description ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Opis</Text>
                <Text style={styles.infoValue}>{bed.description}</Text>
              </View>
            ) : null}
            <View style={styles.infoRowSwitch}>
              <View style={styles.infoRowSwitchText}>
                <Text style={styles.infoLabel}>Status grządki</Text>
                <Text style={styles.infoValueMuted}>
                  {bed.isActive !== true ? "Nieaktywna" : "Aktywna"}
                </Text>
              </View>
              <Switch
                value={bed.isActive === true}
                onValueChange={handleToggleBedActive}
                disabled={updateBed.isPending || isOffline}
              />
            </View>
          </View>

          {dimensions ? (
            <>
              <View style={styles.sectionDivider} />
              <Text style={styles.subsectionTitle}>Wymiary</Text>
              <Text style={styles.dimensionSummary}>{dimensions}</Text>
              <View style={styles.metricGrid}>
                {bed.lengthCm != null ? (
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Długość</Text>
                    <Text style={styles.metricValue}>{bed.lengthCm}</Text>
                    <Text style={styles.metricUnit}>cm</Text>
                  </View>
                ) : null}
                {bed.widthCm != null ? (
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Szerokość</Text>
                    <Text style={styles.metricValue}>{bed.widthCm}</Text>
                    <Text style={styles.metricUnit}>cm</Text>
                  </View>
                ) : null}
                {bed.depthCm != null ? (
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Głębokość</Text>
                    <Text style={styles.metricValue}>{bed.depthCm}</Text>
                    <Text style={styles.metricUnit}>cm</Text>
                  </View>
                ) : null}
              </View>
            </>
          ) : null}

          <View style={styles.sectionDivider} />
          <Text style={styles.subsectionTitle}>Środowisko uprawy</Text>
          <View style={styles.infoRows}>
            {cultivationEnvironmentLabel ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Środowisko</Text>
                <Text style={styles.infoValue}>
                  {cultivationEnvironmentLabel}
                </Text>
              </View>
            ) : null}
            {!cultivationEnvironmentLabel ? (
              <Text style={styles.valueText}>Brak danych o środowisku.</Text>
            ) : null}
          </View>

          <View style={styles.sectionDivider} />
          <Text style={styles.subsectionTitle}>Gleba</Text>
          <View style={styles.infoRows}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Typ gleby</Text>
              <Text style={styles.infoValue}>
                {soilSlugLabel ?? getSoilLabel(bed)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Analiza gleby</Text>
              <Text style={styles.infoValue}>
                {bed.soilTestingEnabled ? "Włączona" : "Wyłączona"}
              </Text>
            </View>
          </View>
        </View>

        {hasSoilAnalysisData ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analiza gleby</Text>
            <View style={styles.metricGrid}>
              {bed.measuredN != null ? (
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>N</Text>
                  <Text style={styles.metricValue}>{bed.measuredN}</Text>
                </View>
              ) : null}
              {bed.measuredP != null ? (
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>P</Text>
                  <Text style={styles.metricValue}>{bed.measuredP}</Text>
                </View>
              ) : null}
              {bed.measuredK != null ? (
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>K</Text>
                  <Text style={styles.metricValue}>{bed.measuredK}</Text>
                </View>
              ) : null}
              {bed.measuredPh != null ? (
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>pH</Text>
                  <Text style={styles.metricValue}>{bed.measuredPh}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Uprawy</Text>
            <Pressable
              style={styles.linkButton}
              onPress={() =>
                router.push(`/(tabs)/beds/${bed.id}/plantings/new`)
              }
            >
              <Text style={styles.linkButtonText}>Dodaj uprawę</Text>
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
              hasAttention={attentionPlantingIds.has(planting.id)}
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
                <Text style={styles.harvestPromptMeta}>
                  Wymaga potwierdzenia
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, styles.sectionTitleInHeader]}>
              Zadania
            </Text>
            {hasAttentionItems ? (
              <Icon source="alert" size={18} color={palette.warning} />
            ) : null}
          </View>
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
                    <Text style={styles.taskDescription}>
                      {task.description}
                    </Text>
                  ) : null}
                  <Text style={styles.taskMeta}>
                    Termin: {formatDate(task.dueAt)}
                  </Text>
                </View>

                <View style={styles.taskActions}>
                  <Button
                    mode="outlined"
                    style={styles.taskActionButton}
                    onPress={() => handleCancelTask(task.id)}
                    disabled={updateActionTask.isPending || isOffline}
                  >
                    Anuluj
                  </Button>
                  <Button
                    mode="contained"
                    style={styles.taskActionButton}
                    onPress={() => handleMarkTaskDone(task.id)}
                    disabled={updateActionTask.isPending || isOffline}
                  >
                    Done
                  </Button>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Historia zabiegów</Text>
            {historyTasks.length > 4 ? (
              <Pressable
                style={styles.linkButton}
                onPress={() => router.push(`/(tabs)/beds/${bed.id}/history`)}
              >
                <Text style={styles.linkButtonText}>Zobacz wszystkie</Text>
              </Pressable>
            ) : null}
          </View>

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

          {!isBedTasksLoading &&
          !bedTasksError &&
          historyPreviewTasks.length === 0 ? (
            <Text style={styles.valueText}>Brak historii zabiegów.</Text>
          ) : null}

          {historyPreviewTasks.map((task) => (
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

        {resolvedBedId ? (
          <BedSeasonHistorySection bedId={resolvedBedId} />
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historia upraw</Text>
            <Text style={styles.valueText}>Brak zakończonych upraw.</Text>
          </View>
        )}

        <View style={styles.metaSection}>
          {formatMetaDate(bed.createdAt) ? (
            <Text style={styles.metaText}>
              Utworzono: {formatMetaDate(bed.createdAt)}
            </Text>
          ) : null}
          {formatMetaDate(bed.updatedAt) ? (
            <Text style={styles.metaText}>
              Zaktualizowano: {formatMetaDate(bed.updatedAt)}
            </Text>
          ) : null}
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

        <Portal>
          <Modal
            visible={actionsVisible}
            onDismiss={() => {
              setActionsVisible(false);
              setDeleteConfirmationStep(false);
            }}
            contentContainerStyle={styles.modal}
          >
            {deleteConfirmationStep ? (
              <>
                <Text style={styles.modalTitle}>Usunąć grządkę?</Text>
                <Text style={styles.modalText}>
                  Tej operacji nie można cofnąć. Wszystkie powiązane dane tej
                  grządki zostaną usunięte.
                </Text>
                <View style={styles.modalActionsColumn}>
                  <Button
                    mode="contained"
                    buttonColor={theme.colors.error}
                    onPress={handleDeleteBed}
                    disabled={deleteBed.isPending || isOffline}
                    loading={deleteBed.isPending}
                  >
                    Potwierdź usunięcie
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => setDeleteConfirmationStep(false)}
                    disabled={deleteBed.isPending}
                  >
                    Wróć
                  </Button>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Akcje</Text>
                <View style={styles.modalActionsColumn}>
                  <Button
                    mode="contained"
                    onPress={() => {
                      setActionsVisible(false);
                      router.push(`/(tabs)/beds/${bed.id}/edit`);
                    }}
                    disabled={deleteBed.isPending || isOffline}
                  >
                    Edytuj
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => setDeleteConfirmationStep(true)}
                    disabled={deleteBed.isPending || isOffline}
                    textColor={theme.colors.error}
                    style={styles.deleteButton}
                  >
                    Usuń
                  </Button>
                  <Button
                    mode="text"
                    onPress={() => setActionsVisible(false)}
                    disabled={deleteBed.isPending}
                  >
                    Zamknij
                  </Button>
                </View>
              </>
            )}
          </Modal>
        </Portal>

        <Snackbar
          visible={!!snackbarMessage}
          onDismiss={() => setSnackbarMessage(null)}
          duration={2400}
        >
          {snackbarMessage}
        </Snackbar>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) => {
  const palette = buildPalette(theme.dark);
  return StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 0,
      paddingBottom: 36,
      backgroundColor: palette.background,
    },
    heroCard: {
      backgroundColor: palette.cardBg,
      borderColor: palette.cardBorder,
      borderWidth: 1,
      borderRadius: 24,
      padding: 20,
      marginTop: 8,
      marginBottom: 20,
      gap: 10,
    },
    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    heroSettingsButton: {
      margin: 0,
    },
    entityTag: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },
    entityTagText: {
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 0.2,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    title: {
      flex: 1,
      fontSize: 30,
      fontWeight: "700",
      letterSpacing: -0.4,
      color: palette.heading,
    },
    harvestDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      backgroundColor: palette.warning,
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 21,
      color: palette.secondary,
    },
    heroStatusRow: {
      flexDirection: "row",
      marginTop: 2,
      marginBottom: 4,
    },
    statusBadge: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: "600",
    },
    quickChipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    quickChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: palette.innerBg,
    },
    quickChipText: {
      fontSize: 12,
      fontWeight: "500",
      color: palette.secondary,
    },
    section: {
      backgroundColor: palette.cardBg,
      borderColor: palette.cardBorder,
      borderWidth: 1,
      borderRadius: 22,
      padding: 20,
      marginBottom: 20,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sectionTitle: {
      fontSize: 19,
      fontWeight: "700",
      color: palette.heading,
      marginBottom: 12,
    },
    sectionTitleInHeader: {
      marginBottom: 0,
    },
    subsectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: palette.heading,
      marginBottom: 10,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: palette.cardBorder,
      marginVertical: 14,
    },
    harvestDotSmall: {
      width: 8,
      height: 8,
      borderRadius: 999,
      marginBottom: 12,
      backgroundColor: palette.warning,
    },
    linkButton: {
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    linkButtonText: {
      color: palette.accent,
      fontWeight: "600",
      fontSize: 14,
    },
    valueText: {
      fontSize: 14,
      lineHeight: 20,
      color: palette.secondary,
    },
    infoRows: {
      gap: 12,
    },
    infoRow: {
      gap: 4,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: palette.cardBorder,
    },
    infoLabel: {
      fontSize: 13,
      color: palette.meta,
      fontWeight: "500",
    },
    infoValue: {
      fontSize: 15,
      color: palette.heading,
      lineHeight: 21,
      fontWeight: "500",
    },
    infoValueMuted: {
      fontSize: 14,
      color: palette.secondary,
    },
    infoRowSwitch: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    infoRowSwitchText: {
      flex: 1,
      gap: 4,
    },
    dimensionSummary: {
      fontSize: 16,
      fontWeight: "600",
      color: palette.secondary,
      marginBottom: 12,
    },
    metricGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    metricCard: {
      minWidth: 92,
      backgroundColor: palette.innerBg,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 12,
      gap: 2,
    },
    metricLabel: {
      fontSize: 12,
      color: palette.meta,
    },
    metricValue: {
      fontSize: 20,
      fontWeight: "700",
      color: palette.heading,
    },
    metricUnit: {
      fontSize: 12,
      color: palette.meta,
    },
    inlineLoader: {
      marginVertical: 8,
    },
    inlineErrorBox: {
      marginTop: 8,
    },
    plantingRow: {
      borderTopWidth: 1,
      borderColor: palette.cardBorder,
      paddingVertical: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
    },
    plantingThumbWrap: {
      width: 46,
      height: 46,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: palette.innerBg,
    },
    plantingThumb: {
      width: "100%",
      height: "100%",
    },
    plantingThumbFallback: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    plantingMain: {
      flex: 1,
      paddingRight: 12,
    },
    plantingTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    plantingTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: palette.heading,
    },
    plantingMeta: {
      fontSize: 12,
      color: palette.meta,
      marginTop: 4,
    },
    plantingStatus: {
      fontSize: 12,
      fontWeight: "500",
    },
    plantingStatusBadge: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 11,
      paddingVertical: 6,
    },
    harvestPromptRow: {
      borderTopWidth: 1,
      borderColor: palette.cardBorder,
      paddingVertical: 12,
    },
    harvestPromptTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: palette.heading,
    },
    harvestPromptMeta: {
      marginTop: 4,
      fontSize: 12,
      color: palette.meta,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: palette.background,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: "center",
    },
    secondaryButton: {
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      backgroundColor: palette.cardBg,
    },
    secondaryButtonText: {
      color: palette.heading,
      fontWeight: "600",
    },
    taskRow: {
      borderTopWidth: 1,
      borderColor: palette.cardBorder,
      paddingVertical: 12,
      gap: 10,
    },
    taskRowHighlighted: {
      backgroundColor: palette.innerBg,
      borderRadius: 12,
      paddingHorizontal: 10,
    },
    taskMain: {
      gap: 4,
    },
    taskTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: palette.heading,
    },
    taskDescription: {
      fontSize: 13,
      color: palette.secondary,
    },
    taskMeta: {
      fontSize: 12,
      color: palette.meta,
    },
    taskActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
      width: "100%",
    },
    taskActionButton: {
      flex: 1,
    },
    filterLabel: {
      fontSize: 12,
      color: palette.meta,
      marginBottom: 6,
      marginTop: 4,
    },
    filterChipsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 10,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      backgroundColor: palette.innerBg,
    },
    filterChipActive: {
      borderColor: palette.accentBorder,
      backgroundColor: palette.accentBg,
    },
    filterChipText: {
      fontSize: 12,
      color: palette.secondary,
      fontWeight: "500",
    },
    filterChipTextActive: {
      color: palette.accent,
      fontWeight: "600",
    },
    historyRow: {
      borderTopWidth: 1,
      borderColor: palette.cardBorder,
      paddingVertical: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    modal: {
      backgroundColor: palette.cardBg,
      marginHorizontal: 16,
      borderRadius: 20,
      padding: 18,
      gap: 12,
      borderWidth: 1,
      borderColor: palette.cardBorder,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: palette.heading,
    },
    modalText: {
      fontSize: 14,
      lineHeight: 20,
      color: palette.secondary,
    },
    modalActionsColumn: {
      gap: 10,
    },
    deleteButton: {
      borderColor: theme.colors.error,
    },
    metaSection: {
      paddingHorizontal: 4,
      paddingVertical: 4,
      marginTop: 2,
      marginBottom: 12,
      gap: 2,
    },
    metaText: {
      fontSize: 12,
      color: palette.meta,
    },
    skeletonPill: {
      width: 78,
      height: 24,
      borderRadius: 999,
      backgroundColor: palette.innerBg,
    },
    skeletonTitle: {
      width: "70%",
      height: 34,
      borderRadius: 10,
      backgroundColor: palette.innerBg,
    },
    skeletonLine: {
      width: "88%",
      height: 14,
      borderRadius: 8,
      backgroundColor: palette.innerBg,
    },
    skeletonChip: {
      width: 112,
      height: 30,
      borderRadius: 999,
      backgroundColor: palette.innerBg,
    },
    skeletonHeader: {
      width: 150,
      height: 20,
      borderRadius: 8,
      backgroundColor: palette.innerBg,
      marginBottom: 12,
    },
  });
};
