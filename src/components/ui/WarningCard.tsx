import { getSeverityTone, radius, spacing, statusColors } from "@/src/theme/ui";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";
import { StatusBadge } from "./StatusBadge";

type WarningCardProps = {
  title: string;
  message: string;
  severity?: string;
  scopeLabel?: string;
  contextLabel?: string | null;
  ctaLabel?: string;
  onPress?: () => void;
};

export function WarningCard({
  title,
  message,
  severity,
  scopeLabel,
  contextLabel,
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
          <View style={styles.headerMain}>
            <Text style={styles.title}>{title}</Text>
            {scopeLabel ? <StatusBadge label={scopeLabel} tone="info" /> : null}
          </View>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={18}
            color={tones[tone].text}
          />
        </View>
        {contextLabel ? (
          <Text style={styles.context}>{contextLabel}</Text>
        ) : null}
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
    headerMain: {
      flex: 1,
      gap: spacing.xs,
    },
    title: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    context: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.onSurfaceVariant,
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
