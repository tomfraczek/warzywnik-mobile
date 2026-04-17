import { getResponseError } from "@/src/api/axios";
import { useGetSoil } from "@/src/api/queries/soils/useGetSoil";
import { Screen } from "@/src/components/Screen";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Icon, MD3Theme, Text, useTheme } from "react-native-paper";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

// ─── palette ─────────────────────────────────────────────────────────────────

function buildPalette(dark: boolean) {
  return {
    background: dark ? "#141816" : "#F7F8F5",
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "#252D29" : "#E8ECE7",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
    meta: dark ? "#7A8880" : "#97A29B",
    accent: dark ? "#8DB89A" : "#5E8A70",
    tagBg: dark ? "#231F17" : "#F5F0E8",
    tagText: dark ? "#B8A882" : "#7A6A4A",
    innerCardBg: dark ? "#161C19" : "#F8FAF8",
    innerCardBorder: dark ? "#222B26" : "#EBF0EA",
    infoLabelColor: dark ? "#7A8880" : "#97A29B",
    infoValueColor: dark ? "#D4DDD8" : "#2E3A35",
    advantageIcon: dark ? "#6BAD7E" : "#4E8C62",
    advantageBg: dark ? "#1A2B1F" : "#F0FAF3",
    disadvantageIcon: dark ? "#C09070" : "#9A6050",
    disadvantageBg: dark ? "#281D18" : "#FBF3EF",
    tipIcon: dark ? "#8DB89A" : "#5E8A70",
    tipBg: dark ? "#1A2420" : "#F2F7F4",
  };
}

// ─── label mappers ────────────────────────────────────────────────────────────

const STRUCTURE_LABELS: Record<string, string> = {
  loose: "Luźna",
  crumbly: "Gruzełkowata",
  compact: "Zbita",
};

const RETENTION_LABELS: Record<string, string> = {
  low: "Niska",
  medium: "Średnia",
  high: "Wysoka",
  very_high: "Bardzo wysoka",
};

const DRAINAGE_LABELS: Record<string, string> = {
  poor: "Słaby",
  medium: "Średni",
  good: "Dobry",
  excellent: "Doskonały",
};

const FERTILITY_LABELS: Record<string, string> = {
  low: "Niska",
  medium: "Średnia",
  high: "Wysoka",
  very_high: "Bardzo wysoka",
};

function mapLabel(
  value: string | null | undefined,
  map: Record<string, string>,
): string | null {
  if (!value) return null;
  return map[value] ?? value;
}

// ─── shimmer ─────────────────────────────────────────────────────────────────

function useShimmer() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);
  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

// ─── skeleton ────────────────────────────────────────────────────────────────

function DetailSkeleton({
  palette,
}: {
  palette: ReturnType<typeof buildPalette>;
}) {
  const shimmer = useShimmer();
  const block = (w: string | number, h: number, r = 8) => (
    <Animated.View
      style={[
        {
          width: w as any,
          height: h,
          borderRadius: r,
          backgroundColor: palette.innerCardBg,
        },
        shimmer,
      ]}
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
        {block(64, 26, 999)}
        <View style={{ height: 10 }} />
        {block("70%", 36)}
        {block("50%", 36)}
        <View style={{ height: 6 }} />
        {block("100%", 16)}
        {block("85%", 16)}
        {block("60%", 16)}
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
          {block(120, 22)}
          <View style={{ height: 14 }} />
          {block("100%", 14)}
          {block("80%", 14)}
          {block("65%", 14)}
        </View>
      ))}
    </ScrollView>
  );
}

// ─── components ──────────────────────────────────────────────────────────────

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
      <Text style={[s.infoLabel, { color: palette.infoLabelColor }]}>
        {label}
      </Text>
      <Text style={[s.infoValue, { color: palette.infoValueColor }]}>
        {value}
      </Text>
    </View>
  );
}

