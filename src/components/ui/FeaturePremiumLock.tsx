import { isAxiosError } from "axios";
import { StyleSheet, View } from "react-native";
import { Icon, MD3Theme, Text, useTheme } from "react-native-paper";
import { PremiumUnlockButton } from "./PremiumUnlockButton";

export function isPremiumFeatureLocked(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  const data = error.response?.data as Record<string, unknown> | undefined;
  if (data?.code !== "PREMIUM_REQUIRED") return false;
  const details = data?.details as Record<string, unknown> | undefined;
  return details?.reason === "FEATURE_LOCKED";
}

export function FeaturePremiumLock({ label }: { label: string }) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon source="lock-outline" size={20} color={theme.colors.primary} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <PremiumUnlockButton compact={false} style={styles.button} />
    </View>
  );
}

function makeStyles(theme: MD3Theme) {
  return StyleSheet.create({
    container: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceVariant,
      padding: 16,
      alignItems: "stretch",
      gap: 8,
    },
    button: {
      borderRadius: 10,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
    },
    label: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
    },
  });
}
