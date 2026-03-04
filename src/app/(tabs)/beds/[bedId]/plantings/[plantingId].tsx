import { getResponseError } from "@/src/api/axios";
import { ActionTask } from "@/src/api/queries/actionTasks/types";
import { useGetPlantingActionTasks } from "@/src/api/queries/actionTasks/useGetPlantingActionTasks";
import { useSearchDiseases } from "@/src/api/queries/diseases/useSearchDiseases";
import {
  DiseaseSeverity,
  PlantingDisease,
} from "@/src/api/queries/plantingDiseases/types";
import { useCreatePlantingDisease } from "@/src/api/queries/plantingDiseases/useCreatePlantingDisease";
import { useGetPlantingDiseases } from "@/src/api/queries/plantingDiseases/useGetPlantingDiseases";
import { useUpdatePlantingDisease } from "@/src/api/queries/plantingDiseases/useUpdatePlantingDisease";
import { Planting } from "@/src/api/queries/plantings/types";
import { useDeletePlanting } from "@/src/api/queries/plantings/useDeletePlanting";
import { useGetPlanting } from "@/src/api/queries/plantings/useGetPlanting";
import { useGetVegetable } from "@/src/api/queries/vegetables/useGetVegetable";
import { Screen } from "@/src/components/Screen";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { isAxiosError } from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
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
  Chip,
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
import { DatePickerModal } from "react-native-paper-dates";

const formatDate = (value?: string | null) => {
  if (!value) return "Brak";
  return value.split("T")[0];
};

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

const getTaskRecordDate = (task: ActionTask) =>
  task.doneAt ?? task.dueAt ?? task.createdAt ?? task.updatedAt ?? null;

