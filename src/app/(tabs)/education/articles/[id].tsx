import { getResponseError } from "@/src/api/axios";
import { useTrackAnalyticsEvents } from "@/src/api/queries/analytics/useTrackAnalyticsEvents";
import { useGetArticle } from "@/src/api/queries/articles/useGetArticle";
import { Screen } from "@/src/components/Screen";
import { FavoriteButton } from "@/src/components/ui/FavoriteButton";
import { normalizeArticleHtmlWhitespace } from "@/src/utils/html";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  DimensionValue,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Button, Icon, MD3Theme, Text, useTheme } from "react-native-paper";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import RenderHTML, {
  CustomRendererProps,
  RenderHTMLProps,
  TNode,
} from "react-native-render-html";

// ─── label maps ──────────────────────────────────────────────────────────────

const SEASON_LABELS: Record<string, string> = {
  winter: "Zima",
  spring: "Wiosna",
  summer: "Lato",
  autumn: "Jesień",
};

const CONTEXT_LABELS: Record<string, string> = {
  planning: "Planowanie",
  soil_preparation: "Przygotowanie gleby",
  sowing: "Siew",
  harvest: "Zbiory",
  problem_solving: "Rozwiązywanie problemów",
  learning: "Wiedza",
};

const MONTH_LABELS = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
];

// ─── palette ─────────────────────────────────────────────────────────────────

function buildPalette(dark: boolean) {
  return {
    background: dark ? "#141816" : "#F7F8F5",
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "#252D29" : "#E8ECE7",
    coverBg: dark ? "#222B26" : "#EFF4EC",
    coverIcon: dark ? "#4A5E52" : "#B8CCB4",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
    meta: dark ? "#7A8880" : "#97A29B",
    accent: dark ? "#7AB88A" : "#4A7C59",
    seasonBg: dark ? "#1E2E24" : "#E6F2E8",
    seasonText: dark ? "#7ABF90" : "#3A7050",
    contextBg: dark ? "#1E2A38" : "#E5EEF8",
    contextText: dark ? "#7AAAD8" : "#2E5A8C",
    tagBg: dark ? "#2A2E2B" : "#F1F5F0",
    tagText: dark ? "#B8C8BC" : "#3D5448",
    chipBg: dark ? "#1F2722" : "#F3F6F2",
    innerBg: dark ? "#161C19" : "#F8FAF8",
  };
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const formatSlug = (slug: string): string =>
  slug.replace(/-/g, " ").replace(/(^|\s)\p{L}/gu, (m) => m.toUpperCase());

// ─── shimmer skeleton ─────────────────────────────────────────────────────────

function useShimmer() {
  const opacity = useSharedValue(1);
  opacity.value = withRepeat(
    withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.ease) }),
    -1,
    true,
  );
  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

