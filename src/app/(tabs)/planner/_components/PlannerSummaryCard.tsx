import { spacing } from "@/src/theme/ui";
import { StyleSheet, View } from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";

type PlannerSummaryCardProps = {
  todayCount: number;
  overdueCount: number;
  harvestCount: number;
};

export function PlannerSummaryCard({
  todayCount,
  overdueCount,
  harvestCount,
}: PlannerSummaryCardProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Plan na dziś</Text>
      <View style={styles.row}>
        <SummaryMetric label="Zadania" value={todayCount} />
        <SummaryMetric label="Zaległe" value={overdueCount} />
        <SummaryMetric label="Zbiory" value={harvestCount} />
      </View>
    </View>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
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
      padding: 20,
      gap: spacing.sm,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    row: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    metric: {
      flex: 1,
      borderRadius: 16,
      paddingVertical: 10,
      paddingHorizontal: 8,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      gap: 2,
    },
    metricValue: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.onSurface,
      textAlign: "center",
    },
    metricLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
    },
  });
