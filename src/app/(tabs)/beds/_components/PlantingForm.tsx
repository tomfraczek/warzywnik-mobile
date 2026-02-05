import { useGetVegetable } from "@/src/api/queries/vegetables/useGetVegetable";
import {
  PlantingFormValues,
  plantingStatusOptions,
} from "@/src/app/(tabs)/beds/_utils/plantingForm";
import { memo, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { TextInput as PaperTextInput } from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";

type PlantingFormProps = {
  values: PlantingFormValues;
  onChange: (patch: Partial<PlantingFormValues>) => void;
  onSubmit: () => void;
  submitLabel: string;
  isSubmitting?: boolean;
  onPickVegetable: () => void;
  onClearVegetable?: () => void;
  showActualStartDate?: boolean;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const isoToDateOnly = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const parseIsoDate = (value?: string) => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

function PlantingFormComponent({
  values,
  onChange,
  onSubmit,
  submitLabel,
  isSubmitting,
  onPickVegetable,
  onClearVegetable,
  showActualStartDate,
}: PlantingFormProps) {
  const [plannedOpen, setPlannedOpen] = useState(false);
  const [actualOpen, setActualOpen] = useState(false);

  const plannedDate = useMemo(
    () => parseIsoDate(values.plannedStartDate),
    [values.plannedStartDate],
  );

  const actualDate = useMemo(
    () => parseIsoDate(values.actualStartDate),
    [values.actualStartDate],
  );

  const {
    data: vegetable,
    isLoading: isVegetableLoading,
    error: vegetableError,
  } = useGetVegetable(values.vegetableId ?? null);

  const vegetableLabel = values.vegetableId
    ? isVegetableLoading
      ? "Ładowanie..."
      : (vegetable?.name ?? (vegetableError ? "Brak danych" : "Brak danych"))
    : "Wybierz warzywo";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Podstawy</Text>

        <Pressable style={styles.pickerRow} onPress={onPickVegetable}>
          <View>
            <Text style={styles.label}>Warzywo *</Text>
            <Text style={styles.valueText}>{vegetableLabel}</Text>
          </View>
          <Text style={styles.linkText}>Wybierz</Text>
        </Pressable>

        {values.vegetableId && onClearVegetable ? (
          <Pressable onPress={onClearVegetable}>
            <Text style={styles.clearText}>Usuń wybór</Text>
          </Pressable>
        ) : null}

        <Text style={styles.label}>Planowana data startu *</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <PaperTextInput
              mode="outlined"
              value={isoToDateOnly(values.plannedStartDate)}
              placeholder="YYYY-MM-DD"
              editable={false}
              right={
                <PaperTextInput.Icon
                  icon="calendar"
                  onPress={() => setPlannedOpen(true)}
                />
              }
            />
          </View>
        </View>

        <DatePickerModal
          locale="pl"
          mode="single"
          visible={plannedOpen}
          date={plannedDate ?? new Date()}
          onDismiss={() => setPlannedOpen(false)}
          onConfirm={({ date }) => {
            setPlannedOpen(false);
            if (!date) return;
            onChange({ plannedStartDate: date.toISOString() });
          }}
        />

        {showActualStartDate ? (
          <>
            <Text style={styles.label}>Rzeczywista data startu</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <PaperTextInput
                  mode="outlined"
                  value={isoToDateOnly(values.actualStartDate)}
                  placeholder="YYYY-MM-DD"
                  editable={false}
                  right={
                    <PaperTextInput.Icon
                      icon="calendar"
                      onPress={() => setActualOpen(true)}
                    />
                  }
                />
              </View>
            </View>

            <DatePickerModal
              locale="pl"
              mode="single"
              visible={actualOpen}
              date={actualDate ?? new Date()}
              onDismiss={() => setActualOpen(false)}
              onConfirm={({ date }) => {
                setActualOpen(false);
                if (!date) return;
                onChange({ actualStartDate: date.toISOString() });
              }}
            />
          </>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.statusRow}>
          {plantingStatusOptions.map((status) => {
            const isActive = values.status === status;
            return (
              <Pressable
                key={status}
                style={[styles.statusChip, isActive && styles.statusChipActive]}
                onPress={() => onChange({ status })}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    isActive && styles.statusChipTextActive,
                  ]}
                >
                  {status}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notatki</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={values.notes}
          onChangeText={(text) => onChange({ notes: text })}
          placeholder="Opcjonalnie"
          multiline
        />
      </View>

      <Pressable
        style={[styles.submitButton, isSubmitting && styles.disabledButton]}
        disabled={Boolean(isSubmitting)}
        onPress={onSubmit}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>{submitLabel}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

export const PlantingForm = memo(PlantingFormComponent);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: "#fff",
  },
  section: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  textarea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  valueText: {
    fontSize: 14,
    color: "#111827",
  },
  linkText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  clearText: {
    color: "#ef4444",
    marginTop: 8,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  dateField: {
    flex: 1,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statusChip: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  statusChipActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  statusChipText: {
    fontSize: 12,
    color: "#111827",
  },
  statusChipTextActive: {
    color: "#fff",
  },
  submitButton: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: "#fff",
    fontWeight: "600",
  },
});
