import { CultivationEnvironment } from "@/src/api/queries/beds/types";
import { BedFormValues } from "@/src/app/(tabs)/beds/_utils/bedForm";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { radius, spacing } from "@/src/theme/ui";
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

const CULTIVATION_ENVIRONMENT_OPTIONS: {
  value: CultivationEnvironment;
  label: string;
}[] = [
  { value: "GROUND_OUTDOOR", label: "Grunt (na zewnątrz)" },
  { value: "RAISED_BED_OUTDOOR", label: "Podwyższona grządka" },
  { value: "POT_OUTDOOR", label: "Donica (na zewnątrz)" },
  { value: "POT_INDOOR", label: "Donica (w domu)" },
  { value: "GREENHOUSE", label: "Szklarnia" },
  { value: "TUNNEL", label: "Tunel" },
];

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
  const isOffline = useIsOffline();

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

        <Text style={styles.label}>Środowisko uprawy</Text>
        <View style={styles.optionList}>
          {CULTIVATION_ENVIRONMENT_OPTIONS.map((option) => {
            const selected = values.cultivationEnvironment === option.value;
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.optionButton,
                  selected ? styles.optionButtonActive : null,
                ]}
                onPress={() =>
                  onChange({ cultivationEnvironment: option.value })
                }
              >
                <Text
                  style={[
                    styles.optionLabel,
                    selected ? styles.optionLabelActive : null,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
        style={[
          styles.submitButton,
          (isSubmitting || isOffline) && styles.disabledButton,
        ]}
        disabled={Boolean(isSubmitting) || isOffline}
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
      padding: spacing.md,
      paddingBottom: spacing.xl,
      backgroundColor: theme.colors.background,
      gap: spacing.sm,
    },
    section: {
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: spacing.sm,
      color: theme.colors.onSurface,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: radius.md,
      backgroundColor: theme.colors.surface,
      color: theme.colors.onSurface,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      fontSize: 14,
      marginBottom: spacing.sm,
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
      marginRight: spacing.sm,
    },
    colLast: {
      marginRight: 0,
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.xs,
    },
    optionList: {
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    optionButton: {
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      backgroundColor: theme.colors.surface,
    },
    optionButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
    },
    optionLabel: {
      fontSize: 13,
      color: theme.colors.onSurface,
      fontWeight: "500",
    },
    optionLabelActive: {
      color: theme.colors.primary,
      fontWeight: "700",
    },
    metrics: {
      marginTop: spacing.sm,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
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
