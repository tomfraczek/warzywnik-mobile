import { BedPlanResponse } from "@/src/api/queries/bedPlan/types";
import { pluralize } from "@/src/utils/pluralize";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ActivityIndicator, Icon, MD3Theme, useTheme } from "react-native-paper";

type BedPlanHeaderCardProps = {
  data: BedPlanResponse;
  onRecompute: () => void;
  isRecomputing?: boolean;
  disabled?: boolean;
};

function buildPalette(dark: boolean) {
  return {
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "rgba(255, 255, 255, 0.12)" : "#E8ECE7",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
    meta: dark ? "#7A8880" : "#637067",
    cta: dark ? "#4C7FB1" : "#356FA5",
    badgeBg: dark ? "#1A2E1F" : "#EDF4EE",
    badgeBorder: dark ? "#2A4A32" : "#C5DFC9",
    badgeText: dark ? "#7AB88A" : "#4F7459",
    metricBg: dark ? "#252D29" : "#F3F6F2",
    metricText: dark ? "#9AA59E" : "#637067",
    progressTrack: dark ? "#252D29" : "#ECF2ED",
    progressFill: dark ? "#5E9A6E" : "#5E9A6E",
  };
}

export function BedPlanHeaderCard({
  data,
  onRecompute,
  isRecomputing = false,
  disabled = false,
}: BedPlanHeaderCardProps) {
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);
  const styles = makeStyles(palette);

  const total = data.summary.total;
  const done = data.summary.done;
  const progress = total > 0 ? done / total : 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Plan grządki</Text>
        </View>
        <Pressable onPress={onRecompute} disabled={disabled || isRecomputing}>
          <View style={styles.recomputeRow}>
            {isRecomputing ? (
              <ActivityIndicator size={14} />
            ) : (
              <Icon source="refresh" size={14} color={palette.cta} />
            )}
            <Text style={styles.recomputeText}>Przelicz plan</Text>
          </View>
        </Pressable>
      </View>

      <Text style={styles.title}>{data.bed.name}</Text>
      <Text style={styles.subtitle}>
        Przygotuj grządkę przed rozpoczęciem upraw.
      </Text>

      <View style={styles.summaryRow}>
        <Text style={styles.metric}>
          {data.plannedPlantings.length}{" "}
          {pluralize("uprawa", "uprawy", "upraw", data.plannedPlantings.length)}
        </Text>
        <Text style={styles.metric}>
          {data.summary.pending}{" "}
          {pluralize(
            "zadanie oczekuje",
            "zadania oczekują",
            "zadań oczekuje",
            data.summary.pending,
          )}
        </Text>
        <Text style={styles.metric}>
          {data.summary.done}{" "}
          {pluralize(
            "zadanie gotowe",
            "zadania gotowe",
            "zadań gotowych",
            data.summary.done,
          )}
        </Text>
        <Text style={styles.metric}>
          {data.summary.skipped}{" "}
          {pluralize(
            "zadanie pominięte",
            "zadania pominięte",
            "zadań pominiętych",
            data.summary.skipped,
          )}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.max(progress * 100, total > 0 ? 8 : 0)}%` },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {done} z {total} gotowe
      </Text>
    </View>
  );
}

function makeStyles(palette: ReturnType<typeof buildPalette>) {
  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: palette.cardBorder,
      borderRadius: 24,
      backgroundColor: palette.cardBg,
      padding: 20,
      gap: 10,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    badge: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.badgeBorder,
      backgroundColor: palette.badgeBg,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    badgeText: {
      fontSize: 12,
      color: palette.badgeText,
      fontWeight: "600",
    },
    recomputeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    recomputeText: {
      fontSize: 13,
      fontWeight: "600",
      color: palette.cta,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: palette.heading,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: palette.secondary,
    },
    summaryRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    metric: {
      fontSize: 12,
      color: palette.metricText,
      backgroundColor: palette.metricBg,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    progressTrack: {
      width: "100%",
      height: 8,
      borderRadius: 999,
      overflow: "hidden",
      backgroundColor: palette.progressTrack,
    },
    progressFill: {
      height: "100%",
      backgroundColor: palette.progressFill,
    },
    progressText: {
      fontSize: 12,
      color: palette.secondary,
    },
  });
}
