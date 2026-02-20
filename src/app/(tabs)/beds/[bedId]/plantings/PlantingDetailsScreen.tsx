import { getResponseError } from "@/src/api/axios";
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
import { Planting } from "@/src/api/queries/plantings/types";
import { useDeletePlanting } from "@/src/api/queries/plantings/useDeletePlanting";
import { useGetPlanting } from "@/src/api/queries/plantings/useGetPlanting";
import { useGetVegetable } from "@/src/api/queries/vegetables/useGetVegetable";
import { Screen } from "@/src/components/Screen";
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

const getStatusLabel = (
  status: DiseaseOccurrenceStatus | PestOccurrenceStatus,
) => {
  if (status === "suspected") return "Podejrzenie";
  if (status === "confirmed") return "Potwierdzony";
  return "Opanowany";
};

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
  const deletePlanting = useDeletePlanting(resolvedBedId);

  const [problemsTab, setProblemsTab] = useState<"diseases" | "pests">(
    "diseases",
  );
  const [problemStatus, setProblemStatus] = useState<"active" | "resolved">(
    "active",
  );
  const [actionsVisible, setActionsVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const diseaseOccurrencesQuery = useGetPlantingDiseaseOccurrences(
    resolvedPlantingId ?? null,
    problemStatus,
  );
  const pestOccurrencesQuery = useGetPlantingPestOccurrences(
    resolvedPlantingId ?? null,
    problemStatus,
  );

  const createDiseaseOccurrence = useCreatePlantingDiseaseOccurrence(
    resolvedPlantingId ?? null,
  );
  const updateDiseaseOccurrence = useUpdateDiseaseOccurrence();
  const deleteDiseaseOccurrence = useDeleteDiseaseOccurrence();

  const createPestOccurrence = useCreatePlantingPestOccurrence(
    resolvedPlantingId ?? null,
  );
  const updatePestOccurrence = useUpdatePestOccurrence();
  const deletePestOccurrence = useDeletePestOccurrence();

  const planting = data as Planting | undefined;
  const {
    data: vegetable,
    isLoading: isVegetableLoading,
    error: vegetableError,
  } = useGetVegetable(planting?.vegetableId ?? null);

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
  const pestSearchItems = pestDictionaryQuery.data?.items ?? [];

  const diseaseOccurrences = (diseaseOccurrencesQuery.data ??
    []) as DiseaseOccurrence[];
  const pestOccurrences = (pestOccurrencesQuery.data ?? []) as PestOccurrence[];

  const vegetableName = isVegetableLoading
    ? "Ładowanie..."
    : (vegetable?.name ?? (vegetableError ? "Brak danych" : "Brak danych"));

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
    Alert.alert("Usunąć wystąpienie?", "Tej operacji nie można cofnąć.", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: async () => {
          try {
            if (editType === "disease") {
              await deleteDiseaseOccurrence.mutateAsync(editOccurrenceId);
            } else {
              await deletePestOccurrence.mutateAsync(editOccurrenceId);
            }
            setEditVisible(false);
            setSnackbarMessage("Usunięto wystąpienie.");
          } catch (err) {
            Alert.alert("Błąd", String(getResponseError(err)));
          }
        },
      },
    ]);
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
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Problemy</Text>
            <Button
              mode="text"
              onPress={() =>
                problemsTab === "diseases"
                  ? setDiseaseModalVisible(true)
                  : setPestModalVisible(true)
              }
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
              { value: "diseases", label: "Choroby" },
              { value: "pests", label: "Szkodniki" },
            ]}
            style={styles.segmentedButtons}
          />

          <Button
            mode="text"
            onPress={() =>
              setProblemStatus((prev) =>
                prev === "active" ? "resolved" : "active",
              )
            }
            style={styles.toggleButton}
          >
            {problemStatus === "active" ? "Pokaż opanowane" : "Pokaż aktywne"}
          </Button>

          {problemsTab === "diseases" ? (
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

          {!selectedPestId ? (
            <TextInput
              mode="outlined"
              label="Szukaj szkodnika"
              value={pestSearch}
              onChangeText={setPestSearch}
              style={styles.modalInput}
            />
          ) : null}

          {!selectedPestId ? (
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
            >
              Zapisz
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
      gap: 8,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.colors.onSurface,
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
    segmentedButtons: {
      alignSelf: "flex-start",
      marginBottom: 6,
    },
    toggleButton: {
      alignSelf: "flex-start",
      marginBottom: 8,
    },
    problemCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      padding: 12,
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
    problemMeta: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    problemNotes: {
      fontSize: 13,
      color: theme.colors.onSurface,
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
  });
