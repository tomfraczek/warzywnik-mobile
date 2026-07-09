import {
  PlanChecklistItem,
  PlanChecklistPriority,
  PlanChecklistStatus,
} from "@/src/api/queries/bedPlan/types";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon, MD3Theme, useTheme } from "react-native-paper";

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

function buildPalette(dark: boolean) {
  return {
    rowBorder: dark ? "rgba(255, 255, 255, 0.12)" : "#E8ECE7",
    heading: dark ? "#F2F5F1" : "#1D2420",
    headingDone: dark ? "#5A6560" : "#7D8882",
    secondary: dark ? "#9AA59E" : "#6E7972",
    description: dark ? "#8A9590" : "#4B5550",
    reason: dark ? "#7A8880" : "#97A29B",
    cta: dark ? "#4C7FB1" : "#356FA5",
    accent: dark ? "#7AB88A" : "#4A7C59",
    actionBg: dark ? "#1E2522" : "#F7FAF7",
    actionBorder: dark ? "#2A3830" : "#DCE6DD",
    dangerBg: dark ? "#2A1A1C" : "#FCEFF1",
    dangerBorder: dark ? "#4A2830" : "#F2D3D8",
    danger: dark ? "#D66C7A" : "#B6473D",
  };
}

export function PlanChecklistItemRow({
  item,
  onChangeStatus,
  onDelete,
  onEdit,
  disabled = false,
}: PlanChecklistItemRowProps) {
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);
  const styles = makeStyles(palette);

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
        <Icon source={statusIcon(item.status)} size={20} color={palette.accent} />
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

function makeStyles(palette: ReturnType<typeof buildPalette>) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: palette.rowBorder,
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
      color: palette.heading,
    },
    titleDone: {
      textDecorationLine: "line-through",
      color: palette.headingDone,
    },
    sourceMetaText: {
      fontSize: 12,
      color: palette.secondary,
      fontWeight: "500",
    },
    description: {
      fontSize: 13,
      lineHeight: 19,
      color: palette.description,
    },
    reason: {
      fontSize: 12,
      lineHeight: 17,
      color: palette.reason,
    },
    actionsRow: {
      flexDirection: "column",
      gap: 8,
      marginTop: 4,
    },
    actionButton: {
      borderWidth: 1,
      borderColor: palette.actionBorder,
      backgroundColor: palette.actionBg,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      width: "100%",
      alignItems: "center",
    },
    actionButtonDanger: {
      borderColor: palette.dangerBorder,
      backgroundColor: palette.dangerBg,
    },
    actionText: {
      fontSize: 14,
      fontWeight: "600",
      color: palette.cta,
    },
    actionDanger: {
      color: palette.danger,
    },
  });
}
