import {
  HarvestResultRecord,
  Planting,
} from "@/src/api/queries/plantings/types";
import { formatQualityRating, formatYield } from "@/src/utils/learningMappers";
import { StyleSheet, Text, View } from "react-native";
import { Button, MD3Theme, Surface, useTheme } from "react-native-paper";

type Props = {
  planting: Planting;
  onAddPress: () => void;
  onEditPress: (record: HarvestResultRecord) => void;
  onDeletePress: (record: HarvestResultRecord) => void;
  deletingRecordId?: string | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

export function PlantingHarvestResultCard({
  planting,
  onAddPress,
  onEditPress,
  onDeletePress,
  deletingRecordId,
}: Props) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  const records: HarvestResultRecord[] = Array.isArray(planting.harvestResults)
    ? planting.harvestResults
    : [];

  const fallbackHasLegacyData =
    planting.yieldKg != null ||
    planting.yieldQualityRating != null ||
    !!planting.yieldNotes;

  const normalizedRecords: HarvestResultRecord[] =
    records.length > 0
      ? records
      : fallbackHasLegacyData
        ? [
            {
              id: `legacy-${planting.id}`,
              harvestedAt:
                planting.harvestEndDate ?? planting.updatedAt ?? null,
              yieldKg: planting.yieldKg ?? null,
              qualityRating: planting.yieldQualityRating ?? null,
              notes: planting.yieldNotes ?? null,
            },
          ]
        : [];

  const totalYield = normalizedRecords.reduce(
    (acc, item) => acc + (item.yieldKg ?? 0),
    0,
  );
  const ratings = normalizedRecords
    .map((item) => item.qualityRating)
    .filter((value): value is number => typeof value === "number");
  const avgRating = ratings.length
    ? ratings.reduce((acc, item) => acc + item, 0) / ratings.length
    : null;

  return (
    <Surface style={styles.section} elevation={0}>
      <Text style={styles.sectionTitle}>Wyniki zbioru</Text>

      {normalizedRecords.length === 0 ? (
        <Text style={styles.emptyText}>Brak wyniku zbioru.</Text>
      ) : (
        normalizedRecords.map((record, idx) => (
          <View key={record.id || `${idx}`} style={styles.recordCard}>
            <View style={styles.row}>
              <Text style={styles.label}>Data:</Text>
              <Text style={styles.value}>{formatDate(record.harvestedAt)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Plon:</Text>
              <Text style={styles.value}>{formatYield(record.yieldKg)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Ocena jakości:</Text>
              <Text style={styles.value}>
                {formatQualityRating(record.qualityRating)}
              </Text>
            </View>
            {record.notes ? (
              <View style={styles.noteRow}>
                <Text style={styles.label}>Notatka:</Text>
                <Text style={styles.noteText}>{record.notes}</Text>
              </View>
            ) : null}

            {!record.id.startsWith("legacy-") ? (
              <View style={styles.recordActions}>
                <Button
                  mode="outlined"
                  compact
                  onPress={() => onEditPress(record)}
                  disabled={deletingRecordId === record.id}
                >
                  Edytuj
                </Button>
                <Button
                  mode="text"
                  compact
                  textColor={theme.colors.error}
                  onPress={() => onDeletePress(record)}
                  loading={deletingRecordId === record.id}
                >
                  Usuń
                </Button>
              </View>
            ) : null}
          </View>
        ))
      )}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Podsumowanie</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Liczba zbiorów:</Text>
          <Text style={styles.value}>{normalizedRecords.length}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Łączny plon:</Text>
          <Text style={styles.value}>{formatYield(totalYield)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Średnia jakość:</Text>
          <Text style={styles.value}>
            {avgRating == null
              ? "Brak oceny"
              : formatQualityRating(Math.round(avgRating))}
          </Text>
        </View>
      </View>

      <Button
        mode="outlined"
        onPress={onAddPress}
        style={styles.ctaButton}
        compact
      >
        Dodaj rekord zbioru
      </Button>
    </Surface>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    section: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 12,
      padding: 12,
      backgroundColor: theme.colors.surface,
      gap: 6,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    recordCard: {
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 10,
      padding: 10,
      gap: 4,
      backgroundColor: theme.colors.surfaceVariant,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    label: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    },
    value: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.onSurface,
      textAlign: "right",
    },
    noteRow: {
      gap: 2,
    },
    noteText: {
      fontSize: 13,
      color: theme.colors.onSurface,
    },
    emptyText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    summaryCard: {
      borderTopWidth: 1,
      borderColor: theme.colors.outline,
      paddingTop: 10,
      marginTop: 4,
      gap: 4,
    },
    summaryTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.colors.onSurface,
      marginBottom: 2,
    },
    recordActions: {
      marginTop: 8,
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
    },
    ctaButton: {
      alignSelf: "flex-start",
      marginTop: 4,
    },
  });
