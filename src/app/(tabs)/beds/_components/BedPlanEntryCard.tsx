import { BedPlanSummary } from "@/src/api/queries/bedPlan/types";
import { Pressable, StyleSheet, Text, View } from "react-native";

type BedPlanEntryCardProps = {
  plannedPlantingsCount?: number;
  summary?: BedPlanSummary;
  onPress: () => void;
  fallbackToPlanCopy?: boolean;
  disabled?: boolean;
};

export function BedPlanEntryCard({
  plannedPlantingsCount = 0,
  summary,
  onPress,
  fallbackToPlanCopy = false,
  disabled = false,
}: BedPlanEntryCardProps) {
  const hasPlanned = plannedPlantingsCount > 0;
  const subtitle = hasPlanned
    ? "Zobacz zaplanowane uprawy i checklistę przygotowania."
    : "Zaplanuj przyszłe uprawy i przygotuj grządkę przed sezonem.";
  const preparationCopy = summary
    ? `${summary.pending} do przygotowania · ${summary.done} gotowe`
    : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        disabled ? styles.cardDisabled : null,
        pressed && !disabled ? styles.cardPressed : null,
      ]}
    >
      <View style={styles.topRow}>
        <Text style={styles.title}>Plan grządki</Text>
        <Text style={styles.linkText}>Otwórz plan</Text>
      </View>

      <Text style={styles.subtitle}>{subtitle}</Text>

      {hasPlanned ? (
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {plannedPlantingsCount} zaplanowane{" "}
            {plannedPlantingsCount === 1 ? "uprawa" : "uprawy"}
          </Text>
          {preparationCopy ? (
            <Text style={styles.metaText}>{preparationCopy}</Text>
          ) : null}
        </View>
      ) : null}

      {fallbackToPlanCopy ? (
        <Text style={styles.ctaText}>Dodaj warzywo</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8ECE7",
    backgroundColor: "#FFFFFF",
    padding: 18,
    marginBottom: 20,
    gap: 10,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardDisabled: {
    opacity: 0.7,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1D2420",
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A7C59",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6E7972",
  },
  metaRow: {
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#97A29B",
  },
  ctaText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4A7C59",
  },
});
