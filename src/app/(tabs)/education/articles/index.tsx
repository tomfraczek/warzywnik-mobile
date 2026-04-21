import { getResponseError } from "@/src/api/axios";
import { ArticleListItem } from "@/src/api/queries/articles/types";
import { useGetArticles } from "@/src/api/queries/articles/useGetArticles";
import { Screen } from "@/src/components/Screen";
import { FavoriteButton } from "@/src/components/ui/FavoriteButton";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  TextInput as RNTextInput,
  ScrollView,
  StyleSheet,
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
import { useDebouncedValue } from "../_components/useDebouncedValue";

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
  "Sty",
  "Lut",
  "Mar",
  "Kwi",
  "Maj",
  "Cze",
  "Lip",
  "Sie",
  "Wrz",
  "Paź",
  "Lis",
  "Gru",
];

// ─── palette ─────────────────────────────────────────────────────────────────

function buildPalette(dark: boolean) {
  return {
    background: dark ? "#141816" : "#F7F8F5",
    surface: dark ? "#1D221F" : "#F0F3EE",
    border: dark ? "#2B332F" : "#E7ECE6",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
    meta: dark ? "#7A8880" : "#97A29B",
    accent: dark ? "#7AB88A" : "#4A7C59",
    searchPlaceholder: dark ? "#98A49C" : "#8A948D",
    searchIcon: dark ? "#9AA59E" : "#7F8B84",
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "#252D29" : "#E8ECE7",
    coverBg: dark ? "#222B26" : "#EFF4EC",
    coverIcon: dark ? "#4A5E52" : "#B8CCB4",
    seasonBg: dark ? "#1E2E24" : "#E6F2E8",
    seasonText: dark ? "#7ABF90" : "#3A7050",
    contextBg: dark ? "#1E2A38" : "#E5EEF8",
    contextText: dark ? "#7AAAD8" : "#2E5A8C",
    tagBg: dark ? "#222B26" : "#F0F4F1",
    tagText: dark ? "#9AB8A2" : "#4E6E5A",
  };
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

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

function ArticleCardSkeleton({
  palette,
}: {
  palette: ReturnType<typeof buildPalette>;
}) {
  const shimmer = useShimmer();
  return (
    <View
      style={[
        skelStyles.card,
        { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
      ]}
    >
      <Animated.View
        style={[
          skelStyles.cover,
          { backgroundColor: palette.coverBg },
          shimmer,
        ]}
      />
      <View style={skelStyles.body}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Animated.View style={[skelStyles.tag, shimmer]} />
          <Animated.View style={[skelStyles.tagSmall, shimmer]} />
        </View>
        <Animated.View style={[skelStyles.title, shimmer]} />
        <Animated.View style={[skelStyles.titleShort, shimmer]} />
        <Animated.View style={[skelStyles.desc, shimmer]} />
        <Animated.View style={[skelStyles.descShort, shimmer]} />
        <Animated.View style={[skelStyles.meta, shimmer]} />
      </View>
    </View>
  );
}

const skelStyles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
  },
  cover: { width: "100%", height: 200 },
  body: { padding: 18, gap: 10 },
  tag: { width: 72, height: 24, borderRadius: 999, backgroundColor: "#E2EDE0" },
  tagSmall: {
    width: 52,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#E5EEF8",
  },
  title: {
    width: "85%",
    height: 22,
    borderRadius: 6,
    backgroundColor: "#DDE8DB",
  },
  titleShort: {
    width: "60%",
    height: 22,
    borderRadius: 6,
    backgroundColor: "#E5EDE3",
  },
  desc: {
    width: "100%",
    height: 15,
    borderRadius: 6,
    backgroundColor: "#EBF1E9",
  },
  descShort: {
    width: "70%",
    height: 15,
    borderRadius: 6,
    backgroundColor: "#EEF3EC",
  },
  meta: { width: 100, height: 13, borderRadius: 6, backgroundColor: "#F0F4EE" },
});

// ─── filters row ──────────────────────────────────────────────────────────────

const SEASON_OPTIONS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: "Wszystkie pory" },
  { value: "spring", label: "Wiosna" },
  { value: "summer", label: "Lato" },
  { value: "autumn", label: "Jesień" },
  { value: "winter", label: "Zima" },
];

const CONTEXT_OPTIONS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: "Wszystkie tematy" },
  { value: "planning", label: "Planowanie" },
  { value: "soil_preparation", label: "Przygotowanie gleby" },
  { value: "sowing", label: "Siew" },
  { value: "harvest", label: "Zbiory" },
  { value: "problem_solving", label: "Problemy" },
  { value: "learning", label: "Wiedza" },
];

