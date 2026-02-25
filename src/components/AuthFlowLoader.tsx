import { Screen } from "@/src/components/Screen";
import { StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  MD3Theme,
  Text,
  useTheme,
} from "react-native-paper";

type AuthFlowLoaderProps = {
  title?: string;
  subtitle?: string;
};

export const AuthFlowLoader = ({
  title = "Logowanie...",
  subtitle = "Trwa przygotowanie Twojej sesji.",
}: AuthFlowLoaderProps) => {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <Screen safeAreaEdges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {subtitle}
          </Text>
        </View>
      </View>
    </Screen>
  );
};

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    card: {
      width: "100%",
      borderRadius: 20,
      paddingVertical: 28,
      paddingHorizontal: 20,
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      gap: 12,
    },
    title: {
      color: theme.colors.onSurface,
      fontWeight: "700",
      textAlign: "center",
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
    },
  });