const sortTaskHistoryDesc = (tasks: ActionTask[]) =>
  [...tasks].sort((a, b) => {
    const aDate = getTaskRecordDate(a) ?? "0000-01-01";
    const bDate = getTaskRecordDate(b) ?? "0000-01-01";
    return bDate.localeCompare(aDate);
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

const getTaskSourceLabel = (source?: ActionTask["source"]) => {
  if (source === "MANUAL") return "Manualne";
  if (source === "VEGETABLE_RULE") return "Automatyczne";
  if (source === "WEATHER_WARNING") return "Pogodowe";
  return "Nieznane";
};

type HistorySegment = "history" | "done" | "canceled" | "pending";

export default function PlantingDetailsScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const { bedId, plantingId } = useLocalSearchParams<{
    bedId?: string | string[];
    plantingId?: string | string[];
  }>();
  const resolvedBedId = Array.isArray(bedId) ? bedId[0] : bedId;
  const resolvedPlantingId = Array.isArray(plantingId)
    ? plantingId[0]
    : plantingId;
  const router = useRouter();
  const { data, isLoading, error, refetch } = useGetPlanting(
    resolvedPlantingId ?? null,
  );
  const plantingTasksQuery = useGetPlantingActionTasks(
    resolvedPlantingId ?? null,
    "all",
  );
  const deletePlanting = useDeletePlanting(resolvedBedId);
  const diseasesQuery = useGetPlantingDiseases(
    resolvedPlantingId
      ? { plantingId: resolvedPlantingId, status: "active" }
      : null,
  );
  const createDisease = useCreatePlantingDisease(resolvedPlantingId ?? null);
  const updateDisease = useUpdatePlantingDisease(resolvedPlantingId ?? null);

  const planting = data as Planting | undefined;
  const {
    data: vegetable,
    isLoading: isVegetableLoading,
    error: vegetableError,
  } = useGetVegetable(planting?.vegetableId ?? null);
  const [reportVisible, setReportVisible] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string | null>(
    null,
  );
  const [selectedDiseaseName, setSelectedDiseaseName] = useState<string | null>(
    null,
  );
  const [reportStatus, setReportStatus] = useState<"suspected" | "confirmed">(
    "suspected",
  );
  const [severity, setSeverity] = useState<DiseaseSeverity | undefined>(
    undefined,
  );
  const [note, setNote] = useState("");
  const [observedAt, setObservedAt] = useState<string | null>(null);
  const [observedOpen, setObservedOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [historySegment, setHistorySegment] =
    useState<HistorySegment>("history");
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const searchQueryResult = useSearchDiseases(searchQuery);

  const observedDate = useMemo(() => parseIsoDate(observedAt), [observedAt]);

  const commonDiseases = vegetable?.commonDiseases ?? [];
  const searchItems = searchQueryResult.data ?? [];
  const activeDiseases = (diseasesQuery.data ?? []) as PlantingDisease[];
  const historyTasks = useMemo(() => {
    const allTasks = (plantingTasksQuery.data?.items ?? []) as ActionTask[];
    const filtered = allTasks.filter((task) => {
      if (historySegment === "history") {
        return task.status === "done" || task.status === "canceled";
      }
      return task.status === historySegment;
    });
    return sortTaskHistoryDesc(filtered);
  }, [historySegment, plantingTasksQuery.data?.items]);

  const handleDelete = () => {
    Alert.alert("Usunąć uprawę?", "Tej operacji nie można cofnąć.", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: async () => {
          try {
            if (!resolvedPlantingId) return;
            await deletePlanting.mutateAsync(resolvedPlantingId);
            if (resolvedBedId) {
              router.replace(`/(tabs)/beds/${resolvedBedId}`);
            } else {
              router.back();
            }
          } catch (err) {
            Alert.alert("Błąd", String(getResponseError(err)));
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (error || !planting) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {String(getResponseError(error))}
          </Text>
          <Button mode="outlined" onPress={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </View>
      </Screen>
    );
  }

  const vegetableName = isVegetableLoading
    ? "Ładowanie..."
    : (vegetable?.name ?? (vegetableError ? "Brak danych" : "Brak danych"));

  const handleMarkResolved = (disease: PlantingDisease) => {
    Alert.alert("Oznaczyć jako wyleczoną?", "Ta akcja zamknie chorobę.", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Wyleczone",
        onPress: async () => {
          try {
            await updateDisease.mutateAsync({
              diseaseId: disease.id,
              payload: { status: "resolved" },
            });
          } catch (err) {
            Alert.alert("Błąd", String(getResponseError(err)));
          }
        },
      },
    ]);
  };

  const handleConfirm = async (disease: PlantingDisease) => {
    try {
      await updateDisease.mutateAsync({
        diseaseId: disease.id,
        payload: { status: "confirmed" },
      });
    } catch (err) {
      const errorMessage = String(getResponseError(err));
      if (
        (isAxiosError(err) && err.response?.status === 409) ||
        errorMessage.includes("Active disease occurrence already exists")
      ) {
        setSnackbarMessage("Ta choroba jest już aktywna dla tej uprawy.");
        return;
      }
      Alert.alert("Błąd", errorMessage);
    }
  };

  const handleCreateDisease = async () => {
    if (!selectedDiseaseId) {
      setSnackbarMessage("Wybierz chorobę.");
      return;
    }
    try {
      await createDisease.mutateAsync({
        diseaseId: selectedDiseaseId,
        status: reportStatus,
        severity,
        observedAt,
        notes: note.trim() ? note.trim() : null,
      });
      setReportVisible(false);
      setSelectedDiseaseId(null);
      setSelectedDiseaseName(null);
      setNote("");
      setSeverity(undefined);
      setObservedAt(null);
      setSearchQuery("");
      setReportStatus("suspected");
      setSnackbarMessage("Dodano chorobę.");
    } catch {
      Alert.alert("Błąd", "Wybrana choroba jest już zgłoszona dla tej uprawy.");
    }
  };

  const getStatusLabel = (status: PlantingDisease["status"]) => {
    if (status === "confirmed") return "Potwierdzona";
    if (status === "suspected") return "Podejrzenie";
    return "Wyleczona";
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

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Szczegóły uprawy</Text>
          <IconButton icon="cog" onPress={() => setActionsVisible(true)} />
        </View>
        <Surface style={styles.section} elevation={0}>
          <Text style={styles.sectionTitle}>Warzywo</Text>
          <Text style={styles.valueText}>{vegetableName}</Text>
        </Surface>

        <Surface style={styles.section} elevation={0}>
          <Text style={styles.sectionTitle}>Status</Text>
          <Text style={styles.valueText}>{planting.status}</Text>
        </Surface>

        <Surface style={styles.section} elevation={0}>
          <Text style={styles.sectionTitle}>Daty</Text>
          <Text style={styles.valueText}>
            Planowana: {formatDate(planting.plannedStartDate)}
          </Text>
          <Text style={styles.valueText}>
            Rzeczywista: {formatDate(planting.actualStartDate)}
          </Text>
        </Surface>

        <Surface style={styles.section} elevation={0}>
          <Text style={styles.sectionTitle}>Notatki</Text>
          <Text style={styles.valueText}>
            {planting.notes ? planting.notes : "Brak"}
          </Text>
        </Surface>

        <Surface style={styles.section} elevation={0}>
          <Text style={styles.sectionTitle}>Historia</Text>
          <SegmentedButtons
            value={historySegment}
            onValueChange={(value) => setHistorySegment(value as HistorySegment)}
            buttons={[
              { value: "history", label: "Wykonane + anulowane" },
              { value: "done", label: "Wykonane" },
              { value: "canceled", label: "Anulowane" },
              { value: "pending", label: "Oczekujące" },
            ]}
            style={styles.segmentedButtons}
          />

          {plantingTasksQuery.isLoading ? <ActivityIndicator /> : null}

          {plantingTasksQuery.error ? (
            <View>
              <Text style={styles.errorText}>
                {String(getResponseError(plantingTasksQuery.error))}
              </Text>
              <Button mode="outlined" onPress={() => plantingTasksQuery.refetch()}>
                Spróbuj ponownie
              </Button>
            </View>
          ) : null}

          {!plantingTasksQuery.isLoading &&
          !plantingTasksQuery.error &&
          historyTasks.length === 0 ? (
            <Text style={styles.emptyText}>Brak historii zabiegów.</Text>
          ) : null}

          {historyTasks.map((task) => (
            <View key={task.id} style={styles.taskHistoryRow}>
              <View style={styles.taskHistoryMain}>
                <Text style={styles.taskHistoryDate}>
                  {formatDate(getTaskRecordDate(task))}
                </Text>
                <Text style={styles.taskHistoryTitle}>{task.title}</Text>
                <Text style={styles.taskHistoryMeta}>
                  Źródło: {getTaskSourceLabel(task.source)}
                </Text>
                {task.description ? (
                  <Text style={styles.taskHistoryDescription}>{task.description}</Text>
                ) : null}
              </View>
              <StatusBadge
                label={getTaskStatusLabel(task.status)}
                tone={getTaskStatusTone(task.status)}
              />
            </View>
          ))}
        </Surface>

        <Surface style={styles.section} elevation={0}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Zdrowie rośliny</Text>
            <IconButton icon="plus" onPress={() => setReportVisible(true)} />
          </View>
          <Text style={styles.sectionSubtitle}>Choroby</Text>

          {diseasesQuery.isLoading ? (
            <ActivityIndicator />
          ) : diseasesQuery.error ? (
            <View>
              <Text style={styles.errorText}>
                {String(getResponseError(diseasesQuery.error))}
              </Text>
              <Button mode="outlined" onPress={() => diseasesQuery.refetch()}>
                Spróbuj ponownie
              </Button>
            </View>
          ) : activeDiseases.length === 0 ? (
            <Text style={styles.emptyText}>Brak aktywnych chorób.</Text>
          ) : (
            activeDiseases.map((disease) => (
              <Surface
                key={disease.id}
                style={styles.diseaseCard}
                elevation={0}
              >
                <View style={styles.diseaseHeader}>
                  <View style={styles.diseaseTitleRow}>
                    <Text style={styles.diseaseTitle}>
                      {disease.disease?.name ?? "Nieznana choroba"}
                    </Text>
                    <View style={styles.chipsContainer}>
                      <Chip mode="outlined" style={styles.statusChip}>
                        {getStatusLabel(disease.status)}
                      </Chip>
                      {disease.severity ? (
                        <Chip
                          mode="outlined"
                          style={[
                            styles.severityChip,
                            { borderColor: getSeverityColor(disease.severity) },
                          ]}
                          textStyle={{
                            color: getSeverityColor(disease.severity),
                          }}
                        >
                          {severityLabels[disease.severity]}
                        </Chip>
                      ) : null}
                    </View>
                    <Text style={styles.diseaseMeta}>
                      Zaobserwowano: {formatDate(disease.observedAt)}
                    </Text>
                    {disease.nextCheckAt ? (
                      <Text style={styles.diseaseMeta}>
                        Kolejna kontrola: {formatDate(disease.nextCheckAt)}
                      </Text>
                    ) : null}
                    {disease.status === "resolved" ? (
                      <Text style={styles.diseaseMeta}>
                        Przypomnienia zostały zatrzymane.
                      </Text>
                    ) : null}
                    {disease.notes ? (
                      <Text style={styles.diseaseNotes}>{disease.notes}</Text>
                    ) : null}
                  </View>
                  <IconButton
                    icon="chevron-right"
                    onPress={() => {
                      const targetId = disease.disease?.id ?? disease.diseaseId;
                      if (!targetId) return;
                      router.push(`/(tabs)/education/diseases/${targetId}`);
                    }}
                    disabled={!(disease.disease?.id ?? disease.diseaseId)}
                  />
                </View>
                <View style={styles.diseaseActions}>
                  {disease.status === "suspected" ? (
                    <Button
                      mode="outlined"
                      onPress={() => handleConfirm(disease)}
                    >
                      Potwierdź
                    </Button>
                  ) : null}
                  <Button
                    mode="contained"
                    onPress={() => handleMarkResolved(disease)}
                  >
                    Wyleczone
                  </Button>
                </View>
              </Surface>
            ))
          )}
        </Surface>
      </ScrollView>

      <Portal>
        <Modal
          visible={actionsVisible}
          onDismiss={() => setActionsVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Akcje</Text>
          <View style={styles.modalActionsColumn}>
            <Button
              mode="contained"
              onPress={() => {
                setActionsVisible(false);
                router.push(
                  `/(tabs)/beds/${resolvedBedId}/plantings/${planting.id}/edit`,
                );
              }}
            >
              Edytuj
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                setActionsVisible(false);
                handleDelete();
              }}
              disabled={deletePlanting.isPending}
              textColor={theme.colors.error}
              style={styles.deleteButton}
            >
              Usuń
            </Button>
            <Button mode="text" onPress={() => setActionsVisible(false)}>
              Zamknij
            </Button>
          </View>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={reportVisible}
          onDismiss={() => setReportVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Zgłoś chorobę</Text>

          {selectedDiseaseId && selectedDiseaseName ? (
            <View style={styles.selectedDiseaseRow}>
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
                      setSearchQuery("");
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
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.modalInput}
            />
          ) : null}

          {!selectedDiseaseId && searchQuery.trim().length >= 2 ? (
            <View style={styles.searchResults}>
              {searchQueryResult.isLoading ? (
                <ActivityIndicator />
              ) : searchItems.length === 0 ? (
                <Text style={styles.emptyText}>Brak wyników.</Text>
              ) : (
                searchItems.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setSelectedDiseaseId(item.id);
                      setSelectedDiseaseName(item.name);
                      setSearchQuery("");
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
            value={reportStatus}
            onValueChange={(value) =>
              setReportStatus(value as "suspected" | "confirmed")
            }
            buttons={[
              { value: "suspected", label: "Podejrzenie" },
              { value: "confirmed", label: "Potwierdzona" },
            ]}
            style={styles.segmentedButtons}
          />

          <Text style={styles.modalLabel}>Nasilenie (opcjonalnie)</Text>
          <SegmentedButtons
            value={severity ?? ""}
            onValueChange={(value) => setSeverity(value as DiseaseSeverity)}
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
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            style={styles.modalInput}
          />

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setReportVisible(false)}>
              Anuluj
            </Button>
            <Button
              mode="contained"
              onPress={handleCreateDisease}
              loading={createDisease.isPending}
            >
              Dodaj
            </Button>
          </View>
        </Modal>
      </Portal>

      <DatePickerModal
        locale="pl"
        mode="single"
        visible={observedOpen}
        date={observedDate ?? new Date()}
        onDismiss={() => setObservedOpen(false)}
        onConfirm={({ date }) => {
          setObservedOpen(false);
          if (!date) return;
          setObservedAt(date.toISOString());
        }}
      />

      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage(null)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: 16,
      paddingBottom: 32,
      backgroundColor: theme.colors.background,
      gap: 12,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.onBackground,
    },
    section: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 12,
      padding: 12,
      backgroundColor: theme.colors.surface,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 10,
    },
    valueText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    deleteButton: {
      borderColor: theme.colors.error,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: "center",
    },
    emptyText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    diseaseCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      padding: 12,
      marginBottom: 10,
    },
    diseaseHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    diseaseTitleRow: {
      flex: 1,
      flexDirection: "column",
      flexWrap: "wrap",
      gap: 6,
    },
    diseaseTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
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
    diseaseMeta: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    diseaseNotes: {
      fontSize: 13,
      color: theme.colors.onSurface,
    },
    diseaseActions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 10,
    },
    modal: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      borderRadius: 16,
      padding: 16,
      gap: 12,
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
    commonList: {
      gap: 8,
    },
    commonChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    selectedDiseaseRow: {
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
    segmentedButtons: {
      alignSelf: "flex-start",
    },
    taskHistoryRow: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
      paddingVertical: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 10,
    },
    taskHistoryMain: {
      flex: 1,
      gap: 4,
    },
    taskHistoryDate: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    taskHistoryTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    taskHistoryMeta: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    taskHistoryDescription: {
      fontSize: 13,
      color: theme.colors.onSurface,
    },
  });
