import { useGetVegetable } from "@/src/api/queries/vegetables/useGetVegetable";
import { PlantingFormValues } from "@/src/app/(tabs)/beds/_utils/plantingForm";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
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
import { Icon, MD3Theme, useTheme } from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";

type PlantingFormProps = {
  values: PlantingFormValues;
  onChange: (patch: Partial<PlantingFormValues>) => void;
  onSubmit: () => void;
  submitLabel: string;
  isSubmitting?: boolean;
  showSowedAt?: boolean;
  sowedAtHint?: string;
  onPickVegetable: () => void;
  onClearVegetable?: () => void;
  showHeaderIntro?: boolean;
  screenTitle?: string;
  screenSubtitle?: string;
  heroPillLabel?: string;
  heroTitle?: string;
  heroDescription?: string;
  validationMessage?: string | null;
  offlineMessage?: string | null;
  blockingMessage?: string | null;
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

function buildPalette(dark: boolean) {
  return {
    background: dark ? "#141816" : "#F7F8F5",
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "#252D29" : "#E8ECE7",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
    tertiary: dark ? "#7A8880" : "#97A29B",
    accent: dark ? "#7AB88A" : "#4A7C59",
    accentBg: dark ? "#1A2E1F" : "#EBF5EE",
    accentBorder: dark ? "#2A4A32" : "#C5DFC9",
    selectorBg: dark ? "#17201B" : "#F3F7F2",
    selectorBorder: dark ? "#27322C" : "#E2EAE1",
    inputBg: dark ? "#161C19" : "#F3F6F2",
    inputBorder: dark ? "#252D29" : "#E4E9E3",
    placeholder: dark ? "#5A6660" : "#A8B4AE",
    heroPillBg: dark ? "#202A23" : "#EDF4EE",
    heroPillText: dark ? "#9ECFA9" : "#4F7459",
    offlineBg: dark ? "#212A24" : "#EFF5F0",
    offlineBorder: dark ? "#2F3C34" : "#D8E6D9",
    offlineText: dark ? "#AFC7B6" : "#4F6A58",
    errorBg: dark ? "#2B1F20" : "#FCEFF1",
    errorBorder: dark ? "#4A3336" : "#F2D3D8",
    errorText: dark ? "#E5A7B2" : "#B44A5E",
  };
}

function PlantingFormComponent({
  values,
  onChange,
  onSubmit,
  submitLabel,
  isSubmitting,
  showSowedAt = true,
  sowedAtHint,
  onPickVegetable,
  onClearVegetable,
  showHeaderIntro = false,
  screenTitle = "Zaplanuj uprawę",
  screenSubtitle = "Dodaj warzywo do planu grządki.",
  heroPillLabel = "Planowanie",
  heroTitle = "Zaplanuj uprawę w grządce",
  heroDescription = "Zadania pielęgnacyjne pojawią się po rozpoczęciu uprawy.",
  validationMessage,
  offlineMessage,
  blockingMessage,
}: PlantingFormProps) {
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);
  const [sowedOpen, setSowedOpen] = useState(false);
  const isOffline = useIsOffline();

  const sowedDate = useMemo(
    () => parseIsoDate(values.sowedAt),
    [values.sowedAt],
  );

  const {
    data: vegetable,
    isLoading: isVegetableLoading,
    error: vegetableError,
  } = useGetVegetable(values.vegetableId ?? null);

  const resolvedVegetableName =
    vegetable?.name?.trim() || values.vegetableName?.trim() || null;
  const submitDisabled =
    Boolean(isSubmitting) || isOffline || !!blockingMessage;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: palette.background },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {showHeaderIntro ? (
        <View style={styles.screenIntro}>
          <Text style={[styles.screenTitle, { color: palette.heading }]}>
            {screenTitle}
          </Text>
          <Text style={[styles.screenSubtitle, { color: palette.secondary }]}>
            {screenSubtitle}
          </Text>
        </View>
      ) : null}

      {showHeaderIntro ? (
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: palette.cardBg,
              borderColor: palette.cardBorder,
            },
          ]}
        >
          <View
            style={[
              styles.heroPill,
              {
                backgroundColor: palette.heroPillBg,
                borderColor: palette.accentBorder,
              },
            ]}
          >
            <Text
              style={[styles.heroPillText, { color: palette.heroPillText }]}
            >
              {heroPillLabel}
            </Text>
          </View>
          <Text style={[styles.heroTitle, { color: palette.heading }]}>
            {heroTitle}
          </Text>
          <Text style={[styles.heroDescription, { color: palette.secondary }]}>
            {heroDescription}
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.section,
          { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: palette.heading }]}>
          Podstawy
        </Text>
        <Text style={[styles.sectionDescription, { color: palette.tertiary }]}>
          Zacznij od wyboru warzywa i sposobu zaplanowania startu uprawy.
        </Text>

        <Text style={[styles.label, { color: palette.secondary }]}>
          Warzywo *
        </Text>
        <Pressable
          style={[
            styles.vegetableSelector,
            {
              backgroundColor: palette.selectorBg,
              borderColor: values.vegetableId
                ? palette.accentBorder
                : palette.selectorBorder,
            },
          ]}
          onPress={onPickVegetable}
        >
          <View style={styles.vegetableSelectorContent}>
            {isVegetableLoading && values.vegetableId ? (
              <View style={styles.skeletonWrap}>
                <View
                  style={[
                    styles.skeletonLinePrimary,
                    { backgroundColor: palette.inputBorder },
                  ]}
                />
                <View
                  style={[
                    styles.skeletonLineSecondary,
                    { backgroundColor: palette.inputBorder },
                  ]}
                />
              </View>
            ) : values.vegetableId ? (
              <>
                <Text
                  style={[styles.vegetableTitle, { color: palette.heading }]}
                >
                  {resolvedVegetableName ?? "Wybrane warzywo"}
                </Text>
                <Text
                  style={[
                    styles.vegetableSubtitle,
                    { color: palette.secondary },
                  ]}
                >
                  {vegetableError
                    ? "Nie udało się pobrać danych warzywa"
                    : "Możesz zmienić wybór w dowolnym momencie"}
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={[styles.vegetableTitle, { color: palette.heading }]}
                >
                  Wybierz warzywo
                </Text>
                <Text
                  style={[
                    styles.vegetableSubtitle,
                    { color: palette.secondary },
                  ]}
                >
                  Przejdź do biblioteki warzyw
                </Text>
              </>
            )}
          </View>
          <View style={styles.selectorActionWrap}>
            <Text
              style={[styles.selectorActionText, { color: palette.accent }]}
            >
              {values.vegetableId ? "Zmień" : "Wybierz"}
            </Text>
            <Icon source="chevron-right" size={20} color={palette.accent} />
          </View>
        </Pressable>

        {validationMessage ? (
          <Text style={[styles.validationText, { color: palette.errorText }]}>
            {validationMessage}
          </Text>
        ) : null}

        {values.vegetableId && onClearVegetable ? (
          <Pressable onPress={onClearVegetable} style={styles.clearAction}>
            <Text style={[styles.clearText, { color: palette.errorText }]}>
              Usuń wybór
            </Text>
          </Pressable>
        ) : null}

        <Text style={[styles.label, { color: palette.secondary }]}>
          Metoda startu *
        </Text>
        <View style={styles.startMethodGrid}>
          <Pressable
            style={[
              styles.startMethodCard,
              {
                backgroundColor:
                  values.startMethod === "DIRECT_SOW"
                    ? palette.accentBg
                    : palette.selectorBg,
                borderColor:
                  values.startMethod === "DIRECT_SOW"
                    ? palette.accentBorder
                    : palette.selectorBorder,
              },
            ]}
            onPress={() => onChange({ startMethod: "DIRECT_SOW" })}
          >
            <Icon
              source="seed-outline"
              size={16}
              color={
                values.startMethod === "DIRECT_SOW"
                  ? palette.accent
                  : palette.secondary
              }
            />
            <Text
              style={[
                styles.startMethodTitle,
                {
                  color:
                    values.startMethod === "DIRECT_SOW"
                      ? palette.accent
                      : palette.heading,
                },
              ]}
            >
              Siew bezpośredni
            </Text>
            <Text
              style={[styles.startMethodSubtitle, { color: palette.secondary }]}
            >
              Nasiona trafiają od razu do grządki
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.startMethodCard,
              {
                backgroundColor:
                  values.startMethod === "TRANSPLANT"
                    ? palette.accentBg
                    : palette.selectorBg,
                borderColor:
                  values.startMethod === "TRANSPLANT"
                    ? palette.accentBorder
                    : palette.selectorBorder,
              },
            ]}
            onPress={() => onChange({ startMethod: "TRANSPLANT" })}
          >
            <Icon
              source="sprout-outline"
              size={16}
              color={
                values.startMethod === "TRANSPLANT"
                  ? palette.accent
                  : palette.secondary
              }
            />
            <Text
              style={[
                styles.startMethodTitle,
                {
                  color:
                    values.startMethod === "TRANSPLANT"
                      ? palette.accent
                      : palette.heading,
                },
              ]}
            >
              Rozsada
            </Text>
            <Text
              style={[styles.startMethodSubtitle, { color: palette.secondary }]}
            >
              Najpierw przygotowujesz sadzonki
            </Text>
          </Pressable>
        </View>

        {showSowedAt ? (
          <>
            <Text style={[styles.label, { color: palette.secondary }]}>
              Data siewu
            </Text>
            <Pressable
              style={[
                styles.dateInput,
                {
                  backgroundColor: palette.inputBg,
                  borderColor: palette.inputBorder,
                },
              ]}
              onPress={() => setSowedOpen(true)}
            >
              <Text
                style={[
                  styles.dateInputText,
                  {
                    color: isoToDateOnly(values.sowedAt)
                      ? palette.heading
                      : palette.placeholder,
                  },
                ]}
              >
                {isoToDateOnly(values.sowedAt) || "YYYY-MM-DD"}
              </Text>
              <Icon source="calendar" size={18} color={palette.secondary} />
            </Pressable>

            <DatePickerModal
              locale="pl"
              mode="single"
              visible={sowedOpen}
              date={sowedDate ?? new Date()}
              onDismiss={() => setSowedOpen(false)}
              onConfirm={({ date }) => {
                setSowedOpen(false);
                if (!date) return;
                onChange({ sowedAt: date.toISOString() });
              }}
            />

            {sowedAtHint ? (
              <Text
                style={[styles.dateFieldHint, { color: palette.secondary }]}
              >
                {sowedAtHint}
              </Text>
            ) : null}
          </>
        ) : null}
      </View>

      <View
        style={[
          styles.section,
          { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: palette.heading }]}>
          Notatki
        </Text>
        <TextInput
          style={[
            styles.notesInput,
            {
              backgroundColor: palette.inputBg,
              borderColor: palette.inputBorder,
              color: palette.heading,
            },
          ]}
          value={values.notes}
          onChangeText={(text) => onChange({ notes: text })}
          placeholder="Opcjonalnie"
          placeholderTextColor={palette.placeholder}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>

      {isOffline && offlineMessage ? (
        <View
          style={[
            styles.inlineNotice,
            {
              backgroundColor: palette.offlineBg,
              borderColor: palette.offlineBorder,
            },
          ]}
        >
          <Icon
            source="wifi-strength-off-outline"
            size={16}
            color={palette.offlineText}
          />
          <Text
            style={[styles.inlineNoticeText, { color: palette.offlineText }]}
          >
            {offlineMessage}
          </Text>
        </View>
      ) : null}

      {blockingMessage ? (
        <View
          style={[
            styles.blockingCard,
            {
              backgroundColor: palette.errorBg,
              borderColor: palette.errorBorder,
            },
          ]}
        >
          <Text
            style={[styles.blockingCardTitle, { color: palette.errorText }]}
          >
            Nie można kontynuować
          </Text>
          <Text style={[styles.blockingCardText, { color: palette.errorText }]}>
            {blockingMessage}
          </Text>
        </View>
      ) : null}

      <Pressable
        style={[
          styles.submitButton,
          {
            backgroundColor: palette.accent,
            borderColor: palette.accent,
          },
          submitDisabled && styles.disabledButton,
        ]}
        disabled={submitDisabled}
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 20,
  },
  screenIntro: {
    gap: 8,
    marginTop: 4,
  },
  screenTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 20,
    gap: 10,
  },
  heroPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroPillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  heroDescription: {
    fontSize: 14,
    lineHeight: 21,
  },
  section: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: -4,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  vegetableSelector: {
    minHeight: 82,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  vegetableSelectorContent: {
    flex: 1,
    gap: 3,
  },
  vegetableTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 21,
  },
  vegetableSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  selectorActionWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  selectorActionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  skeletonWrap: {
    gap: 8,
    paddingVertical: 2,
  },
  skeletonLinePrimary: {
    width: 140,
    height: 11,
    borderRadius: 999,
  },
  skeletonLineSecondary: {
    width: 180,
    height: 9,
    borderRadius: 999,
  },
  validationText: {
    marginTop: -4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  clearAction: {
    marginTop: -4,
    alignSelf: "flex-start",
  },
  clearText: {
    fontSize: 13,
    fontWeight: "600",
  },
  startMethodGrid: {
    gap: 10,
  },
  startMethodCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 4,
  },
  startMethodTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  startMethodSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  dateInputText: {
    fontSize: 15,
  },
  dateFieldHint: {
    marginTop: -2,
    fontSize: 12,
    lineHeight: 17,
  },
  notesInput: {
    minHeight: 126,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 21,
  },
  inlineNotice: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  blockingCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  blockingCardTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  blockingCardText: {
    fontSize: 13,
    lineHeight: 18,
  },
  submitButton: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  disabledButton: {
    opacity: 0.55,
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
