import { CalendarHarvestWindowItem } from "@/src/api/queries/calendar/types";
import { spacing } from "@/src/theme/ui";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { Button, MD3Theme, Text, useTheme } from "react-native-paper";
import {
  getHarvestMomentLabel,
  getHarvestRangeLabel,
} from "../_utils/plannerPresentation";
import { PlannerSourceChip } from "./PlannerSourceChip";

type PlannerHarvestCardProps = {
  event: CalendarHarvestWindowItem;
  onPress?: (event: CalendarHarvestWindowItem) => void;
};

export function PlannerHarvestCard({
  event,
  onPress,
}: PlannerHarvestCardProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  const vegetableName = event.vegetable?.name ?? event.title;
  const bedName = event.bedName ?? null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name="basket-outline"
            size={18}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.main}>
          <Text style={styles.title}>{vegetableName}</Text>
          <Text style={styles.status}>{getHarvestMomentLabel(event)}</Text>
        </View>
        <PlannerSourceChip label="Zbiory" tone="success" />
      </View>

      <Text style={styles.range}>{getHarvestRangeLabel(event)}</Text>
      {bedName ? <Text style={styles.meta}>Grządka: {bedName}</Text> : null}

      {onPress && event.plantingId ? (
        <View style={styles.actions}>
          <Button
            mode="contained"
            compact
            style={styles.primaryActionButton}
            onPress={() => onPress(event)}
          >
            Zobacz uprawę
          </Button>
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    card: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      padding: 18,
      gap: spacing.xs,
    },
    headerRow: {
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
    main: {
      flex: 1,
      gap: 2,
      paddingTop: 2,
    },
    title: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    status: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    range: {
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    meta: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    actions: {
      marginTop: spacing.xs,
      flexDirection: "column",
      alignItems: "stretch",
    },
    primaryActionButton: {
      width: "100%",
    },
  });