function FilterPill({
  label,
  active,
  onPress,
  palette,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        filterStyles.pill,
        {
          backgroundColor: active ? palette.accent : palette.cardBg,
          borderColor: active ? palette.accent : palette.border,
        },
      ]}
    >
      <Text
        style={[
          filterStyles.pillText,
          { color: active ? "#FFFFFF" : palette.secondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const filterStyles = StyleSheet.create({
  row: { gap: 8, paddingBottom: 2 },
  pill: {
    height: 38,
    paddingHorizontal: 15,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { fontSize: 14, fontWeight: "500" },
});

// ─── list header ──────────────────────────────────────────────────────────────

function ListHeader({
  query,
  onQueryChange,
  total,
  isLoading,
  activeSeason,
  onSeasonChange,
  activeContext,
  onContextChange,
  activeMonth,
  onMonthChange,
  palette,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  total: number | undefined;
  isLoading: boolean;
  activeSeason: string | undefined;
  onSeasonChange: (v: string | undefined) => void;
  activeContext: string | undefined;
  onContextChange: (v: string | undefined) => void;
  activeMonth: number | null;
  onMonthChange: (v: number | null) => void;
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <View style={headerStyles.wrap}>
      {/* search bar */}
      <View
        style={[
          headerStyles.searchBar,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      >
        <Icon source="magnify" size={21} color={palette.searchIcon} />
        <RNTextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Szukaj artykułu..."
          placeholderTextColor={palette.searchPlaceholder}
          style={[headerStyles.searchInput, { color: palette.heading }]}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* title */}
      <View style={headerStyles.titleBlock}>
        <Text style={[headerStyles.title, { color: palette.heading }]}>
          Artykuły
        </Text>
        {!isLoading && total !== undefined ? (
          <Text style={[headerStyles.count, { color: palette.meta }]}>
            {total}{" "}
            {total === 1
              ? "artykuł"
              : total >= 2 && total <= 4
                ? "artykuły"
                : "artykułów"}
          </Text>
        ) : null}
      </View>

      {/* season filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={filterStyles.row}
        style={{ marginTop: 14 }}
      >
        {SEASON_OPTIONS.map((opt) => (
          <FilterPill
            key={opt.label}
            label={opt.label}
            active={activeSeason === opt.value}
            onPress={() => onSeasonChange(opt.value)}
            palette={palette}
          />
        ))}
      </ScrollView>

      {/* context filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={filterStyles.row}
        style={{ marginTop: 10 }}
      >
        {CONTEXT_OPTIONS.map((opt) => (
          <FilterPill
            key={opt.label}
            label={opt.label}
            active={activeContext === opt.value}
            onPress={() => onContextChange(opt.value)}
            palette={palette}
          />
        ))}
      </ScrollView>

      {/* month filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={filterStyles.row}
        style={{ marginTop: 10, marginBottom: 4 }}
      >
        <FilterPill
          label="Cały rok"
          active={activeMonth === null}
          onPress={() => onMonthChange(null)}
          palette={palette}
        />
        {MONTH_LABELS.map((label, i) => (
          <FilterPill
            key={label}
            label={label}
            active={activeMonth === i + 1}
            onPress={() => onMonthChange(activeMonth === i + 1 ? null : i + 1)}
            palette={palette}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  wrap: { paddingTop: 12, paddingBottom: 16 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    height: 52,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  titleBlock: { marginTop: 20, marginBottom: 2, gap: 2 },
  title: { fontSize: 26, fontWeight: "700", lineHeight: 32 },
  count: { fontSize: 14, lineHeight: 20 },
});

const prefetchArticleCover = (uri?: string | null) => {
  if (!uri) return;
  void Image.prefetch(uri, "memory-disk").catch(() => undefined);
};

// ─── article card ─────────────────────────────────────────────────────────────

function ArticleCard({
  item,
  onPress,
  onPressIn,
  palette,
}: {
  item: ArticleListItem;
  onPress: () => void;
  onPressIn?: () => void;
  palette: ReturnType<typeof buildPalette>;
}) {
  const firstSeason = item.seasons[0];
  const firstContext = item.contexts[0];
  const firstMonth = item.months[0];

  const date = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      hitSlop={4}
      android_ripple={null}
      style={({ pressed }) => pressed && { opacity: 0.75 }}
    >
      <View
        style={[
          cardStyles.card,
          { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
        ]}
      >
        {/* cover */}
        {item.coverImageUrl ? (
          <View>
            <Image
              source={{
                uri: item.coverImageUrl,
              }}
              style={cardStyles.cover}
              contentFit="cover"
              recyclingKey={item.slug}
            />
            <FavoriteButton targetType="ARTICLE" targetSlug={item.slug} />
          </View>
        ) : (
          <View
            style={[cardStyles.cover, { backgroundColor: palette.coverBg }]}
          >
            <Icon
              source="book-open-page-variant-outline"
              size={40}
              color={palette.coverIcon}
            />
            <FavoriteButton targetType="ARTICLE" targetSlug={item.slug} />
          </View>
        )}

        {/* body */}
        <View style={cardStyles.body}>
          {/* tag row */}
          {firstSeason || firstContext || firstMonth ? (
            <View style={cardStyles.tagRow}>
              {firstSeason ? (
                <View
                  style={[
                    cardStyles.tag,
                    { backgroundColor: palette.seasonBg },
                  ]}
                >
                  <Text
                    style={[cardStyles.tagText, { color: palette.seasonText }]}
                  >
                    {SEASON_LABELS[firstSeason] ?? firstSeason}
                  </Text>
                </View>
              ) : null}
              {firstContext ? (
                <View
                  style={[
                    cardStyles.tag,
                    { backgroundColor: palette.contextBg },
                  ]}
                >
                  <Text
                    style={[cardStyles.tagText, { color: palette.contextText }]}
                  >
                    {CONTEXT_LABELS[firstContext] ?? firstContext}
                  </Text>
                </View>
              ) : null}
              {!firstSeason && !firstContext && firstMonth ? (
                <View
                  style={[cardStyles.tag, { backgroundColor: palette.tagBg }]}
                >
                  <Text
                    style={[cardStyles.tagText, { color: palette.tagText }]}
                  >
                    {MONTH_LABELS[firstMonth - 1]}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* title */}
          <Text
            style={[cardStyles.title, { color: palette.heading }]}
            numberOfLines={3}
          >
            {item.title}
          </Text>

          {/* excerpt */}
          {item.excerpt ? (
            <Text
              style={[cardStyles.excerpt, { color: palette.secondary }]}
              numberOfLines={3}
            >
              {item.excerpt}
            </Text>
          ) : null}

          {/* date */}
          {date ? (
            <Text style={[cardStyles.date, { color: palette.meta }]}>
              {date}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
  },
  cover: {
    width: "100%",
    height: 210,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 18,
    gap: 10,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 27,
  },
  excerpt: {
    fontSize: 15,
    lineHeight: 23,
  },
  date: {
    fontSize: 13,
    lineHeight: 18,
  },
});

// ─── empty state ──────────────────────────────────────────────────────────────

function EmptyContent({
  palette,
}: {
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <View style={emptyStyles.wrap}>
      <View
        style={[emptyStyles.iconWrap, { backgroundColor: palette.coverBg }]}
      >
        <Icon
          source="book-search-outline"
          size={32}
          color={palette.seasonText}
        />
      </View>
      <Text style={[emptyStyles.title, { color: palette.heading }]}>
        Nie znaleziono artykułów
      </Text>
      <Text style={[emptyStyles.subtitle, { color: palette.secondary }]}>
        Spróbuj zmienić frazę wyszukiwania lub filtry.
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: { alignItems: "center", paddingTop: 48, paddingBottom: 32, gap: 12 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22 },
});

// ─── screen ───────────────────────────────────────────────────────────────────

export default function ArticlesScreen() {
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);
  const router = useRouter();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [activeSeason, setActiveSeason] = useState<string | undefined>(
    undefined,
  );
  const [activeContext, setActiveContext] = useState<string | undefined>(
    undefined,
  );
  const [activeMonth, setActiveMonth] = useState<number | null>(null);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error,
  } = useGetArticles({
    q: debouncedQuery.trim() ? debouncedQuery : undefined,
    limit: 20,
    season: activeSeason,
    context: activeContext,
    month: activeMonth ?? undefined,
  });

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages],
  );

  const total = data?.pages[0]?.total;

  const listHeader = (
    <ListHeader
      query={query}
      onQueryChange={setQuery}
      total={total}
      isLoading={isLoading}
      activeSeason={activeSeason}
      onSeasonChange={setActiveSeason}
      activeContext={activeContext}
      onContextChange={setActiveContext}
      activeMonth={activeMonth}
      onMonthChange={setActiveMonth}
      palette={palette}
    />
  );

  if (isLoading && items.length === 0) {
    return (
      <Screen
        style={{ backgroundColor: palette.background }}
        safeAreaEdges={["left", "right"]}
      >
        <ScrollView
          contentContainerStyle={[
            listStyles.content,
            { backgroundColor: palette.background },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {listHeader}
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ marginBottom: 18 }}>
              <ArticleCardSkeleton palette={palette} />
            </View>
          ))}
        </ScrollView>
      </Screen>
    );
  }

  if (error && items.length === 0) {
    return (
      <Screen
        style={{ backgroundColor: palette.background }}
        safeAreaEdges={["left", "right"]}
      >
        <View style={listStyles.errorWrap}>
          <Icon source="alert-circle-outline" size={48} color="#C8776E" />
          <Text style={{ color: palette.secondary, textAlign: "center" }}>
            {String(getResponseError(error))}
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
      <FlashList
        data={items}
        renderItem={({ item }) => (
          <ArticleCard
            item={item}
            palette={palette}
            onPressIn={() => prefetchArticleCover(item.coverImageUrl)}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/education/articles/[id]",
                params: { id: item.id },
              })
            }
          />
        )}
        keyExtractor={(item) => item.id}
        estimatedItemSize={440}
        contentContainerStyle={{
          ...listStyles.content,
          backgroundColor: palette.background,
        }}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View style={{ height: 18 }} />}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              style={listStyles.footer}
              color={palette.accent}
            />
          ) : null
        }
        ListEmptyComponent={<EmptyContent palette={palette} />}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

// ─── list styles ──────────────────────────────────────────────────────────────

const listStyles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  footer: {
    marginTop: 20,
    marginBottom: 8,
  },
  errorWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
});
