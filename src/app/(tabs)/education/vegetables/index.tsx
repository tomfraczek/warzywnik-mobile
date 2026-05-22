import { getResponseError } from "@/src/api/axios";
import { useGetPopularVegetables } from "@/src/api/queries/analytics/useGetPopularVegetables";
import { VegetableListItem } from "@/src/api/queries/vegetables/types";
import { useGetVegetables } from "@/src/api/queries/vegetables/useGetVegetables";
import { Screen } from "@/src/components/Screen";
import { FavoriteButton } from "@/src/components/ui/FavoriteButton";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  TextInput as RNTextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
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

// ─── helpers ────────────────────────────────────────────────────────────────

const BOTANICAL_FAMILY_LABELS: Record<string, string> = {
  SOLANACEAE: "Psiankowate",
  CUCURBITACEAE: "Dyniowate",
  BRASSICACEAE: "Kapustowate",
  AMARYLLIDACEAE: "Amarylkowate",
  APIACEAE: "Selerowate",
  FABACEAE: "Bobowate",
  AMARANTHACEAE: "Szarłatowate",
  ASTERACEAE: "Astrowate",
  ASPARAGACEAE: "Szparagowate",
  POLYGONACEAE: "Rdestowate",
  MALVACEAE: "Ślazowate",
  POACEAE: "Trawy",
};

const getFamilyLabel = (family: string | null) => {
  if (!family) return null;
  return BOTANICAL_FAMILY_LABELS[family] ?? family;
};

// ─── skeleton ───────────────────────────────────────────────────────────────

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

function VegetableCardSkeleton() {
  const shimmer = useShimmer();
  return (
    <View style={skeletonStyles.card}>
      <Animated.View style={[skeletonStyles.image, shimmer]} />
      <View style={skeletonStyles.body}>
        <Animated.View style={[skeletonStyles.tag, shimmer]} />
        <Animated.View style={[skeletonStyles.titleLine, shimmer]} />
        <Animated.View style={[skeletonStyles.titleLineShort, shimmer]} />
        <Animated.View style={[skeletonStyles.latinLine, shimmer]} />
        <Animated.View style={[skeletonStyles.descLine, shimmer]} />
        <Animated.View style={[skeletonStyles.descLineShort, shimmer]} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8ECE7",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 210,
    backgroundColor: "#EBF0EB",
  },
  body: {
    padding: 20,
    gap: 10,
  },
  tag: {
    width: 90,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#DDE8E1",
  },
  titleLine: {
    width: "75%",
    height: 22,
    borderRadius: 6,
    backgroundColor: "#DDE8E1",
  },
  titleLineShort: {
    width: "45%",
    height: 22,
    borderRadius: 6,
    backgroundColor: "#DDE8E1",
  },
  latinLine: {
    width: "55%",
    height: 16,
    borderRadius: 6,
    backgroundColor: "#E5ECEA",
  },
  descLine: {
    width: "100%",
    height: 14,
    borderRadius: 6,
    backgroundColor: "#E5ECEA",
  },
  descLineShort: {
    width: "70%",
    height: 14,
    borderRadius: 6,
    backgroundColor: "#E5ECEA",
  },
});

// ─── sub-components ─────────────────────────────────────────────────────────

