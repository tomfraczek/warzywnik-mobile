import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";
import {
  Button,
  Surface,
  Text,
  useTheme,
  type MD3Theme,
} from "react-native-paper";

export default function WelcomeScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <Surface style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Warzywnik
      </Text>

      <Text variant="bodyMedium" style={styles.subtitle}>
        Zacznij od zalogowania lub rejestracji
      </Text>

      <View style={styles.actions}>
        <Link href="/sign-in" asChild>
          <Button mode="contained" contentStyle={styles.buttonContent}>
            Zaloguj
          </Button>
        </Link>

        <Link href="/sign-up" asChild>
          <Button
            mode="outlined"
            contentStyle={styles.buttonContent}
            style={styles.outlinedButton}
          >
            Załóż konto
          </Button>
        </Link>
      </View>
    </Surface>
  );
}

function makeStyles(theme: MD3Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      padding: 24,
      backgroundColor: theme.colors.background,
    },
    title: {
      textAlign: "center",
      marginBottom: 12,
      color: theme.colors.onBackground,
      fontWeight: "700",
    },
    subtitle: {
      textAlign: "center",
      marginBottom: 32,
      color: theme.colors.onSurfaceVariant,
    },
    actions: {
      gap: 12,
    },
    buttonContent: {
      paddingVertical: 8,
    },
    outlinedButton: {
      borderColor: theme.colors.primary,
    },
  });
}
