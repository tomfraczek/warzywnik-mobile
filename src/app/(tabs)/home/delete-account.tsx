import { clientPersister, queryClient } from "@/src/api/queryClient";
import { useDeleteMyAccount } from "@/src/api/mutations/users/useDeleteMyAccount";
import { Screen } from "@/src/components/Screen";
import { useSettings } from "@/src/context/SettingsProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useClerk } from "@clerk/clerk-expo";
import { isAxiosError } from "axios";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
  const router = useRouter();
  const { signOut } = useClerk();
  const { resetSettings } = useSettings();
  const deleteMyAccount = useDeleteMyAccount();
  const [confirmation, setConfirmation] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const isConfirmed = useMemo(
    () => confirmation.trim().toUpperCase() === CONFIRM_WORD,
    [confirmation],
  );

  const cleanupAfterAccountDeletion = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Failed to sign out after deleting account", error);
    }

    await resetSettings();
    queryClient.clear();

    await Promise.allSettled([
      clientPersister.removeClient(),
      AsyncStorage.clear(),
    ]);

    router.replace("/(auth)");
  };

  const handleDeleteAccount = async () => {
    if (!isConfirmed || deleteMyAccount.isPending) return;

    try {
      await deleteMyAccount.mutateAsync();
      await cleanupAfterAccountDeletion();
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        await cleanupAfterAccountDeletion();
        return;
      }

      setSnackbarMessage("Nie udało się usunąć konta. Spróbuj ponownie.");
    }
  };

  const confirmDelete = () => {
    if (!isConfirmed || deleteMyAccount.isPending) return;

    Alert.alert(
      "Czy na pewno chcesz usunąć konto?",
      "Ta operacja jest nieodwracalna. Wszystkie Twoje dane (grządki, uprawy, zadania, ustawienia) zostaną trwale usunięte.",
      [
        {
          text: "Anuluj",
          style: "cancel",
        },
        {
          text: "Usuń konto",
          style: "destructive",
          onPress: () => {
            void handleDeleteAccount();
          },
        },
      ],
      { cancelable: true },
    );
  };

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

        <View style={styles.deletedDataContainer}>
          <Text style={styles.deletedDataTitle}>Co zostanie usunięte:</Text>
          <Text style={styles.deletedDataItem}>• konto użytkownika</Text>
          <Text style={styles.deletedDataItem}>
            • wszystkie grządki i przestrzenie uprawowe
          </Text>
          <Text style={styles.deletedDataItem}>
            • wszystkie uprawy i powiązane dane (choroby, szkodniki, wyniki
            zbiorów, zdarzenia cyklu)
          </Text>
          <Text style={styles.deletedDataItem}>
            • wszystkie zadania i rekomendacje
          </Text>
          <Text style={styles.deletedDataItem}>• lokalizacja</Text>
          <Text style={styles.deletedDataItem}>
            • preferencje powiadomień, urządzenia push, powiadomienia
          </Text>
          <Text style={styles.deletedDataItem}>
            • przypomnienia, checklist items, harvest prompts
          </Text>
          <Text style={styles.deletedDataItem}>• dane pogodowe i alerty</Text>
        </View>

        <TextInput
          mode="outlined"
          label={`Wpisz "${CONFIRM_WORD}"`}
          value={confirmation}
          onChangeText={setConfirmation}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={confirmDelete}
          disabled={!isConfirmed || deleteMyAccount.isPending}
          loading={deleteMyAccount.isPending}
          buttonColor={theme.colors.error}
          textColor={theme.colors.onError}
          style={styles.deleteButton}
        >
          Usuń konto
        </Button>
      </KeyboardAvoidingView>

      <Snackbar
        visible={Boolean(snackbarMessage)}
        onDismiss={() => setSnackbarMessage(null)}
        duration={3000}
      >
        {snackbarMessage}
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
    deletedDataContainer: {
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 20,
      gap: 4,
    },
    deletedDataTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    deletedDataItem: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    input: {
      backgroundColor: theme.colors.surface,
      marginBottom: 20,
    },
    deleteButton: {
      borderRadius: 12,
    },
  });
