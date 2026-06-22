import { getResponseError } from "@/src/api/axios";
import { useGetPest } from "@/src/api/queries/pests/useGetPest";
import { Screen } from "@/src/components/Screen";
import { FavoriteButton } from "@/src/components/ui/FavoriteButton";
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
    tagBg: dark ? "#23200F" : "#F5F0E0",
    tagText: dark ? "#C8B870" : "#7A6830",
    innerCardBg: dark ? "#161C19" : "#F8FAF8",
    chipBg: dark ? "#222820" : "#F0F4EF",
    chipText: dark ? "#B8C8B0" : "#3A5040",
    symptomsBg: dark ? "#1E1A10" : "#FDFAF0",
    symptomsText: dark ? "#C0B060" : "#6A5820",
    preventionBg: dark ? "#192018" : "#F2F8F2",
    preventionText: dark ? "#7AAA80" : "#3A6A45",
    treatmentBg: dark ? "#1A1820" : "#F4F2FA",
    treatmentText: dark ? "#9090C0" : "#4A4A8A",
  };
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function toText(val: string | string[] | null | undefined): string | null {
  if (!val) return null;
  if (Array.isArray(val)) return val.filter(Boolean).join("\n") || null;
  return val.trim() || null;
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
        {block(72, 26, 999)}
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

// ─── section card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  accentColor,
  children,
  palette,
}: {
  title: string;
  accentColor?: string;
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
      <View style={s.sectionTitleRow}>
        {accentColor ? (
          <View style={[s.sectionDot, { backgroundColor: accentColor }]} />
        ) : null}
        <Text style={[s.sectionTitle, { color: palette.heading }]}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

// ─── screen ──────────────────────────────────────────────────────────────────

export default function PestDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: pest, isLoading, error, refetch } = useGetPest(id ?? null);
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

  if (error || !pest) {
    return (
      <Screen
        style={{ backgroundColor: palette.background }}
        safeAreaEdges={["left", "right"]}
      >
        <View style={s.errorWrap}>
          <Icon source="alert-circle-outline" size={48} color="#C8776E" />
          <Text style={[s.errorText, { color: palette.secondary }]}>
            {error
              ? String(getResponseError(error))
              : "Nie znaleziono szkodnika"}
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

  const symptoms = toText(pest.symptoms);
  const prevention = toText(pest.prevention);
  const treatment = toText(pest.treatment);

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
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={[s.tag, { backgroundColor: palette.tagBg }]}>
              <Icon source="bug-outline" size={13} color={palette.tagText} />
              <Text style={[s.tagText, { color: palette.tagText }]}>
                Szkodnik
              </Text>
            </View>
            <FavoriteButton
              targetType="PEST"
              targetSlug={pest.slug}
              variant="inline"
              size={26}
              inactiveColor="#B0BAB5"
            />
          </View>
          <Text style={[s.pestName, { color: palette.heading }]}>
            {pest.name}
          </Text>
          {pest.description ? (
            <Text style={[s.lead, { color: palette.secondary }]}>
              {pest.description}
            </Text>
          ) : null}
        </View>

        {/* symptoms */}
        {symptoms ? (
          <SectionCard
            title="Objawy"
            accentColor={palette.symptomsText}
            palette={palette}
          >
            <View
              style={[s.contentBlock, { backgroundColor: palette.symptomsBg }]}
            >
              <Text style={[s.contentText, { color: palette.secondary }]}>
                {symptoms}
              </Text>
            </View>
          </SectionCard>
        ) : null}

        {/* prevention */}
        {prevention ? (
          <SectionCard
            title="Zapobieganie"
            accentColor={palette.preventionText}
            palette={palette}
          >
            <View
              style={[
                s.contentBlock,
                { backgroundColor: palette.preventionBg },
              ]}
            >
              <Text style={[s.contentText, { color: palette.secondary }]}>
                {prevention}
              </Text>
            </View>
          </SectionCard>
        ) : null}

        {/* treatment */}
        {treatment ? (
          <SectionCard
            title="Zwalczanie"
            accentColor={palette.treatmentText}
            palette={palette}
          >
            <View
              style={[s.contentBlock, { backgroundColor: palette.treatmentBg }]}
            >
              <Text style={[s.contentText, { color: palette.secondary }]}>
                {treatment}
              </Text>
            </View>
          </SectionCard>
        ) : null}

      </ScrollView>
    </Screen>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

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
  pestName: {
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
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  // content block
  contentBlock: {
    borderRadius: 14,
    padding: 14,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 24,
  },
  // chips
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 22,
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
