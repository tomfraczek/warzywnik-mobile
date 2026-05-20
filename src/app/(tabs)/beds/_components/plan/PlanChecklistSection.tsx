import {
  PlanChecklistItem,
  PlanChecklistStatus,
} from "@/src/api/queries/bedPlan/types";
import { PrimaryActionButton } from "@/src/components/ui/PrimaryActionButton";
import { StyleSheet, Text, View } from "react-native";
import { PlanChecklistItemRow } from "./PlanChecklistItemRow";

type PlanChecklistSectionProps = {
  items: PlanChecklistItem[];
  plannedPlantingsCount: number;
  onChangeStatus: (itemId: string, status: PlanChecklistStatus) => void;
  onDelete: (itemId: string) => void;
  onEdit: (item: PlanChecklistItem) => void;
  onAddManual: () => void;
  onRecompute: () => void;
  disabled?: boolean;
};

export function PlanChecklistSection({
  items,
  plannedPlantingsCount,
  onChangeStatus,
  onDelete,
  onEdit,
  onAddManual,
  onRecompute,
  disabled = false,
}: PlanChecklistSectionProps) {
  const allDone =
    items.length > 0 && items.every((item) => item.status === "done");
  const allSkipped =
    items.length > 0 && items.every((item) => item.status === "skipped");

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Checklista przygotowania</Text>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {plannedPlantingsCount > 0
              ? "Plan gotowy — brak otwartych kroków przygotowania."
              : "Nie masz jeszcze checklisty dla tej grządki."}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <PlanChecklistItemRow
              key={item.id}
              item={item}
              onChangeStatus={onChangeStatus}
              onDelete={onDelete}
              onEdit={onEdit}
              disabled={disabled}
            />
          ))}
        </View>
      )}

      {allDone ? (
        <Text style={styles.infoText}>
          Wszystko przygotowane. Możesz rozpocząć uprawę.
        </Text>
      ) : null}

      {allSkipped ? (
        <View style={styles.allSkippedWrap}>
          <Text style={styles.infoText}>
            Wszystkie punkty zostały pominięte.
          </Text>
          <Text onPress={onRecompute} style={styles.linkText}>
            Przelicz plan
          </Text>
        </View>
      ) : null}

      <PrimaryActionButton
        onPress={onAddManual}
        icon="plus"
        label="Dodaj własny punkt"
        color="#4A7C59"
        disabled={disabled}
      />
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
  emptyState: {
    borderTopWidth: 1,
    borderTopColor: "#E8ECE7",
    paddingTop: 12,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6E7972",
  },
  list: {
    marginTop: -4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#637067",
  },
  allSkippedWrap: {
    gap: 4,
  },
  linkText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#356FA5",
  },
});
