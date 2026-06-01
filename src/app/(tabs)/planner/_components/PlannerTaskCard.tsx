import { TaskItem } from "@/src/api/queries/users/meTypes";
import { getTaskRelationType } from "@/src/features/tasks/taskOwnership";
import {
  getTaskOwnershipLabel,
  getTaskOwnershipReason,
} from "@/src/features/tasks/taskPresentation";
import { spacing } from "@/src/theme/ui";
import { pluralize } from "@/src/utils/pluralize";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { Button, MD3Theme, Text, useTheme } from "react-native-paper";
import {
  getTaskContext,
  getTaskIconName,
  getTaskSourceChip,
} from "../_utils/plannerPresentation";
import { PlannerSourceChip } from "./PlannerSourceChip";

type PlannerTaskCardProps = {
  task: TaskItem;
  onDone?: (task: TaskItem) => void;
  onNavigate?: (task: TaskItem) => void;
  onDelete?: (task: TaskItem) => void;
  disableActions?: boolean;
  disableDoneAction?: boolean;
  showDelete?: boolean;
  isOverdue?: boolean;
};

const getAffectedLabel = (task: TaskItem) => {
  const meta = (task.metadata ?? task.meta) as
    | {
        affectedVegetables?: string[];
        affectedBedsCount?: number;
      }
    | null
    | undefined;

  if (meta?.affectedVegetables?.length) {
    return `Dotyczy: ${meta.affectedVegetables.slice(0, 3).join(", ")}`;
  }

  if (typeof meta?.affectedBedsCount === "number") {
    const grządkaForm = pluralize(
      "grządki",
      "grządek",
      "grządek",
      meta.affectedBedsCount,
    );
    return `Dotyczy ${meta.affectedBedsCount} ${grządkaForm}`;
  }

  return null;
};

export function PlannerTaskCard({
  task,
  onDone,
  onNavigate,
  onDelete,
  disableActions,
  disableDoneAction = false,
  showDelete = false,
  isOverdue = false,
}: PlannerTaskCardProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme, isOverdue);
  const iconName = getTaskIconName(task);
  const sourceChip = getTaskSourceChip(task);
  const context = getTaskContext(task);
  const affectedLabel = getAffectedLabel(task);
  const ownershipLabel = getTaskOwnershipLabel(task);
  const relation = getTaskRelationType(task);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name={iconName}
            size={18}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{task.title}</Text>
        </View>
        <PlannerSourceChip label={sourceChip.label} tone={sourceChip.tone} />
      </View>

      {typeof task.description === "string" && task.description.trim() ? (
        <Text style={styles.description} numberOfLines={3}>
          {task.description}
        </Text>
      ) : null}

      <View style={styles.contextWrap}>
        <Text style={styles.contextSubtitle}>{ownershipLabel}</Text>
        <Text style={styles.contextTitle}>{context.title}</Text>
        {context.subtitle ? (
          <Text style={styles.contextSubtitle}>{context.subtitle}</Text>
        ) : null}
        {relation === "related_from_bed" ||
        relation === "related_from_space" ? (
          <Text style={styles.contextSubtitle}>
            {getTaskOwnershipReason(task)}
          </Text>
        ) : null}
        {affectedLabel ? (
          <Text style={styles.contextSubtitle}>{affectedLabel}</Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        {onDone ? (
          <Button
            mode="contained"
            compact
            onPress={() => onDone(task)}
            disabled={disableActions || disableDoneAction}
          >
            Oznacz jako wykonane
          </Button>
        ) : null}

        {context.canNavigate && onNavigate ? (
          <Button
            mode="outlined"
            icon="sprout-outline"
            compact
            onPress={() => onNavigate(task)}
            disabled={disableActions}
          >
            Przejdź do uprawy
          </Button>
        ) : null}

        {showDelete && onDelete ? (
          <Button
            mode="elevated"
            compact
            onPress={() => onDelete(task)}
            disabled={disableActions}
            textColor={theme.colors.error}
          >
            Usuń
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const makeStyles = (theme: MD3Theme, isOverdue: boolean) =>
  StyleSheet.create({
    card: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: isOverdue ? "#F1D8C0" : theme.colors.outlineVariant,
      backgroundColor: isOverdue ? "#FFF8F1" : theme.colors.surface,
      padding: 18,
      gap: spacing.sm,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    titleWrap: {
      flex: 1,
      paddingTop: 2,
    },
    title: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.colors.onSurface,
      lineHeight: 24,
    },
    description: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.onSurface,
    },
    contextWrap: {
      gap: 2,
    },
    contextTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    contextSubtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    actions: {
      flexDirection: "column",
      alignItems: "stretch",
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
  });
