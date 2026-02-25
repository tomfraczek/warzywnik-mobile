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
import { MD3Theme, useTheme } from "react-native-paper";

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
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

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
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />

        <Text style={styles.label}>Opis</Text>
        <TextInput
          style={styles.input}
          value={values.description}
          onChangeText={(text) => onChange({ description: text })}
          placeholder="Opcjonalnie"
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />

        <Text style={styles.label}>Lokalizacja</Text>
        <TextInput
          style={styles.input}
          value={values.locationLabel}
          onChangeText={(text) => onChange({ locationLabel: text })}
          placeholder="Np. przy szklarni"
          placeholderTextColor={theme.colors.onSurfaceVariant}
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
            trackColor={{
              false: theme.colors.surfaceVariant,
              true: theme.colors.primaryContainer,
            }}
            thumbColor={
              values.isActive ? theme.colors.primary : theme.colors.outline
            }
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
            trackColor={{
              false: theme.colors.surfaceVariant,
              true: theme.colors.primaryContainer,
            }}
            thumbColor={
              values.soilTestingEnabled
                ? theme.colors.primary
                : theme.colors.outline
            }
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
                  placeholderTextColor={theme.colors.onSurfaceVariant}
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
                  placeholderTextColor={theme.colors.onSurfaceVariant}
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
                  placeholderTextColor={theme.colors.onSurfaceVariant}
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
                  placeholderTextColor={theme.colors.onSurfaceVariant}
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
          <ActivityIndicator color={theme.colors.onPrimary} />
        ) : (
          <Text style={styles.submitText}>{submitLabel}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

export const BedForm = memo(BedFormComponent);

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: 16,
      paddingBottom: 32,
      backgroundColor: theme.colors.background,
    },
    section: {
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 12,
      color: theme.colors.onSurface,
    },
    label: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      color: theme.colors.onSurface,
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
      color: theme.colors.onSurface,
    },
    linkText: {
      color: theme.colors.primary,
      fontWeight: "600",
    },
    clearText: {
      color: theme.colors.error,
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
      backgroundColor: theme.colors.primary,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: "center",
    },
    disabledButton: {
      opacity: 0.6,
    },
    submitText: {
      color: theme.colors.onPrimary,
      fontWeight: "600",
      fontSize: 16,
    },
  });
