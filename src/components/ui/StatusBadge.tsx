import { radius, spacing, statusColors } from "@/src/theme/ui";
import { StyleSheet, View } from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";

export type BadgeTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "inactive";

type StatusBadgeProps = {
  label: string;
  tone?: BadgeTone;
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme, tone);

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const makeStyles = (theme: MD3Theme, tone: BadgeTone) => {
  const tones = statusColors(theme);
  const toneColors =
    tone === "inactive"
      ? {
          bg: theme.dark ? "#2F3338" : "#E6E8EB",
          text: theme.dark ? "#C5CAD1" : "#5F6670",
        }
      : tones[tone];

  return StyleSheet.create({
    badge: {
      alignSelf: "flex-start",
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: toneColors.bg,
    },
    text: {
      fontSize: 12,
      fontWeight: "600",
      color: toneColors.text,
    },
  });
};
