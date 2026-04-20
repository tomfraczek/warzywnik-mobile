import { getResponseError } from "@/src/api/axios";
import { Pest } from "@/src/api/queries/pests/types";
import { useGetPests } from "@/src/api/queries/pests/useGetPests";
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
    pestIconBg: dark ? "#23200F" : "#F5F0E0",
    pestIconColor: dark ? "#C8B870" : "#7A6830",
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

function PestCardSkeleton() {
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
    backgroundColor: "#F0EBD0",
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

// ─── pest card ───────────────────────────────────────────────────────────────

function PestCard({
  item,
  onPress,
  palette,
}: {
  item: Pest;
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
            { backgroundColor: palette.pestIconBg },
          ]}
        >
          <Icon source="bug-outline" size={24} color={palette.pestIconColor} />
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
          targetType="PEST"
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
  description: {
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
          placeholder="Szukaj szkodnika..."
          placeholderTextColor={palette.searchPlaceholder}
          style={[headerStyles.searchInput, { color: palette.heading }]}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
      <View style={headerStyles.titleBlock}>
        <Text style={[headerStyles.title, { color: palette.heading }]}>
          Szkodniki
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
        style={[emptyStyles.iconWrap, { backgroundColor: palette.pestIconBg }]}
      >
        <Icon source="magnify" size={32} color={palette.pestIconColor} />
      </View>
      <Text style={[emptyStyles.title, { color: palette.heading }]}>
        Nie znaleziono szkodników
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

export default function PestsIndexScreen() {
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
  } = useGetPests({
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
          renderItem={() => <PestCardSkeleton />}
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
          <PestCard
            item={item}
            onPress={() => router.push(`/(tabs)/education/pests/${item.id}`)}
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
