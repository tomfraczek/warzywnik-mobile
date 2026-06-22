import { BedPlanResponse } from "@/src/api/queries/bedPlan/types";
import { pluralize } from "@/src/utils/pluralize";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ActivityIndicator, Icon } from "react-native-paper";

type BedPlanHeaderCardProps = {
  data: BedPlanResponse;
  onRecompute: () => void;
  isRecomputing?: boolean;
  disabled?: boolean;
};

export function BedPlanHeaderCard({
  data,
  onRecompute,
  isRecomputing = false,
  disabled = false,
}: BedPlanHeaderCardProps) {
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
              <Icon source="refresh" size={14} color="#356FA5" />
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

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#E8ECE7",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
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
    borderColor: "#C5DFC9",
    backgroundColor: "#EDF4EE",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    color: "#4F7459",
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
    color: "#356FA5",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1D2420",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6E7972",
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metric: {
    fontSize: 12,
    color: "#637067",
    backgroundColor: "#F3F6F2",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#ECF2ED",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#5E9A6E",
  },
  progressText: {
    fontSize: 12,
    color: "#6E7972",
  },
});
