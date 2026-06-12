import { getResponseError } from "@/src/api/axios";
import {
  ActionTask,
  getActionTaskSourceLabel,
  resolveActionTaskSourceType,
} from "@/src/api/queries/actionTasks/types";
import { useGetPlantingActionTasks } from "@/src/api/queries/actionTasks/useGetPlantingActionTasks";
import { useUpdateActionTask } from "@/src/api/queries/actionTasks/useUpdateActionTask";
import { useGetBed } from "@/src/api/queries/beds/useGetBed";
import {
  DiseaseOccurrence,
  DiseaseOccurrenceStatus,
  DiseaseSeverity,
} from "@/src/api/queries/diseaseOccurrences/types";
import { useCreatePlantingDiseaseOccurrence } from "@/src/api/queries/diseaseOccurrences/useCreateBedDiseaseOccurrence";
import { useDeleteDiseaseOccurrence } from "@/src/api/queries/diseaseOccurrences/useDeleteDiseaseOccurrence";
import { useGetPlantingDiseaseOccurrences } from "@/src/api/queries/diseaseOccurrences/useGetBedDiseaseOccurrences";
import { useUpdateDiseaseOccurrence } from "@/src/api/queries/diseaseOccurrences/useUpdateDiseaseOccurrence";
import { useSearchDiseases } from "@/src/api/queries/diseases/useSearchDiseases";
import {
  PestOccurrence,
  PestOccurrenceStatus,
} from "@/src/api/queries/pestOccurrences/types";
import { useCreatePlantingPestOccurrence } from "@/src/api/queries/pestOccurrences/useCreateBedPestOccurrence";
import { useDeletePestOccurrence } from "@/src/api/queries/pestOccurrences/useDeletePestOccurrence";
import { useGetPlantingPestOccurrences } from "@/src/api/queries/pestOccurrences/useGetBedPestOccurrences";
import { useUpdatePestOccurrence } from "@/src/api/queries/pestOccurrences/useUpdatePestOccurrence";
import { useGetPests } from "@/src/api/queries/pests/useGetPests";
import {
  HarvestResultRecord,
  Planting,
  PlantingStartMethod,
  PlantingStatus,
  Warning,
} from "@/src/api/queries/plantings/types";
import { useDeletePlanting } from "@/src/api/queries/plantings/useDeletePlanting";
import { useGetPlanting } from "@/src/api/queries/plantings/useGetPlanting";
import { useGetPlantingAvailableStatuses } from "@/src/api/queries/plantings/useGetPlantingAvailableStatuses";
import { useUpdatePlanting } from "@/src/api/queries/plantings/useUpdatePlanting";
import { useGetPlantingQuickActionNotes } from "@/src/api/queries/quickActions/useGetPlantingQuickActionNotes";
import { usePostPlantingQuickAction } from "@/src/api/queries/quickActions/usePostPlantingQuickAction";
import { useGetVegetable } from "@/src/api/queries/vegetables/useGetVegetable";
import { AppDatePickerModal } from "@/src/components/AppDatePickerModal";
import { Screen } from "@/src/components/Screen";
import CustomHeader from "@/src/components/navigation/CustomHeader";
import { BottomSheetModal } from "@/src/components/ui/BottomSheetModal";
import { PrimaryActionButton } from "@/src/components/ui/PrimaryActionButton";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { OFFLINE_MUTATION_MESSAGE } from "@/src/features/network/offline";
import {
  getPlantingStatusLabel,
  getPlantingStatusTone,
} from "@/src/features/plantings/status";
import { getTaskRelationType } from "@/src/features/tasks/taskOwnership";
import {
  getTaskOwnershipLabel,
  getTaskOwnershipReason,
} from "@/src/features/tasks/taskPresentation";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { getTodayKey } from "@/src/utils/date";
import { formatQualityRating, formatYield } from "@/src/utils/learningMappers";
import { isAxiosError } from "axios";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Button,
  Chip,
  Icon,
  IconButton,
  MD3Theme,
  Modal,
  Portal,
  SegmentedButtons,
  Snackbar,
  Surface,
  TextInput,
  useTheme,
} from "react-native-paper";
import { TasksCelebrationCard } from "../../_components/TasksCelebrationCard";
import { PlantingHarvestResultForm } from "./_components/PlantingHarvestResultForm";
import { PlantingSeasonSection } from "./_components/PlantingSeasonSection";
import { PlantingTimelineSection } from "./_components/PlantingTimelineSection";

