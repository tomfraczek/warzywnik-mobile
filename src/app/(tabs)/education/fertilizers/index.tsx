import { getResponseError } from "@/src/api/axios";
import { FertilizerListItem } from "@/src/api/queries/fertilizers/types";
import { useGetFertilizers } from "@/src/api/queries/fertilizers/useGetFertilizers";
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
  RAISES: "Podwyższa pH",
  NEUTRAL: "Neutralny",
  VARIABLE: "Zmienny",
};

const FREQUENCY_LABELS: Record<string, string> = {
  ONE_TIME: "Jednorazowo",
  WEEKLY: "Co tydzień",
  BIWEEKLY: "Co dwa tygodnie",
  MONTHLY: "Co miesiąc",
  SEASONAL: "Sezonowo",
  AS_NEEDED: "Według potrzeb",
};

// ─── palette ─────────────────────────────────────────────────────────────────

function buildPalette(dark: boolean) {
  return {
    dark,
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
    fertIconBg: dark ? "#1E2B22" : "#EFF6EC",
    fertIconColor: dark ? "#7AB88A" : "#4A7C59",
    paramBg: dark ? "#1E2420" : "#F7FAF6",
    paramBorder: dark ? "#2A322E" : "#EAF0E8",
  };
}

// ─── category badge colors ────────────────────────────────────────────────────

const CATEGORY_BADGE: Record<
  string,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  ORGANIC: {
    bg: "#E8F5E2",
    text: "#3E6E33",
    darkBg: "#1E3020",
    darkText: "#8FCB80",
  },
  MINERAL: {
    bg: "#E3EDF7",
    text: "#2E5A8C",
    darkBg: "#1A2A40",
    darkText: "#7AAAD0",
  },
  BIO_STIMULANT: {
    bg: "#E5F7F3",
    text: "#2A7060",
    darkBg: "#1A2E2A",
    darkText: "#72C0B0",
  },
  SOIL_AMENDMENT: {
    bg: "#F5EFE0",
    text: "#7A5A20",
    darkBg: "#302518",
    darkText: "#C8A860",
  },
  PH_ADJUSTER: {
    bg: "#EDE8F5",
    text: "#5A3A8C",
    darkBg: "#22183A",
    darkText: "#A888D8",
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

function CategoryBadge({
  value,
  dark,
}: {
  value?: string | null;
  dark: boolean;
}) {
  if (!value) return null;
  const colors = CATEGORY_BADGE[value];
  if (!colors) return null;
  return (
    <View
      style={[
        badgeStyles.pill,
        { backgroundColor: dark ? colors.darkBg : colors.bg },
      ]}
    >
      <Text
        style={[
          badgeStyles.text,
          { color: dark ? colors.darkText : colors.text },
        ]}
      >
        {CATEGORY_LABELS[value] ?? value}
      </Text>
    </View>
  );
}

function FormBadge({
  value,
  palette,
}: {
  value?: string | null;
  palette: ReturnType<typeof buildPalette>;
}) {
  if (!value) return null;
  return (
    <View
      style={[
        badgeStyles.pill,
        {
          backgroundColor: palette.surface,
          borderWidth: 1,
          borderColor: palette.border,
        },
      ]}
    >
      <Text style={[badgeStyles.text, { color: palette.secondary }]}>
        {FORM_LABELS[value] ?? value}
      </Text>
    </View>
  );
}

function RiskBadge({ value, dark }: { value?: string | null; dark: boolean }) {
  if (!value || value === "LOW") return null;
  const colors = RISK_BADGE[value];
  if (!colors) return null;
  return (
    <View
      style={[
        badgeStyles.pill,
        { backgroundColor: dark ? colors.darkBg : colors.bg },
      ]}
    >
      <Text
        style={[
          badgeStyles.text,
          { color: dark ? colors.darkText : colors.text },
        ]}
      >
        {RISK_LABELS[value] ?? value}
      </Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
  },
});

// ─── param cell ───────────────────────────────────────────────────────────────

