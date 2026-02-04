import { BedFormValues } from "@/src/app/(tabs)/beds/_utils/bedForm";
import { memo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

type BedFormProps = {
  values: BedFormValues;
  onChange: (patch: Partial<BedFormValues>) => void;
  onSubmit: () => void;
  submitLabel: string;
  isSubmitting?: boolean;
  onPickSoil: () => void;
  onClearSoil?: () => void;
};

function BedFormComponent({
  values,
  onChange,
  onSubmit,
  submitLabel,
  isSubmitting,
  onPickSoil,
  onClearSoil,
}: BedFormProps) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Podstawy</Text>
        <Text style={styles.label}>Nazwa *</Text>
        <TextInput
          style={styles.input}
          value={values.name}
          onChangeText={(text) => onChange({ name: text })}
          placeholder="Np. Grządka A"
        />

        <Text style={styles.label}>Opis</Text>
        <TextInput
          style={styles.input}
          value={values.description}
          onChangeText={(text) => onChange({ description: text })}
          placeholder="Opcjonalnie"
        />

        <Text style={styles.label}>Lokalizacja</Text>
        <TextInput
          style={styles.input}
          value={values.locationLabel}
          onChangeText={(text) => onChange({ locationLabel: text })}
          placeholder="Np. przy szklarni"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gleba</Text>
        <Pressable style={styles.pickerRow} onPress={onPickSoil}>
          <View>
            <Text style={styles.label}>Wybrana gleba</Text>
            <Text style={styles.valueText}>
              {values.soilName || "Wybierz glebę (zalecane)"}
            </Text>
          </View>
          <Text style={styles.linkText}>Wybierz</Text>
        </Pressable>
        {values.soilId && onClearSoil ? (
          <Pressable onPress={onClearSoil}>
            <Text style={styles.clearText}>Usuń wybór</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wymiary (cm)</Text>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Długość</Text>
            <TextInput
              style={styles.input}
              value={values.lengthCm}
              onChangeText={(text) => onChange({ lengthCm: text })}
              keyboardType="numeric"
              placeholder="np. 120"
            />
          </View>
          <View style={[styles.col, styles.colLast]}>
            <Text style={styles.label}>Szerokość</Text>
            <TextInput
              style={styles.input}
              value={values.widthCm}
              onChangeText={(text) => onChange({ widthCm: text })}
              keyboardType="numeric"
              placeholder="np. 80"
            />
          </View>
        </View>
        <Text style={styles.label}>Głębokość</Text>
        <TextInput
          style={styles.input}
          value={values.depthCm}
          onChangeText={(text) => onChange({ depthCm: text })}
          keyboardType="numeric"
          placeholder="np. 30"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Aktywna grządka</Text>
          <Switch
            value={values.isActive}
            onValueChange={(value) => onChange({ isActive: value })}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badanie gleby</Text>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Włącz badanie gleby</Text>
          <Switch
            value={values.soilTestingEnabled}
            onValueChange={(value) => onChange({ soilTestingEnabled: value })}
          />
        </View>
        {values.soilTestingEnabled ? (
          <View style={styles.metrics}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>N</Text>
                <TextInput
                  style={styles.input}
                  value={values.measuredN}
                  onChangeText={(text) => onChange({ measuredN: text })}
                  keyboardType="numeric"
                  placeholder="0-100"
                />
              </View>
              <View style={[styles.col, styles.colLast]}>
                <Text style={styles.label}>P</Text>
                <TextInput
                  style={styles.input}
                  value={values.measuredP}
                  onChangeText={(text) => onChange({ measuredP: text })}
                  keyboardType="numeric"
                  placeholder="0-100"
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>K</Text>
                <TextInput
                  style={styles.input}
                  value={values.measuredK}
                  onChangeText={(text) => onChange({ measuredK: text })}
                  keyboardType="numeric"
                  placeholder="0-100"
                />
              </View>
              <View style={[styles.col, styles.colLast]}>
                <Text style={styles.label}>pH</Text>
                <TextInput
                  style={styles.input}
                  value={values.measuredPh}
                  onChangeText={(text) => onChange({ measuredPh: text })}
                  keyboardType="numeric"
                  placeholder="0-14"
                />
              </View>
            </View>
          </View>
        ) : null}
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

export const BedForm = memo(BedFormComponent);

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
  row: {
    flexDirection: "row",
  },
  col: {
    flex: 1,
    marginRight: 12,
  },
  colLast: {
    marginRight: 0,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  metrics: {
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
