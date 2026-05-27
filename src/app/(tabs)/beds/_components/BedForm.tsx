import { CultivationEnvironment } from "@/src/api/queries/beds/types";
import { BedFormValues } from "@/src/app/(tabs)/beds/_utils/bedForm";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { memo } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { Icon, MD3Theme, Text, useTheme } from "react-native-paper";

// ─── palette ─────────────────────────────────────────────────────────────────

function buildPalette(dark: boolean) {
  return {
    background: dark ? "#141816" : "#F7F8F5",
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "#252D29" : "#E8ECE7",
    inputBg: dark ? "#161C19" : "#F3F6F2",
    inputBorder: dark ? "#252D29" : "#E4E9E3",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
    meta: dark ? "#7A8880" : "#97A29B",
    accent: dark ? "#7AB88A" : "#4A7C59",
    accentBg: dark ? "#1A2E1F" : "#EBF5EE",
    accentBorder: dark ? "#2A4A32" : "#C5DFC9",
    switchTrackOff: dark ? "#2B332F" : "#D8DDD7",
    switchTrackOn: dark ? "#2A4A32" : "#C5DFC9",
    switchThumbOn: dark ? "#7AB88A" : "#4A7C59",
    placeholder: dark ? "#5A6660" : "#A8B4AE",
    soilBg: dark ? "#1E2822" : "#F0F5F0",
    soilBorder: dark ? "#2B3830" : "#D6E4D8",
    errorText: dark ? "#E8857A" : "#C0392B",
  };
}

// ─── cultivation environment options ─────────────────────────────────────────

const CULTIVATION_ENVIRONMENT_OPTIONS: {
  value: CultivationEnvironment;
  label: string;
  icon: string;
}[] = [
  { value: "GROUND_OUTDOOR", label: "W gruncie", icon: "sprout-outline" },
  {
    value: "RAISED_BED_OUTDOOR",
    label: "Podwyższona grządka",
    icon: "rectangle-outline",
  },
  {
    value: "POT_OUTDOOR",
    label: "Donica na zewnątrz",
    icon: "flower-outline",
  },
  { value: "POT_INDOOR", label: "Donica w domu", icon: "home-outline" },
  { value: "GREENHOUSE", label: "Szklarnia", icon: "greenhouse" },
  { value: "TUNNEL", label: "Tunel", icon: "tunnel-outline" },
];

// ─── types ────────────────────────────────────────────────────────────────────

type BedFormProps = {
  values: BedFormValues;
  onChange: (patch: Partial<BedFormValues>) => void;
  onSubmit: () => void;
  submitLabel: string;
  isSubmitting?: boolean;
  onPickSoil: () => void;
  onClearSoil?: () => void;
};