function ParamCell({
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
        paramStyles.cell,
        {
          backgroundColor: palette.paramBg,
          borderColor: palette.paramBorder,
        },
      ]}
    >
      <Text style={[paramStyles.label, { color: palette.meta }]}>{label}</Text>
      <Text
        style={[paramStyles.value, { color: palette.heading }]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const paramStyles = StyleSheet.create({
  cell: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 3,
    minWidth: "45%",
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
});

// ─── fertilizer card ──────────────────────────────────────────────────────────

function FertilizerCard({
  item,
  onPress,
  palette,
}: {
  item: FertilizerListItem;
  onPress: () => void;
  palette: ReturnType<typeof buildPalette>;
}) {
  const dark = palette.dark;
  const appMethod = item.applicationMethod
    ? (APPLICATION_LABELS[item.applicationMethod] ?? item.applicationMethod)
    : null;
  const freq = item.recommendedFrequency
    ? (FREQUENCY_LABELS[item.recommendedFrequency] ?? item.recommendedFrequency)
    : null;
  const nitrogen = item.nitrogenEffect
    ? (NUTRIENT_LABELS[item.nitrogenEffect] ?? item.nitrogenEffect)
    : null;
  const ph = item.phEffect ? (PH_LABELS[item.phEffect] ?? item.phEffect) : null;
  const hasParams = !!(appMethod || freq || nitrogen || ph);
  const hasDosage = !!item.dosageGuidance;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      android_ripple={null}
      style={({ pressed }) => pressed && { opacity: 0.7 }}
    >
      <View
        style={[
          fertCardStyles.card,
          {
            backgroundColor: palette.cardBg,
            borderColor: palette.cardBorder,
          },
        ]}
      >
        {/* Tag row */}
        <View style={fertCardStyles.tagRow}>
          <CategoryBadge value={item.category} dark={dark} />
          <FormBadge value={item.form} palette={palette} />
          <RiskBadge value={item.riskLevel} dark={dark} />
        </View>

        {/* Name */}
        <Text
          style={[fertCardStyles.name, { color: palette.heading }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>

        {/* Description */}
        {!!item.description && (
          <Text
            style={[fertCardStyles.description, { color: palette.secondary }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}

        {/* Params grid */}
        {hasParams && (
          <View style={fertCardStyles.paramsGrid}>
            {appMethod ? (
              <ParamCell label="Użycie" value={appMethod} palette={palette} />
            ) : null}
            {freq ? (
              <ParamCell label="Częstotliwość" value={freq} palette={palette} />
            ) : null}
            {nitrogen ? (
              <ParamCell label="Azot" value={nitrogen} palette={palette} />
            ) : null}
            {ph ? (
              <ParamCell label="Wpływ na pH" value={ph} palette={palette} />
            ) : null}
          </View>
        )}

        {/* Dosage footer */}
        {hasDosage && (
          <View
            style={[
              fertCardStyles.dosageWrap,
              { borderTopColor: palette.border },
            ]}
          >
            <Icon source="information-outline" size={14} color={palette.meta} />
            <Text
              style={[fertCardStyles.dosageText, { color: palette.secondary }]}
              numberOfLines={2}
            >
              {item.dosageGuidance}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const fertCardStyles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
    marginTop: 2,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  paramsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  dosageWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  dosageText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});

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

function FertilizerCardSkeleton() {
  const shimmer = useShimmer();
  return (
    <View style={skeletonStyles.card}>
      <View style={skeletonStyles.tagRow}>
        <Animated.View style={[skeletonStyles.tag, shimmer]} />
        <Animated.View style={[skeletonStyles.tagSmall, shimmer]} />
      </View>
      <Animated.View style={[skeletonStyles.nameLine, shimmer]} />
      <Animated.View style={[skeletonStyles.descLine, shimmer]} />
      <Animated.View style={[skeletonStyles.descLineShort, shimmer]} />
      <View style={skeletonStyles.paramsRow}>
        <Animated.View style={[skeletonStyles.paramCell, shimmer]} />
        <Animated.View style={[skeletonStyles.paramCell, shimmer]} />
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
    padding: 18,
    gap: 10,
  },
  tagRow: {
    flexDirection: "row",
    gap: 8,
  },
  tag: {
    width: 90,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#E2EDE0",
  },
  tagSmall: {
    width: 52,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#EAF2E8",
  },
  nameLine: {
    width: "68%",
    height: 22,
    borderRadius: 6,
    backgroundColor: "#DDE8DB",
    marginTop: 2,
  },
  descLine: {
    width: "100%",
    height: 15,
    borderRadius: 6,
    backgroundColor: "#E5EDE3",
  },
  descLineShort: {
    width: "55%",
    height: 15,
    borderRadius: 6,
    backgroundColor: "#EBF1E9",
  },
  paramsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  paramCell: {
    flex: 1,
    height: 60,
    borderRadius: 14,
    backgroundColor: "#F0F5EE",
  },
});

// ─── filters row ──────────────────────────────────────────────────────────────

const ALL_CATEGORIES: { value: string | undefined; label: string }[] = [
  { value: undefined, label: "Wszystkie" },
  { value: "ORGANIC", label: "Organiczne" },
  { value: "MINERAL", label: "Mineralne" },
  { value: "BIO_STIMULANT", label: "Biostymulatory" },
  { value: "SOIL_AMENDMENT", label: "Poprawa gleby" },
  { value: "PH_ADJUSTER", label: "Regulator pH" },
];

function FiltersRow({
  selected,
  onSelect,
  palette,
}: {
  selected: string | undefined;
  onSelect: (v: string | undefined) => void;
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={filterStyles.row}
      style={filterStyles.scroll}
    >
      {ALL_CATEGORIES.map((cat) => {
        const isActive = selected === cat.value;
        return (
          <Pressable
            key={cat.label}
            onPress={() => onSelect(cat.value)}
            style={[
              filterStyles.pill,
              {
                backgroundColor: isActive ? palette.accent : palette.cardBg,
                borderColor: isActive ? palette.accent : palette.border,
              },
            ]}
          >
            <Text
              style={[
                filterStyles.pillText,
                { color: isActive ? "#FFFFFF" : palette.secondary },
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const filterStyles = StyleSheet.create({
  scroll: {
    marginTop: 14,
    marginBottom: 2,
  },
  row: {
    gap: 8,
    paddingBottom: 2,
  },
  pill: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

// ─── list header ──────────────────────────────────────────────────────────────

function ListHeader({
  query,
  onQueryChange,
  total,
  isLoading,
  selectedCategory,
  onSelectCategory,
  palette,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  total: number | undefined;
  isLoading: boolean;
  selectedCategory: string | undefined;
  onSelectCategory: (v: string | undefined) => void;
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
          placeholder="Szukaj nawozu..."
          placeholderTextColor={palette.searchPlaceholder}
          style={[headerStyles.searchInput, { color: palette.heading }]}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <View style={headerStyles.titleBlock}>
        <Text style={[headerStyles.title, { color: palette.heading }]}>
          Nawozy
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
      <FiltersRow
        selected={selectedCategory}
        onSelect={onSelectCategory}
        palette={palette}
      />
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

// ─── empty state ──────────────────────────────────────────────────────────────

function EmptyContent({
  palette,
}: {
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <View style={emptyStyles.wrap}>
      <View
        style={[emptyStyles.iconWrap, { backgroundColor: palette.fertIconBg }]}
      >
        <Icon source="sprout-outline" size={32} color={palette.fertIconColor} />
      </View>
      <Text style={[emptyStyles.title, { color: palette.heading }]}>
        Nie znaleziono nawozów
      </Text>
      <Text style={[emptyStyles.subtitle, { color: palette.secondary }]}>
        Spróbuj zmienić frazę wyszukiwania lub filtry.
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

// ─── screen ───────────────────────────────────────────────────────────────────

export default function FertilizersIndexScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined,
  );
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
  } = useGetFertilizers({
    q: debouncedQuery.trim() ? debouncedQuery : undefined,
    category: selectedCategory,
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

  const listHeader = (
    <ListHeader
      query={query}
      onQueryChange={setQuery}
      total={total}
      isLoading={isLoading}
      selectedCategory={selectedCategory}
      onSelectCategory={setSelectedCategory}
      palette={palette}
    />
  );

  if (isLoading && items.length === 0) {
    return (
      <Screen
        style={{ backgroundColor: palette.background }}
        safeAreaEdges={["left", "right"]}
      >
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(i) => String(i)}
          contentContainerStyle={[
            listStyles.content,
            { backgroundColor: palette.background },
          ]}
          scrollEnabled={false}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          renderItem={() => <FertilizerCardSkeleton />}
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
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => (
          <FertilizerCard
            item={item}
            palette={palette}
            onPress={() =>
              router.push(`/(tabs)/education/fertilizers/${item.id}`)
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
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
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

// ─── list styles ──────────────────────────────────────────────────────────────

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
