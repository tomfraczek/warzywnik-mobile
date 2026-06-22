import { getResponseError } from "@/src/api/axios";
import { actionTaskKeys } from "@/src/api/queries/actionTasks/actionTaskKeys";
import {
  ActionTask,
  getActionTaskSourceLabel,
  resolveActionTaskSourceType,
} from "@/src/api/queries/actionTasks/types";
import { useDeleteActionTask } from "@/src/api/queries/actionTasks/useDeleteActionTask";
import { useGetBedActionTasks } from "@/src/api/queries/actionTasks/useGetBedActionTasks";
import { useUpdateActionTask } from "@/src/api/queries/actionTasks/useUpdateActionTask";
import { useGetBedPlan } from "@/src/api/queries/bedPlan/useGetBedPlan";
import { bedKeys } from "@/src/api/queries/beds/bedKeys";
import {
  HarvestPromptItem,
  PostHarvestProposal,
  PostHarvestTaskSelection,
} from "@/src/api/queries/beds/harvestTypes";
import { Bed } from "@/src/api/queries/beds/types";
import { useCreateBedActionTasksBulk } from "@/src/api/queries/beds/useCreateBedActionTasksBulk";
import { useDeleteBed } from "@/src/api/queries/beds/useDeleteBed";
import { useGetBed } from "@/src/api/queries/beds/useGetBed";
import { useGetBedHarvestPrompts } from "@/src/api/queries/beds/useGetBedHarvestPrompts";
import { useUpdateBed } from "@/src/api/queries/beds/useUpdateBed";
import { Planting } from "@/src/api/queries/plantings/types";
import { useCreatePlantingActionTasksBulk } from "@/src/api/queries/plantings/useCreatePlantingActionTasksBulk";
import { useGetPlantings } from "@/src/api/queries/plantings/useGetPlantings";
import { usePostHarvestConfirmation } from "@/src/api/queries/plantings/usePostHarvestConfirmation";
import { useGetBedQuickActionNotes } from "@/src/api/queries/quickActions/useGetBedQuickActionNotes";
import { usePostBedQuickAction } from "@/src/api/queries/quickActions/usePostBedQuickAction";
import { useGetVegetable } from "@/src/api/queries/vegetables/useGetVegetable";
import { BedPlanEntryCard } from "@/src/app/(tabs)/beds/_components/BedPlanEntryCard";
import { BedSeasonHistorySection } from "@/src/app/(tabs)/beds/_components/BedSeasonHistorySection";
import { HarvestConfirmationModal } from "@/src/app/(tabs)/beds/_components/HarvestConfirmationModal";
import { PostHarvestActionsModal } from "@/src/app/(tabs)/beds/_components/PostHarvestActionsModal";
import { TasksCelebrationCard } from "@/src/app/(tabs)/beds/_components/TasksCelebrationCard";
import { Screen } from "@/src/components/Screen";
import CustomHeader from "@/src/components/navigation/CustomHeader";
import { CoachMarkOverlay } from "@/src/components/tutorial/CoachMarkOverlay";
import { BottomSheetModal } from "@/src/components/ui/BottomSheetModal";
import { PrimaryActionButton } from "@/src/components/ui/PrimaryActionButton";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { useSettings } from "@/src/context/SettingsProvider";
import { OFFLINE_MUTATION_MESSAGE } from "@/src/features/network/offline";
import {
  getPlantingStatusLabel,
  getPlantingStatusTone,
  isPlantingActiveLifecycleStatus,
  isPlantingPlannedStatus,
} from "@/src/features/plantings/status";
import { getTaskAffectedPlantingIds } from "@/src/features/tasks/model";
import {
  getTaskOwnerId,
  getTaskOwnerScope,
  getTaskRelationType,
} from "@/src/features/tasks/taskOwnership";
import {
  getTaskOwnershipLabel,
  getTaskOwnershipReason,
} from "@/src/features/tasks/taskPresentation";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { pluralize } from "@/src/utils/pluralize";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
  SegmentedButtons,
  Snackbar,
  Switch,
  TextInput,
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
    secondaryCta: dark ? "#4C7FB1" : "#356FA5",
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


const getSoilSlugLabel = (bed: Bed) => {
  if (!("soilSlug" in bed)) return null;
  const soilSlug = (bed as Record<string, unknown>).soilSlug;
  return typeof soilSlug === "string" ? formatSlug(soilSlug) : null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "Brak";
  return value.split("T")[0];
};

