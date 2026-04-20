import { getResponseError } from "@/src/api/axios";
import { Fertilizer } from "@/src/api/queries/fertilizers/types";
import { useGetFertilizer } from "@/src/api/queries/fertilizers/useGetFertilizer";
import { Screen } from "@/src/components/Screen";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Icon, MD3Theme, Text, useTheme } from "react-native-paper";

// ─── label maps ──────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  ORGANIC: "Organiczny",
  MINERAL: "Mineralny",
  BIO_STIMULANT: "Biostymulator",
  SOIL_AMENDMENT: "Poprawa gleby",
  PH_ADJUSTER: "Regulator pH",
};

const FORM_LABELS: Record<string, string> = {
  SOLID: "Stały",
  LIQUID: "Płynny",
};

const APPLICATION_LABELS: Record<string, string> = {
  TOP_DRESS: "Pogłównie",
  INCORPORATE: "Wymieszać z glebą",
  WATERING: "Podlewanie",
  FOLIAR: "Oprysk dolistny",
  COMPOST_TEA: "Herbatka kompostowa",
};

const RISK_LABELS: Record<string, string> = {
  LOW: "Niskie ryzyko",
  MEDIUM: "Średnie ryzyko",
  HIGH: "Wysokie ryzyko",
};

const NUTRIENT_LABELS: Record<string, string> = {
  NONE: "Brak wpływu",
  LOW: "Niski",
  MEDIUM: "Średni",
  HIGH: "Wysoki",
  VARIABLE: "Zmienny",
};

const PH_LABELS: Record<string, string> = {
  LOWERS: "Obniża pH",
  RAISES: "Podnosi pH",
  NEUTRAL: "Neutralny",
  VARIABLE: "Zmienny",
};

const SOIL_STRUCTURE_LABELS: Record<string, string> = {
  IMPROVES: "Poprawia strukturę",
  NEUTRAL: "Neutralny",
  MAY_WORSEN: "Może pogorszyć strukturę",
};

const EFFECT_LABELS: Record<string, string> = {
  DECREASES: "Zmniejsza",
  NEUTRAL: "Neutralny",
  INCREASES: "Zwiększa",
};

const FREQUENCY_LABELS: Record<string, string> = {
  ONE_TIME: "Jednorazowo",
  WEEKLY: "Co tydzień",
  BIWEEKLY: "Co 2 tygodnie",
  MONTHLY: "Co miesiąc",
  SEASONAL: "Sezonowo",
  AS_NEEDED: "W razie potrzeby",
};

// ─── palette ─────────────────────────────────────────────────────────────────

function buildPalette(dark: boolean) {
  return {
    background: dark ? "#141816" : "#F7F8F5",
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "#252D29" : "#E8ECE7",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
    meta: dark ? "#7A8880" : "#97A29B",
    accent: dark ? "#7AB88A" : "#4A7C59",
    innerBg: dark ? "#161C19" : "#F8FAF7",
    innerBorder: dark ? "#222B26" : "#EAF0E8",
  };
}

// ─── category badge config ────────────────────────────────────────────────────

const CATEGORY_TAG: Record<
  string,
  { bg: string; text: string; darkBg: string; darkText: string; icon: string }
> = {
  ORGANIC: {
    bg: "#E8F5E2",
    text: "#3E6E33",
    darkBg: "#1E3020",
    darkText: "#8FCB80",
    icon: "leaf-circle-outline",
  },
  MINERAL: {
    bg: "#E3EDF7",
    text: "#2E5A8C",
    darkBg: "#1A2A40",
    darkText: "#7AAAD0",
    icon: "atom",
  },
  BIO_STIMULANT: {
    bg: "#E5F7F3",
    text: "#2A7060",
    darkBg: "#1A2E2A",
    darkText: "#72C0B0",
    icon: "sprout-outline",
  },
  SOIL_AMENDMENT: {
    bg: "#F5EFE0",
    text: "#7A5A20",
    darkBg: "#302518",
    darkText: "#C8A860",
    icon: "layers-outline",
  },
  PH_ADJUSTER: {
    bg: "#EDE8F5",
    text: "#5A3A8C",
    darkBg: "#22183A",
    darkText: "#A888D8",
    icon: "flask-outline",
  },
};

