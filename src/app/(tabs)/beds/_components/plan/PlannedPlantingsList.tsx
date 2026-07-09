import { PlannedPlanting } from "@/src/api/queries/bedPlan/types";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MD3Theme, useTheme } from "react-native-paper";

const formatDate = (value?: string | null) => {
  if (!value) return "Brak daty";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Brak daty";
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const getStartMethodLabel = (startMethod?: string) => {
  if (startMethod === "DIRECT_SOW") return "Siew bezpośredni";
  if (startMethod === "TRANSPLANT") return "Własna rozsada";
  if (startMethod === "PURCHASED_SEEDLING") return "Kupiona flanca / sadzonka";
  return "Brak";
};

type PlannedPlantingsListProps = {
  items: PlannedPlanting[];
  onPressPlanting: (plantingId: string) => void;
  onPressAddVegetable: () => void;
};

function buildPalette(dark: boolean) {
  return {
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "rgba(255, 255, 255, 0.12)" : "#E8ECE7",
    innerBg: dark ? "#161C19" : "#FBFCFA",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
    accent: dark ? "#7AB88A" : "#4A7C59",
  };
}

export function PlannedPlantingsList({
  items,
  onPressPlanting,
  onPressAddVegetable,
}: PlannedPlantingsListProps) {
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);
  const styles = makeStyles(palette);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Zaplanowane uprawy</Text>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Nie masz jeszcze zaplanowanych upraw w tej grządce.
          </Text>
          <Pressable onPress={onPressAddVegetable}>
            <Text style={styles.link}>Dodaj warzywo</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => onPressPlanting(item.id)}
              style={styles.card}
            >
              <View style={styles.headerRow}>
                <Text style={styles.name}>{item.vegetableName}</Text>
                <StatusBadge label="Planowana" tone="neutral" />
              </View>
              <Text style={styles.meta}>
                Start: {formatDate(item.plannedStartDate)}
              </Text>
              <Text style={styles.meta}>
                Metoda: {getStartMethodLabel(item.startMethod)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function makeStyles(palette: ReturnType<typeof buildPalette>) {
  return StyleSheet.create({
    section: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      backgroundColor: palette.cardBg,
      padding: 18,
      gap: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: palette.heading,
    },
    list: {
      gap: 10,
    },
    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      backgroundColor: palette.innerBg,
      padding: 14,
      gap: 6,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    },
    name: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: palette.heading,
    },
    meta: {
      fontSize: 13,
      color: palette.secondary,
    },
    emptyState: {
      gap: 8,
    },
    emptyText: {
      fontSize: 14,
      lineHeight: 20,
      color: palette.secondary,
    },
    link: {
      fontSize: 14,
      fontWeight: "700",
      color: palette.accent,
    },
  });
}
