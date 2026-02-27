import { cardShadow, radius, spacing } from "@/src/theme/ui";
import { PropsWithChildren, ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { MD3Theme, Surface, Text, useTheme } from "react-native-paper";

type CardProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  style?: StyleProp<ViewStyle>;
}>;

export function Card({
  title,
  subtitle,
  rightSlot,
  style,
  children,
}: CardProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <Surface style={[styles.card, style]} elevation={0}>
      {(title || subtitle || rightSlot) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {rightSlot}
        </View>
      )}
      {children}
    </Surface>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: spacing.md,
      gap: spacing.sm,
      ...cardShadow,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    headerText: {
      flex: 1,
      gap: spacing.xs,
    },
    title: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
  });