const RISK_BADGE: Record<
  string,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  LOW: {
    bg: "#E8F5E2",
    text: "#3E6E33",
    darkBg: "#1E3020",
    darkText: "#8FCB80",
  },
  MEDIUM: {
    bg: "#FFF4E3",
    text: "#8A6030",
    darkBg: "#302215",
    darkText: "#D4A050",
  },
  HIGH: {
    bg: "#FDE9E7",
    text: "#9A3A30",
    darkBg: "#351818",
    darkText: "#E07068",
  },
};

// ─── skeleton ────────────────────────────────────────────────────────────────

function DetailSkeleton({
  palette,
}: {
  palette: ReturnType<typeof buildPalette>;
}) {
  const block = (w: string | number, h: number, r = 8) => (
    <View
      style={{
        width: w as any,
        height: h,
        borderRadius: r,
        backgroundColor: palette.innerBg,
      }}
    />
  );
  return (
    <ScrollView
      contentContainerStyle={[
        s.scroll,
        { backgroundColor: palette.background },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          s.heroCard,
          { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
        ]}
      >
        {block(88, 26, 999)}
        <View style={{ height: 6 }} />
        {block("72%", 36, 8)}
        {block("90%", 18, 6)}
        {block("75%", 18, 6)}
        <View style={{ height: 4 }} />
        {block(70, 26, 999)}
        {block(56, 26, 999)}
      </View>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            s.sectionCard,
            {
              backgroundColor: palette.cardBg,
              borderColor: palette.cardBorder,
            },
          ]}
        >
          {block("50%", 22, 6)}
          <View style={{ height: 10 }} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            {block("48%", 64, 14)}
            {block("48%", 64, 14)}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── section card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
  palette,
}: {
  title: string;
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
      {children}
    </View>
  );
}

// ─── info cell (2-column grid item) ──────────────────────────────────────────

function InfoCell({
  label,
  value,
  palette,
}: {
  label: string;
  value: string;
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <View
      style={[
        s.infoCell,
        { backgroundColor: palette.innerBg, borderColor: palette.innerBorder },
      ]}
    >
      <Text style={[s.infoCellLabel, { color: palette.meta }]}>{label}</Text>
      <Text style={[s.infoCellValue, { color: palette.heading }]}>{value}</Text>
    </View>
  );
}

