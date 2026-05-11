import { spacing } from "@/src/theme/ui";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";

export function PlannerOfflineBanner() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="wifi-off"
        size={16}
        color={theme.colors.onSurfaceVariant}
      />
      <Text style={styles.text}>
        Jesteś offline — pokazujemy ostatnio zapisany plan
      </Text>
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      marginHorizontal: spacing.md,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceVariant,
      paddingHorizontal: 12,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    text: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      flexShrink: 1,
    },
  });
