import { getResponseError } from "@/src/api/axios";
import {
  HarvestResultRecord,
  Planting,
} from "@/src/api/queries/plantings/types";
import { useDeleteHarvestResultRecord } from "@/src/api/queries/plantings/useDeleteHarvestResultRecord";
import { useGetPlanting } from "@/src/api/queries/plantings/useGetPlanting";
import { Screen } from "@/src/components/Screen";
import { OFFLINE_MUTATION_MESSAGE } from "@/src/features/network/offline";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { formatQualityRating, formatYield } from "@/src/utils/learningMappers";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, MD3Theme, Surface, useTheme } from "react-native-paper";
import { PlantingHarvestResultForm } from "../_components/PlantingHarvestResultForm";

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

type ExtendedPlanting = Planting & {
  harvestEndDate?: string | null;
};

function buildPalette(dark: boolean) {
  return {
    background: dark ? "#141816" : "#F7F8F5",
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "#252D29" : "#E8ECE7",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
  };
}

export default function PlantingHarvestResultsScreen() {
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);
  const styles = makeStyles(theme);
  const { bedId, plantingId } = useLocalSearchParams<{
    bedId?: string | string[];
    plantingId?: string | string[];
  }>();

  const resolvedBedId = Array.isArray(bedId) ? bedId[0] : bedId;
  const resolvedPlantingId = Array.isArray(plantingId)
    ? plantingId[0]
    : plantingId;

  const { data, isLoading, error, refetch } = useGetPlanting(
    resolvedPlantingId ?? null,
  );
  const planting = data as ExtendedPlanting | undefined;

  const deleteHarvestResultRecord = useDeleteHarvestResultRecord(
    resolvedPlantingId ?? "",
    resolvedBedId,
  );
  const isOffline = useIsOffline();

  const [harvestFormVisible, setHarvestFormVisible] = useState(false);
  const [editingHarvestRecord, setEditingHarvestRecord] =
    useState<HarvestResultRecord | null>(null);

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
        } satisfies HarvestResultRecord,
      ];
    }

    return [];
  }, [planting]);

  const deletingRecordId = deleteHarvestResultRecord.isPending
    ? (deleteHarvestResultRecord.variables ?? null)
    : null;

  const handleEditHarvestRecord = (record: HarvestResultRecord) => {
    setEditingHarvestRecord(record);
    setHarvestFormVisible(true);
  };

  const handleDeleteHarvestRecord = (record: HarvestResultRecord) => {
    if (!record.id || record.id.startsWith("legacy-")) return;
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }
    Alert.alert("Usunąć rekord zbioru?", "Tej operacji nie można cofnąć.", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteHarvestResultRecord.mutateAsync(record.id);
          } catch (err) {
            Alert.alert("Błąd", String(getResponseError(err)));
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <Screen style={{ backgroundColor: palette.background }}>
        <View style={styles.center}>
          <Text style={styles.infoText}>Ładowanie...</Text>
        </View>
      </Screen>
    );
  }

  if (error || !planting) {
    return (
      <Screen style={{ backgroundColor: palette.background }}>
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
    <Screen style={{ backgroundColor: palette.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Surface style={styles.section} elevation={0}>
          <Text style={styles.sectionTitle}>Szczegóły wyników zbiorów</Text>

          {harvestRecords.length === 0 ? (
            <Text style={styles.infoText}>Brak wyników zbioru.</Text>
          ) : (
            <View style={styles.recordsList}>
              {harvestRecords.map((record, idx) => (
                <View key={record.id || `${idx}`} style={styles.recordCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Data zbioru</Text>
                    <Text style={styles.infoValue}>
                      {formatDate(record.harvestedAt)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Plon</Text>
                    <Text style={styles.infoValue}>
                      {formatYield(record.yieldKg)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Jakość</Text>
                    <Text style={styles.infoValue}>
                      {formatQualityRating(record.qualityRating)}
                    </Text>
                  </View>

                  {record.notes ? (
                    <Text style={styles.noteText}>{record.notes}</Text>
                  ) : null}

                  {!record.id.startsWith("legacy-") ? (
                    <View style={styles.rowActions}>
                      <Button
                        mode="outlined"
                        compact
                        onPress={() => handleEditHarvestRecord(record)}
                        disabled={deletingRecordId === record.id}
                      >
                        Edytuj
                      </Button>
                      <Button
                        mode="text"
                        compact
                        textColor={theme.colors.error}
                        onPress={() => handleDeleteHarvestRecord(record)}
                        loading={deletingRecordId === record.id}
                      >
                        Usuń
                      </Button>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          <Button
            mode="contained"
            onPress={() => {
              setEditingHarvestRecord(null);
              setHarvestFormVisible(true);
            }}
            disabled={isOffline}
          >
            Dodaj rekord
          </Button>
        </Surface>
      </ScrollView>

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
        />
      ) : null}
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 32,
      backgroundColor: buildPalette(theme.dark).background,
    },
    section: {
      borderWidth: 1,
      borderColor: buildPalette(theme.dark).cardBorder,
      borderRadius: 22,
      padding: 20,
      backgroundColor: buildPalette(theme.dark).cardBg,
      gap: 12,
    },
    sectionTitle: {
      fontSize: 19,
      fontWeight: "700",
      color: buildPalette(theme.dark).heading,
    },
    recordsList: {
      gap: 10,
    },
    recordCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: buildPalette(theme.dark).cardBorder,
      backgroundColor: buildPalette(theme.dark).cardBg,
      padding: 12,
      gap: 6,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
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
    noteText: {
      fontSize: 13,
      color: buildPalette(theme.dark).secondary,
      marginTop: 4,
    },
    rowActions: {
      marginTop: 6,
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      gap: 10,
    },
    infoText: {
      fontSize: 14,
      color: buildPalette(theme.dark).secondary,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      textAlign: "center",
    },
  });
