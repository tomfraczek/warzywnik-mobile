import { getResponseError } from "@/src/api/axios";
import { Bed } from "@/src/api/queries/beds/types";
import { useDeleteBed } from "@/src/api/queries/beds/useDeleteBed";
import { useGetBed } from "@/src/api/queries/beds/useGetBed";
import { useCreateBedDiseaseOccurrence } from "@/src/api/queries/diseaseOccurrences/useCreateBedDiseaseOccurrence";
import { useGetBedDiseaseOccurrences } from "@/src/api/queries/diseaseOccurrences/useGetBedDiseaseOccurrences";
import { useGetDiseases } from "@/src/api/queries/diseases/useGetDiseases";
import { useCreateBedPestOccurrence } from "@/src/api/queries/pestOccurrences/useCreateBedPestOccurrence";
import { useGetBedPestOccurrences } from "@/src/api/queries/pestOccurrences/useGetBedPestOccurrences";
import { useGetPests } from "@/src/api/queries/pests/useGetPests";
import { Planting } from "@/src/api/queries/plantings/types";
import { useGetPlantings } from "@/src/api/queries/plantings/useGetPlantings";
import { useGetVegetable } from "@/src/api/queries/vegetables/useGetVegetable";
import { isAxiosError } from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useMemo, useState } from "react";
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

const getSoilLabel = (bed: Bed) =>
  bed.soil?.name ?? (bed as any)?.soilName ?? "Brak wybranej gleby";

const formatDate = (value?: string | null) => {
  if (!value) return "Brak";
  return value.split("T")[0];
};

type ProblemSuggestion = {
  id: string;
  name: string;
  type: "disease" | "pest";
};

type PlantingRowProps = {
  planting: Planting;
  onPress: () => void;
};