function ArticleSkeleton({
  palette,
}: {
  palette: ReturnType<typeof buildPalette>;
}) {
  const shimmer = useShimmer();
  const block = (w: string | number, h: number, r = 8) => (
    <Animated.View
      style={[
        {
          width: w as DimensionValue,
          height: h,
          borderRadius: r,
          backgroundColor: palette.innerBg,
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
      <Animated.View
        style={[
          { width: "100%", height: 260, backgroundColor: palette.coverBg },
          shimmer,
        ]}
      />
      <View style={{ marginHorizontal: 16, marginTop: -28 }}>
        <View
          style={[
            s.heroCard,
            {
              backgroundColor: palette.cardBg,
              borderColor: palette.cardBorder,
              marginHorizontal: 0,
              marginTop: 0,
            },
          ]}
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            {block(72, 22, 999)}
            {block(80, 22, 999)}
          </View>
          <View style={{ gap: 8 }}>
            {block("75%", 32)}
            {block("55%", 32)}
          </View>
          <View style={{ gap: 6 }}>
            {block("100%", 14)}
            {block("90%", 14)}
            {block("70%", 14)}
          </View>
          {block(100, 13, 4)}
        </View>
      </View>
      <View
        style={[
          s.sectionCard,
          { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
        ]}
      >
        {block(120, 20)}
        <View style={{ height: 4 }} />
        {[100, 90, 95, 80, 85, 60].map((w, i) => (
          <View key={i} style={{ marginBottom: 6 }}>
            {block(`${w}%`, 14)}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── related group component ──────────────────────────────────────────────────

function RelatedGroup({
  label,
  items,
  palette,
}: {
  label: string;
  items: string[];
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <View style={s.relatedGroup}>
      <Text style={[s.relatedGroupLabel, { color: palette.meta }]}>
        {label}
      </Text>
      <View style={s.chipRow}>
        {items.map((item) => (
          <View
            key={item}
            style={[s.chip, { backgroundColor: palette.chipBg }]}
          >
            <Text style={[s.chipText, { color: palette.secondary }]}>
              {formatSlug(item)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── html render styles ───────────────────────────────────────────────────────

const getBaseStyle = (palette: ReturnType<typeof buildPalette>) => ({
  color: palette.secondary,
  fontSize: 16,
  lineHeight: 28,
});

const getTagsStyles = (palette: ReturnType<typeof buildPalette>) => ({
  h2: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: palette.heading,
    marginTop: 24,
    marginBottom: 10,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: palette.heading,
    marginTop: 18,
    marginBottom: 8,
    lineHeight: 26,
  },
  p: {
    marginBottom: 14,
    lineHeight: 28,
  },
  ul: { marginBottom: 12, paddingLeft: 20 },
  ol: { marginBottom: 12, paddingLeft: 20 },
  li: { marginBottom: 6, lineHeight: 26 },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: "#B8CCB4",
    paddingLeft: 14,
    marginLeft: 0,
    marginBottom: 14,
  },
  a: { color: "#4A7C59", textDecorationLine: "underline" as const },
});

// ─── screen ──────────────────────────────────────────────────────────────────

function ArticleImage({ src, cardWidth }: { src: string; cardWidth: number }) {
  return (
    <View
      style={{ marginHorizontal: -20, marginVertical: 8, width: cardWidth }}
    >
      <Image
        source={{ uri: src }}
        contentFit="cover"
        style={{ width: cardWidth, height: Math.round(cardWidth * 0.6) }}
      />
    </View>
  );
}

function makeRenderers(cardWidth: number) {
  return {
    img: ({ tnode }: CustomRendererProps<TNode>) => {
      const src: string =
        (tnode.attributes as Record<string, string>)?.src ||
        (tnode.attributes as Record<string, string>)?.["data-src"] ||
        "";
      if (!src) return null;
      return <ArticleImage src={src} cardWidth={cardWidth} />;
    },
  };
}

export default function ArticleDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { width } = useWindowDimensions();
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);

  // ─── analytics ────────────────────────────────────────────────────────────
  const sessionId = useRef(
    `article-${id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  ).current;
  const { mutate: trackEvents } = useTrackAnalyticsEvents();
  const engagedSecondsRef = useRef(0);
  const scroll50Sent = useRef(false);
  const scroll90Sent = useRef(false);
  const scrollHeightRef = useRef(0);

  // Send engaged time every 15s
  useEffect(() => {
    const timer = setInterval(() => {
      engagedSecondsRef.current += 15;
      if (id) {
        trackEvents([
          {
            eventType: "ARTICLE_ENGAGED",
            targetType: "ARTICLE",
            targetSlug: id,
            sessionId,
            valueInt: engagedSecondsRef.current,
            idempotencyKey: `engaged-${sessionId}-${engagedSecondsRef.current}`,
          },
        ]);
      }
    }, 15_000);
    return () => clearInterval(timer);
  }, [id, sessionId, trackEvents]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const totalHeight = contentSize.height - layoutMeasurement.height;
      scrollHeightRef.current = totalHeight;
      const pct = totalHeight > 0 ? contentOffset.y / totalHeight : 0;

      if (!scroll50Sent.current && pct >= 0.5 && id) {
        scroll50Sent.current = true;
        trackEvents([
          {
            eventType: "ARTICLE_SCROLL_50",
            targetType: "ARTICLE",
            targetSlug: id,
            sessionId,
            idempotencyKey: `scroll50-${sessionId}`,
          },
        ]);
      }
      if (!scroll90Sent.current && pct >= 0.9 && id) {
        scroll90Sent.current = true;
        trackEvents([
          {
            eventType: "ARTICLE_SCROLL_90",
            targetType: "ARTICLE",
            targetSlug: id,
            sessionId,
            idempotencyKey: `scroll90-${sessionId}`,
          },
        ]);
      }
    },
    [id, sessionId, trackEvents],
  );
  // ─────────────────────────────────────────────────────────────────────────

  const {
    data: article,
    isLoading,
    error,
    refetch,
  } = useGetArticle(id ?? null);

  const normalizedContent = useMemo(() => {
    if (!article?.content) return "";
    return normalizeArticleHtmlWhitespace(article.content);
  }, [article?.content]);

  const hasRelated = useMemo(() => {
    if (!article) return false;
    return (
      (article.relatedVegetableIds?.length ?? 0) > 0 ||
      (article.relatedSoilIds?.length ?? 0) > 0 ||
      (article.relatedFertilizerIds?.length ?? 0) > 0 ||
      (article.relatedDiseaseIds?.length ?? 0) > 0 ||
      (article.relatedPestIds?.length ?? 0) > 0
    );
  }, [article]);

  if (isLoading) {
    return (
      <Screen
        style={{ backgroundColor: palette.background }}
        safeAreaEdges={["left", "right"]}
      >
        <ArticleSkeleton palette={palette} />
      </Screen>
    );
  }

  if (error || !article) {
    return (
      <Screen
        style={{ backgroundColor: palette.background }}
        safeAreaEdges={["left", "right"]}
      >
        <View style={s.errorWrap}>
          <Icon
            source="file-document-alert-outline"
            size={52}
            color="#C8776E"
          />
          <Text style={[s.errorText, { color: palette.secondary }]}>
            {error
              ? String(getResponseError(error))
              : "Nie znaleziono artykułu"}
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

  const seasons = article.seasons ?? [];
  const contexts = article.contexts ?? [];
  const months = article.months ?? [];

  const cardWidth = width - 34; // ekran − marginHorizontal 16×2 − borderWidth 1×2

  const renderProps = {
    source: { html: normalizedContent },
    tagsStyles: getTagsStyles(palette),
    baseStyle: getBaseStyle(palette),
    renderers: makeRenderers(cardWidth),
    renderersProps: {
      a: {
        onPress: (_event: unknown, href?: string) => {
          if (href) Linking.openURL(href);
        },
      },
      img: { enableExperimentalPercentWidth: true },
    },
    contentWidth: width - 72,
    imagesMaxWidth: width - 72,
  } as const;

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
        onScroll={handleScroll}
        scrollEventThrottle={200}
      >
        {/* cover */}
        {article.coverImageUrl ? (
          <Image
            source={{
              uri: article.coverImageUrl,
            }}
            contentFit="cover"
            style={s.cover}
            recyclingKey={article.slug}
          />
        ) : (
          <View
            style={[
              s.cover,
              s.coverPlaceholder,
              { backgroundColor: palette.coverBg },
            ]}
          >
            <Icon
              source="book-open-page-variant-outline"
              size={56}
              color={palette.coverIcon}
            />
          </View>
        )}

        {/* hero card */}
        <View style={{ marginHorizontal: 16, marginTop: -28 }}>
          <View
            style={[
              s.heroCard,
              {
                backgroundColor: palette.cardBg,
                borderColor: palette.cardBorder,
                marginHorizontal: 0,
                marginTop: 0,
              },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              {contexts.length > 0 ||
              seasons.length > 0 ||
              months.length > 0 ? (
                <View style={[s.tagRow, { flex: 1, marginRight: 8 }]}>
                  {contexts.slice(0, 2).map((ctx) => (
                    <View
                      key={ctx}
                      style={[s.badge, { backgroundColor: palette.contextBg }]}
                    >
                      <Text
                        style={[s.badgeText, { color: palette.contextText }]}
                      >
                        {CONTEXT_LABELS[ctx] ?? ctx}
                      </Text>
                    </View>
                  ))}
                  {seasons.slice(0, 1).map((season) => (
                    <View
                      key={season}
                      style={[s.badge, { backgroundColor: palette.seasonBg }]}
                    >
                      <Text
                        style={[s.badgeText, { color: palette.seasonText }]}
                      >
                        {SEASON_LABELS[season] ?? season}
                      </Text>
                    </View>
                  ))}
                  {months.length > 0 && (
                    <View style={[s.badge, { backgroundColor: palette.tagBg }]}>
                      <Text style={[s.badgeText, { color: palette.tagText }]}>
                        {months.length === 1
                          ? MONTH_LABELS[(months[0] - 1 + 12) % 12]
                          : `${MONTH_LABELS[(months[0] - 1 + 12) % 12]} – ${MONTH_LABELS[(months[months.length - 1] - 1 + 12) % 12]}`}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View />
              )}
              <FavoriteButton
                targetType="ARTICLE"
                targetSlug={article.slug}
                variant="inline"
                size={26}
                inactiveColor="#B0BAB5"
              />
            </View>

            <Text style={[s.title, { color: palette.heading }]}>
              {article.title}
            </Text>

            {article.excerpt ? (
              <Text style={[s.excerpt, { color: palette.secondary }]}>
                {article.excerpt}
              </Text>
            ) : null}

            {article.publishedAt ? (
              <Text style={[s.publishedAt, { color: palette.meta }]}>
                {new Date(article.publishedAt).toLocaleDateString("pl-PL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            ) : null}
          </View>
        </View>

        {/* content */}
        {normalizedContent ? (
          <View
            style={[
              s.sectionCard,
              {
                backgroundColor: palette.cardBg,
                borderColor: palette.cardBorder,
              },
            ]}
          >
            <RenderHTML {...(renderProps as RenderHTMLProps)} />
          </View>
        ) : null}

        {/* related topics */}
        {hasRelated && (
          <View
            style={[
              s.sectionCard,
              {
                backgroundColor: palette.cardBg,
                borderColor: palette.cardBorder,
              },
            ]}
          >
            <Text style={[s.sectionTitle, { color: palette.heading }]}>
              Powiązane tematy
            </Text>
            {article.relatedVegetableIds?.length > 0 && (
              <RelatedGroup
                label="Warzywa"
                items={article.relatedVegetableIds}
                palette={palette}
              />
            )}
            {article.relatedSoilIds?.length > 0 && (
              <RelatedGroup
                label="Gleby"
                items={article.relatedSoilIds}
                palette={palette}
              />
            )}
            {article.relatedFertilizerIds?.length > 0 && (
              <RelatedGroup
                label="Nawozy"
                items={article.relatedFertilizerIds}
                palette={palette}
              />
            )}
            {article.relatedDiseaseIds?.length > 0 && (
              <RelatedGroup
                label="Choroby"
                items={article.relatedDiseaseIds}
                palette={palette}
              />
            )}
            {article.relatedPestIds?.length > 0 && (
              <RelatedGroup
                label="Szkodniki"
                items={article.relatedPestIds}
                palette={palette}
              />
            )}
          </View>
        )}
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
  cover: {
    width: "100%",
    height: 260,
  },
  coverPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
  title: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  excerpt: {
    fontSize: 16,
    lineHeight: 26,
  },
  publishedAt: {
    fontSize: 13,
    fontWeight: "400",
  },
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 16,
  },
  relatedGroup: {
    gap: 8,
    marginBottom: 14,
  },
  relatedGroupLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
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
    fontWeight: "400",
  },
});