function VegetableCard({
  item,
  onPress,
}: {
  item: VegetableListItem;
  onPress: () => void;
}) {
  const familyLabel = getFamilyLabel(item.botanicalFamily);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      android_ripple={null}
      style={({ pressed }) => pressed && { opacity: 0.7 }}
    >
      <View style={cardStyles.card}>
        {/* hero image */}
        <View style={cardStyles.imageWrap}>
          <View style={cardStyles.imagePlaceholder}>
            <Icon source="image-outline" size={40} color="#C0D5C8" />
          </View>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={cardStyles.image}
              contentFit="cover"
              transition={350}
            />
          ) : null}
          <FavoriteButton targetType="VEGETABLE" targetSlug={item.slug} />
        </View>

        {/* content */}
        <View style={cardStyles.body}>
          {familyLabel ? (
            <View style={cardStyles.familyTag}>
              <Text style={cardStyles.familyTagText}>{familyLabel}</Text>
            </View>
          ) : null}

          <Text style={cardStyles.name}>{item.name}</Text>

          {item.latinName ? (
            <Text style={cardStyles.latinName}>{item.latinName}</Text>
          ) : null}

          {item.description ? (
            <Text style={cardStyles.description} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

// ─── popular vegetables ─────────────────────────────────────────────────────

function PopularVegetablesSection({
  palette,
  onPressItem,
  onOpenStats,
}: {
  palette: ReturnType<typeof buildPalette>;
  onPressItem: (id: string) => void;
  onOpenStats: () => void;
}) {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayMs = 24 * 60 * 60 * 1000;
  const windowDays = Math.min(
    365,
    Math.max(
      1,
      Math.floor((now.getTime() - startOfYear.getTime()) / dayMs) + 1,
    ),
  );

  const { data, isLoading } = useGetPopularVegetables({
    limit: 10,
    sort: "adds",
    windowDays,
  });

  const items = (data?.items ?? []).filter((item) => item.vegetable);

  if (!isLoading && items.length === 0) return null;

  return (
    <View style={popularStyles.wrap}>
      <View style={popularStyles.headerRow}>
        <Text style={[popularStyles.title, { color: palette.heading }]}>
          Popularne warzywa w tym sezonie
        </Text>
        <TouchableOpacity onPress={onOpenStats} activeOpacity={0.8}>
          <Text style={[popularStyles.statsLink, { color: palette.accent }]}>
            Zobacz statystyki
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={popularStyles.row}
      >
        {isLoading
          ? [0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  popularStyles.chip,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                  },
                ]}
              >
                <View
                  style={[
                    popularStyles.chipImg,
                    { backgroundColor: palette.imagePlaceholderBg },
                  ]}
                />
                <View
                  style={[
                    popularStyles.chipNameSkel,
                    { backgroundColor: palette.border },
                  ]}
                />
              </View>
            ))
          : items.map((pop, index) => (
              <TouchableOpacity
                key={pop.vegetableSlug}
                onPress={() => {
                  if (!pop.vegetable) return;
                  onPressItem(pop.vegetable.id);
                }}
                activeOpacity={0.75}
                style={[
                  popularStyles.chip,
                  {
                    backgroundColor: palette.cardBg,
                    borderColor: palette.cardBorder,
                  },
                ]}
              >
                {index < 3 ? (
                  <View style={popularStyles.rankBadge}>
                    <Icon
                      source={index === 0 ? "medal" : "medal-outline"}
                      size={14}
                      color={
                        index === 0
                          ? "#D9A200"
                          : index === 1
                            ? "#8F98A3"
                            : "#B4743E"
                      }
                    />
                    <Text style={popularStyles.rankText}>{index + 1}</Text>
                  </View>
                ) : null}

                {pop.vegetable?.imageUrl ? (
                  <Image
                    source={{ uri: pop.vegetable.imageUrl }}
                    style={popularStyles.chipImg}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={[
                      popularStyles.chipImg,
                      { backgroundColor: palette.imagePlaceholderBg },
                    ]}
                  >
                    <Icon
                      source="sprout-outline"
                      size={20}
                      color={palette.accent}
                    />
                  </View>
                )}
                <Text
                  style={[popularStyles.chipName, { color: palette.heading }]}
                  numberOfLines={2}
                >
                  {pop.vegetable?.name ?? pop.vegetableSlug}
                </Text>
              </TouchableOpacity>
            ))}
      </ScrollView>
    </View>
  );
}

const popularStyles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  title: { fontSize: 17, fontWeight: "700" },
  statsLink: {
    fontSize: 13,
    fontWeight: "700",
  },
  row: { gap: 10, paddingBottom: 4 },
  chip: {
    position: "relative",
    width: 100,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
  },
  rankBadge: {
    position: "absolute",
    right: 6,
    top: 6,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "#E1E6E2",
  },
  rankText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2F3932",
  },
  chipImg: {
    width: 100,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  chipName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 6,
    paddingVertical: 8,
    lineHeight: 16,
  },
  chipNameSkel: {
    width: 64,
    height: 12,
    borderRadius: 6,
    marginVertical: 10,
  },
});

