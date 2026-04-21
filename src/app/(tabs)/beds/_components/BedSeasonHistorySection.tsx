import { useGetBedSeasons } from "@/src/api/queries/beds/useGetBedSeasons";
import type { SeasonSummary } from "@/src/api/queries/plantings/learningTypes";
import { useGetVegetable } from "@/src/api/queries/vegetables/useGetVegetable";
import { formatLocalDate, formatYield } from "@/src/utils/learningMappers";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button, Icon, MD3Theme, useTheme } from "react-native-paper";

// ─── Rotation badge helper ────────────────────────────────────────────────────

type RotationInfo = {
  label: string;
  isSame: boolean;
};

function computeRotation(
  seasons: SeasonSummary[],
  currentIndex: number,
): RotationInfo | null {
  if (currentIndex === 0) return null;
  const prev = seasons[currentIndex - 1];
  const curr = seasons[currentIndex];
  if (!prev || !curr) return null;
  if (prev.vegetableId === curr.vegetableId) {
    return { label: "To samo warzywo pojawia się kolejny sezon", isSame: true };
  }
  return { label: "Po tej uprawie nastąpiła zmiana warzywa", isSame: false };
}

// ─── Single season card ───────────────────────────────────────────────────────

type BedSeasonCardProps = {
  season: SeasonSummary;
  rotation: RotationInfo | null;
};

function BedSeasonCard({ season, rotation }: BedSeasonCardProps) {
  const theme = useTheme<MD3Theme>();
  const styles = cardStyles(theme);

  const { data: vegetable, isLoading: isVegetableLoading } = useGetVegetable(
    season.vegetableId ?? null,
  );

  const vegetableName = isVegetableLoading
    ? "Ładowanie..."
    : (vegetable?.name ?? "Nieznane warzywo");

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.vegetableName}>{vegetableName}</Text>
          <Text style={styles.year}>Sezon {season.seasonYear}</Text>
        </View>
        {rotation ? (
          <View
            style={[
              styles.rotationBadge,
              rotation.isSame
                ? styles.rotationBadgeSame
                : styles.rotationBadgeNew,
            ]}
          >
            <Text
              style={[
                styles.rotationText,
                rotation.isSame
                  ? styles.rotationTextSame
                  : styles.rotationTextNew,
              ]}
              numberOfLines={2}
            >
              {rotation.label}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.metrics}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Start:</Text>
          <Text style={styles.metricValue}>
            {formatLocalDate(season.realStartDate)}
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Zakończenie:</Text>
          <Text style={styles.metricValue}>
            {formatLocalDate(season.realEndDate)}
          </Text>
        </View>
        {season.seasonDurationDays != null ? (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Długość sezonu:</Text>
            <Text style={styles.metricValue}>
              {season.seasonDurationDays} dni
            </Text>
          </View>
        ) : null}
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Zabiegi:</Text>
          <Text style={styles.metricValue}>{season.tasksCompleted}</Text>
        </View>
        {season.pestEvents > 0 ? (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Szkodniki:</Text>
            <Text style={styles.metricValue}>{season.pestEvents}</Text>
          </View>
        ) : null}
        {season.diseaseEvents > 0 ? (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Choroby:</Text>
            <Text style={styles.metricValue}>{season.diseaseEvents}</Text>
          </View>
        ) : null}
        {season.yieldKg != null ? (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Plon:</Text>
            <Text style={styles.metricValue}>
              {formatYield(season.yieldKg)}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const cardStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    card: {
      borderTopWidth: 1,
      borderColor: theme.colors.outline,
      paddingVertical: 12,
      gap: 8,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 8,
    },
    titleBlock: {
      flex: 1,
      gap: 2,
    },
    vegetableName: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    year: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    rotationBadge: {
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      maxWidth: 130,
    },
    rotationBadgeSame: {
      backgroundColor: theme.dark ? "#3B2F15" : "#FFF3DA",
    },
    rotationBadgeNew: {
      backgroundColor: theme.dark ? "#163222" : "#E7F4EC",
    },
    rotationText: {
      fontSize: 10,
      fontWeight: "600",
      textAlign: "right",
    },
    rotationTextSame: {
      color: theme.dark ? "#F2CD7B" : "#8D6A1B",
    },
    rotationTextNew: {
      color: theme.dark ? "#9BD7B4" : "#1C5A3D",
    },
    metrics: {
      gap: 3,
    },
    metricRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    metricLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    metricValue: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
  });

// ─── Main section ─────────────────────────────────────────────────────────────

type Props = {
  bedId: string;
};

export function BedSeasonHistorySection({ bedId }: Props) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  const { data, isLoading, error, refetch } = useGetBedSeasons(bedId);
  const seasons = data?.items ?? [];

  if (!isLoading && !error && seasons.length === 0) {
    return (
      <View style={styles.emptyInfoCardStandalone}>
        <View style={styles.emptyInfoIconWrap}>
          <Icon
            source="information-outline"
            size={18}
            color={theme.dark ? "#A9CBF3" : "#3D6FA5"}
          />
        </View>
        <Text style={styles.emptyInfoTitle}>
          Historia upraw pojawi się tutaj
        </Text>
        <Text style={styles.emptyInfoText}>
          Po zakończeniu pierwszego sezonu na tej grządce zobaczysz w tym
          miejscu historię upraw.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Historia upraw</Text>

      {isLoading ? <ActivityIndicator style={styles.loader} /> : null}

      {error && !isLoading ? (
        <View>
          <Text style={styles.errorText}>
            Nie udało się załadować historii upraw.
          </Text>
          <Button
            mode="outlined"
            onPress={() => refetch()}
            style={styles.retryBtn}
          >
            Spróbuj ponownie
          </Button>
        </View>
      ) : null}

      {!isLoading && !error && seasons.length > 0
        ? seasons.map((season, idx) => (
            <BedSeasonCard
              key={season.id}
              season={season}
              rotation={computeRotation(seasons, idx)}
            />
          ))
        : null}
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    section: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 12,
      padding: 12,
      marginBottom: 14,
      backgroundColor: theme.colors.surface,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 4,
      color: theme.colors.onSurface,
    },
    loader: {
      marginVertical: 8,
    },
    errorText: {
      fontSize: 13,
      color: theme.colors.error,
      marginBottom: 6,
    },
    emptyInfoCardStandalone: {
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
      backgroundColor: theme.dark ? "#1E2A38" : "#EAF3FF",
      gap: 8,
    },
    emptyInfoIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyInfoTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.dark ? "#DDEBFF" : "#2F5F91",
    },
    emptyInfoText: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.dark ? "#B9CBE0" : "#4D6D8D",
    },
    retryBtn: {
      alignSelf: "flex-start",
    },
  });
