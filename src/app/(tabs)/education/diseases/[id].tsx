import { getResponseError } from "@/src/api/axios";
import { useGetDisease } from "@/src/api/queries/diseases/useGetDisease";
import { Screen } from "@/src/components/Screen";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Icon, MD3Theme, Text, useTheme } from "react-native-paper";

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
    tagBg: dark ? "#2E1A1A" : "#FBF0EF",
    tagText: dark ? "#C88A85" : "#9A4A45",
    innerCardBg: dark ? "#161C19" : "#F8FAF8",
    innerCardBorder: dark ? "#222B26" : "#EBF0EA",
    badgeBg: dark ? "#1E2821" : "#F0F4F1",
    badgeText: dark ? "#C4D5CA" : "#3D5448",
  };
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const toText = (val: string | string[] | null | undefined): string | null => {
  if (!val) return null;
  if (Array.isArray(val)) return val.length > 0 ? val.join("\n") : null;
  return val.trim() || null;
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
        backgroundColor: palette.innerCardBg,
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
        {block(72, 24, 999)}
        <View style={{ height: 8 }} />
        {block("70%", 34)}
        {block("50%", 34)}
        <View style={{ height: 4 }} />
        {block("100%", 16)}
        {block("85%", 16)}
        {block("65%", 16)}
      </View>
      {["80%", "90%", "75%"].map((w, i) => (
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
          {block(100, 22)}
          <View style={{ height: 12 }} />
          {block(w, 15)}
          {block("100%", 15)}
          {block("70%", 15)}
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

function TextContent({
  text,
  palette,
}: {
  text: string;
  palette: ReturnType<typeof buildPalette>;
}) {
  return <Text style={[s.bodyText, { color: palette.secondary }]}>{text}</Text>;
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function DiseaseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const {
    data: disease,
    isLoading,
    error,
    refetch,
  } = useGetDisease(id ?? null);
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

  if (error || !disease) {
    return (
      <Screen
        style={{ backgroundColor: palette.background }}
        safeAreaEdges={["left", "right"]}
      >
        <View style={s.errorWrap}>
          <Icon source="alert-circle-outline" size={48} color="#C8776E" />
          <Text style={[s.errorText, { color: palette.secondary }]}>
            {error ? String(getResponseError(error)) : "Nie znaleziono choroby"}
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
          <View style={[s.tag, { backgroundColor: palette.tagBg }]}>
            <Icon source="bacteria-outline" size={13} color={palette.tagText} />
            <Text style={[s.tagText, { color: palette.tagText }]}>Choroba</Text>
          </View>
          <Text style={[s.diseaseName, { color: palette.heading }]}>
            {disease.name}
          </Text>
          {disease.description ? (
            <Text style={[s.lead, { color: palette.secondary }]}>
              {disease.description}
            </Text>
          ) : null}
        </View>

        {/* symptoms */}
        {toText(disease.symptoms) ? (
          <SectionCard title="Objawy" palette={palette}>
            <TextContent text={toText(disease.symptoms)!} palette={palette} />
          </SectionCard>
        ) : null}

        {/* prevention */}
        {toText(disease.prevention) ? (
          <SectionCard title="Zapobieganie" palette={palette}>
            <TextContent text={toText(disease.prevention)!} palette={palette} />
          </SectionCard>
        ) : null}

        {/* treatment */}
        {toText(disease.treatment) ? (
          <SectionCard title="Leczenie" palette={palette}>
            <TextContent text={toText(disease.treatment)!} palette={palette} />
          </SectionCard>
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
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  tag: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  diseaseName: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  lead: {
    fontSize: 15,
    lineHeight: 25,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    gap: 12,
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
  chipRow: {
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
  emptyNote: {
    fontSize: 14,
    fontStyle: "italic",
  },
  metaBlock: {
    marginHorizontal: 16,
    marginTop: 20,
    gap: 4,
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    fontWeight: "400",
  },
});
