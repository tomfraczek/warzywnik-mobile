import { getResponseError } from "@/src/api/axios";
import { HarvestResultRecord } from "@/src/api/queries/plantings/types";
import { useCreateHarvestResultRecord } from "@/src/api/queries/plantings/useCreateHarvestResultRecord";
import { useUpdateHarvestResultRecord } from "@/src/api/queries/plantings/useUpdateHarvestResultRecord";
import { AppDatePickerModal } from "@/src/components/AppDatePickerModal";
import { OFFLINE_MUTATION_MESSAGE } from "@/src/features/network/offline";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Button,
  MD3Theme,
  Modal,
  Portal,
  TextInput,
  useTheme,
} from "react-native-paper";

type Props = {
  visible: boolean;
  onDismiss: () => void;
  plantingId: string;
  bedId?: string;
  mode?: "create" | "edit";
  record?: HarvestResultRecord | null;
  onSuccess?: () => void;
};

export function PlantingHarvestResultForm({
  visible,
  onDismiss,
  plantingId,
  bedId,
  mode = "create",
  record,
  onSuccess,
}: Props) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  const [yieldKgText, setYieldKgText] = useState("");
  const [qualityRating, setQualityRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [harvestedAt, setHarvestedAt] = useState<string | null>(null);
  const [harvestedAtOpen, setHarvestedAtOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const createHarvestRecord = useCreateHarvestResultRecord(plantingId, bedId);
  const updateHarvestRecord = useUpdateHarvestResultRecord(plantingId, bedId);
  const isOffline = useIsOffline();

  // Reset form state when modal opens
  useEffect(() => {
    if (visible) {
      setYieldKgText(
        mode === "edit" && record?.yieldKg != null
          ? String(record.yieldKg)
          : "",
      );
      setQualityRating(
        mode === "edit" && record?.qualityRating != null
          ? record.qualityRating
          : null,
      );
      setNotes(mode === "edit" ? (record?.notes ?? "") : "");
      setHarvestedAt(mode === "edit" ? (record?.harvestedAt ?? null) : null);
      setValidationError(null);
    }
  }, [visible, mode, record]);

  const harvestedDate = useMemo(() => {
    if (!harvestedAt) return new Date();
    const parsed = new Date(harvestedAt);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [harvestedAt]);

  const harvestedAtLabel = useMemo(() => {
    if (!harvestedAt) return "Wybierz datę";
    const d = new Date(harvestedAt);
    if (Number.isNaN(d.getTime())) return "Wybierz datę";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }, [harvestedAt]);

  const handleSubmit = async () => {
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }
    setValidationError(null);
    const normalized = yieldKgText.trim().replace(",", ".");
    const yieldKg = normalized === "" ? null : parseFloat(normalized);
    if (yieldKg !== null && (Number.isNaN(yieldKg) || yieldKg < 0)) {
      setValidationError("Plon musi być liczbą większą lub równą 0.");
      return;
    }

    if (
      yieldKg === null &&
      qualityRating === null &&
      notes.trim().length === 0
    ) {
      setValidationError("Uzupełnij przynajmniej jedno pole rekordu zbioru.");
      return;
    }

    try {
      if (mode === "edit" && record?.id) {
        await updateHarvestRecord.mutateAsync({
          recordId: record.id,
          payload: {
            harvestedAt,
            yieldKg,
            qualityRating,
            notes: notes.trim() || null,
          },
        });
      } else {
        await createHarvestRecord.mutateAsync({
          harvestedAt,
          yieldKg,
          qualityRating,
          notes: notes.trim() || null,
        });
      }
      onSuccess?.();
      onDismiss();
    } catch (err) {
      Alert.alert("Błąd", String(getResponseError(err)));
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.modalTitle}>
            {mode === "edit" ? "Edytuj rekord zbioru" : "Dodaj rekord zbioru"}
          </Text>

          <Text style={styles.label}>Data zbioru (opcjonalnie)</Text>
          <TextInput
            mode="outlined"
            value={harvestedAtLabel}
            editable={false}
            onPressIn={() => setHarvestedAtOpen(true)}
            right={
              <TextInput.Icon
                icon="calendar"
                onPress={() => setHarvestedAtOpen(true)}
              />
            }
            style={styles.input}
          />

          <Text style={styles.label}>Plon (kg)</Text>
          <TextInput
            mode="outlined"
            value={yieldKgText}
            onChangeText={setYieldKgText}
            keyboardType="decimal-pad"
            placeholder="np. 2.4"
            style={styles.input}
          />

          <Text style={styles.label}>Ocena jakości (1–5)</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((val) => (
              <Button
                key={val}
                mode={qualityRating === val ? "contained" : "outlined"}
                onPress={() =>
                  setQualityRating(qualityRating === val ? null : val)
                }
                style={styles.ratingButton}
                compact
              >
                {String(val)}
              </Button>
            ))}
          </View>

          <Text style={styles.label}>Notatka (opcjonalnie)</Text>
          <TextInput
            mode="outlined"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          {validationError ? (
            <Text style={styles.errorText}>{validationError}</Text>
          ) : null}

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              disabled={
                createHarvestRecord.isPending || updateHarvestRecord.isPending
              }
            >
              Anuluj
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={
                createHarvestRecord.isPending || updateHarvestRecord.isPending
              }
              disabled={
                isOffline ||
                createHarvestRecord.isPending ||
                updateHarvestRecord.isPending
              }
            >
              {mode === "edit" ? "Zapisz" : "Dodaj"}
            </Button>
          </View>
        </ScrollView>
      </Modal>

      <AppDatePickerModal
        visible={harvestedAtOpen}
        date={harvestedDate}
        onDismiss={() => setHarvestedAtOpen(false)}
        onConfirm={(selectedDate) => {
          setHarvestedAtOpen(false);
          setHarvestedAt(selectedDate.toISOString());
        }}
      />
    </Portal>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    modal: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      borderRadius: 16,
      padding: 16,
      maxHeight: "80%",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.onSurface,
      marginBottom: 12,
    },
    label: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
      marginTop: 8,
    },
    input: {
      backgroundColor: theme.colors.surface,
    },
    ratingRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 4,
    },
    ratingButton: {
      flex: 1,
    },
    errorText: {
      fontSize: 13,
      color: theme.colors.error,
      marginTop: 6,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
      marginTop: 16,
    },
  });
