import { getSeverityTone, radius, spacing, statusColors } from "@/src/theme/ui";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";

type WarningCardProps = {
  title: string;
  message: string;
  severity?: string;
  ctaLabel?: string;
  onPress?: () => void;
};

export function WarningCard({
  title,
  message,
  severity,
  ctaLabel = "Zobacz szczegóły",
  onPress,
}: WarningCardProps) {
  const theme = useTheme<MD3Theme>();
  const tone = getSeverityTone(severity);
  const tones = statusColors(theme);
  const styles = makeStyles(theme, tones[tone].text);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.accent} />
      <View style={styles.main}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={18}
            color={tones[tone].text}
          />
        </View>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.cta}>{ctaLabel}</Text>
      </View>
    </Pressable>
  );
}

const makeStyles = (theme: MD3Theme, accentColor: string) =>
  StyleSheet.create({
    card: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      flexDirection: "row",
      overflow: "hidden",
    },
    accent: {
      width: 4,
      backgroundColor: accentColor,
    },
    main: {
      flex: 1,
      padding: spacing.md,
      gap: spacing.xs,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    message: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    cta: {
      marginTop: spacing.xs,
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.primary,
    },
  });