function ListHeader({
  query,
  onQueryChange,
  total,
  isLoading,
  palette,
  onPopularPress,
  onOpenPopularStats,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  total: number | undefined;
  isLoading: boolean;
  palette: ReturnType<typeof buildPalette>;
  onPopularPress: (id: string) => void;
  onOpenPopularStats: () => void;
}) {
  return (
    <View style={headerStyles.wrap}>
      <PopularVegetablesSection
        palette={palette}
        onPressItem={onPopularPress}
        onOpenStats={onOpenPopularStats}
      />
      {/* search bar */}
      <View
        style={[
          headerStyles.searchBar,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      >
        <Icon source="magnify" size={21} color={palette.searchIcon} />
        <RNTextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Szukaj warzywa..."
          placeholderTextColor={palette.searchPlaceholder}
          style={[headerStyles.searchInput, { color: palette.heading }]}
          selectionColor={palette.accent}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {/* title + count */}
      <View style={headerStyles.titleRow}>
        <Text style={[headerStyles.title, { color: palette.heading }]}>
          Warzywa
        </Text>
        {!isLoading && total !== undefined ? (
          <Text style={[headerStyles.count, { color: palette.secondary }]}>
            {total} {total === 1 ? "wynik" : total < 5 ? "wyniki" : "wyników"}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function EmptyContent() {
  return (
    <View style={emptyStyles.wrap}>
      <Icon source="sprout-outline" size={52} color="#C0D5C8" />
      <Text style={emptyStyles.title}>Nie znaleziono warzyw</Text>
      <Text style={emptyStyles.subtitle}>
        Spróbuj zmienić frazę wyszukiwania.
      </Text>
    </View>
  );
}

// ─── screen ─────────────────────────────────────────────────────────────────

export default function VegetablesIndexScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetVegetables({
    q: debouncedQuery.trim() ? debouncedQuery : undefined,
    limit: 20,
  });

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages],
  );

  // total comes from the first page of the API response
  const total = data?.pages[0]?.total;

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <Screen
        style={{ backgroundColor: palette.background }}
        safeAreaEdges={["left", "right"]}
      >
        <ScrollView
          contentContainerStyle={[
            screenStyles.listContent,
            { backgroundColor: palette.background },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <ListHeader
            query={query}
            onQueryChange={setQuery}
            total={undefined}
            isLoading={true}
            palette={palette}
            onPopularPress={(id) =>
              router.push(`/(tabs)/education/vegetables/${id}`)
            }
            onOpenPopularStats={() =>
              router.push("/(tabs)/education/vegetables/statistics")
            }
          />
          {[0, 1, 2, 3].map((i) => (
            <View key={i}>
              <VegetableCardSkeleton />
              {i < 3 ? <View style={screenStyles.separator} /> : null}
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
        <View style={screenStyles.errorWrap}>
          <Icon source="alert-circle-outline" size={48} color="#C8776E" />
          <Text style={[screenStyles.errorText, { color: palette.secondary }]}>
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
      <FlatList
        data={isLoading && items.length === 0 ? [] : items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          screenStyles.listContent,
          { backgroundColor: palette.background },
        ]}
        ListHeaderComponent={
          <ListHeader
            query={query}
            onQueryChange={setQuery}
            total={total}
            isLoading={isLoading}
            palette={palette}
            onPopularPress={(id) =>
              router.push(`/(tabs)/education/vegetables/${id}`)
            }
            onOpenPopularStats={() =>
              router.push("/(tabs)/education/vegetables/statistics")
            }
          />
        }
        renderItem={({ item }) => (
          <VegetableCard
            item={item}
            onPress={() =>
              router.push(`/(tabs)/education/vegetables/${item.id}`)
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={screenStyles.separator} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.8}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={screenStyles.footerLoading}>
              <ActivityIndicator color={palette.accent} size="small" />
            </View>
          ) : null
        }
        ListEmptyComponent={isLoading ? null : <EmptyContent />}
      />
    </Screen>
  );
}

// ─── palette ────────────────────────────────────────────────────────────────

function buildPalette(dark: boolean) {
  return {
    background: dark ? "#141816" : "#F7F8F5",
    surface: dark ? "#1D221F" : "#F0F3EE",
    border: dark ? "#2B332F" : "#E7ECE6",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
    meta: dark ? "#7A8880" : "#97A29B",
    accent: dark ? "#8DB89A" : "#5E8A70",
    searchPlaceholder: dark ? "#98A49C" : "#8A948D",
    searchIcon: dark ? "#9AA59E" : "#7F8B84",
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "#252D29" : "#E8ECE7",
    familyTagBg: dark ? "#1F2E25" : "#EBF4EF",
    familyTagText: dark ? "#88B89A" : "#4A7A60",
    imagePlaceholderBg: dark ? "#1B2620" : "#EEF5F0",
  };
}

// ─── styles ─────────────────────────────────────────────────────────────────

const headerStyles = StyleSheet.create({
  wrap: {
    paddingBottom: 20,
  },
  searchBar: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    paddingVertical: 0,
    fontSize: 16,
  },
  titleRow: {
    marginTop: 20,
    marginBottom: 4,
    gap: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  count: {
    fontSize: 14,
    fontWeight: "400",
    marginTop: 4,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8ECE7",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  imageWrap: {
    width: "100%",
    height: 210,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  imagePlaceholder: {
    width: "100%",
    height: 210,
    backgroundColor: "#EEF5F0",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 20,
  },
  familyTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EBF4EF",
    marginBottom: 12,
  },
  familyTagText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#4A7A60",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1D2420",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  latinName: {
    fontSize: 15,
    fontStyle: "italic",
    color: "#7A8880",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: "#6E7972",
  },
});

const emptyStyles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: 64,
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D2420",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#7A8880",
    textAlign: "center",
  },
});

const screenStyles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 32,
  },
  separator: {
    height: 16,
  },
  loadingWrap: {
    paddingVertical: 80,
    alignItems: "center",
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: "center",
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
});
