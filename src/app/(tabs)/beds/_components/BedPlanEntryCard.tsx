import { BedPlanSummary } from "@/src/api/queries/bedPlan/types";
import { FeaturePremiumLock } from "@/src/components/ui/FeaturePremiumLock";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MD3Theme, useTheme } from "react-native-paper";

function buildPalette(dark: boolean) {
  return {
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "rgba(255, 255, 255, 0.12)" : "#E8ECE7",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
    meta: dark ? "#7A8880" : "#97A29B",
    accent: dark ? "#7AB88A" : "#4A7C59",
  };
}

type BedPlanEntryCardProps = {
  plannedPlantingsCount?: number;
  summary?: BedPlanSummary;
  onPress: () => void;
  fallbackToPlanCopy?: boolean;
  disabled?: boolean;
  isPremiumLocked?: boolean;
};

export function BedPlanEntryCard({
  plannedPlantingsCount = 0,
  summary,
  onPress,
  fallbackToPlanCopy = false,
  disabled = false,
  isPremiumLocked = false,
}: BedPlanEntryCardProps) {
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);
  const hasPlanned = plannedPlantingsCount > 0;
  const subtitle = hasPlanned
    ? "Zobacz zaplanowane uprawy i checklistę przygotowania."
    : "Zaplanuj przyszłe uprawy i przygotuj grządkę przed sezonem.";
  const preparationCopy = summary
    ? `${summary.pending} do przygotowania · ${summary.done} gotowe`
    : null;

  const styles = makeStyles(palette);

  if (isPremiumLocked) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Plan grządki</Text>
        <FeaturePremiumLock label="Planowanie grządki dostępne jest w planie Premium." />
      </View>
    );
  }

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

function makeStyles(palette: ReturnType<typeof buildPalette>) {
  return StyleSheet.create({
    card: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      backgroundColor: palette.cardBg,
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
      color: palette.heading,
    },
    linkText: {
      fontSize: 14,
      fontWeight: "600",
      color: palette.accent,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: palette.secondary,
    },
    metaRow: {
      gap: 4,
    },
    metaText: {
      fontSize: 13,
      color: palette.meta,
    },
    ctaText: {
      fontSize: 14,
      fontWeight: "700",
      color: palette.accent,
    },
  });
}