// ─── info row ─────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  palette,
}: {
  label: string;
  value: string;
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <View style={s.infoRow}>
      <Text style={[s.infoRowLabel, { color: palette.meta }]}>{label}</Text>
      <Text style={[s.infoRowValue, { color: palette.heading }]}>{value}</Text>
    </View>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function FertilizerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const {
    data: fertilizer,
    isLoading,
    error,
    refetch,
  } = useGetFertilizer(id ?? null);
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);

  if (isLoading) {
    return (
      <Screen
        style={{ backgroundColor: palette.background }}
        safeAreaEdges={["left", "right"]}
      >
        <DetailSkeleton palette={palette} />
      </Screen>
    );
  }

  if (error || !fertilizer) {
    return (
      <Screen
        style={{ backgroundColor: palette.background }}
        safeAreaEdges={["left", "right"]}
      >
        <View style={s.errorWrap}>
          <Icon source="alert-circle-outline" size={48} color="#C8776E" />
          <Text style={[s.errorText, { color: palette.secondary }]}>
            {error ? String(getResponseError(error)) : "Nie znaleziono nawozu"}
          </Text>
          <Button
            mode="outlined"
            onPress={() => refetch()}
            textColor={palette.accent}
          >
            Spróbuj ponownie
          </Button>
        </View>
      </Screen>
    );
  }

  const f: Fertilizer = fertilizer;
  const catTag = f.category ? CATEGORY_TAG[f.category] : null;

  return (
    <Screen
      style={{ backgroundColor: palette.background }}
      safeAreaEdges={["left", "right"]}
    >
      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { backgroundColor: palette.background },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── hero ── */}
        <View
          style={[
            s.heroCard,
            {
              backgroundColor: palette.cardBg,
              borderColor: palette.cardBorder,
            },
          ]}
        >
          {catTag ? (
            <View
              style={[
                s.catTag,
                {
                  backgroundColor: theme.dark ? catTag.darkBg : catTag.bg,
                },
              ]}
            >
              <Icon
                source={catTag.icon}
                size={13}
                color={theme.dark ? catTag.darkText : catTag.text}
              />
              <Text
                style={[
                  s.catTagText,
                  { color: theme.dark ? catTag.darkText : catTag.text },
                ]}
              >
                {CATEGORY_LABELS[f.category!] ?? f.category}
              </Text>
            </View>
          ) : null}

          <Text style={[s.fertName, { color: palette.heading }]}>{f.name}</Text>

          {f.description ? (
            <Text style={[s.lead, { color: palette.secondary }]}>
              {f.description}
            </Text>
          ) : null}

          {/* hero badges */}
          <View style={s.badgeRow}>
            {f.form ? (
              <View
                style={[
                  s.badge,
                  {
                    backgroundColor: palette.innerBg,
                    borderColor: palette.innerBorder,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={[s.badgeText, { color: palette.secondary }]}>
                  {FORM_LABELS[f.form] ?? f.form}
                </Text>
              </View>
            ) : null}
            {f.applicationMethod ? (
              <View
                style={[
                  s.badge,
                  {
                    backgroundColor: palette.innerBg,
                    borderColor: palette.innerBorder,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={[s.badgeText, { color: palette.secondary }]}>
                  {APPLICATION_LABELS[f.applicationMethod] ??
                    f.applicationMethod}
                </Text>
              </View>
            ) : null}
            {f.riskLevel
              ? (() => {
                  const rb = RISK_BADGE[f.riskLevel];
                  return rb ? (
                    <View
                      style={[
                        s.badge,
                        {
                          backgroundColor: theme.dark ? rb.darkBg : rb.bg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.badgeText,
                          { color: theme.dark ? rb.darkText : rb.text },
                        ]}
                      >
                        {RISK_LABELS[f.riskLevel] ?? f.riskLevel}
                      </Text>
                    </View>
                  ) : null;
                })()
              : null}
            {f.isActive === false ? (
              <View
                style={[
                  s.badge,
                  {
                    backgroundColor: palette.innerBg,
                    borderColor: palette.innerBorder,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={[s.badgeText, { color: palette.meta }]}>
                  Nieaktywny
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── basic info ── */}
        <SectionCard title="Podstawowe informacje" palette={palette}>
          <View style={s.infoCellGrid}>
            {f.category ? (
              <InfoCell
                label="Kategoria"
                value={CATEGORY_LABELS[f.category] ?? f.category}
                palette={palette}
              />
            ) : null}
            {f.form ? (
              <InfoCell
                label="Forma"
                value={FORM_LABELS[f.form] ?? f.form}
                palette={palette}
              />
            ) : null}
            {f.recommendedFrequency ? (
              <InfoCell
                label="Częstotliwość"
                value={
                  FREQUENCY_LABELS[f.recommendedFrequency] ??
                  f.recommendedFrequency
                }
                palette={palette}
              />
            ) : null}
            {f.riskLevel ? (
              <InfoCell
                label="Ryzyko"
                value={RISK_LABELS[f.riskLevel] ?? f.riskLevel}
                palette={palette}
              />
            ) : null}
          </View>
        </SectionCard>

        {/* ── nutrients ── */}
        {f.nitrogenEffect || f.phosphorusEffect || f.potassiumEffect ? (
          <SectionCard title="Wpływ na składniki pokarmowe" palette={palette}>
            <View style={s.infoCellGrid}>
              {f.nitrogenEffect ? (
                <InfoCell
                  label="Azot"
                  value={NUTRIENT_LABELS[f.nitrogenEffect] ?? f.nitrogenEffect}
                  palette={palette}
                />
              ) : null}
              {f.phosphorusEffect ? (
                <InfoCell
                  label="Fosfor"
                  value={
                    NUTRIENT_LABELS[f.phosphorusEffect] ?? f.phosphorusEffect
                  }
                  palette={palette}
                />
              ) : null}
              {f.potassiumEffect ? (
                <InfoCell
                  label="Potas"
                  value={
                    NUTRIENT_LABELS[f.potassiumEffect] ?? f.potassiumEffect
                  }
                  palette={palette}
                />
              ) : null}
            </View>
          </SectionCard>
        ) : null}

        {/* ── soil effects ── */}
        {f.phEffect ||
        f.soilStructureEffect ||
        f.waterRetentionEffect ||
        f.drainageEffect ? (
          <SectionCard title="Wpływ na glebę" palette={palette}>
            <View style={s.infoRowList}>
              {f.phEffect ? (
                <InfoRow
                  label="Odczyn pH"
                  value={PH_LABELS[f.phEffect] ?? f.phEffect}
                  palette={palette}
                />
              ) : null}
              {f.soilStructureEffect ? (
                <InfoRow
                  label="Struktura gleby"
                  value={
                    SOIL_STRUCTURE_LABELS[f.soilStructureEffect] ??
                    f.soilStructureEffect
                  }
                  palette={palette}
                />
              ) : null}
              {f.waterRetentionEffect ? (
                <InfoRow
                  label="Retencja wody"
                  value={
                    EFFECT_LABELS[f.waterRetentionEffect] ??
                    f.waterRetentionEffect
                  }
                  palette={palette}
                />
              ) : null}
              {f.drainageEffect ? (
                <InfoRow
                  label="Drenaż"
                  value={EFFECT_LABELS[f.drainageEffect] ?? f.drainageEffect}
                  palette={palette}
                />
              ) : null}
            </View>
          </SectionCard>
        ) : null}

        {/* ── application ── */}
        {f.applicationMethod || f.recommendedFrequency || f.dosageGuidance ? (
          <SectionCard title="Stosowanie" palette={palette}>
            <View style={s.infoRowList}>
              {f.applicationMethod ? (
                <InfoRow
                  label="Sposób użycia"
                  value={
                    APPLICATION_LABELS[f.applicationMethod] ??
                    f.applicationMethod
                  }
                  palette={palette}
                />
              ) : null}
              {f.recommendedFrequency ? (
                <InfoRow
                  label="Częstotliwość"
                  value={
                    FREQUENCY_LABELS[f.recommendedFrequency] ??
                    f.recommendedFrequency
                  }
                  palette={palette}
                />
              ) : null}
            </View>
            {f.dosageGuidance ? (
              <View
                style={[
                  s.dosageBox,
                  {
                    backgroundColor: palette.innerBg,
                    borderColor: palette.innerBorder,
                  },
                ]}
              >
                <Icon
                  source="information-outline"
                  size={16}
                  color={palette.meta}
                />
                <Text style={[s.dosageText, { color: palette.secondary }]}>
                  {f.dosageGuidance}
                </Text>
              </View>
            ) : null}
          </SectionCard>
        ) : null}

        {/* ── notes ── */}
        {f.notes ? (
          <SectionCard title="Uwagi" palette={palette}>
            <Text style={[s.bodyText, { color: palette.secondary }]}>
              {f.notes}
            </Text>
          </SectionCard>
        ) : null}

        {/* ── meta ── */}
        {f.createdAt || f.updatedAt ? (
          <View style={s.metaBlock}>
            {f.createdAt ? (
              <Text style={[s.metaText, { color: palette.meta }]}>
                Utworzono: {new Date(f.createdAt).toLocaleDateString("pl-PL")}
              </Text>
            ) : null}
            {f.updatedAt ? (
              <Text style={[s.metaText, { color: palette.meta }]}>
                Zaktualizowano:{" "}
                {new Date(f.updatedAt).toLocaleDateString("pl-PL")}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll: {
    paddingBottom: 48,
  },
  errorWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  // hero
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  catTag: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  catTagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  fertName: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.4,
    lineHeight: 36,
  },
  lead: {
    fontSize: 15,
    lineHeight: 25,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  // sections
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 25,
  },
  // info cells grid
  infoCellGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  infoCell: {
    flex: 1,
    minWidth: "44%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  infoCellLabel: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoCellValue: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  // info rows
  infoRowList: {
    gap: 0,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8EDE6",
  },
  infoRowLabel: {
    fontSize: 14,
    fontWeight: "400",
  },
  infoRowValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  // dosage
  dosageBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 2,
  },
  dosageText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  // meta
  metaBlock: {
    marginHorizontal: 16,
    marginTop: 20,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "400",
  },
});
