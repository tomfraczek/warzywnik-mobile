import { getResponseError } from "@/src/api/axios";
import { Reminder } from "@/src/api/queries/reminders/types";
import { useGetReminders } from "@/src/api/queries/reminders/useGetReminders";
import { useUpdateReminder } from "@/src/api/queries/reminders/useUpdateReminder";
import { OFFLINE_MUTATION_MESSAGE } from "@/src/features/network/offline";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { Screen } from "@/src/components/Screen";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, Card, MD3Theme, Snackbar, useTheme } from "react-native-paper";

type ReminderContent = {
  title: string;
  description: string;
};

const reminderTypeLabels: Record<string, ReminderContent> = {
  DISEASE_CHECK: {
    title: "Sprawdź chorobę w uprawie",
    description: "Skontroluj objawy i stan rośliny.",
  },
  DISEASE_TREATMENT: {
    title: "Zastosuj leczenie choroby",
    description: "Wykonaj zalecane działania ochronne.",
  },
};

const getPlantingIdFromPayload = (payload?: Record<string, unknown> | null) => {
  const raw = payload?.plantingId;
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  return null;
};

const getReminderContent = (reminder: Reminder): ReminderContent => {
  if (reminder.type && reminderTypeLabels[reminder.type]) {
    return reminderTypeLabels[reminder.type];
  }
  return {
    title: "Zadanie w ogrodzie",
    description: "Sprawdź szczegóły i wykonaj czynność.",
  };
};

export default function RemindersScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();
  const remindersQuery = useGetReminders({
    status: "pending",
    page: 1,
    limit: 50,
  });
  const updateReminder = useUpdateReminder();
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const reminders = useMemo(
    () => remindersQuery.data ?? [],
    [remindersQuery.data],
  );

  const isOffline = useIsOffline();

  const handleUpdate = async (id: string, status: "done" | "skipped") => {
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }
    if (updatingId) return;
    setUpdatingId(id);
    try {
      await updateReminder.mutateAsync({ id, payload: { status } });
      setSnackbarMessage(
        status === "done" ? "Oznaczono jako zrobione." : "Pominięto zadanie.",
      );
    } catch (error) {
      setSnackbarMessage(String(getResponseError(error)));
    } finally {
      setUpdatingId(null);
    }
  };

  const renderItem = ({ item }: { item: Reminder }) => {
    const content = getReminderContent(item);
    const plantingId = getPlantingIdFromPayload(item.payload ?? null);
    return (
      <Card style={styles.card} mode="outlined">
        <Pressable
          onPress={() => {
            if (plantingId) {
              router.push(`/plantings/${plantingId}`);
            }
          }}
        >
          <Card.Content>
            <Text style={styles.cardTitle}>{content.title}</Text>
            <Text style={styles.cardSubtitle}>{content.description}</Text>
          </Card.Content>
        </Pressable>
        <Card.Actions style={styles.cardActions}>
          <Button
            mode="outlined"
            onPress={() => handleUpdate(item.id, "done")}
            loading={updatingId === item.id && updateReminder.isPending}
            disabled={updateReminder.isPending || isOffline}
          >
            Zrobione
          </Button>
          <Button
            mode="text"
            onPress={() => handleUpdate(item.id, "skipped")}
            disabled={updateReminder.isPending || isOffline}
          >
            Pomiń
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  if (remindersQuery.isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (remindersQuery.error && reminders.length === 0) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {String(getResponseError(remindersQuery.error))}
          </Text>
          <Button mode="outlined" onPress={() => remindersQuery.refetch()}>
            Spróbuj ponownie
          </Button>
        </View>
      </Screen>
    );
  }

  if (!remindersQuery.isLoading && reminders.length === 0) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Brak zadań</Text>
          <Text style={styles.emptySubtitle}>Wszystko zrobione na dziś.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<Text style={styles.title}>Zadania</Text>}
      />
      <Snackbar
        visible={!!snackbarMessage}
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
    listContent: {
      padding: 16,
      paddingBottom: 32,
      gap: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.onBackground,
      marginBottom: 8,
    },
    card: {
      borderRadius: 12,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    cardActions: {
      justifyContent: "flex-end",
      gap: 8,
      paddingHorizontal: 12,
      paddingBottom: 12,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: "center",
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    emptySubtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
  });
