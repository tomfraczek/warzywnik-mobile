import { PrimaryScreenHeading } from "@/src/components/navigation/PrimaryScreenHeading";
import { spacing } from "@/src/theme/ui";
import { StyleSheet, View } from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";

type PlannerHeaderProps = {
  subtitle: string;
  dateLabel: string;
};

const capitalizeFirst = (value: string) => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export function PlannerHeader({ subtitle, dateLabel }: PlannerHeaderProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <PrimaryScreenHeading title="Kalendarz" subtitle={subtitle} />
      <View style={styles.datePill}>
        <Text style={styles.dateText}>{capitalizeFirst(dateLabel)}</Text>
      </View>
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    datePill: {
      alignSelf: "flex-start",
      borderRadius: 999,
      backgroundColor: theme.colors.surfaceVariant,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    dateText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    meta: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
  });