const formatNoteDateTime = (value?: string | null) => {
  if (!value) return "Brak daty";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Brak daty";
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getTaskPlantingId = (task: ActionTask): string | null => {
  const scope = (task.ownerScopeType ?? "").toLowerCase();
  if (scope === "planting" && task.ownerScopeId) return task.ownerScopeId;
  if (task.plantingId) return task.plantingId;
  const affected =
    task.affectedPlantingIds ??
    task.metadata?.affectedPlantingIds ??
    task.meta?.affectedPlantingIds;
  if (Array.isArray(affected) && affected.length === 1) return affected[0];
  return null;
};

const sortTasksByDueAt = (tasks: ActionTask[]) =>
  [...tasks].sort((a, b) => {
    const aDue = a.dueAt ?? "9999-12-31";
    const bDue = b.dueAt ?? "9999-12-31";
    return aDue.localeCompare(bDue);
  });

const getTaskRecordDate = (task: ActionTask) =>
  task.doneAt ?? task.dueAt ?? task.createdAt ?? task.updatedAt ?? null;

const sortTaskHistoryAsc = (tasks: ActionTask[]) =>
  [...tasks].sort((a, b) => {
    const aDate = getTaskRecordDate(a) ?? "0000-01-01";
    const bDate = getTaskRecordDate(b) ?? "0000-01-01";
    return aDate.localeCompare(bDate);
  });

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

const getActionTaskAffectedVegetablesLabel = (
  task: ActionTask,
  maxExplicitVegetables = 3,
) => {
  const candidate =
    task.metadata?.affectedVegetables ?? task.meta?.affectedVegetables;
  if (!Array.isArray(candidate)) return null;

  const vegetables = candidate.filter(
    (name): name is string =>
      typeof name === "string" && name.trim().length > 0,
  );

  if (vegetables.length === 0) return null;
  if (vegetables.length > maxExplicitVegetables) {
    const uprawForm = pluralize("uprawy", "upraw", "upraw", vegetables.length);
    return `Dotyczy ${vegetables.length} ${uprawForm} na grządce`;
  }

  return `Dotyczy: ${vegetables.join(", ")}`;
};

type PlantingRowProps = {
  planting: Planting;
  onPress: () => void;
  hasAttention: boolean;
  isFirst?: boolean;
};

const PlantingRow = memo(function PlantingRow({
  planting,
  onPress,
  hasAttention,
  isFirst,
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
  const showAttention = hasAttention;

  return (
    <Pressable
      style={[styles.plantingRow, isFirst ? styles.plantingRowFirst : null]}
      onPress={onPress}
    >
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
      {showAttention ? <Icon source="alert" size={15} color="#B6473D" /> : null}
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
  const { data: bedPlan } = useGetBedPlan(
    !isBedDeleted ? (resolvedBedId ?? null) : null,
  );
  const {
    data: pendingBedTasksResponse,
    refetch: refetchPendingBedTasks,
    isLoading: isBedTasksLoading,
    error: bedTasksError,
  } = useGetBedActionTasks(
    !isBedDeleted ? (resolvedBedId ?? null) : null,
    "pending",
    undefined,
    "includingChildren",
  );
  const {
    data: historyBedTasksResponse,
    refetch: refetchHistoryBedTasks,
    isLoading: isBedHistoryTasksLoading,
  } = useGetBedActionTasks(
    !isBedDeleted ? (resolvedBedId ?? null) : null,
    "all",
    undefined,
    "includingChildren",
  );
  const deleteBed = useDeleteBed();
  const updateBed = useUpdateBed(resolvedBedId ?? "");
  const updateActionTask = useUpdateActionTask();
  const deleteActionTask = useDeleteActionTask();
  const bedQuickNotesQuery = useGetBedQuickActionNotes(
    !isBedDeleted ? (resolvedBedId ?? null) : null,
  );
  const postBedQuickAction = usePostBedQuickAction(
    !isBedDeleted ? (resolvedBedId ?? null) : null,
  );

  const bed = data as Bed | undefined;
  const plantings = useMemo(
    () => plantingPages?.pages.flatMap((page) => page.items) ?? [],
    [plantingPages?.pages],
  );
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [plantingsFilter, setPlantingsFilter] = useState<"planned" | "active">(
    "active",
  );
  const [endedModalVisible, setEndedModalVisible] = useState(false);
  const [promptQueue, setPromptQueue] = useState<HarvestPromptItem[]>([]);
  const [lastPromptSignature, setLastPromptSignature] = useState("");
  const [postHarvestModalVisible, setPostHarvestModalVisible] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [taskInfoTask, setTaskInfoTask] = useState<ActionTask | null>(null);
  const [quickActionModalVisible, setQuickActionModalVisible] = useState(false);
  const [bedInfoModalVisible, setBedInfoModalVisible] = useState(false);
  const [quickActionStep, setQuickActionStep] = useState<"menu" | "note">(
    "menu",
  );
  const [quickActionNote, setQuickActionNote] = useState("");

  const [postHarvestActions, setPostHarvestActions] = useState<
    PostHarvestProposal[]
  >([]);
  const [harvestPlantingId, setHarvestPlantingId] = useState<string | null>(
    null,
  );
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState(false);

  const harvestPrompts = useMemo(
    () => harvestPromptsResponse?.items ?? [],
    [harvestPromptsResponse?.items],
  );
  const pendingBedTasks = useMemo(
    () => pendingBedTasksResponse?.items ?? [],
    [pendingBedTasksResponse?.items],
  );
  const historyBedTasks = useMemo(
    () => historyBedTasksResponse?.items ?? [],
    [historyBedTasksResponse?.items],
  );
  const pendingTasks = useMemo(() => {
    return sortTasksByDueAt(
      pendingBedTasks.filter(
        (task) => task.status === "pending" && !task.suppressedAt,
      ),
    );
  }, [pendingBedTasks]);
  const historyTasks = useMemo(
    () =>
      sortTaskHistoryAsc(
        historyBedTasks.filter((task) => {
          const isDoneOrCanceled =
            task.status === "done" || task.status === "canceled";
          return isDoneOrCanceled;
        }),
      ),
    [historyBedTasks],
  );
  const historyPreviewTasks = useMemo(
    () => historyTasks.slice(0, 4),
    [historyTasks],
  );
  const bedQuickNotes = useMemo(
    () => bedQuickNotesQuery.data?.items ?? [],
    [bedQuickNotesQuery.data?.items],
  );
  const bedQuickNotesPreview = useMemo(
    () => bedQuickNotes.slice(-5),
    [bedQuickNotes],
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
  const createPlantingActionTasksBulk =
    useCreatePlantingActionTasksBulk(harvestPlantingId);

  const harvestConfirmationVisible =
    !!activeHarvestPrompt && !postHarvestModalVisible;
  const activePlantings = useMemo(
    () =>
      plantings.filter((planting) =>
        isPlantingActiveLifecycleStatus(planting.status),
      ),
    [plantings],
  );
  const plannedPlantings = useMemo(
    () =>
      plantings.filter((planting) => isPlantingPlannedStatus(planting.status)),
    [plantings],
  );
  const endedPlantings = useMemo(
    () =>
      plantings.filter(
        (planting) => !isPlantingActiveLifecycleStatus(planting.status),
      ),
    [plantings],
  );
  const filteredPlantings = useMemo(
    () => (plantingsFilter === "planned" ? plannedPlantings : activePlantings),
    [plannedPlantings, activePlantings, plantingsFilter],
  );

  const activeTasks = useMemo(() => pendingTasks, [pendingTasks]);

  const hasAttentionItems = harvestPrompts.length > 0 || activeTasks.length > 0;

  const tasksError = bedTasksError;
  const isTasksLoading = isBedTasksLoading;

  const attentionPlantingIds = useMemo(() => {
    const ids = new Set<string>();
    harvestPrompts.forEach((prompt) => ids.add(prompt.plantingId));
    activeTasks.forEach((task) => {
      if (getTaskOwnerScope(task) === "planting") {
        const ownerId = getTaskOwnerId(task);
        if (ownerId) {
          ids.add(ownerId);
        }
      }
      if (task.plantingId) {
        ids.add(task.plantingId);
      }
      getTaskAffectedPlantingIds(task).forEach((plantingId) => {
        ids.add(plantingId);
      });
    });
    return ids;
  }, [harvestPrompts, activeTasks]);

  const isOffline = useIsOffline();

  const { tutorials, setTutorials } = useSettings();
  const [showTutorial, setShowTutorial] = useState(false);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const heroCardRef = useRef<View | null>(null);
  const addVegetableRef = useRef<View | null>(null);
  const plantingsSectionRef = useRef<View | null>(null);
  const tasksSectionRef = useRef<View | null>(null);
  const notesSectionRef = useRef<View | null>(null);
  const historySectionRef = useRef<View | null>(null);
  const seasonHistoryRef = useRef<View | null>(null);
  const plantingsSectionY = useRef(0);
  const tasksSectionY = useRef(0);
  const notesSectionY = useRef(0);
  const historySectionY = useRef(0);
  const seasonHistoryY = useRef(0);

  useFocusEffect(
    useCallback(() => {
      if (tutorials.enabled && !tutorials.bedDetailSeen && !isLoading && bed) {
        setShowTutorial(true);
      }
    }, [tutorials.enabled, tutorials.bedDetailSeen, isLoading, bed]),
  );

  const handleTutorialDismiss = useCallback(
    (dontShowAgain: boolean) => {
      setShowTutorial(false);
      if (dontShowAgain) {
        setTutorials({ bedDetailSeen: true });
      }
    },
    [setTutorials],
  );

  const handleBeforeStepMeasure = useCallback(
    (stepIndex: number): Promise<void> => {
      return new Promise((resolve) => {
        const sectionYs = [
          0, // 0: heroCard
          0, // 1: addVegetable
          plantingsSectionY.current, // 2: warzywa
          tasksSectionY.current, // 3: zadania
          notesSectionY.current, // 4: notatki
          historySectionY.current, // 5: historia zabiegów
          seasonHistoryY.current, // 6: historia upraw
        ];
        const y = sectionYs[stepIndex] ?? 0;
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, y - 80),
          animated: true,
        });
        setTimeout(resolve, y > 0 ? 500 : 300);
      });
    },
    [],
  );

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
      setHarvestPlantingId(response.plantingId ?? null);
      setPostHarvestModalVisible(true);
    } catch (err) {
      Alert.alert("Błąd", String(getResponseError(err)));
    }
  };

  const handleCreatePostHarvestTasks = async (
    tasks: PostHarvestTaskSelection[],
  ) => {
    if (!resolvedBedId) return;
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }

    const bedTasks = tasks.filter((t) => !t.target || t.target === "bed");
    const plantingTasks = tasks.filter((t) => t.target === "planting");

    let bedSuccess = bedTasks.length === 0;
    let plantingSuccess = plantingTasks.length === 0;

    if (bedTasks.length > 0) {
      try {
        await createBedActionTasksBulk.mutateAsync({
          items: bedTasks.map(({ actionTemplateId, dueDate }) => ({
            actionTemplateId,
            dueDate,
          })),
        });
        bedSuccess = true;
      } catch {
        bedSuccess = false;
      }
    }

    if (plantingTasks.length > 0) {
      if (!harvestPlantingId) {
        plantingSuccess = false;
      } else {
        try {
          await createPlantingActionTasksBulk.mutateAsync({
            items: plantingTasks.map(({ actionTemplateId, dueDate }) => ({
              actionTemplateId,
              dueDate,
            })),
          });
          plantingSuccess = true;
        } catch {
          plantingSuccess = false;
        }
      }
    }

    const anySuccess = bedSuccess || plantingSuccess;
    const allSuccess = bedSuccess && plantingSuccess;

    if (!anySuccess) {
      Alert.alert("Błąd", "Nie udało się dodać zadań po zbiorach");
      return;
    }

    setPostHarvestModalVisible(false);
    setPostHarvestActions([]);

    await Promise.allSettled([
      refetchHarvestPrompts(),
      refetchPendingBedTasks(),
      refetchHistoryBedTasks(),
      refetchPlantings(),
    ]);

    setSnackbarMessage(
      allSuccess
        ? "Dodano zadania po zbiorach"
        : "Część zadań po zbiorach nie została dodana",
    );
  };

  const pendingTasksKey = actionTaskKeys.bed(
    resolvedBedId ?? "",
    "pending",
    undefined,
    "includingChildren",
  );
  const allTasksKey = actionTaskKeys.bed(
    resolvedBedId ?? "",
    "all",
    undefined,
    "includingChildren",
  );

  const handleMarkTaskDone = async (taskId: string) => {
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }

    await queryClient.cancelQueries({ queryKey: pendingTasksKey });
    await queryClient.cancelQueries({ queryKey: allTasksKey });

    const prevPending = queryClient.getQueryData<{ items: ActionTask[] }>(
      pendingTasksKey,
    );
    const prevAll = queryClient.getQueryData<{ items: ActionTask[] }>(
      allTasksKey,
    );

    const now = new Date().toISOString();
    queryClient.setQueryData<{ items: ActionTask[] }>(pendingTasksKey, (old) =>
      old ? { items: old.items.filter((t) => t.id !== taskId) } : old,
    );
    queryClient.setQueryData<{ items: ActionTask[] }>(allTasksKey, (old) =>
      old
        ? {
            items: old.items.map((t) =>
              t.id === taskId ? { ...t, status: "done", doneAt: now } : t,
            ),
          }
        : old,
    );

    try {
      await updateActionTask.mutateAsync({
        id: taskId,
        payload: { status: "done" },
      });
      setSnackbarMessage("Zadanie wykonane");
    } catch (err) {
      queryClient.setQueryData(pendingTasksKey, prevPending);
      queryClient.setQueryData(allTasksKey, prevAll);
      Alert.alert("Błąd", String(getResponseError(err)));
    } finally {
      await Promise.allSettled([
        refetchPendingBedTasks(),
        refetchHistoryBedTasks(),
      ]);
    }
  };

  const handleDeleteTask = async (task: ActionTask) => {
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }

    await queryClient.cancelQueries({ queryKey: pendingTasksKey });
    await queryClient.cancelQueries({ queryKey: allTasksKey });

    const prevPending = queryClient.getQueryData<{ items: ActionTask[] }>(
      pendingTasksKey,
    );
    const prevAll = queryClient.getQueryData<{ items: ActionTask[] }>(
      allTasksKey,
    );

    queryClient.setQueryData<{ items: ActionTask[] }>(pendingTasksKey, (old) =>
      old ? { items: old.items.filter((t) => t.id !== task.id) } : old,
    );
    queryClient.setQueryData<{ items: ActionTask[] }>(allTasksKey, (old) =>
      old ? { items: old.items.filter((t) => t.id !== task.id) } : old,
    );

    try {
      await deleteActionTask.mutateAsync({
        id: task.id,
        ownerScopeType: task.ownerScopeType ?? null,
        ownerScopeId: task.ownerScopeId ?? null,
        bedId: resolvedBedId ?? null,
        plantingId: task.plantingId ?? null,
        growingSpaceId: task.growingSpaceId ?? null,
        relationType: task.relationType ?? null,
        affectedPlantingIds: task.affectedPlantingIds,
        meta: task.meta ?? null,
        metadata: task.metadata ?? null,
      });
      setSnackbarMessage("Zadanie usunięte");
    } catch (err) {
      queryClient.setQueryData(pendingTasksKey, prevPending);
      queryClient.setQueryData(allTasksKey, prevAll);
      Alert.alert("Błąd", String(getResponseError(err)));
    } finally {
      await Promise.allSettled([
        refetchPendingBedTasks(),
        refetchHistoryBedTasks(),
      ]);
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

  const openQuickActionModal = () => {
    setQuickActionStep("menu");
    setQuickActionNote("");
    setQuickActionModalVisible(true);
  };

  const closeQuickActionModal = () => {
    if (postBedQuickAction.isPending) return;
    setQuickActionModalVisible(false);
    setQuickActionStep("menu");
  };

  const handleSubmitBedQuickAction = async (payload: {
    actionKind: "NOTE";
    note: string;
  }) => {
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }

    try {
      await postBedQuickAction.mutateAsync(payload);
      await Promise.allSettled([
        refetchPendingBedTasks(),
        refetchHistoryBedTasks(),
        refetchPlantings(),
      ]);
      closeQuickActionModal();
      setSnackbarMessage("Akcja zarejestrowana: notatka");
    } catch (err) {
      setSnackbarMessage(String(getResponseError(err)));
    }
  };

  const depthLabel = useMemo(() => {
    if (!bed) return null;
    return bed.depthCm != null ? `${bed.depthCm} cm` : null;
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
      <CustomHeader
        title="Podgląd grządki"
        showBack
        backRoute="/(tabs)/beds"
        actions={[
          {
            icon: "pencil",
            accessibilityLabel: "Edytuj grządkę",
            disabled: deleteBed.isPending || isOffline,
            onPress: () => {
              if (!bed?.id) return;
              router.push(`/(tabs)/beds/${bed.id}/edit`);
            },
          },
          {
            icon: "trash-can-outline",
            accessibilityLabel: "Usuń grządkę",
            disabled: deleteBed.isPending || isOffline,
            onPress: () => {
              setDeleteConfirmationStep(true);
              setActionsVisible(true);
            },
          },
        ]}
      />
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.container}>
        <View ref={heroCardRef} collapsable={false} style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View
              style={[styles.entityTag, { backgroundColor: palette.accentBg }]}
            >
              <Text style={[styles.entityTagText, { color: palette.accent }]}>
                Grządka
              </Text>
            </View>
            <Pressable
              onPress={() => setBedInfoModalVisible(true)}
              style={styles.heroInfoButton}
              accessibilityRole="button"
              accessibilityLabel="Informacje o grządce"
            >
              <Icon
                source="information-outline"
                size={18}
                color={palette.secondary}
              />
            </Pressable>
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

        <View
          ref={addVegetableRef}
          collapsable={false}
          style={styles.addVegetableButton}
        >
          <PrimaryActionButton
            onPress={() => router.push(`/(tabs)/beds/${bed.id}/plantings/new`)}
            icon="sprout-outline"
            label="Dodaj warzywo"
            color={palette.secondaryCta}
            disabled={isOffline}
          />
        </View>

        <BedPlanEntryCard
          plannedPlantingsCount={
            bedPlan?.plannedPlantings.length ?? plannedPlantings.length
          }
          summary={bedPlan?.summary}
          fallbackToPlanCopy={
            (bedPlan?.plannedPlantings.length ?? plannedPlantings.length) === 0
          }
          onPress={() => {
            const plannedCount =
              bedPlan?.plannedPlantings.length ?? plannedPlantings.length;
            if (plannedCount > 0) {
              router.push(`/(tabs)/beds/${bed.id}/plan`);
              return;
            }
            router.push(`/(tabs)/beds/${bed.id}/plantings/new`);
          }}
          disabled={isOffline}
        />

        <View
          ref={plantingsSectionRef}
          collapsable={false}
          style={styles.section}
          onLayout={(e) => {
            plantingsSectionY.current = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Twoje warzywa</Text>
            {endedPlantings.length > 0 ? (
              <Pressable
                onPress={() => setEndedModalVisible(true)}
                style={styles.endedModalTrigger}
              >
                <Text
                  style={[
                    styles.endedModalTriggerText,
                    { color: palette.accent },
                  ]}
                >
                  Zakończone ({endedPlantings.length})
                </Text>
                <Icon source="history" size={14} color={palette.accent} />
              </Pressable>
            ) : null}
          </View>

          <SegmentedButtons
            value={plantingsFilter}
            onValueChange={(value) =>
              setPlantingsFilter(value as "planned" | "active")
            }
            buttons={[
              {
                value: "active",
                label: `Aktywne (${activePlantings.length})`,
                style: [
                  styles.segmentedButtonItem,
                  plantingsFilter === "active"
                    ? styles.segmentedButtonItemActive
                    : null,
                ],
                checkedColor: palette.accent,
                uncheckedColor: palette.secondary,
              },
              {
                value: "planned",
                label: `Planowane (${plannedPlantings.length})`,
                style: [
                  styles.segmentedButtonItem,
                  plantingsFilter === "planned"
                    ? styles.segmentedButtonItemActive
                    : null,
                ],
                checkedColor: palette.accent,
                uncheckedColor: palette.secondary,
              },
            ]}
            style={styles.segmentedButtons}
          />

          {isPlantingsLoading && filteredPlantings.length === 0 ? (
            <ActivityIndicator style={styles.inlineLoader} />
          ) : null}

          {plantingsError && filteredPlantings.length === 0 ? (
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
          !plantingsError &&
          filteredPlantings.length === 0 ? (
            <Text style={styles.valueText}>
              {plantingsFilter === "planned"
                ? "Brak planowanych upraw w tej grządce."
                : "Brak aktywnych upraw w tej grządce."}
            </Text>
          ) : null}

          {filteredPlantings.length > 0 ? (
            <View style={styles.plantingsListContainer}>
              <ScrollView
                nestedScrollEnabled
                style={styles.plantingsListScroll}
                contentContainerStyle={styles.plantingsListContent}
                showsVerticalScrollIndicator
              >
                {filteredPlantings.map((planting: Planting, idx: number) => (
                  <PlantingRow
                    key={planting.id}
                    planting={planting}
                    isFirst={idx === 0}
                    hasAttention={attentionPlantingIds.has(planting.id)}
                    onPress={() =>
                      router.push(
                        `/(tabs)/beds/${bed.id}/plantings/${planting.id}`,
                      )
                    }
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

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

        {/* ── Modal: zakończone uprawy ── */}
        <Portal>
          <Modal
            visible={endedModalVisible}
            onDismiss={() => setEndedModalVisible(false)}
            contentContainerStyle={[
              styles.endedModal,
              { backgroundColor: palette.cardBg },
            ]}
          >
            <View style={styles.endedModalHeader}>
              <Text
                style={[styles.endedModalTitle, { color: palette.heading }]}
              >
                Zakończone uprawy
              </Text>
              <IconButton
                icon="close"
                size={20}
                onPress={() => setEndedModalVisible(false)}
                iconColor={palette.secondary}
              />
            </View>
            {endedPlantings.length === 0 ? (
              <Text style={[styles.valueText, { color: palette.secondary }]}>
                Brak zakończonych upraw.
              </Text>
            ) : (
              <ScrollView
                style={styles.endedModalList}
                showsVerticalScrollIndicator={false}
              >
                {endedPlantings.map((planting: Planting, idx: number) => (
                  <PlantingRow
                    key={planting.id}
                    planting={planting}
                    isFirst={idx === 0}
                    hasAttention={false}
                    onPress={() => {
                      setEndedModalVisible(false);
                      router.push(
                        `/(tabs)/beds/${bed.id}/plantings/${planting.id}`,
                      );
                    }}
                  />
                ))}
              </ScrollView>
            )}
          </Modal>
        </Portal>

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

        <View
          ref={tasksSectionRef}
          collapsable={false}
          style={styles.section}
          onLayout={(e) => {
            tasksSectionY.current = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={[styles.sectionTitle, styles.sectionTitleInHeader]}>
                Zadania
              </Text>
              {hasAttentionItems ? (
                <Icon source="alert" size={18} color={palette.warning} />
              ) : null}
            </View>
            <Pressable
              style={styles.linkButton}
              onPress={() =>
                router.push(
                  `/(tabs)/planner/create-task?target=bed&bedId=${bed.id}`,
                )
              }
            >
              <Text style={styles.linkButtonText}>Dodaj zadanie</Text>
            </Pressable>
          </View>

          {isTasksLoading ? <ActivityIndicator /> : null}

          {tasksError ? (
            <View style={styles.inlineErrorBox}>
              <Text style={styles.errorText}>
                {String(getResponseError(tasksError))}
              </Text>
              <Button
                mode="outlined"
                onPress={() => {
                  void Promise.allSettled([
                    refetchPendingBedTasks(),
                    refetchHistoryBedTasks(),
                  ]);
                }}
              >
                Spróbuj ponownie
              </Button>
            </View>
          ) : null}

          {!isTasksLoading && !tasksError && activeTasks.length === 0 ? (
            <TasksCelebrationCard
              footer={
                <Button
                  mode="outlined"
                  onPress={() =>
                    router.push(
                      `/(tabs)/planner/create-task?target=bed&bedId=${bed.id}`,
                    )
                  }
                >
                  Dodaj zadanie
                </Button>
              }
            />
          ) : null}

          {activeTasks.map((task) => {
            const isHighlighted = highlightedActionTaskId === task.id;
            const affectedVegetablesLabel =
              getActionTaskAffectedVegetablesLabel(task);
            const relation = getTaskRelationType(task);
            const taskPlantingId = getTaskPlantingId(task);
            return (
              <View
                key={task.id}
                style={[
                  styles.taskRow,
                  isHighlighted ? styles.taskRowHighlighted : null,
                ]}
              >
                <View style={styles.taskMain}>
                  <View style={styles.taskTopRow}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    {task.description ? (
                      <IconButton
                        icon="information-outline"
                        size={18}
                        onPress={() => setTaskInfoTask(task)}
                        style={styles.taskInfoButton}
                      />
                    ) : null}
                  </View>
                  <Text style={styles.taskMeta}>
                    Termin: {formatDate(task.dueAt)}
                  </Text>
                  <Text style={styles.taskMeta}>
                    {getTaskOwnershipLabel(task)}
                  </Text>
                  {relation === "related_from_bed" ||
                  relation === "related_from_space" ? (
                    <Text style={styles.taskMeta}>
                      {getTaskOwnershipReason(task)}
                    </Text>
                  ) : null}
                  {affectedVegetablesLabel ? (
                    <Text style={styles.taskMeta}>
                      {affectedVegetablesLabel}
                    </Text>
                  ) : null}
                  <StatusBadge
                    label={getActionTaskSourceLabel(
                      resolveActionTaskSourceType(task),
                    )}
                    tone="neutral"
                  />
                </View>
                <View style={styles.taskActions}>
                  <Button
                    mode="contained"
                    style={styles.taskActionButton}
                    onPress={() => handleMarkTaskDone(task.id)}
                    disabled={updateActionTask.isPending || isOffline}
                  >
                    Oznacz jako wykonane
                  </Button>
                  {taskPlantingId ? (
                    <Button
                      mode="outlined"
                      style={styles.taskActionButton}
                      icon="sprout-outline"
                      onPress={() =>
                        router.push(
                          `/(tabs)/beds/${bed.id}/plantings/${taskPlantingId}`,
                        )
                      }
                    >
                      Przejdź do uprawy
                    </Button>
                  ) : null}

                  <Button
                    mode="elevated"
                    style={styles.taskActionButton}
                    onPress={() => handleDeleteTask(task)}
                    disabled={deleteActionTask.isPending || isOffline}
                  >
                    Anuluj
                  </Button>
                </View>
              </View>
            );
          })}
        </View>

        <View
          ref={notesSectionRef}
          collapsable={false}
          style={styles.section}
          onLayout={(e) => {
            notesSectionY.current = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Notatki</Text>
            <View style={styles.sectionHeaderRight}>
              {bedQuickNotes.length > 0 ? (
                <Pressable
                  style={styles.linkButton}
                  onPress={() => router.push(`/(tabs)/beds/${bed.id}/notes`)}
                >
                  <Text style={styles.linkButtonText}>Zobacz wszystkie</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={styles.linkButton}
                onPress={() => {
                  setQuickActionStep("note");
                  setQuickActionNote("");
                  setQuickActionModalVisible(true);
                }}
              >
                <Text style={styles.linkButtonText}>Dodaj notatkę</Text>
              </Pressable>
            </View>
          </View>

          {bedQuickNotesQuery.isLoading ? <ActivityIndicator /> : null}

          {bedQuickNotesQuery.error ? (
            <View style={styles.inlineErrorBox}>
              <Text style={styles.errorText}>
                {String(getResponseError(bedQuickNotesQuery.error))}
              </Text>
              <Button
                mode="outlined"
                onPress={() => bedQuickNotesQuery.refetch()}
              >
                Spróbuj ponownie
              </Button>
            </View>
          ) : null}

          {!bedQuickNotesQuery.isLoading &&
          !bedQuickNotesQuery.error &&
          bedQuickNotesPreview.length === 0 ? (
            <View style={styles.emptyStateCenter}>
              <Text style={styles.valueText}>
                Nie dodano jeszcze żadnych notatek do tej grządki.
              </Text>
              <Button
                mode="outlined"
                onPress={() => {
                  setQuickActionStep("note");
                  setQuickActionNote("");
                  setQuickActionModalVisible(true);
                }}
              >
                Dodaj notatkę
              </Button>
            </View>
          ) : null}

          {bedQuickNotesPreview.map((note) => (
            <View key={note.id} style={styles.noteTimelineRow}>
              <View style={styles.noteTimelineDot} />
              <View style={styles.noteTimelineContent}>
                <Text style={styles.noteTimelineDate}>
                  {formatNoteDateTime(note.occurredAt ?? note.createdAt)}
                </Text>
                <Text style={styles.noteTimelineText} numberOfLines={2}>
                  {note.note}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View
          ref={historySectionRef}
          collapsable={false}
          style={styles.section}
          onLayout={(e) => {
            historySectionY.current = e.nativeEvent.layout.y;
          }}
        >
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

          {isBedHistoryTasksLoading ? <ActivityIndicator /> : null}

          {bedTasksError ? (
            <View style={styles.inlineErrorBox}>
              <Text style={styles.errorText}>
                {String(getResponseError(bedTasksError))}
              </Text>
              <Button mode="outlined" onPress={() => refetchHistoryBedTasks()}>
                Spróbuj ponownie
              </Button>
            </View>
          ) : null}

          {!isBedHistoryTasksLoading &&
          !bedTasksError &&
          historyPreviewTasks.length === 0 ? (
            <Text style={styles.valueText}>
              Zapis wykonanych zabiegów pojawi się tutaj.
            </Text>
          ) : null}

          {historyPreviewTasks.map((task) => (
            <View key={`history-${task.id}`} style={styles.historyRow}>
              <View style={[styles.taskMain, styles.historyTaskMain]}>
                <View style={styles.taskTopRow}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  {task.description ? (
                    <IconButton
                      icon="information-outline"
                      size={18}
                      onPress={() => setTaskInfoTask(task)}
                      style={styles.taskInfoButton}
                    />
                  ) : null}
                </View>
                <Text style={styles.taskMeta}>
                  Data: {formatDate(getTaskRecordDate(task))}
                </Text>
                <Text style={styles.taskMeta}>
                  Źródło:{" "}
                  {getActionTaskSourceLabel(resolveActionTaskSourceType(task))}
                </Text>
              </View>

              <StatusBadge
                label={getTaskStatusLabel(task.status)}
                tone={getTaskStatusTone(task.status)}
              />
            </View>
          ))}
        </View>

        <View
          ref={seasonHistoryRef}
          collapsable={false}
          onLayout={(e) => {
            seasonHistoryY.current = e.nativeEvent.layout.y;
          }}
        >
          {resolvedBedId ? (
            <BedSeasonHistorySection
              bedId={resolvedBedId}
              maxItems={3}
              showSeeAllLink
              onPressSeeAll={() =>
                router.push(`/(tabs)/beds/${bed.id}/history`)
              }
            />
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Historia upraw</Text>
              <Text style={styles.valueText}>Brak danych grządki.</Text>
            </View>
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

        <BottomSheetModal
          visible={quickActionModalVisible}
          onDismiss={closeQuickActionModal}
          dismissDisabled={postBedQuickAction.isPending}
        >
          {postBedQuickAction.isPending ? <ActivityIndicator /> : null}

          {quickActionStep === "menu" ? (
            <View style={styles.modalActionsColumn}>
              <Text style={styles.modalTitle}>Wykonaj akcję</Text>
              <Button
                mode="contained"
                onPress={() => setQuickActionStep("note")}
                disabled={postBedQuickAction.isPending || isOffline}
                buttonColor="#6A4F9B"
                textColor="#FFFFFF"
              >
                Notatka
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  closeQuickActionModal();
                  router.push(
                    `/(tabs)/planner/create-task?target=bed&bedId=${bed.id}`,
                  );
                }}
                disabled={postBedQuickAction.isPending || isOffline}
                buttonColor="#2F6B4F"
                textColor="#FFFFFF"
              >
                Dodaj zadanie do grządki
              </Button>
              <Button
                mode="text"
                onPress={closeQuickActionModal}
                disabled={postBedQuickAction.isPending}
              >
                Zamknij
              </Button>
            </View>
          ) : null}

          {quickActionStep === "note" ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <View style={styles.modalActionsColumn}>
                <Text style={styles.modalTitle}>Notatka</Text>
                <TextInput
                  mode="outlined"
                  label="Treść notatki"
                  value={quickActionNote}
                  onChangeText={setQuickActionNote}
                  multiline
                  numberOfLines={4}
                  style={styles.modalInput}
                  disabled={postBedQuickAction.isPending}
                />
                <View style={styles.modalActionsBetween}>
                  <Button
                    mode="outlined"
                    onPress={() => setQuickActionStep("menu")}
                    disabled={postBedQuickAction.isPending}
                  >
                    Wstecz
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => {
                      const note = quickActionNote.trim();
                      if (!note) {
                        setSnackbarMessage("Wpisz notatkę.");
                        return;
                      }
                      handleSubmitBedQuickAction({
                        actionKind: "NOTE",
                        note,
                      });
                    }}
                    loading={postBedQuickAction.isPending}
                    disabled={
                      postBedQuickAction.isPending ||
                      isOffline ||
                      !quickActionNote.trim()
                    }
                  >
                    Zapisz
                  </Button>
                </View>
              </View>
            </KeyboardAvoidingView>
          ) : null}
        </BottomSheetModal>

        <Portal>
          <Modal
            visible={bedInfoModalVisible}
            onDismiss={() => setBedInfoModalVisible(false)}
            contentContainerStyle={styles.bedInfoModal}
          >
            <ScrollView
              contentContainerStyle={styles.bedInfoModalContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>Informacje o grządce</Text>

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

              {depthLabel ? (
                <>
                  <View style={styles.sectionDivider} />
                  <Text style={styles.subsectionTitle}>Głębokość grządki</Text>
                  <Text style={styles.dimensionSummary}>{depthLabel}</Text>
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
                  <Text style={styles.valueText}>
                    Brak danych o środowisku.
                  </Text>
                ) : null}
              </View>

              <View style={styles.sectionDivider} />
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

              <Button
                mode="contained"
                onPress={() => setBedInfoModalVisible(false)}
              >
                Zamknij
              </Button>
            </ScrollView>
          </Modal>

          <Modal
            visible={!!taskInfoTask}
            onDismiss={() => setTaskInfoTask(null)}
            contentContainerStyle={styles.taskInfoModal}
          >
            <Text style={styles.modalTitle}>Szczegóły zadania</Text>
            <Text style={styles.taskInfoModalText}>
              {taskInfoTask?.description ?? "Brak opisu zadania."}
            </Text>
            <Button mode="contained" onPress={() => setTaskInfoTask(null)}>
              Zamknij
            </Button>
          </Modal>

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
                      router.push(
                        `/(tabs)/planner/create-task?target=bed&bedId=${bed.id}`,
                      );
                    }}
                    disabled={deleteBed.isPending || isOffline}
                  >
                    Dodaj zadanie do grządki
                  </Button>
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
      </ScrollView>

      <Portal>
        <Snackbar
          visible={!!snackbarMessage}
          onDismiss={() => setSnackbarMessage(null)}
          duration={2400}
          wrapperStyle={{ marginBottom: 72 }}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>

      <CoachMarkOverlay
        visible={showTutorial}
        onDismiss={handleTutorialDismiss}
        beforeStepMeasure={handleBeforeStepMeasure}
        steps={[
          {
            ref: heroCardRef,
            title: "Twoja grządka",
            description:
              "Tutaj widzisz wszystkie informacje o grządce — nazwę, status, środowisko uprawy i typ gleby.",
            placement: "bottom",
          },
          {
            ref: addVegetableRef,
            title: "Dodaj warzywo",
            description:
              "Dotknij, aby dodać warzywo do tej grządki i zaplanować jego uprawę.",
            placement: "bottom",
          },
          {
            ref: plantingsSectionRef,
            title: "Twoje warzywa",
            description:
              "Tu znajdziesz aktywne i planowane uprawy w tej grządce. Dotknij wiersz, aby zobaczyć szczegóły.",
            placement: "top",
          },
          {
            ref: tasksSectionRef,
            title: "Zadania",
            description:
              "Aplikacja sugeruje zadania do wykonania, np. podlewanie czy nawożenie. Możesz je oznaczać jako wykonane lub anulować.",
            placement: "top",
          },
          {
            ref: notesSectionRef,
            title: "Notatki",
            description:
              "Zapisuj obserwacje, spostrzeżenia i wskazówki dotyczące tej grządki. Notatki pomagają śledzić historię upraw.",
            placement: "top",
          },
          {
            ref: historySectionRef,
            title: "Historia zabiegów",
            description:
              "Tu znajdziesz zapis wykonanych zadań — podlewań, nawożeń i innych zabiegów. Dobra historia to klucz do lepszych zbiorów.",
            placement: "top",
          },
          {
            ref: seasonHistoryRef,
            title: "Historia upraw",
            description:
              "Przegląd poprzednich sezonów — co rosło w tej grządce, kiedy i z jakim wynikiem. Pomaga planować rotację upraw.",
            placement: "top",
          },
        ]}
      />
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
    heroInfoButton: {
      width: 34,
      height: 34,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.innerBg,
      borderWidth: 1,
      borderColor: palette.cardBorder,
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
    quickActionButton: {
      marginBottom: 10,
    },
    addVegetableButton: {
      marginBottom: 14,
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
    sectionHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    sectionHeaderRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    emptyStateCenter: {
      alignItems: "center",
      gap: 12,
      paddingVertical: 8,
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 19,
      fontWeight: "700",
      color: palette.heading,
    },
    endedModalTrigger: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    endedModalTriggerText: {
      fontSize: 13,
      fontWeight: "600",
    },
    endedModal: {
      margin: 20,
      borderRadius: 16,
      padding: 20,
      maxHeight: "80%",
    },
    endedModalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    endedModalTitle: {
      fontSize: 17,
      fontWeight: "700",
    },
    endedModalList: {
      flexGrow: 0,
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
    plantingsListContainer: {
      maxHeight: 360,
      marginTop: 2,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: palette.cardBg,
    },
    plantingsListScroll: {
      maxHeight: 360,
    },
    plantingsListContent: {
      paddingHorizontal: 12,
      paddingVertical: 4,
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
    plantingRowFirst: {
      borderTopWidth: 0,
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
    taskTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 8,
    },
    taskTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: palette.heading,
      flex: 1,
    },
    taskInfoButton: {
      margin: -8,
    },
    taskMeta: {
      fontSize: 12,
      color: palette.meta,
    },
    taskActions: {
      flexDirection: "column",
      justifyContent: "space-between",
      gap: 8,
      width: "100%",
    },
    taskActionButton: {
      flex: 1,
    },
    segmentedButtons: {
      alignSelf: "flex-start",
      marginBottom: 8,
    },
    segmentedButtonItem: {
      borderColor: palette.cardBorder,
      backgroundColor: palette.cardBg,
    },
    segmentedButtonItemActive: {
      borderColor: palette.accentBorder,
      backgroundColor: palette.accentBg,
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
    historyTaskMain: {
      flex: 1,
      minWidth: 0,
    },
    noteTimelineRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: palette.cardBorder,
      paddingVertical: 12,
    },
    noteTimelineDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: palette.accent,
      marginTop: 6,
    },
    noteTimelineContent: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    noteTimelineDate: {
      fontSize: 12,
      color: palette.meta,
      fontWeight: "500",
    },
    noteTimelineText: {
      fontSize: 14,
      lineHeight: 20,
      color: palette.heading,
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
    actionSheetModal: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 0,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      padding: 16,
      paddingBottom: 26,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      gap: 12,
    },
    bottomSheetModalWrapper: {
      justifyContent: "flex-end",
      margin: 0,
    },
    actionSheetHandle: {
      alignSelf: "center",
      width: 52,
      height: 5,
      borderRadius: 999,
      backgroundColor: theme.colors.outline,
      marginBottom: 2,
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
    taskInfoModal: {
      backgroundColor: palette.cardBg,
      marginHorizontal: 16,
      borderRadius: 20,
      padding: 18,
      gap: 12,
      borderWidth: 1,
      borderColor: palette.cardBorder,
    },
    bedInfoModal: {
      backgroundColor: palette.cardBg,
      marginHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      maxHeight: "85%",
    },
    bedInfoModalContent: {
      padding: 18,
      gap: 12,
    },
    taskInfoModalText: {
      fontSize: 14,
      lineHeight: 20,
      color: palette.secondary,
    },
    modalActionsColumn: {
      gap: 10,
    },
    modalActionsBetween: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 10,
    },
    modalInput: {
      backgroundColor: theme.colors.surface,
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
