import { spacing } from "@/src/theme/ui";
import { PropsWithChildren, ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";

type PlannerSectionProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
}>;

export function PlannerSection({
  title,
  subtitle,
  rightSlot,
  children,
}: PlannerSectionProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightSlot}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    headerTextWrap: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.onBackground,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    content: {
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
    },
  });
