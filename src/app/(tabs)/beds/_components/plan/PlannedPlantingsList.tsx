import { PlannedPlanting } from "@/src/api/queries/bedPlan/types";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
  if (startMethod === "TRANSPLANT") return "Rozsada";
  return "Brak";
};

type PlannedPlantingsListProps = {
  items: PlannedPlanting[];
  onPressPlanting: (plantingId: string) => void;
  onPressAddVegetable: () => void;
};

export function PlannedPlantingsList({
  items,
  onPressPlanting,
  onPressAddVegetable,
}: PlannedPlantingsListProps) {
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

const styles = StyleSheet.create({
  section: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8ECE7",
    backgroundColor: "#FFFFFF",
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D2420",
  },
  list: {
    gap: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8ECE7",
    backgroundColor: "#FBFCFA",
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
    color: "#1D2420",
  },
  meta: {
    fontSize: 13,
    color: "#6E7972",
  },
  emptyState: {
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6E7972",
  },
  link: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4A7C59",
  },
});
