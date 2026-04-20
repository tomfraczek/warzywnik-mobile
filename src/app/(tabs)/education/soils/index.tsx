import { getResponseError } from "@/src/api/axios";
import { Soil } from "@/src/api/queries/soils/types";
import { useGetSoils } from "@/src/api/queries/soils/useGetSoils";
import { Screen } from "@/src/components/Screen";
import { FavoriteButton } from "@/src/components/ui/FavoriteButton";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  TextInput as RNTextInput,
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

// ─── palette ─────────────────────────────────────────────────────────────────

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
    soilIconBg: dark ? "#231F17" : "#F5F0E8",
    soilIconColor: dark ? "#B8A882" : "#7A6A4A",
    chevron: dark ? "#4A5550" : "#C0CAC4",
  };
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

function SoilCardSkeleton() {
  const shimmer = useShimmer();
  return (
    <View style={skeletonStyles.card}>
      <Animated.View style={[skeletonStyles.iconBlock, shimmer]} />
      <View style={skeletonStyles.body}>
        <Animated.View style={[skeletonStyles.titleLine, shimmer]} />
        <Animated.View style={[skeletonStyles.subtitleLine, shimmer]} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8ECE7",
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 14,
  },
  iconBlock: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#F0EDE5",
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: 8,
  },
  titleLine: {
    width: "60%",
    height: 20,
    borderRadius: 6,
    backgroundColor: "#DDE8E1",
  },
  subtitleLine: {
    width: "40%",
    height: 14,
    borderRadius: 6,
    backgroundColor: "#E5ECEA",
  },
});

// ─── soil card ───────────────────────────────────────────────────────────────

function slugToSubtitle(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function SoilCard({
  item,
  onPress,
  palette,
}: {
  item: Soil;
  onPress: () => void;
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      android_ripple={null}
      style={({ pressed }) => pressed && { opacity: 0.7 }}
    >
      <View
        style={[
          cardStyles.card,
          { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
        ]}
      >
        <View
          style={[
            cardStyles.iconBadge,
            { backgroundColor: palette.soilIconBg },
          ]}
        >
          <Icon
            source="layers-outline"
            size={24}
            color={palette.soilIconColor}
          />
        </View>
        <View style={cardStyles.textBlock}>
          <Text
            style={[cardStyles.name, { color: palette.heading }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
        </View>
        <FavoriteButton
          targetType="SOIL"
          targetSlug={item.slug}
          variant="inline"
          size={20}
          inactiveColor={palette.chevron}
        />
      </View>
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
});

// ─── list header ─────────────────────────────────────────────────────────────

function ListHeader({
  query,
  onQueryChange,
  total,
  isLoading,
  palette,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  total: number | undefined;
  isLoading: boolean;
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <View style={headerStyles.wrap}>
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
          placeholder="Szukaj gleby..."
          placeholderTextColor={palette.searchPlaceholder}
          style={[headerStyles.searchInput, { color: palette.heading }]}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
      <View style={headerStyles.titleBlock}>
        <Text style={[headerStyles.title, { color: palette.heading }]}>
          Gleby
        </Text>
        {!isLoading && total !== undefined ? (
          <Text style={[headerStyles.count, { color: palette.meta }]}>
            {total}{" "}
            {total === 1
              ? "wynik"
              : total >= 2 && total <= 4
                ? "wyniki"
                : "wyników"}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  wrap: {
    paddingTop: 12,
    paddingBottom: 16,
    gap: 0,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    height: 52,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  titleBlock: {
    marginTop: 20,
    marginBottom: 2,
    gap: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 32,
  },
  count: {
    fontSize: 14,
    lineHeight: 20,
  },
});

// ─── empty state ─────────────────────────────────────────────────────────────

function EmptyContent({
  palette,
}: {
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <View style={emptyStyles.wrap}>
      <View
        style={[emptyStyles.iconWrap, { backgroundColor: palette.soilIconBg }]}
      >
        <Icon source="magnify" size={32} color={palette.soilIconColor} />
      </View>
      <Text style={[emptyStyles.title, { color: palette.heading }]}>
        Nie znaleziono gleb
      </Text>
      <Text style={[emptyStyles.subtitle, { color: palette.secondary }]}>
        Spróbuj zmienić frazę wyszukiwania.
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 32,
    gap: 12,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});

// ─── screen ──────────────────────────────────────────────────────────────────

export default function SoilsIndexScreen() {
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
  } = useGetSoils({
    q: debouncedQuery.trim() ? debouncedQuery : undefined,
    limit: 20,
  });

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages],
  );

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
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          keyExtractor={(i) => String(i)}
          contentContainerStyle={[
            listStyles.content,
            { backgroundColor: palette.background },
          ]}
          scrollEnabled={false}
          ListHeaderComponent={
            <ListHeader
              query={query}
              onQueryChange={setQuery}
              total={undefined}
              isLoading={true}
              palette={palette}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          renderItem={() => <SoilCardSkeleton />}
        />
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
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          listStyles.content,
          { backgroundColor: palette.background },
        ]}
        ListHeaderComponent={
          <ListHeader
            query={query}
            onQueryChange={setQuery}
            total={total}
            isLoading={isLoading}
            palette={palette}
          />
        }
        renderItem={({ item }) => (
          <SoilCard
            item={item}
            onPress={() => router.push(`/(tabs)/education/soils/${item.id}`)}
            palette={palette}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              style={listStyles.footer}
              color={palette.accent}
            />
          ) : null
        }
        ListEmptyComponent={<EmptyContent palette={palette} />}
      />
    </Screen>
  );
}

const listStyles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
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