const formatDate = (value?: string | null) => {
  if (!value) return "Brak";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Brak";
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
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

const START_METHOD_LABELS: Record<PlantingStartMethod, string> = {
  DIRECT_SOW: "Siew bezpośredni",
  TRANSPLANT: "Własna rozsada",
  PURCHASED_SEEDLING: "Kupiona flanca / sadzonka",
};

const PLANTING_STATUS_DESCRIPTIONS: Record<PlantingStatus, string> = {
  NEW: "Ta uprawa jest zaplanowana i jeszcze nie została rozpoczęta.",
  IN_GROUND: "Uprawa znajduje się już w gruncie i jest w trakcie wzrostu.",
  READY_FOR_FINAL_HARVEST: "Rośliny są gotowe do końcowego zbioru.",
  HARVESTED: "Zbiory zostały wykonane.",
  CLEARED: "Uprawa została uprzątnięta po zakończeniu sezonu.",
  FAILED: "Uprawa zakończyła się niepowodzeniem.",
  CANCELLED: "Uprawa została anulowana i nie będzie kontynuowana.",
};

type GrowthStep = {
  key: PlantingStatus;
  label: string;
};

type GrowthStepState = "done" | "current" | "pending";

type GrowthTimelineStep = GrowthStep & {
  state: GrowthStepState;
};

const DIRECT_SOW_GROWTH_STEPS: GrowthStep[] = [
  { key: "NEW", label: "Planowana" },
  { key: "IN_GROUND", label: "Wsadzenie do gruntu" },
  { key: "READY_FOR_FINAL_HARVEST", label: "Gotowe do zbioru" },
  { key: "HARVESTED", label: "Zbiory" },
  { key: "CLEARED", label: "Uprzątnięte" },
];

const TRANSPLANT_GROWTH_STEPS: GrowthStep[] = [
  { key: "NEW", label: "Planowana" },
  { key: "IN_GROUND", label: "Wsadzenie do gruntu" },
  { key: "READY_FOR_FINAL_HARVEST", label: "Gotowe do zbioru" },
  { key: "HARVESTED", label: "Zbiory" },
  { key: "CLEARED", label: "Uprzątnięte" },
];

type ExtendedPlanting = Planting & {
  timelineTimezone?: string | null;
  appliedRulesVersion?: string | null;
  transplantedAt?: string | null;
  harvestedAt?: string | null;
  harvestWindowStart?: string | null;
  harvestWindowEnd?: string | null;
};

function buildPalette(dark: boolean) {
  return {
    background: dark ? "#141816" : "#F7F8F5",
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "#252D29" : "#E8ECE7",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
    muted: dark ? "#7A8880" : "#97A29B",
    secondaryCta: dark ? "#4C7FB1" : "#356FA5",
    accent: dark ? "#7AB88A" : "#4A7C59",
    accentBg: dark ? "#1A2E1F" : "#EBF5EE",
    accentBorder: dark ? "#2A4A32" : "#C5DFC9",
    heroTagBg: dark ? "#202A23" : "#EDF4EE",
    heroTagText: dark ? "#9ECFA9" : "#4F7459",
    chipBg: dark ? "#1F2521" : "#F3F6F2",
    chipBorder: dark ? "#313A34" : "#E2E8E3",
    chipText: dark ? "#B7C2BB" : "#637067",
    taskHighlight: dark ? "#212A24" : "#F4F8F4",
    warningInfoBg: dark ? "#1A2328" : "#EEF6FB",
    warningInfoBorder: dark ? "#2B3A42" : "#D3E7F4",
    warningInfoText: dark ? "#9FC6DD" : "#3F6C89",
    warningWarningBg: dark ? "#2A251B" : "#FDF5E8",
    warningWarningBorder: dark ? "#4A3D27" : "#F0DFC0",
    warningWarningText: dark ? "#E1C48B" : "#9B6E2A",
    warningCriticalBg: dark ? "#2C1F1F" : "#FCEEF0",
    warningCriticalBorder: dark ? "#503434" : "#F3D1D7",
    warningCriticalText: dark ? "#E4A5AE" : "#A94A58",
  };
}

const isHarvestActionTask = (task: ActionTask): boolean => {
  const actionType = (task.actionTemplate?.type ?? "").toUpperCase();
  const actionSlug = (task.actionTemplate?.slug ?? "").toUpperCase();
  const title = (task.title ?? "").toLowerCase();
  return (
    actionType === "HARVEST" ||
    actionSlug.includes("HARVEST") ||
    title.includes("zbiór") ||
    title.includes("zbior") ||
    title.includes("zebra")
  );
};

const sortTasksByDueAt = (tasks: ActionTask[]) =>
  [...tasks].sort((a, b) => {
    const aDue = a.dueAt ?? "9999-12-31";
    const bDue = b.dueAt ?? "9999-12-31";
    return aDue.localeCompare(bDue);
  });

const isoToDateOnly = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const parseIsoDate = (value?: string | null) => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const getStatusLabel = (
  status: DiseaseOccurrenceStatus | PestOccurrenceStatus,
) => {
  if (status === "suspected") return "Podejrzenie";
  if (status === "confirmed") return "Potwierdzony";
  return "Opanowany";
};

export default function PlantingDetailsScreen() {
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);
  const styles = makeStyles(theme);
  const { bedId, plantingId, actionTaskId } = useLocalSearchParams<{
    bedId?: string | string[];
    plantingId?: string | string[];
    actionTaskId?: string | string[];
  }>();
  const resolvedBedId = Array.isArray(bedId) ? bedId[0] : bedId;
  const resolvedPlantingId = Array.isArray(plantingId)
    ? plantingId[0]
    : plantingId;
  const highlightedActionTaskId = Array.isArray(actionTaskId)
    ? actionTaskId[0]
    : actionTaskId;
  const todayKey = getTodayKey();
  const router = useRouter();

  const { data, isLoading, error, refetch } = useGetPlanting(
    resolvedPlantingId ?? null,
  );
  const { data: bed } = useGetBed(resolvedBedId ?? null);

  const deletePlanting = useDeletePlanting(resolvedBedId);
  const updatePlanting = useUpdatePlanting(
    resolvedPlantingId ?? "",
    resolvedBedId,
  );
  const {
    data: plantingTasksResponse,
    refetch: refetchPlantingTasks,
    isLoading: isPlantingTasksLoading,
    error: plantingTasksError,
  } = useGetPlantingActionTasks(
    resolvedPlantingId ?? null,
    "pending",
    undefined,
    "all",
  );
  const updateActionTask = useUpdateActionTask();

  const [problemsTab, setProblemsTab] = useState<"diseases" | "pests">(
    "diseases",
  );
  const [problemStatus, setProblemStatus] = useState<"active" | "resolved">(
    "active",
  );
  const [actionsVisible, setActionsVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [taskIdsCompleting, setTaskIdsCompleting] = useState<string[]>([]);
  const [taskInfoTask, setTaskInfoTask] = useState<ActionTask | null>(null);
  const [harvestFormVisible, setHarvestFormVisible] = useState(false);
  const [editingHarvestRecord, setEditingHarvestRecord] =
    useState<HarvestResultRecord | null>(null);

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [startPlantingConfirmModalVisible, setStartPlantingConfirmModalVisible] =
    useState(false);
  const [
    confirmStartPlantingModalVisible,
    setConfirmStartPlantingModalVisible,
  ] = useState(false);
  const [
    confirmDeletePlantingModalVisible,
    setConfirmDeletePlantingModalVisible,
  ] = useState(false);
  const [
    confirmHarvestWindowModalVisible,
    setConfirmHarvestWindowModalVisible,
  ] = useState(false);
  const [confirmHarvestWindowDateLabel, setConfirmHarvestWindowDateLabel] =
    useState("");
  const [
    confirmDeleteOccurrenceModalVisible,
    setConfirmDeleteOccurrenceModalVisible,
  ] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<PlantingStatus | null>(
    null,
  );
  const [statusErrorMessage, setStatusErrorMessage] = useState<string | null>(
    null,
  );
  const [quickActionModalVisible, setQuickActionModalVisible] = useState(false);
  const [quickActionStep, setQuickActionStep] = useState<"menu" | "note">(
    "menu",
  );
  const [quickActionNote, setQuickActionNote] = useState("");

  const diseaseActiveQuery = useGetPlantingDiseaseOccurrences(
    resolvedPlantingId ?? null,
    "active",
  );
  const diseaseResolvedQuery = useGetPlantingDiseaseOccurrences(
    resolvedPlantingId ?? null,
    "resolved",
  );
  const pestActiveQuery = useGetPlantingPestOccurrences(
    resolvedPlantingId ?? null,
    "active",
  );
  const pestResolvedQuery = useGetPlantingPestOccurrences(
    resolvedPlantingId ?? null,
    "resolved",
  );

  const createDiseaseOccurrence = useCreatePlantingDiseaseOccurrence(
    resolvedPlantingId ?? null,
  );
  const updateDiseaseOccurrence = useUpdateDiseaseOccurrence();
  const deleteDiseaseOccurrence = useDeleteDiseaseOccurrence();
  const postPlantingQuickAction = usePostPlantingQuickAction(
    resolvedPlantingId ?? null,
  );
  const plantingQuickNotesQuery = useGetPlantingQuickActionNotes(
    resolvedPlantingId ?? null,
  );

  const createPestOccurrence = useCreatePlantingPestOccurrence(
    resolvedPlantingId ?? null,
  );
  const updatePestOccurrence = useUpdatePestOccurrence();
  const deletePestOccurrence = useDeletePestOccurrence();

  const planting = data as ExtendedPlanting | undefined;
  const {
    data: vegetable,
    isLoading: isVegetableLoading,
    error: vegetableError,
    refetch: refetchVegetable,
  } = useGetVegetable(planting?.vegetableId ?? null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const availableStatusesQuery = useGetPlantingAvailableStatuses(
    resolvedPlantingId ?? null,
    Boolean(statusModalVisible),
  );
  const availableStatuses = useMemo(
    () => availableStatusesQuery.data?.availableStatuses ?? [],
    [availableStatusesQuery.data?.availableStatuses],
  );
  const lifecycleOrder = useMemo<PlantingStatus[]>(() => {
    const steps =
      planting?.startMethod === "TRANSPLANT"
        ? TRANSPLANT_GROWTH_STEPS
        : DIRECT_SOW_GROWTH_STEPS;

    return steps.map((step) => step.key);
  }, [planting?.startMethod]);
  const statusOptionsByDirection = useMemo(() => {
    const next: PlantingStatus[] = [];
    const rollback: PlantingStatus[] = [];
    const other: PlantingStatus[] = [];
    const currentStatus = planting?.status;

    if (!currentStatus) {
      return { next, rollback, other };
    }

    const currentIndex = lifecycleOrder.indexOf(currentStatus);
    const orderIndexByStatus = new Map<PlantingStatus, number>(
      lifecycleOrder.map((status, index) => [status, index]),
    );

    availableStatuses.forEach((status) => {
      const candidateIndex = orderIndexByStatus.get(status);

      if (currentIndex >= 0 && candidateIndex != null) {
        if (candidateIndex > currentIndex) {
          next.push(status);
          return;
        }

        if (candidateIndex < currentIndex) {
          rollback.push(status);
          return;
        }
      }

      other.push(status);
    });

    return { next, rollback, other };
  }, [availableStatuses, lifecycleOrder, planting?.status]);

  const [diseaseModalVisible, setDiseaseModalVisible] = useState(false);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string | null>(
    null,
  );
  const [selectedDiseaseName, setSelectedDiseaseName] = useState<string | null>(
    null,
  );
  const [diseaseStatus, setDiseaseStatus] =
    useState<DiseaseOccurrenceStatus>("suspected");
  const [severity, setSeverity] = useState<DiseaseSeverity | undefined>(
    undefined,
  );
  const [diseaseNote, setDiseaseNote] = useState("");
  const [observedAt, setObservedAt] = useState<string | null>(null);
  const [observedOpen, setObservedOpen] = useState(false);
  const [diseaseSearch, setDiseaseSearch] = useState("");

  const [pestModalVisible, setPestModalVisible] = useState(false);
  const [selectedPestId, setSelectedPestId] = useState<string | null>(null);
  const [selectedPestName, setSelectedPestName] = useState<string | null>(null);
  const [pestStatus, setPestStatus] =
    useState<PestOccurrenceStatus>("suspected");
  const [pestNote, setPestNote] = useState("");
  const [pestSearch, setPestSearch] = useState("");

  const [editVisible, setEditVisible] = useState(false);
  const [editType, setEditType] = useState<"disease" | "pest" | null>(null);
  const [editOccurrenceId, setEditOccurrenceId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<
    DiseaseOccurrenceStatus | PestOccurrenceStatus
  >("suspected");
  const [editNote, setEditNote] = useState("");

  const observedDate = useMemo(() => parseIsoDate(observedAt), [observedAt]);
  const searchDiseasesQuery = useSearchDiseases(diseaseSearch);
  const commonDiseases = vegetable?.commonDiseases ?? [];
  const diseaseSearchItems = searchDiseasesQuery.data ?? [];

  const pestDictionaryQuery = useGetPests({
    page: 1,
    limit: 50,
    q: pestSearch.trim() || undefined,
  });
  const commonPestsQuery = useGetPests({
    page: 1,
    limit: 20,
  });
  const pestSearchItems = useMemo(
    () => pestDictionaryQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [pestDictionaryQuery.data?.pages],
  );
  const commonPests = useMemo(
    () =>
      commonPestsQuery.data?.pages
        .flatMap((page) => page.items)
        .filter((item) => !!item?.id && !!item?.name)
        .slice(0, 12) ?? [],
    [commonPestsQuery.data?.pages],
  );

  const diseaseOccurrencesQuery =
    problemStatus === "active" ? diseaseActiveQuery : diseaseResolvedQuery;
  const pestOccurrencesQuery =
    problemStatus === "active" ? pestActiveQuery : pestResolvedQuery;

  const diseaseOccurrences = (diseaseOccurrencesQuery.data ??
    []) as DiseaseOccurrence[];
  const pestOccurrences = (pestOccurrencesQuery.data ?? []) as PestOccurrence[];
  const hasAnyResolvedProblems =
    (diseaseResolvedQuery.data?.length ?? 0) +
      (pestResolvedQuery.data?.length ?? 0) >
    0;
  const hasAnyProblems =
    (diseaseActiveQuery.data?.length ?? 0) +
      (pestActiveQuery.data?.length ?? 0) +
      (diseaseResolvedQuery.data?.length ?? 0) +
      (pestResolvedQuery.data?.length ?? 0) >
    0;
  const plantingTasks = useMemo(() => {
    const ownAndRelatedPendingTasks = (
      plantingTasksResponse?.items ?? []
    ).filter((task) => task.status === "pending" && !task.suppressedAt);

    return sortTasksByDueAt(ownAndRelatedPendingTasks);
  }, [plantingTasksResponse?.items]);
  const visiblePlantingTasks = useMemo(
    () =>
      plantingTasks.filter((task) => {
        const dueDateKey = isoToDateOnly(task.dueAt);
        if (!dueDateKey) return true;
        return dueDateKey >= todayKey;
      }),
    [plantingTasks, todayKey],
  );
  const hiddenOverdueTasksCount = useMemo(
    () =>
      plantingTasks.filter((task) => {
        const dueDateKey = isoToDateOnly(task.dueAt);
        return Boolean(dueDateKey) && dueDateKey < todayKey;
      }).length,
    [plantingTasks, todayKey],
  );
  const plantingQuickNotes = useMemo(
    () => plantingQuickNotesQuery.data?.items ?? [],
    [plantingQuickNotesQuery.data?.items],
  );
  const plantingQuickNotesPreview = useMemo(
    () => plantingQuickNotes.slice(-5),
    [plantingQuickNotes],
  );
  const tasksError = plantingTasksError;
  const isTasksLoading = isPlantingTasksLoading;

  useEffect(() => {
    if (taskIdsCompleting.length === 0) return;
    const visibleTaskIds = new Set(plantingTasks.map((task) => task.id));
    setTaskIdsCompleting((prev) =>
      prev.filter((taskId) => visibleTaskIds.has(taskId)),
    );
  }, [plantingTasks, taskIdsCompleting.length]);

  const vegetableName = isVegetableLoading
    ? "Ładowanie..."
    : (vegetable?.name ?? (vegetableError ? "Brak danych" : "Brak danych"));

  const isOffline = useIsOffline();

  const statusLabel = planting ? getPlantingStatusLabel(planting.status) : "—";
  const isPlannedPlanting = planting?.status === "NEW";
  const statusTone = planting
    ? getPlantingStatusTone(planting.status, theme.dark)
    : null;
  const startMethodLabel = planting?.startMethod
    ? START_METHOD_LABELS[planting.startMethod]
    : "Brak";
  const expectedHarvestWindowStart =
    planting?.harvestWindowStart ?? planting?.harvestStartDate ?? null;
  const expectedHarvestWindowEnd =
    planting?.harvestWindowEnd ?? planting?.harvestEndDate ?? null;
  const expectedHarvestWindowLabel =
    expectedHarvestWindowStart && expectedHarvestWindowEnd
      ? `${formatDate(expectedHarvestWindowStart)} – ${formatDate(expectedHarvestWindowEnd)}`
      : expectedHarvestWindowStart
        ? `Od ${formatDate(expectedHarvestWindowStart)}`
        : expectedHarvestWindowEnd
          ? `Do ${formatDate(expectedHarvestWindowEnd)}`
          : "Brak danych";
  const plantingBedLabel =
    planting?.bedName?.trim() ||
    bed?.name?.trim() ||
    (resolvedBedId ? `Grządka #${resolvedBedId.slice(0, 8)}` : "Brak danych");

  const vegetableLibraryId = planting?.vegetableId ?? vegetable?.id ?? null;

  const openVegetableLibrary = () => {
    if (!vegetableLibraryId) {
      Alert.alert("Biblioteka", "Brak identyfikatora warzywa dla tej uprawy.");
      return;
    }

    router.push(`/(tabs)/education/vegetables/${vegetableLibraryId}`);
  };

  const harvestRecords = useMemo(() => {
    if (!planting) return [];
    const records = Array.isArray(planting.harvestResults)
      ? planting.harvestResults
      : [];

    const fallbackHasLegacyData =
      planting.yieldKg != null ||
      planting.yieldQualityRating != null ||
      !!planting.yieldNotes;

    if (records.length > 0) return records;

    if (fallbackHasLegacyData) {
      return [
        {
          id: `legacy-${planting.id}`,
          harvestedAt: planting.harvestEndDate ?? planting.updatedAt ?? null,
          yieldKg: planting.yieldKg ?? null,
          qualityRating: planting.yieldQualityRating ?? null,
          notes: planting.yieldNotes ?? null,
        },
      ];
    }

    return [];
  }, [planting]);

  const yieldSummary = useMemo(() => {
    const totalYield = harvestRecords.reduce(
      (acc, item) => acc + (item.yieldKg ?? 0),
      0,
    );
    const ratings = harvestRecords
      .map((item) => item.qualityRating)
      .filter((value): value is number => typeof value === "number");
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((acc, item) => acc + item, 0) / ratings.length
        : null;

    return {
      totalYield,
      avgRating,
      recordsCount: harvestRecords.length,
    };
  }, [harvestRecords]);

  const warnings = planting?.warnings ?? [];

  useEffect(() => {
    if (!__DEV__) return;
    if (!planting?.id) return;

    console.log("[PlantingDetails] transplantedAt", {
      plantingId: planting.id,
      transplantedAt: planting.transplantedAt ?? null,
    });
  }, [planting?.id, planting?.transplantedAt]);

  useEffect(() => {
    if (!__DEV__) return;
    if (!resolvedPlantingId) return;

    console.log("[PlantingDetails] plantingTasks", {
      plantingId: resolvedPlantingId,
      hasTasks: plantingTasks.length > 0,
      count: plantingTasks.length,
      taskIds: plantingTasks.map((task) => task.id),
      visibleTasks: visiblePlantingTasks.length,
      hiddenOverdueTasksCount,
    });
  }, [
    resolvedPlantingId,
    plantingTasks,
    visiblePlantingTasks.length,
    hiddenOverdueTasksCount,
  ]);

  const growthTimelineSteps = useMemo<GrowthTimelineStep[]>(() => {
    if (!planting) return [];

    const baseSteps =
      planting.startMethod === "TRANSPLANT"
        ? TRANSPLANT_GROWTH_STEPS
        : DIRECT_SOW_GROWTH_STEPS;

    const currentStatus = planting.status;
    const currentIndex = baseSteps.findIndex(
      (step) => step.key === currentStatus,
    );

    if (currentIndex >= 0) {
      const allSteps = baseSteps.map((step, index) => {
        let state: GrowthStepState = "pending";
        if (index < currentIndex) state = "done";
        if (index === currentIndex) state = "current";

        return {
          ...step,
          state,
        };
      });

      const doneSteps = allSteps.filter((step) => step.state === "done");
      const currentStep = allSteps.find((step) => step.state === "current");
      const nextStep = allSteps.find((step) => step.state === "pending");

      return [
        ...doneSteps,
        ...(currentStep ? [currentStep] : []),
        ...(nextStep ? [nextStep] : []),
      ];
    }

    return [
      ...baseSteps.map((step) => ({
        ...step,
        state: "done" as const,
      })),
      {
        key: currentStatus,
        label: getPlantingStatusLabel(currentStatus) || currentStatus,
        state: "current" as const,
      },
    ];
  }, [planting]);

  const warningSeverityTone = (severity: Warning["severity"]) => {
    if (severity === "CRITICAL") {
      return {
        bg: palette.warningCriticalBg,
        border: palette.warningCriticalBorder,
        text: palette.warningCriticalText,
        label: "Krytyczne",
      };
    }
    if (severity === "WARNING") {
      return {
        bg: palette.warningWarningBg,
        border: palette.warningWarningBorder,
        text: palette.warningWarningText,
        label: "Uwaga",
      };
    }
    return {
      bg: palette.warningInfoBg,
      border: palette.warningInfoBorder,
      text: palette.warningInfoText,
      label: "Informacja",
    };
  };

  const handleDelete = () => {
    if (isOffline) {
      setSnackbarMessage(OFFLINE_MUTATION_MESSAGE);
      return;
    }
    setConfirmDeletePlantingModalVisible(true);
  };

  const executeDeletePlanting = async () => {
    setConfirmDeletePlantingModalVisible(false);
    try {
      if (!resolvedPlantingId) return;
      await deletePlanting.mutateAsync(resolvedPlantingId);
      if (resolvedBedId) {
        router.replace(`/(tabs)/beds/${resolvedBedId}`);
      } else {
        router.back();
      }
    } catch (err) {
      setSnackbarMessage(String(getResponseError(err)));
    }
  };

  const openStatusModal = () => {
    setStatusErrorMessage(null);
    setSelectedStatus(null);
    setStatusModalVisible(true);
  };

  const handleStartPlantingDirect = async () => {
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }
    try {
      await updatePlanting.mutateAsync({ status: "IN_GROUND" });
      await Promise.allSettled([refetch(), refetchPlantingTasks()]);
      setStartPlantingConfirmModalVisible(false);
      setSnackbarMessage("Uprawa została rozpoczęta.");
    } catch (err) {
      setSnackbarMessage(String(getResponseError(err)));
    }
  };

  const openQuickActionModal = () => {
    setQuickActionStep("menu");
    setQuickActionNote("");
    setQuickActionModalVisible(true);
  };

  const closeQuickActionModal = () => {
    if (postPlantingQuickAction.isPending) return;
    setQuickActionModalVisible(false);
    setQuickActionStep("menu");
  };

  const handleSavePlantingNoteQuickAction = async () => {
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }

    const note = quickActionNote.trim();
    if (!note) {
      setSnackbarMessage("Wpisz notatkę.");
      return;
    }

    try {
      await postPlantingQuickAction.mutateAsync({
        actionKind: "NOTE",
        note,
      });
      await Promise.allSettled([refetch(), refetchPlantingTasks()]);
      closeQuickActionModal();
      setSnackbarMessage("Akcja zarejestrowana: notatka");
    } catch (err) {
      setSnackbarMessage(String(getResponseError(err)));
    }
  };

  const executeSavePlantingStatus = async () => {
    if (!planting) return;
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }
    if (!selectedStatus) {
      setStatusErrorMessage("Wybierz status.");
      return;
    }
    if (selectedStatus === planting.status) {
      setStatusErrorMessage("To już jest aktualny status.");
      return;
    }
    try {
      await updatePlanting.mutateAsync({ status: selectedStatus });
      await Promise.allSettled([refetch(), refetchPlantingTasks()]);
      setStatusModalVisible(false);
      setSelectedStatus(null);
      setStatusErrorMessage(null);
      setSnackbarMessage("Status uprawy został zmieniony.");
    } catch (err) {
      setStatusErrorMessage(String(getResponseError(err)));
    }
  };

  const handleSavePlantingStatus = async () => {
    if (!planting || !selectedStatus) {
      await executeSavePlantingStatus();
      return;
    }

    const shouldConfirmPlanArchive =
      planting.status === "NEW" && selectedStatus !== "NEW";

    if (shouldConfirmPlanArchive) {
      setConfirmStartPlantingModalVisible(true);
      return;
    }

    // Warn (but don't block) if the user wants to mark READY_FOR_FINAL_HARVEST
    // before the planned harvest window has started.
    if (selectedStatus === "READY_FOR_FINAL_HARVEST") {
      const windowStart =
        planting.harvestWindowStart ?? planting.harvestStartDate ?? null;
      const windowStartKey = isoToDateOnly(windowStart);
      const todayKeyValue = getTodayKey();

      if (windowStartKey && windowStartKey > todayKeyValue) {
        const formattedStart = windowStart
          ? formatDate(windowStart)
          : windowStartKey;
        setConfirmHarvestWindowDateLabel(formattedStart);
        setConfirmHarvestWindowModalVisible(true);
        return;
      }
    }

    await executeSavePlantingStatus();
  };

  const handleMarkTaskDone = async (taskId: string) => {
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }
    if (taskIdsCompleting.includes(taskId)) {
      return;
    }

    // If this is a harvest task, open the harvest form instead of
    // marking it done – keeps harvest result recording in one place.
    const task = visiblePlantingTasks.find((t) => t.id === taskId);
    if (task && isHarvestActionTask(task)) {
      setEditingHarvestRecord(null);
      setHarvestFormVisible(true);
      return;
    }

    setTaskIdsCompleting((prev) =>
      prev.includes(taskId) ? prev : [...prev, taskId],
    );

    try {
      await updateActionTask.mutateAsync({
        id: taskId,
        payload: { status: "done" },
      });
      setSnackbarMessage("Zadanie wykonane");
      await Promise.allSettled([refetchPlantingTasks(), refetch()]);
    } catch (err) {
      setTaskIdsCompleting((prev) => prev.filter((id) => id !== taskId));
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
      setSnackbarMessage("Zadanie anulowane.");
      await Promise.allSettled([refetchPlantingTasks(), refetch()]);
    } catch (err) {
      Alert.alert("Błąd", String(getResponseError(err)));
    }
  };

  const resetDiseaseModal = () => {
    setSelectedDiseaseId(null);
    setSelectedDiseaseName(null);
    setDiseaseStatus("suspected");
    setSeverity(undefined);
    setDiseaseNote("");
    setObservedAt(null);
    setDiseaseSearch("");
  };

  const resetPestModal = () => {
    setSelectedPestId(null);
    setSelectedPestName(null);
    setPestStatus("suspected");
    setPestNote("");
    setPestSearch("");
  };

  const handleCreateDisease = async () => {
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }
    if (!selectedDiseaseId) {
      setSnackbarMessage("Wybierz chorobę.");
      return;
    }
    try {
      await createDiseaseOccurrence.mutateAsync({
        diseaseId: selectedDiseaseId,
        status: diseaseStatus,
        severity,
        observedAt: observedAt ?? undefined,
        notes: diseaseNote.trim() ? diseaseNote.trim() : null,
      });
      setDiseaseModalVisible(false);
      resetDiseaseModal();
      setSnackbarMessage("Dodano chorobę.");
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setSnackbarMessage("To wystąpienie już jest aktywne dla tej uprawy");
        return;
      }
      Alert.alert("Błąd", String(getResponseError(err)));
    }
  };

  const handleCreatePest = async () => {
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }
    if (!selectedPestId) {
      setSnackbarMessage("Wybierz szkodnika.");
      return;
    }
    try {
      await createPestOccurrence.mutateAsync({
        pestId: selectedPestId,
        status: pestStatus,
        notes: pestNote.trim() ? pestNote.trim() : null,
      });
      setPestModalVisible(false);
      resetPestModal();
      setSnackbarMessage("Dodano szkodnika.");
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setSnackbarMessage("To wystąpienie już jest aktywne dla tej uprawy");
        return;
      }
      Alert.alert("Błąd", String(getResponseError(err)));
    }
  };

  const openEditDisease = (occurrence: DiseaseOccurrence) => {
    setEditType("disease");
    setEditOccurrenceId(occurrence.id);
    setEditStatus(occurrence.status);
    setEditNote(occurrence.notes ?? "");
    setEditVisible(true);
  };

  const openEditPest = (occurrence: PestOccurrence) => {
    setEditType("pest");
    setEditOccurrenceId(occurrence.id);
    setEditStatus(occurrence.status);
    setEditNote(occurrence.notes ?? "");
    setEditVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editType || !editOccurrenceId) return;
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }
    try {
      const payload = {
        status: editStatus,
        notes: editNote.trim() ? editNote.trim() : null,
      };
      if (editType === "disease") {
        await updateDiseaseOccurrence.mutateAsync({
          id: editOccurrenceId,
          payload,
        });
      } else {
        await updatePestOccurrence.mutateAsync({
          id: editOccurrenceId,
          payload,
        });
      }
      setEditVisible(false);
      setSnackbarMessage("Zapisano zmiany.");
    } catch (err) {
      Alert.alert("Błąd", String(getResponseError(err)));
    }
  };

  const handleDeleteOccurrence = () => {
    if (!editType || !editOccurrenceId) return;
    if (isOffline) {
      setSnackbarMessage(OFFLINE_MUTATION_MESSAGE);
      return;
    }
    setConfirmDeleteOccurrenceModalVisible(true);
  };

  const executeDeleteOccurrence = async () => {
    if (!editType || !editOccurrenceId) return;
    setConfirmDeleteOccurrenceModalVisible(false);
    try {
      if (editType === "disease") {
        await deleteDiseaseOccurrence.mutateAsync(editOccurrenceId);
      } else {
        await deletePestOccurrence.mutateAsync(editOccurrenceId);
      }
      setEditVisible(false);
      setSnackbarMessage("Usunięto wystąpienie.");
    } catch (err) {
      setSnackbarMessage(String(getResponseError(err)));
    }
  };

  const severityLabels: Record<DiseaseSeverity, string> = {
    low: "Niskie",
    medium: "Umiarkowane",
    high: "Silne",
  };

  const getSeverityColor = (value: DiseaseSeverity) => {
    if (value === "high") return theme.colors.error;
    if (value === "medium") return theme.colors.secondary;
    return theme.colors.primary;
  };

  const renderStatusOption = (status: PlantingStatus) => (
    <Pressable
      key={status}
      style={[
        styles.statusOptionRow,
        selectedStatus === status ? styles.statusOptionRowActive : null,
      ]}
      onPress={() => {
        setSelectedStatus(status);
        setStatusErrorMessage(null);
      }}
    >
      <View style={styles.statusOptionMain}>
        <Text
          style={[
            styles.statusOptionText,
            selectedStatus === status ? styles.statusOptionTextActive : null,
          ]}
        >
          {getPlantingStatusLabel(status) || status}
        </Text>

        <View style={styles.statusOptionInfoRow}>
          <Icon
            source="information-outline"
            size={14}
            color={buildPalette(theme.dark).secondary}
          />
          <Text style={styles.statusOptionInfoText}>
            {PLANTING_STATUS_DESCRIPTIONS[status]}
          </Text>
        </View>
      </View>

      <View style={styles.statusOptionRadioWrap}>
        <Icon
          source={
            selectedStatus === status ? "radiobox-marked" : "radiobox-blank"
          }
          size={20}
          color={
            selectedStatus === status
              ? buildPalette(theme.dark).accent
              : buildPalette(theme.dark).secondary
          }
        />
      </View>
    </Pressable>
  );

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        refetch(),
        refetchPlantingTasks(),
        diseaseActiveQuery.refetch(),
        diseaseResolvedQuery.refetch(),
        pestActiveQuery.refetch(),
        pestResolvedQuery.refetch(),
        refetchVegetable(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Screen
        style={{ backgroundColor: palette.background }}
        safeAreaEdges={["left", "right"]}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Surface style={styles.heroCard} elevation={0}>
            <View style={styles.loadingBarShort} />
            <View style={styles.loadingBarTitle} />
            <View style={styles.loadingChipRow}>
              <View style={styles.loadingChip} />
              <View style={styles.loadingChip} />
              <View style={styles.loadingChip} />
            </View>
          </Surface>

          {[0, 1, 2].map((item) => (
            <Surface key={item} style={styles.section} elevation={0}>
              <View style={styles.loadingBarMedium} />
              <View style={styles.loadingBarLong} />
              <View style={styles.loadingBarLong} />
            </Surface>
          ))}
        </ScrollView>
      </Screen>
    );
  }

  if (error || !planting) {
    const rawErrorMessage = String(getResponseError(error));
    const isNotFound = /not found|404|nie znaleziono/i.test(rawErrorMessage);
    return (
      <Screen
        style={{ backgroundColor: palette.background }}
        safeAreaEdges={["left", "right"]}
      >
        <View style={styles.center}>
          <Text style={styles.errorTitle}>
            {isNotFound ? "Nie znaleziono uprawy" : "Coś poszło nie tak"}
          </Text>
          <Text style={styles.errorText}>{rawErrorMessage}</Text>
          <Button mode="outlined" onPress={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      style={{ backgroundColor: palette.background }}
      safeAreaEdges={["left", "right"]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.heroStack}>
          <View style={styles.heroMediaCard}>
            {vegetable?.imageUrl ? (
              <Image
                source={{ uri: vegetable.imageUrl }}
                style={styles.heroMediaImage}
              />
            ) : (
              <View style={styles.heroMediaFallback}>
                <Icon
                  source="sprout-outline"
                  size={34}
                  color={palette.secondary}
                />
              </View>
            )}

            <CustomHeader
              overlay
              showBack
              actions={[
                {
                  icon: "pencil",
                  accessibilityLabel: "Edytuj uprawę",
                  disabled: isOffline,
                  onPress: () => {
                    if (!resolvedBedId || !planting?.id) return;
                    router.push(
                      `/(tabs)/beds/${resolvedBedId}/plantings/${planting.id}/edit`,
                    );
                  },
                },
                {
                  icon: "trash-can-outline",
                  accessibilityLabel: "Usuń uprawę",
                  disabled: deletePlanting.isPending || isOffline,
                  onPress: handleDelete,
                },
              ]}
            />
          </View>

          <Surface style={styles.heroCard} elevation={0}>
            <View style={styles.heroHeadingBlock}>
              <Text
                style={styles.heroEyebrow}
              >{`UPRAWA • ${startMethodLabel.toUpperCase()}`}</Text>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {vegetableName || "Szczegóły uprawy"}
              </Text>
              <View style={styles.heroStatusRow}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        statusTone?.backgroundColor ?? palette.accentBg,
                      borderColor:
                        statusTone?.borderColor ?? palette.accentBorder,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusBadgeDot,
                      {
                        backgroundColor:
                          statusTone?.textColor ?? palette.accent,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: statusTone?.textColor ?? palette.accent },
                    ]}
                  >
                    {statusLabel}
                  </Text>
                </View>
              </View>
              <Button
                compact
                mode="text"
                icon="book-open-variant"
                onPress={openVegetableLibrary}
                textColor={palette.secondaryCta}
                contentStyle={styles.heroLibraryInlineContent}
                labelStyle={styles.heroLibraryInlineLabel}
              >
                Porady i artykuły o tym warzywie
              </Button>
            </View>

            {isPlannedPlanting ? (
              <Text style={styles.plannedDescription}>
                Ta uprawa jest zaplanowana i jeszcze nie została rozpoczęta.
              </Text>
            ) : null}

            <View style={styles.heroHarvestWindowBlock}>
              <Text style={styles.heroHarvestWindowLabel}>
                Oczekiwane okno zbioru
              </Text>
              <Text style={styles.heroHarvestWindowValue}>
                {expectedHarvestWindowLabel}
              </Text>
            </View>

            <View style={styles.heroBedBlock}>
              <Text style={styles.heroBedLabel}>Dodane do grządki</Text>
              <Text style={styles.heroBedValue}>{plantingBedLabel}</Text>
            </View>
          </Surface>
        </View>

        <View style={styles.actionButtonsGroup}>
          {isPlannedPlanting ? (
            <PrimaryActionButton
              onPress={() => setStartPlantingConfirmModalVisible(true)}
              icon="play-circle-outline"
              label="Rozpocznij uprawę"
              color={palette.accent}
              disabled={isOffline}
            />
          ) : null}

          <PrimaryActionButton
            onPress={openQuickActionModal}
            icon="lightning-bolt-outline"
            label="Wykonaj akcję"
            color={palette.secondaryCta}
            disabled={isOffline || postPlantingQuickAction.isPending}
            loading={postPlantingQuickAction.isPending}
          />

          <PrimaryActionButton
            onPress={openStatusModal}
            icon="swap-horizontal"
            label="Zmień status"
            color={palette.accent}
            disabled={isOffline}
          />
        </View>

        {warnings.length > 0 ? (
          <View style={styles.warningHighlightCard}>
            <View style={styles.warningHighlightIconWrap}>
              <Icon
                source="alert-outline"
                size={22}
                color={palette.warningCriticalText}
              />
            </View>
            <View style={styles.warningHighlightTextWrap}>
              <Text style={styles.warningHighlightTitle}>
                {warnings[0].title}
              </Text>
              <Text style={styles.warningHighlightMessage}>
                {warnings[0].message}
              </Text>
            </View>
          </View>
        ) : null}

        {growthTimelineSteps.length > 0 ? (
          <Surface style={styles.section} elevation={0}>
            <Text style={styles.sectionTitle}>Etapy wzrostu</Text>
            <View style={styles.growthTimelineList}>
              {growthTimelineSteps.map((step, index) => {
                const isLast = index === growthTimelineSteps.length - 1;
                const isDone = step.state === "done";
                const isCurrent = step.state === "current";
                const isNext = step.state === "pending";

                return (
                  <View
                    key={`${step.key}-${index}`}
                    style={styles.growthTimelineRow}
                  >
                    <View
                      style={[
                        styles.growthIconColumn,
                        isNext ? styles.growthIconColumnNext : null,
                      ]}
                    >
                      <View
                        style={[
                          styles.growthIconCircle,
                          isDone
                            ? styles.growthIconCircleDone
                            : isCurrent
                              ? styles.growthIconCircleCurrent
                              : styles.growthIconCirclePending,
                        ]}
                      >
                        {isDone ? (
                          <Icon source="check" size={14} color="#FFFFFF" />
                        ) : isCurrent ? (
                          <View style={styles.growthIconInnerDot} />
                        ) : null}
                      </View>

                      {!isLast ? (
                        <View
                          style={[
                            styles.growthConnector,
                            isDone ? styles.growthConnectorDone : null,
                          ]}
                        />
                      ) : null}
                    </View>

                    <View
                      style={[
                        styles.growthContent,
                        isCurrent ? styles.growthContentCurrent : null,
                        isNext ? styles.growthContentNext : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.growthTitle,
                          isCurrent ? styles.growthTitleCurrent : null,
                          !isDone && !isCurrent
                            ? styles.growthTitlePending
                            : null,
                        ]}
                      >
                        {step.label}
                      </Text>
                      <Text
                        style={[
                          styles.growthSubtitle,
                          isCurrent ? styles.growthSubtitleCurrent : null,
                        ]}
                      >
                        {isDone
                          ? "Zakończono"
                          : isCurrent
                            ? "Obecny etap"
                            : "Oczekujące"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Surface>
        ) : null}

        {planting.notes ? (
          <Surface style={styles.section} elevation={0}>
            <Text style={styles.sectionTitle}>Notatki</Text>
            <Text style={styles.notesText}>{planting.notes}</Text>
          </Surface>
        ) : null}

        {warnings.length > 0 ? (
          <Surface style={styles.section} elevation={0}>
            <Text style={styles.sectionTitle}>Ostrzeżenia</Text>
            <View style={styles.warningList}>
              {warnings.map((warning, idx) => {
                const tone = warningSeverityTone(warning.severity);
                return (
                  <View
                    key={`${warning.code}-${idx}`}
                    style={[
                      styles.warningCard,
                      {
                        backgroundColor: tone.bg,
                        borderColor: tone.border,
                      },
                    ]}
                  >
                    <View style={styles.warningTopRow}>
                      <View
                        style={[
                          styles.warningSeverityBadge,
                          { borderColor: tone.text },
                        ]}
                      >
                        <Text
                          style={[
                            styles.warningSeverityText,
                            { color: tone.text },
                          ]}
                        >
                          {tone.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.warningTitle}>{warning.title}</Text>
                    <Text style={styles.warningMessage}>{warning.message}</Text>
                    {warning.hint ? (
                      <Text style={styles.warningHint}>
                        Wskazówka: {warning.hint}
                      </Text>
                    ) : null}
                    {warning.details ? (
                      <Text style={styles.warningDetails}>
                        {Object.entries(warning.details)
                          .map(([key, value]) => `${key}: ${String(value)}`)
                          .join(" • ")}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </Surface>
        ) : null}

        {isPlannedPlanting ? (
          <Surface style={styles.section} elevation={0}>
            <Text style={styles.sectionTitle}>Zadania</Text>
            <Text style={styles.emptyText}>
              Zadania pojawią się po rozpoczęciu uprawy.
            </Text>
            <Button
              mode="outlined"
              onPress={() => {
                if (!resolvedBedId) return;
                router.push(`/(tabs)/beds/${resolvedBedId}/plan`);
              }}
            >
              Zobacz checklistę przygotowania
            </Button>
          </Surface>
        ) : (
          <Surface style={styles.section} elevation={0}>
            <Text style={styles.sectionTitle}>Zadania</Text>
            {isTasksLoading ? <ActivityIndicator /> : null}

            {tasksError ? (
              <View>
                <Text style={styles.errorText}>
                  {String(getResponseError(tasksError))}
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => {
                    void Promise.allSettled([
                      refetchPlantingTasks(),
                      refetch(),
                    ]);
                  }}
                >
                  Spróbuj ponownie
                </Button>
              </View>
            ) : null}

            {!isTasksLoading && !tasksError && plantingTasks.length === 0 ? (
              <TasksCelebrationCard />
            ) : null}

            {plantingTasks.length > 0 && visiblePlantingTasks.length === 0 ? (
              <Text style={styles.emptyText}>
                Brak aktywnych zadań. Zaległe zadania są ukryte.
              </Text>
            ) : null}

            {visiblePlantingTasks.map((task) => {
              const isHighlighted = highlightedActionTaskId === task.id;
              const isTaskCompleting = taskIdsCompleting.includes(task.id);

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
                    {(() => {
                      const relation = getTaskRelationType(task);
                      if (
                        relation === "related_from_bed" ||
                        relation === "related_from_space"
                      ) {
                        return (
                          <Text style={styles.taskMeta}>
                            {getTaskOwnershipReason(task)}
                          </Text>
                        );
                      }
                      return null;
                    })()}
                    <StatusBadge
                      label={getActionTaskSourceLabel(
                        resolveActionTaskSourceType(task),
                      )}
                      tone="neutral"
                    />
                  </View>

                  <View style={styles.taskActions}>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => handleCancelTask(task.id)}
                      disabled={updateActionTask.isPending || isTaskCompleting}
                      style={styles.equalTaskButton}
                    >
                      Anuluj
                    </Button>
                    <Button
                      mode="contained"
                      compact
                      onPress={() => handleMarkTaskDone(task.id)}
                      disabled={updateActionTask.isPending || isTaskCompleting}
                      style={styles.equalTaskButton}
                    >
                      Wykonane
                    </Button>
                  </View>
                </View>
              );
            })}
          </Surface>
        )}

        <Surface style={styles.section} elevation={0}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Notatki</Text>
            {plantingQuickNotes.length > 0 ? (
              <Pressable
                hitSlop={8}
                onPress={() =>
                  router.push(
                    `/(tabs)/beds/${resolvedBedId}/plantings/${planting.id}/notes`,
                  )
                }
              >
                <Text style={styles.sectionLink}>Zobacz wszystkie</Text>
              </Pressable>
            ) : null}
          </View>

          {plantingQuickNotesQuery.isLoading ? <ActivityIndicator /> : null}

          {plantingQuickNotesQuery.error ? (
            <View>
              <Text style={styles.errorText}>
                {String(getResponseError(plantingQuickNotesQuery.error))}
              </Text>
              <Button
                mode="outlined"
                onPress={() => plantingQuickNotesQuery.refetch()}
              >
                Spróbuj ponownie
              </Button>
            </View>
          ) : null}

          {!plantingQuickNotesQuery.isLoading &&
          !plantingQuickNotesQuery.error &&
          plantingQuickNotesPreview.length === 0 ? (
            <Text style={styles.emptyText}>Brak notatek.</Text>
          ) : null}

          {plantingQuickNotesPreview.map((note) => (
            <View key={note.id} style={styles.timelineRow}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>
                  {formatNoteDateTime(note.occurredAt ?? note.createdAt)}
                </Text>
                <Text style={styles.timelineValue} numberOfLines={2}>
                  {note.note}
                </Text>
              </View>
            </View>
          ))}
        </Surface>

        {resolvedPlantingId ? (
          <PlantingSeasonSection plantingId={resolvedPlantingId} />
        ) : null}

        <Surface style={styles.section} elevation={0}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Problemy</Text>
            <Button
              mode="text"
              onPress={() =>
                problemsTab === "diseases"
                  ? setDiseaseModalVisible(true)
                  : setPestModalVisible(true)
              }
              style={styles.problemHeaderActionButton}
              labelStyle={styles.problemHeaderActionLabel}
            >
              {problemsTab === "diseases" ? "Dodaj chorobę" : "Dodaj szkodnika"}
            </Button>
          </View>

          <SegmentedButtons
            value={problemsTab}
            onValueChange={(value) =>
              setProblemsTab(value as "diseases" | "pests")
            }
            buttons={[
              {
                value: "diseases",
                label: "Choroby",
                style: [
                  styles.segmentedButtonItem,
                  problemsTab === "diseases"
                    ? styles.segmentedButtonItemActive
                    : null,
                ],
                checkedColor: palette.accent,
                uncheckedColor: palette.secondary,
              },
              {
                value: "pests",
                label: "Szkodniki",
                style: [
                  styles.segmentedButtonItem,
                  problemsTab === "pests"
                    ? styles.segmentedButtonItemActive
                    : null,
                ],
                checkedColor: palette.accent,
                uncheckedColor: palette.secondary,
              },
            ]}
            style={styles.segmentedButtons}
          />

          {hasAnyResolvedProblems ? (
            <Button
              mode="outlined"
              onPress={() =>
                setProblemStatus((prev) =>
                  prev === "active" ? "resolved" : "active",
                )
              }
              style={styles.toggleButton}
              labelStyle={styles.toggleButtonLabel}
            >
              {problemStatus === "active" ? "Pokaż opanowane" : "Pokaż aktywne"}
            </Button>
          ) : null}

          {!hasAnyProblems ? (
            <Text style={styles.emptyText}>Brak zgłoszonych problemów.</Text>
          ) : problemsTab === "diseases" ? (
            diseaseOccurrencesQuery.isLoading ? (
              <ActivityIndicator />
            ) : diseaseOccurrencesQuery.error ? (
              <View>
                <Text style={styles.errorText}>
                  {String(getResponseError(diseaseOccurrencesQuery.error))}
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => diseaseOccurrencesQuery.refetch()}
                >
                  Spróbuj ponownie
                </Button>
              </View>
            ) : diseaseOccurrences.length === 0 ? (
              <Text style={styles.emptyText}>
                Brak chorób dla wybranego filtra.
              </Text>
            ) : (
              diseaseOccurrences.map((occurrence) => (
                <Surface
                  key={occurrence.id}
                  style={styles.problemCard}
                  elevation={0}
                >
                  <View style={styles.problemHeader}>
                    <View style={styles.problemTitleRow}>
                      <Text style={styles.problemTitle}>
                        {occurrence.disease?.name ?? "Nieznana choroba"}
                      </Text>
                      <View style={styles.chipsContainer}>
                        <Chip mode="outlined" style={styles.statusChip}>
                          {getStatusLabel(occurrence.status)}
                        </Chip>
                        {occurrence.severity ? (
                          <Chip
                            mode="outlined"
                            style={[
                              styles.severityChip,
                              {
                                borderColor: getSeverityColor(
                                  occurrence.severity,
                                ),
                              },
                            ]}
                            textStyle={{
                              color: getSeverityColor(occurrence.severity),
                            }}
                          >
                            {severityLabels[occurrence.severity]}
                          </Chip>
                        ) : null}
                      </View>
                      <Text style={styles.problemMeta}>
                        Zaobserwowano: {formatDate(occurrence.observedAt)}
                      </Text>
                      {occurrence.nextCheckAt ? (
                        <Text style={styles.problemMeta}>
                          Kontrola: {formatDate(occurrence.nextCheckAt)}
                        </Text>
                      ) : null}
                      {occurrence.notes ? (
                        <Text style={styles.problemNotes}>
                          {occurrence.notes}
                        </Text>
                      ) : null}
                    </View>
                    <IconButton
                      icon="chevron-right"
                      onPress={() => {
                        const targetId =
                          occurrence.disease?.id ?? occurrence.diseaseId;
                        if (!targetId) return;
                        router.push(`/(tabs)/education/diseases/${targetId}`);
                      }}
                      disabled={
                        !(occurrence.disease?.id ?? occurrence.diseaseId)
                      }
                    />
                  </View>
                  <View style={styles.problemActions}>
                    <Button
                      mode="outlined"
                      onPress={() => openEditDisease(occurrence)}
                    >
                      Zmień status / notatkę
                    </Button>
                  </View>
                </Surface>
              ))
            )
          ) : pestOccurrencesQuery.isLoading ? (
            <ActivityIndicator />
          ) : pestOccurrencesQuery.error ? (
            <View>
              <Text style={styles.errorText}>
                {String(getResponseError(pestOccurrencesQuery.error))}
              </Text>
              <Button
                mode="outlined"
                onPress={() => pestOccurrencesQuery.refetch()}
              >
                Spróbuj ponownie
              </Button>
            </View>
          ) : pestOccurrences.length === 0 ? (
            <Text style={styles.emptyText}>
              Brak szkodników dla wybranego filtra.
            </Text>
          ) : (
            pestOccurrences.map((occurrence) => (
              <Surface
                key={occurrence.id}
                style={styles.problemCard}
                elevation={0}
              >
                <View style={styles.problemHeader}>
                  <View style={styles.problemTitleRow}>
                    <Text style={styles.problemTitle}>
                      {occurrence.pest?.name ?? "Nieznany szkodnik"}
                    </Text>
                    <View style={styles.chipsContainer}>
                      <Chip mode="outlined" style={styles.statusChip}>
                        {getStatusLabel(occurrence.status)}
                      </Chip>
                    </View>
                    {occurrence.nextCheckAt ? (
                      <Text style={styles.problemMeta}>
                        Kontrola: {formatDate(occurrence.nextCheckAt)}
                      </Text>
                    ) : null}
                    {occurrence.notes ? (
                      <Text style={styles.problemNotes}>
                        {occurrence.notes}
                      </Text>
                    ) : null}
                  </View>
                  <IconButton
                    icon="chevron-right"
                    onPress={() => {
                      const targetId = occurrence.pest?.id ?? occurrence.pestId;
                      if (!targetId) return;
                      router.push(`/(tabs)/education/pests/${targetId}`);
                    }}
                    disabled={!(occurrence.pest?.id ?? occurrence.pestId)}
                  />
                </View>
                <View style={styles.problemActions}>
                  <Button
                    mode="outlined"
                    onPress={() => openEditPest(occurrence)}
                  >
                    Zmień status / notatkę
                  </Button>
                </View>
              </Surface>
            ))
          )}
        </Surface>

        {resolvedPlantingId ? (
          <PlantingTimelineSection plantingId={resolvedPlantingId} />
        ) : null}

        <Surface style={styles.section} elevation={0}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Wyniki zbiorów</Text>
            <Button
              mode="text"
              onPress={() => {
                setEditingHarvestRecord(null);
                setHarvestFormVisible(true);
              }}
            >
              Dodaj rekord
            </Button>
          </View>

          {yieldSummary.recordsCount > 0 ? (
            <>
              <View style={styles.harvestSummaryGrid}>
                <View style={styles.harvestMetricCard}>
                  <Text style={styles.harvestMetricLabel}>Liczba wpisów</Text>
                  <Text style={styles.harvestMetricValue}>
                    {yieldSummary.recordsCount}
                  </Text>
                </View>
                <View style={styles.harvestMetricCard}>
                  <Text style={styles.harvestMetricLabel}>Łączny plon</Text>
                  <Text style={styles.harvestMetricValue}>
                    {formatYield(yieldSummary.totalYield)}
                  </Text>
                </View>
                <View style={styles.harvestMetricCard}>
                  <Text style={styles.harvestMetricLabel}>Średnia jakość</Text>
                  <Text style={styles.harvestMetricValue}>
                    {yieldSummary.avgRating == null
                      ? "Brak"
                      : formatQualityRating(Math.round(yieldSummary.avgRating))}
                  </Text>
                </View>
              </View>

              <View style={styles.harvestDetailsLinkRow}>
                <Pressable
                  onPress={() =>
                    router.push(
                      `/(tabs)/beds/${resolvedBedId}/plantings/${planting.id}/harvest-results`,
                    )
                  }
                  hitSlop={8}
                >
                  <Text style={styles.harvestDetailsLinkText}>
                    Zobacz szczegóły
                  </Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </Surface>

        <View style={styles.metaBlock}>
          {planting.createdAt ? (
            <Text style={styles.metaText}>
              Utworzono: {formatDate(planting.createdAt)}
            </Text>
          ) : null}
          {planting.updatedAt ? (
            <Text style={styles.metaText}>
              Zaktualizowano: {formatDate(planting.updatedAt)}
            </Text>
          ) : null}
          {planting.appliedRulesVersion ? (
            <Text style={styles.metaText}>
              Wersja reguł: {planting.appliedRulesVersion}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <Portal>
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
      </Portal>

      <Portal>
        <Modal
          visible={startPlantingConfirmModalVisible}
          onDismiss={() => {
            if (updatePlanting.isPending) return;
            setStartPlantingConfirmModalVisible(false);
          }}
          contentContainerStyle={styles.statusModal}
        >
          <Text style={styles.modalTitle}>Rozpocząć uprawę?</Text>
          <Text style={styles.statusModalHint}>
            Status uprawy zmieni się na &bdquo;W gruncie&rdquo;.
          </Text>
          <View style={styles.modalActionsBetween}>
            <Button
              mode="outlined"
              onPress={() => setStartPlantingConfirmModalVisible(false)}
              disabled={updatePlanting.isPending}
              style={{ flex: 1 }}
            >
              Anuluj
            </Button>
            <Button
              mode="contained"
              onPress={() => void handleStartPlantingDirect()}
              loading={updatePlanting.isPending}
              disabled={updatePlanting.isPending}
              style={{ flex: 1 }}
            >
              Rozpocznij
            </Button>
          </View>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={confirmStartPlantingModalVisible}
          onDismiss={() => setConfirmStartPlantingModalVisible(false)}
          contentContainerStyle={styles.statusModal}
        >
          <Text style={styles.modalTitle}>Rozpocząć uprawę?</Text>
          <Text style={styles.statusModalHint}>
            Po rozpoczęciu uprawy checklista planu zostanie zarchiwizowana.
            Bieżące zadania będą generowane dla aktywnej uprawy.
          </Text>
          <View style={styles.modalActionsBetween}>
            <Button
              mode="outlined"
              onPress={() => setConfirmStartPlantingModalVisible(false)}
              style={{ flex: 1 }}
            >
              Anuluj
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                setConfirmStartPlantingModalVisible(false);
                void executeSavePlantingStatus();
              }}
              style={{ flex: 1 }}
            >
              Rozpocznij
            </Button>
          </View>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={confirmDeletePlantingModalVisible}
          onDismiss={() => setConfirmDeletePlantingModalVisible(false)}
          contentContainerStyle={styles.statusModal}
        >
          <Text style={styles.modalTitle}>Usunąć uprawę?</Text>
          <Text style={styles.statusModalHint}>
            Tej operacji nie można cofnąć.
          </Text>
          <View style={styles.modalActionsBetween}>
            <Button
              mode="outlined"
              onPress={() => setConfirmDeletePlantingModalVisible(false)}
              style={{ flex: 1 }}
            >
              Anuluj
            </Button>
            <Button
              mode="contained"
              buttonColor={theme.colors.error}
              textColor={theme.colors.onError}
              onPress={() => void executeDeletePlanting()}
              style={{ flex: 1 }}
            >
              Usuń
            </Button>
          </View>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={confirmHarvestWindowModalVisible}
          onDismiss={() => setConfirmHarvestWindowModalVisible(false)}
          contentContainerStyle={styles.statusModal}
        >
          <Text style={styles.modalTitle}>
            Okno zbioru jeszcze się nie zaczęło
          </Text>
          <Text style={styles.statusModalHint}>
            Według planu okno zbioru zaczyna się dopiero{" "}
            {confirmHarvestWindowDateLabel}. Czy na pewno chcesz oznaczyć tę
            uprawę jako gotową do zbioru?
          </Text>
          <View style={styles.modalActionsBetween}>
            <Button
              mode="outlined"
              onPress={() => setConfirmHarvestWindowModalVisible(false)}
              style={{ flex: 1 }}
            >
              Anuluj
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                setConfirmHarvestWindowModalVisible(false);
                void executeSavePlantingStatus();
              }}
              style={{ flex: 1 }}
            >
              Tak, roślina jest gotowa
            </Button>
          </View>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={confirmDeleteOccurrenceModalVisible}
          onDismiss={() => setConfirmDeleteOccurrenceModalVisible(false)}
          contentContainerStyle={styles.statusModal}
        >
          <Text style={styles.modalTitle}>Usunąć wystąpienie?</Text>
          <Text style={styles.statusModalHint}>
            Tej operacji nie można cofnąć.
          </Text>
          <View style={styles.modalActionsBetween}>
            <Button
              mode="outlined"
              onPress={() => setConfirmDeleteOccurrenceModalVisible(false)}
              style={{ flex: 1 }}
            >
              Anuluj
            </Button>
            <Button
              mode="contained"
              buttonColor={theme.colors.error}
              textColor={theme.colors.onError}
              onPress={() => void executeDeleteOccurrence()}
              style={{ flex: 1 }}
            >
              Usuń
            </Button>
          </View>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={statusModalVisible}
          onDismiss={() => {
            setStatusModalVisible(false);
          }}
          contentContainerStyle={styles.statusModal}
        >
          <Text style={styles.modalTitle}>Zmień status uprawy</Text>
          <Text style={styles.statusModalHint}>
            Aktualny status: {statusLabel}
          </Text>

          {availableStatusesQuery.isLoading ? (
            <View style={styles.statusModalStateWrap}>
              <ActivityIndicator />
              <Text style={styles.statusModalHint}>Pobieranie statusów…</Text>
            </View>
          ) : availableStatusesQuery.error ? (
            <View style={styles.statusModalStateWrap}>
              <Text style={styles.modalErrorText}>
                {String(getResponseError(availableStatusesQuery.error))}
              </Text>
              <Button
                mode="outlined"
                onPress={() => availableStatusesQuery.refetch()}
              >
                Spróbuj ponownie
              </Button>
            </View>
          ) : availableStatuses.length === 0 ? (
            <View style={styles.statusModalStateWrap}>
              <Text style={styles.statusModalHint}>
                Brak dostępnych zmian statusu
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.modalLabel}>Nowy status</Text>
              {statusOptionsByDirection.next.length > 0 ? (
                <View style={styles.statusOptionGroup}>
                  <Text style={styles.statusOptionGroupTitle}>
                    Kolejny etap
                  </Text>
                  <View style={styles.statusOptionsColumn}>
                    {statusOptionsByDirection.next.map(renderStatusOption)}
                  </View>
                </View>
              ) : null}

              {statusOptionsByDirection.rollback.length > 0 ? (
                <View style={styles.statusOptionGroup}>
                  <Text style={styles.statusOptionGroupTitle}>
                    Cofnięcie etapu
                  </Text>
                  <View style={styles.statusOptionsColumn}>
                    {statusOptionsByDirection.rollback.map(renderStatusOption)}
                  </View>
                </View>
              ) : null}

              {statusOptionsByDirection.other.length > 0 ? (
                <View style={styles.statusOptionGroup}>
                  <Text style={styles.statusOptionGroupTitle}>Inne</Text>
                  <View style={styles.statusOptionsColumn}>
                    {statusOptionsByDirection.other.map(renderStatusOption)}
                  </View>
                </View>
              ) : null}
            </>
          )}

          {statusErrorMessage ? (
            <Text style={styles.modalErrorText}>{statusErrorMessage}</Text>
          ) : null}

          <View style={styles.modalActionsBetween}>
            <Button
              mode="outlined"
              onPress={() => {
                setStatusModalVisible(false);
              }}
            >
              Anuluj
            </Button>
            <Button
              mode="contained"
              onPress={handleSavePlantingStatus}
              loading={updatePlanting.isPending}
              disabled={
                updatePlanting.isPending ||
                availableStatuses.length === 0 ||
                !selectedStatus
              }
            >
              Zapisz
            </Button>
          </View>
        </Modal>
      </Portal>

      <BottomSheetModal
        visible={quickActionModalVisible}
        onDismiss={closeQuickActionModal}
        dismissDisabled={postPlantingQuickAction.isPending}
      >
        {postPlantingQuickAction.isPending ? <ActivityIndicator /> : null}

        {quickActionStep === "menu" ? (
          <View style={styles.modalActionsColumn}>
            <Text style={styles.modalTitle}>Wykonaj akcję</Text>
            <Button
              mode="contained"
              onPress={() => {
                closeQuickActionModal();
                setEditingHarvestRecord(null);
                setHarvestFormVisible(true);
              }}
              disabled={postPlantingQuickAction.isPending || isOffline}
              buttonColor="#2F7A4F"
              textColor="#FFFFFF"
            >
              Zebrano plony
            </Button>
            <Button
              mode="contained"
              onPress={() => setQuickActionStep("note")}
              disabled={postPlantingQuickAction.isPending || isOffline}
              buttonColor="#6A4F9B"
              textColor="#FFFFFF"
            >
              Notatka
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                closeQuickActionModal();
                if (!resolvedBedId || !resolvedPlantingId) return;
                router.push(
                  `/(tabs)/planner/create-task?target=planting&bedId=${resolvedBedId}&plantingId=${resolvedPlantingId}`,
                );
              }}
              disabled={postPlantingQuickAction.isPending || isOffline}
              buttonColor="#2F6B4F"
              textColor="#FFFFFF"
            >
              Dodaj zadanie
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                closeQuickActionModal();
                setDiseaseModalVisible(true);
              }}
              disabled={postPlantingQuickAction.isPending || isOffline}
              buttonColor="#9A5A2D"
              textColor="#FFFFFF"
            >
              Dodaj chorobę
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                closeQuickActionModal();
                setPestModalVisible(true);
              }}
              disabled={postPlantingQuickAction.isPending || isOffline}
              buttonColor="#2F6FA6"
              textColor="#FFFFFF"
            >
              Dodaj szkodnika
            </Button>
            <Button
              mode="text"
              onPress={closeQuickActionModal}
              disabled={postPlantingQuickAction.isPending}
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
                disabled={postPlantingQuickAction.isPending}
              />

              <View style={styles.modalActionsBetween}>
                <Button
                  mode="outlined"
                  onPress={() => setQuickActionStep("menu")}
                  disabled={postPlantingQuickAction.isPending}
                >
                  Wstecz
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSavePlantingNoteQuickAction}
                  loading={postPlantingQuickAction.isPending}
                  disabled={
                    postPlantingQuickAction.isPending ||
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
          visible={actionsVisible}
          onDismiss={() => setActionsVisible(false)}
          contentContainerStyle={styles.actionSheetModal}
        >
          <View style={styles.actionSheetHandle} />
          <View style={styles.modalActionsColumn}>
            <Button
              mode="contained"
              onPress={() => {
                setActionsVisible(false);
                router.push(
                  `/(tabs)/beds/${resolvedBedId}/plantings/${planting.id}/edit`,
                );
              }}
              disabled={isOffline}
            >
              Edytuj
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                setActionsVisible(false);
                handleDelete();
              }}
              disabled={deletePlanting.isPending || isOffline}
              textColor={theme.colors.error}
              style={styles.deleteButton}
            >
              Usuń
            </Button>
          </View>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={diseaseModalVisible}
          onDismiss={() => {
            setDiseaseModalVisible(false);
            resetDiseaseModal();
          }}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Dodaj chorobę</Text>

          {selectedDiseaseId && selectedDiseaseName ? (
            <View style={styles.selectedRow}>
              <Chip mode="flat" style={styles.selectedChip}>
                {selectedDiseaseName}
              </Chip>
              <Button
                mode="text"
                onPress={() => {
                  setSelectedDiseaseId(null);
                  setSelectedDiseaseName(null);
                }}
              >
                Usuń
              </Button>
            </View>
          ) : null}

          {!selectedDiseaseId && commonDiseases.length > 0 ? (
            <View style={styles.commonList}>
              <Text style={styles.modalLabel}>Typowe choroby</Text>
              <View style={styles.commonChips}>
                {commonDiseases.map((disease) => (
                  <Chip
                    key={disease.id}
                    mode={
                      selectedDiseaseId === disease.id ? "flat" : "outlined"
                    }
                    onPress={() => {
                      setSelectedDiseaseId(disease.id);
                      setSelectedDiseaseName(disease.name);
                      setDiseaseSearch("");
                    }}
                  >
                    {disease.name}
                  </Chip>
                ))}
              </View>
            </View>
          ) : null}

          {!selectedDiseaseId ? (
            <TextInput
              mode="outlined"
              label="Szukaj choroby"
              value={diseaseSearch}
              onChangeText={setDiseaseSearch}
              style={styles.modalInput}
            />
          ) : null}

          {!selectedDiseaseId && diseaseSearch.trim().length >= 2 ? (
            <View style={styles.searchResults}>
              {searchDiseasesQuery.isLoading ? (
                <ActivityIndicator />
              ) : diseaseSearchItems.length === 0 ? (
                <Text style={styles.emptyText}>Brak wyników.</Text>
              ) : (
                diseaseSearchItems.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setSelectedDiseaseId(item.id);
                      setSelectedDiseaseName(item.name);
                      setDiseaseSearch("");
                    }}
                    style={styles.searchRow}
                  >
                    <Text style={styles.searchTitle}>{item.name}</Text>
                  </Pressable>
                ))
              )}
            </View>
          ) : null}

          <Text style={styles.modalLabel}>Status</Text>
          <SegmentedButtons
            value={diseaseStatus}
            onValueChange={(value) =>
              setDiseaseStatus(value as DiseaseOccurrenceStatus)
            }
            buttons={[
              { value: "suspected", label: "Podejrzenie" },
              { value: "confirmed", label: "Potwierdzony" },
            ]}
            style={styles.segmentedButtons}
          />

          <Text style={styles.modalLabel}>Nasilenie (opcjonalnie)</Text>
          <SegmentedButtons
            value={severity ?? ""}
            onValueChange={(value) =>
              setSeverity(value ? (value as DiseaseSeverity) : undefined)
            }
            buttons={[
              { value: "low", label: "Niskie" },
              { value: "medium", label: "Umiarkowane" },
              { value: "high", label: "Silne" },
            ]}
            style={styles.segmentedButtons}
          />

          <Text style={styles.modalLabel}>Zaobserwowano</Text>
          <TextInput
            mode="outlined"
            value={isoToDateOnly(observedAt)}
            placeholder="YYYY-MM-DD"
            editable={false}
            onPressIn={() => setObservedOpen(true)}
            right={
              <TextInput.Icon
                icon="calendar"
                onPress={() => setObservedOpen(true)}
              />
            }
            style={styles.modalInput}
          />

          <TextInput
            mode="outlined"
            label="Notatka"
            value={diseaseNote}
            onChangeText={setDiseaseNote}
            multiline
            numberOfLines={3}
            style={styles.modalInput}
          />

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => {
                setDiseaseModalVisible(false);
                resetDiseaseModal();
              }}
            >
              Anuluj
            </Button>
            <Button
              mode="contained"
              onPress={handleCreateDisease}
              loading={createDiseaseOccurrence.isPending}
              disabled={createDiseaseOccurrence.isPending || isOffline}
            >
              Dodaj
            </Button>
          </View>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={pestModalVisible}
          onDismiss={() => {
            setPestModalVisible(false);
            resetPestModal();
          }}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Dodaj szkodnika</Text>

          {selectedPestId && selectedPestName ? (
            <View style={styles.selectedRow}>
              <Chip mode="flat" style={styles.selectedChip}>
                {selectedPestName}
              </Chip>
              <Button
                mode="text"
                onPress={() => {
                  setSelectedPestId(null);
                  setSelectedPestName(null);
                }}
              >
                Usuń
              </Button>
            </View>
          ) : null}

          {!selectedPestId && commonPests.length > 0 ? (
            <View style={styles.commonList}>
              <Text style={styles.modalLabel}>Typowe szkodniki</Text>
              <View style={styles.commonChips}>
                {commonPests.map((pest) => (
                  <Chip
                    key={pest.id}
                    mode={selectedPestId === pest.id ? "flat" : "outlined"}
                    onPress={() => {
                      setSelectedPestId(pest.id);
                      setSelectedPestName(pest.name);
                      setPestSearch("");
                    }}
                  >
                    {pest.name}
                  </Chip>
                ))}
              </View>
            </View>
          ) : null}

          {!selectedPestId ? (
            <TextInput
              mode="outlined"
              label="Szukaj szkodnika"
              value={pestSearch}
              onChangeText={setPestSearch}
              style={styles.modalInput}
            />
          ) : null}

          {!selectedPestId && pestSearch.trim().length >= 2 ? (
            <View style={styles.searchResults}>
              {pestDictionaryQuery.isLoading ? (
                <ActivityIndicator />
              ) : pestSearchItems.length === 0 ? (
                <Text style={styles.emptyText}>Brak wyników.</Text>
              ) : (
                pestSearchItems.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setSelectedPestId(item.id);
                      setSelectedPestName(item.name);
                      setPestSearch("");
                    }}
                    style={styles.searchRow}
                  >
                    <Text style={styles.searchTitle}>{item.name}</Text>
                  </Pressable>
                ))
              )}
            </View>
          ) : null}

          <Text style={styles.modalLabel}>Status</Text>
          <SegmentedButtons
            value={pestStatus}
            onValueChange={(value) =>
              setPestStatus(value as PestOccurrenceStatus)
            }
            buttons={[
              { value: "suspected", label: "Podejrzenie" },
              { value: "confirmed", label: "Potwierdzony" },
            ]}
            style={styles.segmentedButtons}
          />

          <TextInput
            mode="outlined"
            label="Notatka"
            value={pestNote}
            onChangeText={setPestNote}
            multiline
            numberOfLines={3}
            style={styles.modalInput}
          />

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => {
                setPestModalVisible(false);
                resetPestModal();
              }}
            >
              Anuluj
            </Button>
            <Button
              mode="contained"
              onPress={handleCreatePest}
              loading={createPestOccurrence.isPending}
              disabled={createPestOccurrence.isPending || isOffline}
            >
              Dodaj
            </Button>
          </View>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={editVisible}
          onDismiss={() => setEditVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Edytuj wystąpienie</Text>

          <Text style={styles.modalLabel}>Status</Text>
          <SegmentedButtons
            value={editStatus}
            onValueChange={(value) =>
              setEditStatus(
                value as DiseaseOccurrenceStatus | PestOccurrenceStatus,
              )
            }
            buttons={[
              { value: "suspected", label: "Podejrzenie" },
              { value: "confirmed", label: "Potwierdzony" },
              { value: "resolved", label: "Opanowany" },
            ]}
            style={styles.segmentedButtons}
          />

          <TextInput
            mode="outlined"
            label="Notatka"
            value={editNote}
            onChangeText={setEditNote}
            multiline
            numberOfLines={3}
            style={styles.modalInput}
          />

          <View style={styles.modalActionsBetween}>
            <Button
              mode="outlined"
              textColor={theme.colors.error}
              style={styles.deleteButton}
              onPress={handleDeleteOccurrence}
              loading={
                deleteDiseaseOccurrence.isPending ||
                deletePestOccurrence.isPending
              }
              disabled={
                isOffline ||
                deleteDiseaseOccurrence.isPending ||
                deletePestOccurrence.isPending
              }
            >
              Usuń
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveEdit}
              loading={
                updateDiseaseOccurrence.isPending ||
                updatePestOccurrence.isPending
              }
              disabled={
                isOffline ||
                updateDiseaseOccurrence.isPending ||
                updatePestOccurrence.isPending
              }
            >
              Zapisz
            </Button>
          </View>
        </Modal>
      </Portal>

      <AppDatePickerModal
        visible={observedOpen}
        date={observedDate}
        onDismiss={() => setObservedOpen(false)}
        onConfirm={(selectedDate) => {
          setObservedOpen(false);
          setObservedAt(selectedDate.toISOString());
        }}
      />

      {resolvedPlantingId ? (
        <PlantingHarvestResultForm
          visible={harvestFormVisible}
          onDismiss={() => {
            setHarvestFormVisible(false);
            setEditingHarvestRecord(null);
          }}
          plantingId={resolvedPlantingId}
          bedId={resolvedBedId}
          mode={editingHarvestRecord ? "edit" : "create"}
          record={editingHarvestRecord}
          onSuccess={() =>
            setSnackbarMessage(
              editingHarvestRecord
                ? "Zapisano rekord zbioru."
                : "Dodano rekord zbioru.",
            )
          }
        />
      ) : null}

      <Portal>
        <Snackbar
          visible={!!snackbarMessage}
          onDismiss={() => setSnackbarMessage(null)}
          duration={3000}
          wrapperStyle={{ marginBottom: 72 }}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 32,
      gap: 20,
      backgroundColor: buildPalette(theme.dark).background,
    },
    actionButtonsGroup: {
      gap: 10,
    },
    heroStack: {
      marginHorizontal: -16,
      marginTop: -14,
      marginBottom: 2,
    },
    changeStatusButton: {
      height: 56,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: buildPalette(theme.dark).accent,
      backgroundColor: buildPalette(theme.dark).accent,
      alignItems: "center",
      justifyContent: "center",
    },
    changeStatusButtonInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    changeStatusButtonText: {
      fontSize: 17,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    currentStatusBlock: {
      gap: 6,
      marginTop: 2,
      marginBottom: 2,
      borderWidth: 1,
      borderColor: buildPalette(theme.dark).cardBorder,
      backgroundColor: buildPalette(theme.dark).cardBg,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      shadowColor: "#000",
      shadowOpacity: theme.dark ? 0.16 : 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    currentStatusLabel: {
      fontSize: 12,
      fontWeight: "500",
      color: buildPalette(theme.dark).secondary,
    },
    heroCard: {
      borderWidth: 1,
      borderColor: buildPalette(theme.dark).cardBorder,
      borderRadius: 22,
      padding: 18,
      backgroundColor: buildPalette(theme.dark).cardBg,
      gap: 12,
      marginHorizontal: 16,
      marginTop: -44,
      shadowColor: "#000",
      shadowOpacity: theme.dark ? 0.3 : 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    heroMediaCard: {
      width: "100%",
      height: 248,
      borderRadius: 0,
      overflow: "hidden",
      borderWidth: 0,
      backgroundColor: buildPalette(theme.dark).chipBg,
    },
    heroMediaOverlayTopRow: {
      position: "absolute",
      top: 56,
      left: 16,
      right: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    heroActionsRightGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    heroCircleAction: {
      width: 44,
      height: 44,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(17, 24, 20, 0.52)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.28)",
    },
    heroMediaImage: {
      width: "100%",
      height: "100%",
    },
    heroMediaFallback: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    heroTag: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: buildPalette(theme.dark).heroTagBg,
      borderWidth: 1,
      borderColor: buildPalette(theme.dark).accentBorder,
      alignSelf: "flex-start",
    },
    heroTagText: {
      fontSize: 12,
      fontWeight: "600",
      color: buildPalette(theme.dark).heroTagText,
    },
    heroSettingsButton: {
      margin: -4,
    },
    heroHeadingBlock: {
      gap: 8,
    },
    heroLibraryInlineContent: {
      justifyContent: "flex-start",
      paddingHorizontal: 0,
      minHeight: 28,
    },
    heroLibraryInlineLabel: {
      marginLeft: 6,
      fontSize: 13,
      fontWeight: "600",
    },
    heroEyebrow: {
      fontSize: 13,
      color: buildPalette(theme.dark).secondary,
      fontWeight: "500",
    },
    heroTitle: {
      fontSize: 28,
      lineHeight: 33,
      fontWeight: "700",
      color: buildPalette(theme.dark).heading,
    },
    heroStatusRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
    },
    heroHarvestWindowBlock: {
      gap: 4,
      marginTop: 2,
    },
    heroHarvestWindowLabel: {
      fontSize: 12,
      color: buildPalette(theme.dark).secondary,
      fontWeight: "500",
    },
    heroHarvestWindowValue: {
      fontSize: 15,
      color: buildPalette(theme.dark).heading,
      fontWeight: "600",
    },
    heroBedBlock: {
      gap: 4,
    },
    heroBedLabel: {
      fontSize: 12,
      color: buildPalette(theme.dark).secondary,
      fontWeight: "500",
    },
    heroBedValue: {
      fontSize: 15,
      color: buildPalette(theme.dark).heading,
      fontWeight: "600",
    },
    plannedDescription: {
      fontSize: 14,
      lineHeight: 20,
      color: buildPalette(theme.dark).secondary,
      marginTop: 2,
    },
    statusBadge: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: buildPalette(theme.dark).accentBg,
      borderWidth: 1,
      borderColor: buildPalette(theme.dark).accentBorder,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    statusBadgeDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: "500",
    },
    quickChipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      paddingTop: 2,
    },
    heroMethodText: {
      fontSize: 15,
      color: buildPalette(theme.dark).secondary,
      fontWeight: "500",
    },
    section: {
      borderWidth: 1,
      borderColor: buildPalette(theme.dark).cardBorder,
      borderRadius: 22,
      padding: 20,
      backgroundColor: buildPalette(theme.dark).cardBg,
      gap: 12,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 19,
      fontWeight: "700",
      color: buildPalette(theme.dark).heading,
    },
    sectionLink: {
      fontSize: 13,
      fontWeight: "600",
      color: buildPalette(theme.dark).accent,
    },
    infoRowCompact: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
      paddingVertical: 4,
    },
    infoLabel: {
      fontSize: 13,
      color: buildPalette(theme.dark).secondary,
      flex: 1,
      fontWeight: "500",
    },
    infoValue: {
      fontSize: 15,
      color: buildPalette(theme.dark).heading,
      fontWeight: "600",
      flex: 1,
      textAlign: "right",
    },
    notesText: {
      fontSize: 15,
      lineHeight: 24,
      color: buildPalette(theme.dark).heading,
    },
    deleteButton: {
      borderColor: theme.colors.error,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      gap: 10,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: buildPalette(theme.dark).heading,
    },
    errorText: {
      fontSize: 14,
      color: buildPalette(theme.dark).secondary,
      marginBottom: 12,
      textAlign: "center",
    },
    emptyText: {
      fontSize: 14,
      color: buildPalette(theme.dark).secondary,
    },
    segmentedButtons: {
      alignSelf: "flex-start",
      marginBottom: 6,
    },
    segmentedButtonItem: {
      borderColor: buildPalette(theme.dark).cardBorder,
      backgroundColor: buildPalette(theme.dark).cardBg,
    },
    segmentedButtonItemActive: {
      borderColor: buildPalette(theme.dark).accentBorder,
      backgroundColor: buildPalette(theme.dark).accentBg,
    },
    toggleButton: {
      alignSelf: "flex-start",
      marginBottom: 8,
      borderColor: buildPalette(theme.dark).cardBorder,
      backgroundColor: buildPalette(theme.dark).cardBg,
    },
    toggleButtonLabel: {
      color: buildPalette(theme.dark).accent,
      fontWeight: "600",
    },
    problemHeaderActionButton: {
      borderColor: buildPalette(theme.dark).cardBorder,
      backgroundColor: buildPalette(theme.dark).cardBg,
    },
    problemHeaderActionLabel: {
      color: buildPalette(theme.dark).accent,
      fontWeight: "600",
    },
    problemCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: buildPalette(theme.dark).cardBorder,
      backgroundColor: buildPalette(theme.dark).cardBg,
      padding: 14,
      marginBottom: 10,
    },
    problemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    problemTitleRow: {
      flex: 1,
      flexDirection: "column",
      gap: 6,
    },
    problemTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: buildPalette(theme.dark).heading,
      marginRight: 6,
    },
    chipsContainer: {
      flexDirection: "row",
      gap: 6,
      flexWrap: "wrap",
    },
    statusChip: {
      height: 36,
    },
    severityChip: {
      height: 36,
    },
    problemMeta: {
      fontSize: 12,
      color: buildPalette(theme.dark).secondary,
    },
    problemNotes: {
      fontSize: 13,
      color: buildPalette(theme.dark).heading,
    },
    problemActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 10,
    },
    modal: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      borderRadius: 16,
      padding: 16,
      gap: 12,
    },
    statusModal: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      borderRadius: 22,
      padding: 20,
      gap: 14,
      borderWidth: 1,
      borderColor: buildPalette(theme.dark).cardBorder,
    },
    statusModalHint: {
      fontSize: 13,
      color: buildPalette(theme.dark).secondary,
      lineHeight: 20,
    },
    statusModalStateWrap: {
      gap: 10,
      alignItems: "flex-start",
    },
    statusSelectInput: {
      backgroundColor: buildPalette(theme.dark).cardBg,
      minHeight: 54,
    },
    statusOptionsColumn: {
      gap: 8,
    },
    statusOptionGroup: {
      gap: 8,
    },
    statusOptionGroupTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: buildPalette(theme.dark).secondary,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    statusOptionRow: {
      minHeight: 0,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: buildPalette(theme.dark).cardBorder,
      backgroundColor: buildPalette(theme.dark).cardBg,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 10,
    },
    statusOptionMain: {
      flex: 1,
      gap: 6,
      paddingRight: 6,
    },
    statusOptionRadioWrap: {
      marginTop: 2,
      marginRight: -2,
      minWidth: 20,
      alignItems: "center",
    },
    statusOptionRowActive: {
      borderColor: buildPalette(theme.dark).accentBorder,
      backgroundColor: buildPalette(theme.dark).accentBg,
    },
    statusOptionText: {
      fontSize: 16,
      lineHeight: 22,
      color: buildPalette(theme.dark).heading,
      fontWeight: "700",
    },
    statusOptionTextActive: {
      color: buildPalette(theme.dark).accent,
      fontWeight: "600",
    },
    statusOptionInfoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
    },
    statusOptionInfoText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 17,
      color: buildPalette(theme.dark).secondary,
      fontWeight: "400",
    },
    modalErrorText: {
      fontSize: 13,
      color: theme.colors.error,
      fontWeight: "500",
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
    modalActionsColumn: {
      gap: 10,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    modalLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    modalInput: {
      backgroundColor: theme.colors.surface,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
    },
    modalActionsBetween: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 10,
    },
    commonList: {
      gap: 8,
    },
    commonChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    selectedRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    selectedChip: {
      flex: 1,
    },
    searchResults: {
      gap: 8,
    },
    searchRow: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    searchTitle: {
      fontSize: 13,
      color: theme.colors.onSurface,
    },
    taskRow: {
      borderTopWidth: 1,
      borderColor: buildPalette(theme.dark).cardBorder,
      paddingVertical: 12,
      gap: 8,
    },
    taskRowHighlighted: {
      backgroundColor: buildPalette(theme.dark).taskHighlight,
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
    taskInfoButton: {
      margin: -8,
    },
    taskTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: buildPalette(theme.dark).heading,
      flex: 1,
    },
    taskMeta: {
      fontSize: 12,
      color: buildPalette(theme.dark).secondary,
    },
    taskActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    equalTaskButton: {
      flex: 1,
    },
    quickActionOutlinedDisease: {
      borderColor: theme.dark ? "#B87845" : "#9A5A2D",
    },
    quickActionOutlinedPest: {
      borderColor: theme.dark ? "#4E8BC4" : "#2F6FA6",
    },
    taskInfoModal: {
      backgroundColor: buildPalette(theme.dark).cardBg,
      marginHorizontal: 16,
      borderRadius: 20,
      padding: 18,
      gap: 12,
      borderWidth: 1,
      borderColor: buildPalette(theme.dark).cardBorder,
    },
    taskInfoModalText: {
      fontSize: 14,
      lineHeight: 20,
      color: buildPalette(theme.dark).secondary,
    },
    growthTimelineList: {
      gap: 0,
    },
    growthTimelineRow: {
      flexDirection: "row",
      gap: 10,
    },
    growthIconColumn: {
      width: 28,
      alignItems: "center",
    },
    growthIconColumnNext: {
      opacity: 0.5,
    },
    growthIconCircle: {
      width: 24,
      height: 24,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    growthIconCircleDone: {
      backgroundColor: buildPalette(theme.dark).accent,
      borderWidth: 1,
      borderColor: buildPalette(theme.dark).accent,
    },
    growthIconCircleCurrent: {
      borderWidth: 2,
      borderColor: buildPalette(theme.dark).accent,
      backgroundColor: buildPalette(theme.dark).cardBg,
    },
    growthIconCirclePending: {
      borderWidth: 1.5,
      borderColor: buildPalette(theme.dark).cardBorder,
      backgroundColor: buildPalette(theme.dark).cardBg,
    },
    growthIconInnerDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: buildPalette(theme.dark).accent,
    },
    growthConnector: {
      flex: 1,
      width: 2,
      minHeight: 20,
      marginTop: 4,
      backgroundColor: buildPalette(theme.dark).cardBorder,
    },
    growthConnectorDone: {
      backgroundColor: buildPalette(theme.dark).accentBorder,
    },
    growthContent: {
      flex: 1,
      paddingBottom: 12,
      gap: 3,
    },
    growthContentCurrent: {
      borderWidth: 1,
      borderColor: buildPalette(theme.dark).accentBorder,
      backgroundColor: buildPalette(theme.dark).accentBg,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 10,
    },
    growthContentNext: {
      opacity: 0.55,
    },
    growthTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: buildPalette(theme.dark).heading,
    },
    growthTitleCurrent: {
      color: buildPalette(theme.dark).accent,
      fontWeight: "700",
    },
    growthTitlePending: {
      color: buildPalette(theme.dark).muted,
    },
    growthSubtitle: {
      fontSize: 12,
      color: buildPalette(theme.dark).secondary,
    },
    growthSubtitleCurrent: {
      color: buildPalette(theme.dark).accent,
      fontWeight: "600",
    },
    timelineList: {
      gap: 12,
    },
    timelineRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    timelineDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: buildPalette(theme.dark).accent,
      marginTop: 6,
    },
    timelineContent: {
      flex: 1,
      gap: 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: buildPalette(theme.dark).cardBorder,
      paddingBottom: 10,
    },
    timelineLabel: {
      fontSize: 13,
      color: buildPalette(theme.dark).secondary,
      fontWeight: "500",
    },
    timelineValue: {
      fontSize: 15,
      color: buildPalette(theme.dark).heading,
      fontWeight: "600",
    },
    harvestSummaryGrid: {
      gap: 10,
    },
    harvestMetricCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: buildPalette(theme.dark).cardBorder,
      backgroundColor: buildPalette(theme.dark).chipBg,
      padding: 12,
      gap: 4,
    },
    harvestMetricLabel: {
      fontSize: 12,
      color: buildPalette(theme.dark).secondary,
      fontWeight: "500",
    },
    harvestMetricValue: {
      fontSize: 17,
      color: buildPalette(theme.dark).heading,
      fontWeight: "700",
    },
    harvestDetailsLinkRow: {
      alignItems: "flex-end",
      paddingTop: 4,
    },
    harvestDetailsLinkText: {
      fontSize: 14,
      color: buildPalette(theme.dark).accent,
      fontWeight: "600",
    },
    warningList: {
      gap: 12,
    },
    warningCard: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 14,
      gap: 8,
    },
    warningTopRow: {
      flexDirection: "row",
      justifyContent: "flex-start",
    },
    warningSeverityBadge: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    warningSeverityText: {
      fontSize: 12,
      fontWeight: "600",
    },
    warningTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: buildPalette(theme.dark).heading,
    },
    warningMessage: {
      fontSize: 14,
      color: buildPalette(theme.dark).heading,
      lineHeight: 21,
    },
    warningHint: {
      fontSize: 13,
      color: buildPalette(theme.dark).secondary,
      lineHeight: 19,
    },
    warningDetails: {
      fontSize: 12,
      color: buildPalette(theme.dark).muted,
      lineHeight: 17,
    },
    warningHighlightCard: {
      borderWidth: 1,
      borderColor: buildPalette(theme.dark).warningCriticalBorder,
      backgroundColor: buildPalette(theme.dark).warningCriticalBg,
      borderRadius: 16,
      padding: 12,
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
    },
    warningHighlightIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 999,
      backgroundColor: buildPalette(theme.dark).background,
      alignItems: "center",
      justifyContent: "center",
    },
    warningHighlightTextWrap: {
      flex: 1,
      gap: 2,
    },
    warningHighlightTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: buildPalette(theme.dark).heading,
    },
    warningHighlightMessage: {
      fontSize: 13,
      color: buildPalette(theme.dark).secondary,
      lineHeight: 19,
    },
    metaBlock: {
      marginTop: 4,
      gap: 4,
      paddingHorizontal: 2,
      paddingBottom: 8,
    },
    metaText: {
      fontSize: 12,
      color: buildPalette(theme.dark).muted,
    },
    loadingBarShort: {
      width: 78,
      height: 24,
      borderRadius: 999,
      backgroundColor: buildPalette(theme.dark).chipBg,
    },
    loadingBarTitle: {
      width: "78%",
      height: 34,
      borderRadius: 10,
      backgroundColor: buildPalette(theme.dark).chipBg,
    },
    loadingChipRow: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
    },
    loadingChip: {
      width: 104,
      height: 30,
      borderRadius: 999,
      backgroundColor: buildPalette(theme.dark).chipBg,
    },
    loadingBarMedium: {
      width: "50%",
      height: 20,
      borderRadius: 10,
      backgroundColor: buildPalette(theme.dark).chipBg,
    },
    loadingBarLong: {
      width: "100%",
      height: 16,
      borderRadius: 10,
      backgroundColor: buildPalette(theme.dark).chipBg,
    },
  });