function BulletList({
  items,
  iconSource,
  iconColor,
  itemBg,
  palette,
}: {
  items: string[];
  iconSource: string;
  iconColor: string;
  itemBg: string;
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <View style={s.bulletList}>
      {items.map((item, i) => (
        <View key={i} style={[s.bulletItem, { backgroundColor: itemBg }]}>
          <Icon source={iconSource} size={16} color={iconColor} />
          <Text style={[s.bulletText, { color: palette.secondary }]}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── screen ──────────────────────────────────────────────────────────────────

export default function SoilDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: soil, isLoading, error, refetch } = useGetSoil(id ?? null);
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

  if (error || !soil) {
    return (
      <Screen
        style={{ backgroundColor: palette.background }}
        safeAreaEdges={["left", "right"]}
      >
        <View style={s.errorWrap}>
          <Icon source="alert-circle-outline" size={48} color="#C8776E" />
          <Text style={[s.errorText, { color: palette.secondary }]}>
            {error ? String(getResponseError(error)) : "Nie znaleziono gleby"}
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

  const structure = mapLabel(soil.structure, STRUCTURE_LABELS);
  const waterRetention = mapLabel(soil.waterRetention, RETENTION_LABELS);
  const drainage = mapLabel(soil.drainage, DRAINAGE_LABELS);
  const fertilityLevel = mapLabel(soil.fertilityLevel, FERTILITY_LABELS);

  const hasCharacteristics =
    structure || waterRetention || drainage || fertilityLevel;
  const hasPh = soil.phMin != null || soil.phMax != null;
  const advantages = soil.advantages?.filter(Boolean) ?? [];
  const disadvantages = soil.disadvantages?.filter(Boolean) ?? [];
  const tips = soil.improvementTips?.filter(Boolean) ?? [];

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
        {/* hero */}
        <View
          style={[
            s.heroCard,
            {
              backgroundColor: palette.cardBg,
              borderColor: palette.cardBorder,
            },
          ]}
        >
          <Text style={[s.soilName, { color: palette.heading }]}>
            {soil.name}
          </Text>
          {soil.description ? (
            <Text style={[s.lead, { color: palette.secondary }]}>
              {soil.description}
            </Text>
          ) : null}
        </View>

        {/* characteristics */}
        {hasCharacteristics ? (
          <SectionCard title="Charakterystyka" palette={palette}>
            <View style={s.infoGrid}>
              {structure ? (
                <View
                  style={[
                    s.infoBlock,
                    {
                      backgroundColor: palette.innerCardBg,
                      borderColor: palette.innerCardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.infoBlockLabel,
                      { color: palette.infoLabelColor },
                    ]}
                  >
                    Struktura
                  </Text>
                  <Text
                    style={[
                      s.infoBlockValue,
                      { color: palette.infoValueColor },
                    ]}
                  >
                    {structure}
                  </Text>
                </View>
              ) : null}
              {fertilityLevel ? (
                <View
                  style={[
                    s.infoBlock,
                    {
                      backgroundColor: palette.innerCardBg,
                      borderColor: palette.innerCardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.infoBlockLabel,
                      { color: palette.infoLabelColor },
                    ]}
                  >
                    Żyzność
                  </Text>
                  <Text
                    style={[
                      s.infoBlockValue,
                      { color: palette.infoValueColor },
                    ]}
                  >
                    {fertilityLevel}
                  </Text>
                </View>
              ) : null}
              {waterRetention ? (
                <View
                  style={[
                    s.infoBlock,
                    {
                      backgroundColor: palette.innerCardBg,
                      borderColor: palette.innerCardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.infoBlockLabel,
                      { color: palette.infoLabelColor },
                    ]}
                  >
                    Retencja wody
                  </Text>
                  <Text
                    style={[
                      s.infoBlockValue,
                      { color: palette.infoValueColor },
                    ]}
                  >
                    {waterRetention}
                  </Text>
                </View>
              ) : null}
              {drainage ? (
                <View
                  style={[
                    s.infoBlock,
                    {
                      backgroundColor: palette.innerCardBg,
                      borderColor: palette.innerCardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.infoBlockLabel,
                      { color: palette.infoLabelColor },
                    ]}
                  >
                    Drenaż
                  </Text>
                  <Text
                    style={[
                      s.infoBlockValue,
                      { color: palette.infoValueColor },
                    ]}
                  >
                    {drainage}
                  </Text>
                </View>
              ) : null}
            </View>
          </SectionCard>
        ) : null}

        {/* pH */}
        {hasPh ? (
          <SectionCard title="pH" palette={palette}>
            {soil.phMin != null && soil.phMax != null ? (
              <InfoRow
                label="Zakres pH"
                value={`${soil.phMin} – ${soil.phMax}`}
                palette={palette}
              />
            ) : soil.phMin != null ? (
              <InfoRow
                label="pH min"
                value={String(soil.phMin)}
                palette={palette}
              />
            ) : (
              <InfoRow
                label="pH max"
                value={String(soil.phMax)}
                palette={palette}
              />
            )}
          </SectionCard>
        ) : null}

        {/* advantages */}
        {advantages.length > 0 ? (
          <SectionCard title="Zalety" palette={palette}>
            <BulletList
              items={advantages}
              iconSource="check-circle-outline"
              iconColor={palette.advantageIcon}
              itemBg={palette.advantageBg}
              palette={palette}
            />
          </SectionCard>
        ) : null}

        {/* disadvantages */}
        {disadvantages.length > 0 ? (
          <SectionCard title="Wady" palette={palette}>
            <BulletList
              items={disadvantages}
              iconSource="alert-circle-outline"
              iconColor={palette.disadvantageIcon}
              itemBg={palette.disadvantageBg}
              palette={palette}
            />
          </SectionCard>
        ) : null}

        {/* improvement tips */}
        {tips.length > 0 ? (
          <SectionCard title="Jak poprawić glebę" palette={palette}>
            <BulletList
              items={tips}
              iconSource="sprout-outline"
              iconColor={palette.tipIcon}
              itemBg={palette.tipBg}
              palette={palette}
            />
          </SectionCard>
        ) : null}

        {/* metadata */}
        {soil.createdAt || soil.updatedAt ? (
          <View style={s.metaBlock}>
            {soil.createdAt ? (
              <Text style={[s.metaText, { color: palette.meta }]}>
                Utworzono:{" "}
                {new Date(soil.createdAt).toLocaleDateString("pl-PL")}
              </Text>
            ) : null}
            {soil.updatedAt ? (
              <Text style={[s.metaText, { color: palette.meta }]}>
                Zaktualizowano:{" "}
                {new Date(soil.updatedAt).toLocaleDateString("pl-PL")}
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
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
  },
  // hero
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 5,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  soilName: {
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 38,
  },
  lead: {
    fontSize: 15,
    lineHeight: 24,
  },
  // section card
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  // info grid
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  infoBlock: {
    flexBasis: "47%",
    flexGrow: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  infoBlockLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoBlockValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  // info row
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  // bullet list
  bulletList: {
    gap: 8,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  // meta
  metaBlock: {
    marginHorizontal: 16,
    marginTop: 24,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
});
