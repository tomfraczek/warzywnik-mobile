import { spacing } from "@/src/theme/ui";
import { PropsWithChildren, ReactNode, RefObject } from "react";
import { StyleSheet, View } from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";

type PlannerSectionProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  containerRef?: RefObject<View | null>;
}>;

export function PlannerSection({
  title,
  subtitle,
  rightSlot,
  children,
  containerRef,
}: PlannerSectionProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <View style={styles.container} ref={containerRef} collapsable={false}>
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
      marginHorizontal: spacing.md,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm,
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
    },
  });
