import { Screen } from "@/src/components/Screen";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text } from "react-native";
import {
  Button,
  MD3Theme,
  Snackbar,
  TextInput,
  useTheme,
} from "react-native-paper";

const CONFIRM_WORD = "USUŃ";

export default function DeleteAccountScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const [confirmation, setConfirmation] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const isConfirmed = useMemo(
    () => confirmation.trim().toUpperCase() === CONFIRM_WORD,
    [confirmation],
  );

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Text style={styles.title}>Usuń konto</Text>
        <Text style={styles.subtitle}>
          Ta operacja jest nieodwracalna. Aby kontynuować, wpisz słowo
          potwierdzające.
        </Text>

        <TextInput
          mode="outlined"
          label={`Wpisz "${CONFIRM_WORD}"`}
          value={confirmation}
          onChangeText={setConfirmation}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={() => setSnackbarVisible(true)}
          disabled={!isConfirmed}
          buttonColor={theme.colors.error}
          textColor={theme.colors.onError}
          style={styles.deleteButton}
        >
          Usuń konto
        </Button>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        Funkcja wkrótce
      </Snackbar>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.onBackground,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 20,
    },
    input: {
      backgroundColor: theme.colors.surface,
      marginBottom: 20,
    },
    deleteButton: {
      borderRadius: 12,
    },
  });
