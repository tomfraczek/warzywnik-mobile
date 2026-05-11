import { spacing } from "@/src/theme/ui";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";

type PlannerEmptyStateProps = {
  title: string;
  description: string;
  icon?: ComponentProps<typeof MaterialCommunityIcons>["name"];
};

export function PlannerEmptyState({
  title,
  description,
  icon = "sprout-outline",
}: PlannerEmptyStateProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={theme.colors.onSurfaceVariant}
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 20,
      padding: spacing.lg,
      gap: spacing.xs,
      backgroundColor: theme.colors.surface,
    },
    title: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    description: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 21,
    },
  });
