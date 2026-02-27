import { radius, spacing } from "@/src/theme/ui";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";
import { StatusBadge } from "./StatusBadge";

type TaskItemProps = {
  title: string;
  bed?: string | null;
  crop?: string | null;
  status: string;
  iconName?: ComponentProps<typeof MaterialCommunityIcons>["name"];
  onPress?: () => void;
};

const mapTaskStatus = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes("done")) return "success" as const;
  if (normalized.includes("over") || normalized.includes("late"))
    return "danger" as const;
  if (normalized.includes("progress")) return "info" as const;
  return "warning" as const;
};

export function TaskItem({
  title,
  bed,
  crop,
  status,
  iconName = "clipboard-text-outline",
  onPress,
}: TaskItemProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons
          name={iconName}
          size={18}
          color={theme.colors.primary}
        />
      </View>
      <View style={styles.main}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>
          {bed || "Nieznana grządka"}
          {crop ? ` • ${crop}` : ""}
        </Text>
      </View>
      <StatusBadge label={status} tone={mapTaskStatus(status)} />
    </Pressable>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primaryContainer,
    },
    main: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    meta: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
  });