// ─── section card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  children,
  palette,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <View
      style={[
        s.sectionCard,
        { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
      ]}
    >
      <Text style={[s.sectionTitle, { color: palette.heading }]}>{title}</Text>
      {description ? (
        <Text style={[s.sectionDesc, { color: palette.meta }]}>
          {description}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

// ─── field label ─────────────────────────────────────────────────────────────

function FieldLabel({
  label,
  palette,
  optional,
}: {
  label: string;
  palette: ReturnType<typeof buildPalette>;
  optional?: boolean;
}) {
  return (
    <View style={s.labelRow}>
      <Text style={[s.fieldLabel, { color: palette.secondary }]}>{label}</Text>
      {optional ? (
        <Text style={[s.optionalTag, { color: palette.meta }]}>opcjonalne</Text>
      ) : null}
    </View>
  );
}

// ─── component ───────────────────────────────────────────────────────────────

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
  const palette = buildPalette(theme.dark);
  const isOffline = useIsOffline();

  const inputStyle = [
    s.input,
    {
      backgroundColor: palette.inputBg,
      borderColor: palette.inputBorder,
      color: palette.heading,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          s.container,
          { backgroundColor: palette.background },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── A. Podstawowe informacje ── */}
        <SectionCard
          title="Podstawowe informacje"
          description="Uzupełnij nazwę i opis swojej grządki."
          palette={palette}
        >
          <FieldLabel label="Nazwa" palette={palette} />
          <TextInput
            style={inputStyle}
            value={values.name}
            onChangeText={(text) => onChange({ name: text })}
            placeholder="np. Grządka A"
            placeholderTextColor={palette.placeholder}
            returnKeyType="next"
          />

          <FieldLabel label="Opis" palette={palette} optional />
          <TextInput
            style={[inputStyle, s.textarea]}
            value={values.description}
            onChangeText={(text) => onChange({ description: text })}
            placeholder="Krótki opis — co tu rośnie, jakie warunki…"
            placeholderTextColor={palette.placeholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <FieldLabel label="Lokalizacja" palette={palette} optional />
          <TextInput
            style={inputStyle}
            value={values.locationLabel}
            onChangeText={(text) => onChange({ locationLabel: text })}
            placeholder="np. przy szklarni, ogród zachodni…"
            placeholderTextColor={palette.placeholder}
            returnKeyType="done"
          />
        </SectionCard>

        {/* ── B. Parametry fizyczne ── */}
        <SectionCard
          title="Parametry fizyczne"
          description="Opcjonalna głębokość grządki w centymetrach."
          palette={palette}
        >
          <FieldLabel label="Głębokość (cm)" palette={palette} optional />
          <TextInput
            style={inputStyle}
            value={values.depthCm}
            onChangeText={(text) => onChange({ depthCm: text })}
            keyboardType="numeric"
            placeholder="np. 30"
            placeholderTextColor={palette.placeholder}
          />

          <View style={{ marginTop: 4 }}>
            <FieldLabel label="Rodzaj uprawy" palette={palette} />
            <View style={s.envGrid}>
              {CULTIVATION_ENVIRONMENT_OPTIONS.map((option) => {
                const selected = values.cultivationEnvironment === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[
                      s.envChip,
                      {
                        backgroundColor: selected
                          ? palette.accentBg
                          : palette.inputBg,
                        borderColor: selected
                          ? palette.accentBorder
                          : palette.inputBorder,
                      },
                    ]}
                    onPress={() =>
                      onChange({ cultivationEnvironment: option.value })
                    }
                  >
                    <Icon
                      source={option.icon}
                      size={15}
                      color={selected ? palette.accent : palette.meta}
                    />
                    <Text
                      style={[
                        s.envChipText,
                        {
                          color: selected ? palette.accent : palette.secondary,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </SectionCard>

        {/* ── C. Gleba ── */}
        <SectionCard
          title="Gleba"
          description="Wybierz typ gleby dla grządki."
          palette={palette}
        >
          <FieldLabel label="Gleba" palette={palette} optional />
          <Pressable
            style={[
              s.soilPicker,
              {
                backgroundColor: palette.soilBg,
                borderColor: values.soilId
                  ? palette.accentBorder
                  : palette.soilBorder,
              },
            ]}
            onPress={onPickSoil}
          >
            <View style={s.soilPickerLeft}>
              <Icon
                source="layers-outline"
                size={20}
                color={values.soilId ? palette.accent : palette.meta}
              />
              <Text
                style={[
                  s.soilPickerText,
                  {
                    color: values.soilId
                      ? palette.heading
                      : palette.placeholder,
                  },
                ]}
              >
                {values.soilName ?? "Wybierz glebę…"}
              </Text>
            </View>
            <Text style={[s.soilPickerAction, { color: palette.accent }]}>
              {values.soilId ? "Zmień" : "Wybierz"}
            </Text>
          </Pressable>
          {values.soilId && onClearSoil ? (
            <Pressable style={s.clearSoilBtn} onPress={onClearSoil}>
              <Text style={[s.clearSoilText, { color: palette.errorText }]}>
                Usuń wybraną glebę
              </Text>
            </Pressable>
          ) : null}
        </SectionCard>

        {/* ── D. Analiza gleby ── */}
        <SectionCard
          title="Analiza gleby"
          description="Uzupełnij tylko wtedy, gdy masz wykonany test gleby."
          palette={palette}
        >
          <View style={s.switchRow}>
            <View style={s.switchRowLeft}>
              <Text style={[s.switchLabel, { color: palette.heading }]}>
                Mam wyniki analizy gleby
              </Text>
              <Text style={[s.switchDesc, { color: palette.meta }]}>
                Odblokuje pola do wprowadzenia pomiarów
              </Text>
            </View>
            <Switch
              value={values.soilTestingEnabled}
              onValueChange={(v) => onChange({ soilTestingEnabled: v })}
              trackColor={{
                false: palette.switchTrackOff,
                true: palette.switchTrackOn,
              }}
              thumbColor={
                values.soilTestingEnabled ? palette.switchThumbOn : palette.meta
              }
            />
          </View>

          {values.soilTestingEnabled ? (
            <View style={s.metricsBlock}>
              <View
                style={[
                  s.metricsDivider,
                  { backgroundColor: palette.cardBorder },
                ]}
              />
              <Text style={[s.metricsHint, { color: palette.meta }]}>
                Wartości N, P, K w zakresie 0–100. pH w zakresie 0–14.
              </Text>
              <View style={s.metricsRow}>
                {(
                  [
                    { key: "measuredN", label: "Azot (N)", ph: false },
                    { key: "measuredP", label: "Fosfor (P)", ph: false },
                    { key: "measuredK", label: "Potas (K)", ph: false },
                    { key: "measuredPh", label: "Odczyn (pH)", ph: true },
                  ] as const
                ).map(({ key, label }) => (
                  <View key={key} style={s.metricCol}>
                    <Text style={[s.metricLabel, { color: palette.secondary }]}>
                      {label}
                    </Text>
                    <TextInput
                      style={[
                        s.metricInput,
                        {
                          backgroundColor: palette.inputBg,
                          borderColor: palette.inputBorder,
                          color: palette.heading,
                        },
                      ]}
                      value={values[key]}
                      onChangeText={(text) => onChange({ [key]: text })}
                      keyboardType="numeric"
                      placeholder={key === "measuredPh" ? "0–14" : "0–100"}
                      placeholderTextColor={palette.placeholder}
                    />
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </SectionCard>

        {/* ── Submit ── */}
        <Pressable
          style={[
            s.submitBtn,
            { backgroundColor: palette.accent },
            (isSubmitting || isOffline) && s.submitBtnDisabled,
          ]}
          disabled={Boolean(isSubmitting) || isOffline}
          onPress={onSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={s.submitText}>{submitLabel}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export const BedForm = memo(BedFormComponent);

// ─── styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 14,
  },
  // section card
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  // labels
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
    marginTop: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  optionalTag: {
    fontSize: 11,
    fontWeight: "400",
  },
  // inputs
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textarea: {
    height: 88,
    paddingTop: 14,
    paddingBottom: 14,
  },
  // cultivation env grid
  envGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  envChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  envChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  // soil picker
  soilPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  soilPickerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  soilPickerText: {
    fontSize: 15,
    flex: 1,
  },
  soilPickerAction: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
  },
  clearSoilBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
  },
  clearSoilText: {
    fontSize: 13,
    fontWeight: "500",
  },
  // switch rows
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  switchRowLeft: {
    flex: 1,
    gap: 2,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  switchDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  // metrics
  metricsBlock: {
    marginTop: 16,
    gap: 12,
  },
  metricsDivider: {
    height: 1,
  },
  metricsHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
  },
  metricCol: {
    flex: 1,
    gap: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  metricInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    textAlign: "center",
  },
  // submit
  submitBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.55,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