const PlantingRow = memo(function PlantingRow({
  planting,
  onPress,
}: PlantingRowProps) {
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
  const problemStyles = makeProblemStyles(theme);
  const { bedId } = useLocalSearchParams<{ bedId?: string | string[] }>();
  const resolvedBedId = Array.isArray(bedId) ? bedId[0] : bedId;
  const router = useRouter();
  const { data, isLoading, error, refetch } = useGetBed(resolvedBedId ?? null);
  const deleteBed = useDeleteBed();
  const diseaseOccurrencesQuery = useGetBedDiseaseOccurrences(
    resolvedBedId ?? null,
  );
  const pestOccurrencesQuery = useGetBedPestOccurrences(resolvedBedId ?? null);
  const createDiseaseOccurrence = useCreateBedDiseaseOccurrence(
    resolvedBedId ?? null,
  );
  const createPestOccurrence = useCreateBedPestOccurrence(
    resolvedBedId ?? null,
  );
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

  const bed = data as Bed | undefined;
  const plantings = useMemo(
    () => plantingPages?.pages.flatMap((page) => page.items) ?? [],
    [plantingPages?.pages],
  );
  const [actionsVisible, setActionsVisible] = useState(false);
  const [problemsTab, setProblemsTab] = useState<
    "unknown" | "diseases" | "pests"
  >("diseases");
  const [reportVisible, setReportVisible] = useState(false);
  const [reportStep, setReportStep] = useState<"start" | "select" | "details">(
    "start",
  );
  const [selectedProblem, setSelectedProblem] =
    useState<ProblemSuggestion | null>(null);
  const [reportStatus, setReportStatus] = useState<"suspected" | "confirmed">(
    "suspected",
  );
  const [reportNote, setReportNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const normalizedSearch = searchQuery.trim();
  const diseasesQuery = useGetDiseases({
    limit: 20,
    q: normalizedSearch || undefined,
  });
  const pestsQuery = useGetPests({
    limit: 20,
    q: normalizedSearch || undefined,
  });
  const activePlantings = useMemo(
    () => plantings.filter((planting) => planting.status !== "CANCELLED"),
    [plantings],
  );
  const cancelledPlantings = useMemo(
    () => plantings.filter((planting) => planting.status === "CANCELLED"),
    [plantings],
  );

  const diseaseSuggestions = useMemo<ProblemSuggestion[]>(() => {
    const items = diseasesQuery.data?.pages.flatMap((page) => page.items) ?? [];
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      type: "disease",
    }));
  }, [diseasesQuery.data]);

  const pestSuggestions = useMemo<ProblemSuggestion[]>(() => {
    const items = pestsQuery.data?.pages.flatMap((page) => page.items) ?? [];
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      type: "pest",
    }));
  }, [pestsQuery.data]);

  const problemSuggestions = useMemo(
    () =>
      [...diseaseSuggestions, ...pestSuggestions].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [diseaseSuggestions, pestSuggestions],
  );

  const diseaseOccurrences = useMemo(
    () => diseaseOccurrencesQuery.data ?? [],
    [diseaseOccurrencesQuery.data],
  );
  const pestOccurrences = useMemo(
    () => pestOccurrencesQuery.data ?? [],
    [pestOccurrencesQuery.data],
  );

  const getProblemStatusLabel = (
    status: "suspected" | "confirmed" | "resolved",
  ) => {
    if (status === "suspected") return "Podejrzenie";
    if (status === "confirmed") return "Potwierdzony";
    return "Opanowany";
  };

  const resetReportState = () => {
    setReportStep("start");
    setSelectedProblem(null);
    setReportStatus("suspected");
    setReportNote("");
    setSearchQuery("");
  };

  const handleOpenReport = () => {
    resetReportState();
    setReportVisible(true);
  };

  const handleCreateProblem = async () => {
    if (!resolvedBedId || !selectedProblem) return;
    try {
      if (selectedProblem.type === "pest") {
        await createPestOccurrence.mutateAsync({
          pestId: selectedProblem.id,
          status: reportStatus,
          notes: reportNote.trim() ? reportNote.trim() : null,
        });
        setReportVisible(false);
        resetReportState();
        router.push(`/(tabs)/education/pests/${selectedProblem.id}`);
        return;
      }
      await createDiseaseOccurrence.mutateAsync({
        diseaseId: selectedProblem.id,
        status: reportStatus,
        notes: reportNote.trim() ? reportNote.trim() : null,
      });
      setReportVisible(false);
      resetReportState();
      router.push(`/(tabs)/education/diseases/${selectedProblem.id}`);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setSnackbarMessage("To wystąpienie już jest aktywne na tej grządce");
        return;
      }
      setSnackbarMessage(String(getResponseError(err)));
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

  const handleDelete = () => {
    Alert.alert("Usunąć grządkę?", "Tej operacji nie można cofnąć.", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: async () => {
          try {
            if (!resolvedBedId) return;
            await deleteBed.mutateAsync(resolvedBedId);
            router.replace("/(tabs)/beds");
          } catch (err) {
            Alert.alert("Błąd", String(getResponseError(err)));
          }
        },
      },
    ]);
  };

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
            <Text style={styles.title}>{bed.name}</Text>
            {bed.locationLabel ? (
              <Text style={styles.subtitle}>{bed.locationLabel}</Text>
            ) : null}
          </View>
          <IconButton icon="cog" onPress={() => setActionsVisible(true)} />
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
          <Text style={styles.sectionTitle}>Uprawy</Text>
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

      <View style={problemStyles.section}>
        <View style={problemStyles.sectionHeaderRow}>
          <Text style={problemStyles.sectionTitle}>Problemy</Text>
          <Button mode="contained-tonal" onPress={handleOpenReport}>
            Zgłoś problem
          </Button>
        </View>

        <SegmentedButtons
          value={problemsTab}
          onValueChange={(value) =>
            setProblemsTab(value as "unknown" | "diseases" | "pests")
          }
          buttons={[
            { value: "unknown", label: "Nie rozpoznane" },
            { value: "diseases", label: "Choroby" },
            { value: "pests", label: "Szkodniki" },
          ]}
          style={problemStyles.tabs}
        />

        {problemsTab === "unknown" ? (
          <Text style={problemStyles.emptyText}>Wkrótce.</Text>
        ) : null}

        {problemsTab === "diseases" ? (
          diseaseOccurrencesQuery.isLoading ? (
            <ActivityIndicator style={problemStyles.inlineLoader} />
          ) : diseaseOccurrencesQuery.error ? (
            <Text style={problemStyles.errorText}>
              {String(getResponseError(diseaseOccurrencesQuery.error))}
            </Text>
          ) : diseaseOccurrences.length === 0 ? (
            <Text style={problemStyles.emptyText}>
              Brak zgłoszonych chorób.
            </Text>
          ) : (
            diseaseOccurrences.map((occurrence) => {
              const targetId =
                occurrence.disease?.id ?? occurrence.diseaseId ?? null;
              return (
                <Surface
                  key={occurrence.id}
                  style={problemStyles.problemCard}
                  elevation={0}
                >
                  <View style={problemStyles.problemRow}>
                    <View style={problemStyles.problemMain}>
                      <Text style={problemStyles.problemTitle}>
                        {occurrence.disease?.name ?? "Nieznana choroba"}
                      </Text>
                      <View style={problemStyles.problemMetaRow}>
                        <Chip mode="outlined" style={problemStyles.statusChip}>
                          {getProblemStatusLabel(occurrence.status)}
                        </Chip>
                      </View>
                      {occurrence.nextCheckAt ? (
                        <Text style={problemStyles.problemMeta}>
                          Kontrola: {formatDate(occurrence.nextCheckAt)}
                        </Text>
                      ) : null}
                      {occurrence.status === "resolved" ? (
                        <Text style={problemStyles.problemMeta}>
                          Przypomnienia zostały zatrzymane.
                        </Text>
                      ) : null}
                      {occurrence.notes ? (
                        <Text style={problemStyles.problemNotes}>
                          {occurrence.notes}
                        </Text>
                      ) : null}
                    </View>
                    <IconButton
                      icon="chevron-right"
                      onPress={() => {
                        if (!targetId) return;
                        router.push(`/(tabs)/education/diseases/${targetId}`);
                      }}
                      disabled={!targetId}
                    />
                  </View>
                </Surface>
              );
            })
          )
        ) : null}

        {problemsTab === "pests" ? (
          pestOccurrencesQuery.isLoading ? (
            <ActivityIndicator style={problemStyles.inlineLoader} />
          ) : pestOccurrencesQuery.error ? (
            <Text style={problemStyles.errorText}>
              {String(getResponseError(pestOccurrencesQuery.error))}
            </Text>
          ) : pestOccurrences.length === 0 ? (
            <Text style={problemStyles.emptyText}>
              Brak zgłoszonych szkodników.
            </Text>
          ) : (
            pestOccurrences.map((occurrence) => {
              const targetId = occurrence.pest?.id ?? occurrence.pestId ?? null;
              return (
                <Surface
                  key={occurrence.id}
                  style={problemStyles.problemCard}
                  elevation={0}
                >
                  <View style={problemStyles.problemRow}>
                    <View style={problemStyles.problemMain}>
                      <Text style={problemStyles.problemTitle}>
                        {occurrence.pest?.name ?? "Nieznany szkodnik"}
                      </Text>
                      <View style={problemStyles.problemMetaRow}>
                        <Chip mode="outlined" style={problemStyles.statusChip}>
                          {getProblemStatusLabel(occurrence.status)}
                        </Chip>
                      </View>
                      {occurrence.nextCheckAt ? (
                        <Text style={problemStyles.problemMeta}>
                          Kontrola: {formatDate(occurrence.nextCheckAt)}
                        </Text>
                      ) : null}
                      {occurrence.status === "resolved" ? (
                        <Text style={problemStyles.problemMeta}>
                          Przypomnienia zostały zatrzymane.
                        </Text>
                      ) : null}
                      {occurrence.notes ? (
                        <Text style={problemStyles.problemNotes}>
                          {occurrence.notes}
                        </Text>
                      ) : null}
                    </View>
                    <IconButton
                      icon="chevron-right"
                      onPress={() => {
                        if (!targetId) return;
                        router.push(`/(tabs)/education/pests/${targetId}`);
                      }}
                      disabled={!targetId}
                    />
                  </View>
                </Surface>
              );
            })
          )
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historia</Text>
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
                router.push(`/(tabs)/beds/${bed.id}/edit`);
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
          onDismiss={() => {
            setReportVisible(false);
            resetReportState();
          }}
          contentContainerStyle={problemStyles.modal}
        >
          <Text style={problemStyles.modalTitle}>Zgłoś problem</Text>

          {reportStep === "start" ? (
            <View style={problemStyles.modalBlock}>
              <Text style={problemStyles.modalText}>
                Nie wiesz, czy to choroba czy szkodnik?
              </Text>
              <Button mode="contained" onPress={() => setReportStep("select")}>
                Nie wiem
              </Button>
              <Button
                mode="text"
                onPress={() => {
                  setReportVisible(false);
                  resetReportState();
                }}
              >
                Anuluj
              </Button>
            </View>
          ) : null}

          {reportStep === "select" ? (
            <View style={problemStyles.modalBlock}>
              <TextInput
                mode="outlined"
                label="Szukaj"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={problemStyles.modalInput}
              />
              {diseasesQuery.isLoading || pestsQuery.isLoading ? (
                <ActivityIndicator style={problemStyles.inlineLoader} />
              ) : problemSuggestions.length === 0 ? (
                <Text style={problemStyles.emptyText}>Brak wyników.</Text>
              ) : (
                <View style={problemStyles.suggestionList}>
                  {problemSuggestions.map((item) => (
                    <Pressable
                      key={`${item.type}-${item.id}`}
                      onPress={() => {
                        setSelectedProblem(item);
                        setReportStep("details");
                      }}
                      style={problemStyles.suggestionRow}
                    >
                      <Text style={problemStyles.suggestionTitle}>
                        {item.name}
                      </Text>
                      <Chip mode="outlined" style={problemStyles.typeChip}>
                        {item.type === "disease" ? "Choroba" : "Szkodnik"}
                      </Chip>
                    </Pressable>
                  ))}
                </View>
              )}
              <View style={problemStyles.modalActionsRow}>
                <Button mode="text" onPress={() => setReportStep("start")}>
                  Wstecz
                </Button>
                <Button
                  mode="text"
                  onPress={() => {
                    setReportVisible(false);
                    resetReportState();
                  }}
                >
                  Anuluj
                </Button>
              </View>
            </View>
          ) : null}

          {reportStep === "details" ? (
            <View style={problemStyles.modalBlock}>
              {selectedProblem ? (
                <View style={problemStyles.selectedRow}>
                  <Chip mode="flat" style={problemStyles.selectedChip}>
                    {selectedProblem.name}
                  </Chip>
                  <Button mode="text" onPress={() => setReportStep("select")}>
                    Zmień
                  </Button>
                </View>
              ) : null}

              <Text style={problemStyles.modalLabel}>Status</Text>
              <SegmentedButtons
                value={reportStatus}
                onValueChange={(value) =>
                  setReportStatus(value as "suspected" | "confirmed")
                }
                buttons={[
                  { value: "suspected", label: "Podejrzenie" },
                  { value: "confirmed", label: "Potwierdzony" },
                ]}
                style={problemStyles.segmentedButtons}
              />

              <TextInput
                mode="outlined"
                label="Notatka"
                value={reportNote}
                onChangeText={setReportNote}
                multiline
                numberOfLines={3}
                style={problemStyles.modalInput}
              />

              <View style={problemStyles.modalActionsRow}>
                <Button mode="text" onPress={() => setReportStep("select")}>
                  Wstecz
                </Button>
                <Button
                  mode="contained"
                  onPress={handleCreateProblem}
                  loading={
                    createDiseaseOccurrence.isPending ||
                    createPestOccurrence.isPending
                  }
                  disabled={!selectedProblem}
                >
                  Zapisz
                </Button>
              </View>
            </View>
          ) : null}
        </Modal>
      </Portal>

      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage(null)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: "#fff",
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
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  section: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  linkButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  linkButtonText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  valueText: {
    fontSize: 14,
    color: "#111827",
  },
  inlineLoader: {
    marginVertical: 8,
  },
  inlineErrorBox: {
    marginTop: 8,
  },
  plantingRow: {
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
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
  },
  plantingMeta: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  plantingStatus: {
    fontSize: 11,
    color: "#2563eb",
  },
  metrics: {
    marginTop: 8,
  },
  metricRow: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 4,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  errorText: {
    fontSize: 14,
    color: "#dc2626",
    marginBottom: 12,
    textAlign: "center",
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  secondaryButtonText: {
    color: "#111827",
    fontWeight: "600",
  },
  modal: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalActionsColumn: {
    gap: 10,
  },
});

const makeProblemStyles = (theme: MD3Theme) =>
  StyleSheet.create({
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
      gap: 12,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    tabs: {
      marginBottom: 10,
    },
    inlineLoader: {
      marginVertical: 8,
    },
    errorText: {
      fontSize: 13,
      color: theme.colors.error,
    },
    emptyText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    problemCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      padding: 12,
      backgroundColor: theme.colors.surface,
      marginBottom: 10,
    },
    problemRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 10,
    },
    problemMain: {
      flex: 1,
      gap: 6,
    },
    problemTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    problemMetaRow: {
      flexDirection: "row",
      gap: 6,
      flexWrap: "wrap",
    },
    problemMeta: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    problemNotes: {
      fontSize: 13,
      color: theme.colors.onSurface,
    },
    statusChip: {
      height: 32,
    },
    modal: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      borderRadius: 16,
      padding: 16,
      gap: 12,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    modalBlock: {
      gap: 12,
    },
    modalText: {
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    modalInput: {
      backgroundColor: theme.colors.surface,
    },
    modalActionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    modalLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    segmentedButtons: {
      alignSelf: "flex-start",
    },
    suggestionList: {
      gap: 8,
    },
    suggestionRow: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    suggestionTitle: {
      fontSize: 13,
      color: theme.colors.onSurface,
      flex: 1,
    },
    typeChip: {
      height: 30,
    },
    selectedRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    selectedChip: {
      flex: 1,
    },
  });
