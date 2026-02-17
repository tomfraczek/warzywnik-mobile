import { getResponseError } from "@/src/api/axios";
import { useGetDisease } from "@/src/api/queries/diseases/useGetDisease";
import { useGetPlanting } from "@/src/api/queries/plantings/useGetPlanting";
import { Reminder } from "@/src/api/queries/reminders/types";
import { useGetReminders } from "@/src/api/queries/reminders/useGetReminders";
import { useUpdateReminder } from "@/src/api/queries/reminders/useUpdateReminder";
import { Screen } from "@/src/components/Screen";
import { useRouter } from "expo-router";
import { memo, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, MD3Theme, Surface, useTheme } from "react-native-paper";

const formatReminderTitle = (reminder: Reminder) => {
  if (reminder.type?.trim()) return reminder.type;
  return "Zadanie";
};

const getPayloadString = (
  payload: Record<string, unknown> | null | undefined,
  key: string,
) => {
  const value = payload?.[key];
  return typeof value === "string" ? value : null;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const ReminderRow = memo(function ReminderRow({
  reminder,
  onDone,
  onSkip,
}: {
  reminder: Reminder;
  onDone: () => void;
  onSkip: () => void;
}) {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const plantingId = getPayloadString(reminder.payload, "plantingId") ?? null;
  const diseaseId = getPayloadString(reminder.payload, "diseaseId") ?? null;
  const { data: planting } = useGetPlanting(plantingId ?? null);
  const { data: disease } = useGetDisease(diseaseId ?? null);
  const handlePress = () => {
    if (planting?.bedId && plantingId) {
      router.push(`/(tabs)/beds/${planting.bedId}/plantings/${plantingId}`);
    }
  };

  const plantingLabel =
    planting?.vegetableName ?? planting?.name ?? (plantingId ? "Uprawa" : "");
  const diseaseLabel = disease?.name ?? (diseaseId ? "Choroba" : "");

  return (
    <Surface style={styles.card} elevation={0}>
      <Pressable
        onPress={handlePress}
        disabled={!planting?.bedId || !plantingId}
      >
        <Text style={styles.cardTitle}>{formatReminderTitle(reminder)}</Text>
        {diseaseLabel || plantingLabel ? (
          <Text style={styles.cardSubtitle}>
            {diseaseLabel}
            {diseaseLabel && plantingLabel ? " • " : ""}
            {plantingLabel}
          </Text>
        ) : null}
        {reminder.scheduledAt ? (
          <Text style={styles.cardMeta}>
            {formatDateTime(reminder.scheduledAt)}
          </Text>
        ) : null}
      </Pressable>
      <View style={styles.cardActions}>
        <Button mode="outlined" onPress={onSkip} style={styles.actionButton}>
          Pomiń
        </Button>
        <Button mode="contained" onPress={onDone} style={styles.actionButton}>
          Zrobione
        </Button>
      </View>
    </Surface>
  );
});

export default function RemindersScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const remindersQuery = useGetReminders({
    status: "pending",
    page: 1,
    limit: 50,
  });
  const updateReminder = useUpdateReminder();

  const handleUpdate = useCallback(
    async (reminder: Reminder, status: "done" | "skipped") => {
      try {
        await updateReminder.mutateAsync({
          id: reminder.id,
          payload: { status },
        });
      } catch (error) {
        Alert.alert("Błąd", String(getResponseError(error)));
      }
    },
    [updateReminder],
  );

  if (remindersQuery.isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (remindersQuery.error) {
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

  const reminders = remindersQuery.data ?? [];

  return (
    <Screen>
      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Brak oczekujących zadań</Text>
            <Text style={styles.emptySubtitle}>
              Wróć później, gdy pojawią się nowe przypomnienia.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ReminderRow
            reminder={item}
            onDone={() => handleUpdate(item, "done")}
            onSkip={() => handleUpdate(item, "skipped")}
          />
        )}
      />
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    listContent: {
      padding: 16,
      paddingBottom: 24,
      backgroundColor: theme.colors.background,
      gap: 12,
    },
    card: {
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      gap: 6,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    cardSubtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    cardMeta: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    cardActions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 10,
    },
    actionButton: {
      flex: 1,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    errorText: {
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: "center",
    },
    emptyState: {
      padding: 24,
      alignItems: "center",
      gap: 6,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    emptySubtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
    },
  });
