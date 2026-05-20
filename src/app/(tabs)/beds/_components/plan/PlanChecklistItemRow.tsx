import {
  PlanChecklistItem,
  PlanChecklistPriority,
  PlanChecklistStatus,
} from "@/src/api/queries/bedPlan/types";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "react-native-paper";

type PlanChecklistItemRowProps = {
  item: PlanChecklistItem;
  onChangeStatus: (itemId: string, status: PlanChecklistStatus) => void;
  onDelete: (itemId: string) => void;
  onEdit: (item: PlanChecklistItem) => void;
  disabled?: boolean;
};

const PRIORITY_LABELS: Record<PlanChecklistPriority, string> = {
  low: "Niski",
  medium: "Średni",
  high: "Wysoki",
  critical: "Krytyczny",
};

const statusIcon = (status: PlanChecklistStatus) => {
  if (status === "done") return "check-circle";
  if (status === "skipped") return "minus-circle-outline";
  return "checkbox-blank-circle-outline";
};

export function PlanChecklistItemRow({
  item,
  onChangeStatus,
  onDelete,
  onEdit,
  disabled = false,
}: PlanChecklistItemRowProps) {
  const sourceLabel = item.source === "manual" ? "Własne" : "Auto";
  const showPriority = item.priority === "high" || item.priority === "critical";

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() =>
          onChangeStatus(item.id, item.status === "done" ? "pending" : "done")
        }
        disabled={disabled}
        style={styles.statusButton}
      >
        <Icon source={statusIcon(item.status)} size={20} color="#4A7C59" />
      </Pressable>

      <View style={styles.main}>
        <View style={styles.topRow}>
          <Text
            style={[
              styles.title,
              item.status === "done" ? styles.titleDone : null,
            ]}
          >
            {item.title}
          </Text>
        </View>

        <Text style={styles.sourceMetaText}>
          {sourceLabel}
          {showPriority ? ` • ${PRIORITY_LABELS[item.priority]}` : ""}
        </Text>

        {item.description ? (
          <Text style={styles.description}>{item.description}</Text>
        ) : null}
        {item.reason ? <Text style={styles.reason}>{item.reason}</Text> : null}

        <View style={styles.actionsRow}>
          {item.status !== "pending" ? (
            <Pressable
              onPress={() => onChangeStatus(item.id, "pending")}
              disabled={disabled}
              style={styles.actionButton}
            >
              <Text style={styles.actionText}>Przywróć</Text>
            </Pressable>
          ) : null}
          {item.status !== "skipped" ? (
            <Pressable
              onPress={() => onChangeStatus(item.id, "skipped")}
              disabled={disabled}
              style={styles.actionButton}
            >
              <Text style={styles.actionText}>Pomiń</Text>
            </Pressable>
          ) : null}
          {item.source === "manual" ? (
            <Pressable
              onPress={() => onEdit(item)}
              disabled={disabled}
              style={styles.actionButton}
            >
              <Text style={styles.actionText}>Edytuj</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => onDelete(item.id)}
            disabled={disabled}
            style={[styles.actionButton, styles.actionButtonDanger]}
          >
            <Text style={[styles.actionText, styles.actionDanger]}>Usuń</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#E8ECE7",
    paddingTop: 12,
    paddingBottom: 10,
  },
  statusButton: {
    marginTop: 1,
  },
  main: {
    flex: 1,
    gap: 6,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1D2420",
  },
  titleDone: {
    textDecorationLine: "line-through",
    color: "#7D8882",
  },
  sourceMetaText: {
    fontSize: 12,
    color: "#6E7972",
    fontWeight: "500",
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: "#4B5550",
  },
  reason: {
    fontSize: 12,
    lineHeight: 17,
    color: "#97A29B",
  },
  actionsRow: {
    flexDirection: "column",
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: "#DCE6DD",
    backgroundColor: "#F7FAF7",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: "100%",
    alignItems: "center",
  },
  actionButtonDanger: {
    borderColor: "#F2D3D8",
    backgroundColor: "#FCEFF1",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#356FA5",
  },
  actionDanger: {
    color: "#B6473D",
  },
});
