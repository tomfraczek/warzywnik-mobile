import type {
  PreviousSeasonSummary,
  SeasonSummary,
} from "@/src/api/queries/plantings/learningTypes";
import { useGetPlantingSeasonComparison } from "@/src/api/queries/plantings/useGetPlantingSeasonComparison";
import {
  formatDurationDiff,
  formatLocalDate,
  formatStartDiff,
  formatTaskCountDiff,
  formatYield,
  formatYieldDiff,
} from "@/src/utils/learningMappers";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button, MD3Theme, Surface, useTheme } from "react-native-paper";

// ─── Metric row ───────────────────────────────────────────────────────────────

type MetricRowProps = { label: string; value: string | number };

function MetricRow({ label, value }: MetricRowProps) {
  const theme = useTheme<MD3Theme>();
  return (
    <View style={metricRowStyles(theme).row}>
      <Text style={metricRowStyles(theme).label}>{label}</Text>
      <Text style={metricRowStyles(theme).value}>{String(value)}</Text>
    </View>
  );
}

const metricRowStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 3,
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
  });

// ─── Previous season card ─────────────────────────────────────────────────────

type PreviousSeasonCardProps = {
  season: PreviousSeasonSummary;
};

function PreviousSeasonCard({ season }: PreviousSeasonCardProps) {
  const theme = useTheme<MD3Theme>();
  const styles = prevCardStyles(theme);

  const diffs = [
    formatStartDiff(season.startDiffDays),
    formatDurationDiff(season.durationDiffDays),
    formatYieldDiff(season.yieldDiffKg),
    formatTaskCountDiff(season.taskCountDiff),
  ].filter((v): v is string => v !== null);

  return (
    <Surface style={styles.card} elevation={0}>
      <Text style={styles.year}>Sezon {season.seasonYear}</Text>
      <MetricRow label="Start" value={formatLocalDate(season.realStartDate)} />
      <MetricRow
        label="Zakończenie"
        value={formatLocalDate(season.realEndDate)}
      />
      {season.seasonDurationDays != null ? (
        <MetricRow
          label="Długość sezonu"
          value={`${season.seasonDurationDays} dni`}
        />
      ) : null}
      <MetricRow label="Zabiegi" value={season.tasksCompleted} />
      {season.yieldKg != null ? (
        <MetricRow label="Plon" value={formatYield(season.yieldKg)} />
      ) : null}

      {diffs.length > 0 ? (
        <View style={styles.diffsContainer}>
          <Text style={styles.diffsTitle}>
            Różnice względem bieżącego sezonu:
          </Text>
          {diffs.map((diff, idx) => (
            <Text key={idx} style={styles.diffText}>
              • {diff}
            </Text>
          ))}
        </View>
      ) : null}
    </Surface>
  );
}

const prevCardStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 10,
      padding: 10,
      marginTop: 8,
      backgroundColor: theme.colors.surfaceVariant,
      gap: 2,
    },
    year: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    diffsContainer: {
      marginTop: 8,
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      gap: 2,
    },
    diffsTitle: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    diffText: {
      fontSize: 12,
      color: theme.colors.onSurface,
    },
  });

// ─── Season section (summary + comparison) ────────────────────────────────────

type Props = {
  plantingId: string;
};

export function PlantingSeasonSection({ plantingId }: Props) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  const { data, isLoading, error, refetch } =
    useGetPlantingSeasonComparison(plantingId);

  if (isLoading) {
    return (
      <Surface style={styles.section} elevation={0}>
        <Text style={styles.sectionTitle}>Podsumowanie sezonu</Text>
        <ActivityIndicator style={styles.loader} />
      </Surface>
    );
  }

  if (error) {
    return (
      <Surface style={styles.section} elevation={0}>
        <Text style={styles.sectionTitle}>Podsumowanie sezonu</Text>
        <Text style={styles.errorText}>Nie udało się załadować danych.</Text>
        <Button
          mode="outlined"
          onPress={() => refetch()}
          style={styles.retryBtn}
        >
          Spróbuj ponownie
        </Button>
      </Surface>
    );
  }

  const current: SeasonSummary | null = data?.current ?? null;
  const previous: PreviousSeasonSummary[] = data?.previous ?? [];

  return (
    <>
      {/* Season Summary */}
      <Surface style={styles.section} elevation={0}>
        <Text style={styles.sectionTitle}>
          Podsumowanie sezonu{current ? ` ${current.seasonYear}` : ""}
        </Text>

        {!current ? (
          <Text style={styles.emptyText}>
            Podsumowanie sezonu pojawi się po zakończeniu lub podsumowaniu tej
            uprawy.
          </Text>
        ) : (
          <>
            <MetricRow
              label="Rzeczywisty start"
              value={formatLocalDate(current.realStartDate)}
            />
            <MetricRow
              label="Zakończenie sezonu"
              value={formatLocalDate(current.realEndDate)}
            />
            {current.seasonDurationDays != null ? (
              <MetricRow
                label="Długość sezonu"
                value={`${current.seasonDurationDays} dni`}
              />
            ) : null}
            <MetricRow
              label="Wykonane zabiegi"
              value={current.tasksCompleted}
            />
            <MetricRow label="Podlewania" value={current.wateringCount} />
            <MetricRow label="Nawożenia" value={current.fertilizationCount} />
            <MetricRow
              label="Zabiegi ochronne"
              value={current.protectionCount}
            />
            <MetricRow label="Szkodniki" value={current.pestEvents} />
            <MetricRow label="Choroby" value={current.diseaseEvents} />
            {current.yieldKg != null ? (
              <MetricRow label="Plon" value={formatYield(current.yieldKg)} />
            ) : null}
          </>
        )}
      </Surface>

      {/* Season Comparison */}
      <Surface style={styles.section} elevation={0}>
        <Text style={styles.sectionTitle}>
          Porównanie z poprzednimi sezonami
        </Text>

        {!current || previous.length === 0 ? (
          <Text style={styles.emptyText}>
            Brak danych do porównania z poprzednimi sezonami.
          </Text>
        ) : (
          previous
            .slice(0, 3)
            .map((season) => (
              <PreviousSeasonCard key={season.id} season={season} />
            ))
        )}
      </Surface>
    </>
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
      gap: 4,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    loader: {
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
    retryBtn: {
      alignSelf: "flex-start",
      marginTop: 4,
    },
  });
