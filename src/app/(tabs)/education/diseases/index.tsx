import { getResponseError } from "@/src/api/axios";
import { DiseaseListItem } from "@/src/api/queries/diseases/types";
import { useGetDiseases } from "@/src/api/queries/diseases/useGetDiseases";
import { Screen } from "@/src/components/Screen";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
    tagBg: dark ? "#2E1A1A" : "#FBF0EF",
    tagText: dark ? "#C88A85" : "#9A4A45",
    innerCardBg: dark ? "#161C19" : "#F8FAF8",
    innerCardBorder: dark ? "#222B26" : "#EBF0EA",
  };
}

// ─── skeleton ────────────────────────────────────────────────────────────────

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

function DiseaseCardSkeleton() {
  const shimmer = useShimmer();
  return (
    <View style={skeletonStyles.card}>
      <View style={skeletonStyles.body}>
        <Animated.View style={[skeletonStyles.tag, shimmer]} />
        <Animated.View style={[skeletonStyles.titleLine, shimmer]} />
        <Animated.View style={[skeletonStyles.titleLineShort, shimmer]} />
        <Animated.View style={[skeletonStyles.descLine, shimmer]} />
        <Animated.View style={[skeletonStyles.descLineShort, shimmer]} />
        <View style={skeletonStyles.blocksRow}>
          <Animated.View style={[skeletonStyles.block, shimmer]} />
          <Animated.View style={[skeletonStyles.block, shimmer]} />
        </View>
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
  body: {
    padding: 20,
    gap: 10,
  },
  tag: {
    width: 72,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#F5E8E8",
  },
  titleLine: {
    width: "72%",
    height: 22,
    borderRadius: 6,
    backgroundColor: "#DDE8E1",
  },
  titleLineShort: {
    width: "48%",
    height: 22,
    borderRadius: 6,
    backgroundColor: "#DDE8E1",
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
  blocksRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  block: {
    flex: 1,
    height: 64,
    borderRadius: 14,
    backgroundColor: "#EBF0EA",
  },
});

// ─── sub-components ───────────────────────────────────────────────────────────

function DiseaseCard({
  item,
  onPress,
  palette,
}: {
  item: DiseaseListItem;
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
        {/* name */}
        <Text style={[cardStyles.name, { color: palette.heading }]}>
          {item.name}
        </Text>

        {/* description */}
        {item.description ? (
          <Text
            style={[cardStyles.description, { color: palette.secondary }]}
            numberOfLines={3}
          >
            {item.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

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
          placeholder="Szukaj choroby..."
          placeholderTextColor={palette.searchPlaceholder}
          style={[headerStyles.searchInput, { color: palette.heading }]}
          selectionColor={palette.accent}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>
      <View style={headerStyles.titleRow}>
        <Text style={[headerStyles.title, { color: palette.heading }]}>
          Choroby
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

function EmptyContent({
  palette,
}: {
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <View style={emptyStyles.wrap}>
      <Icon source="bacteria-outline" size={52} color="#C8B0B0" />
      <Text style={[emptyStyles.title, { color: palette.heading }]}>
        Nie znaleziono chorób
      </Text>
      <Text style={[emptyStyles.subtitle, { color: palette.meta }]}>
        Spróbuj zmienić frazę wyszukiwania.
      </Text>
    </View>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function DiseasesIndexScreen() {
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
  } = useGetDiseases({
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
          />
          {[0, 1, 2, 3].map((i) => (
            <View key={i}>
              <DiseaseCardSkeleton />
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
        data={items}
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
          />
        }
        renderItem={({ item }) => (
          <DiseaseCard
            item={item}
            palette={palette}
            onPress={() => router.push(`/(tabs)/education/diseases/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={screenStyles.separator} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.6}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={screenStyles.footerLoading}>
              <ActivityIndicator color={palette.accent} size="small" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? null : <EmptyContent palette={palette} />
        }
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

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
    overflow: "hidden",
    padding: 20,
  },
  tag: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  name: {
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 16,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "600",
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
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
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
