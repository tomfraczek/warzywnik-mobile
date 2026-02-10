import { ArticleListItem } from "@/src/api/queries/articles/types";
import { useGetArticles } from "@/src/api/queries/articles/useGetArticles";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { EmptyState } from "../_components/EmptyState";

const CONTEXT_LABELS: Record<string, string> = {
  planning: "Planowanie",
  soil_preparation: "Przygotowanie gleby",
  sowing: "Siew",
  harvest: "Zbiory",
  problem_solving: "Rozwiązywanie problemów",
  learning: "Nauka",
};

const formatContextLabel = (value: string) => {
  const key = value.toLowerCase();
  return (
    CONTEXT_LABELS[key] ||
    value
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/(^|\s)\p{L}/gu, (match) => match.toUpperCase())
  );
};

const getArticleTags = (article: ArticleListItem) =>
  article.contexts?.map(formatContextLabel) ?? [];

const CONTEXT_FILTERS = [
  { label: "Wszystkie", value: null },
  { label: "Planowanie", value: "planning" },
  { label: "Przygotowanie gleby", value: "soil_preparation" },
  { label: "Siew", value: "sowing" },
  { label: "Zbiory", value: "harvest" },
  { label: "Rozwiązywanie problemów", value: "problem_solving" },
  { label: "Nauka", value: "learning" },
];

const SEASON_FILTERS = [
  { label: "Wszystkie sezony", value: null },
  { label: "Zima", value: "winter" },
  { label: "Wiosna", value: "spring" },
  { label: "Lato", value: "summer" },
  { label: "Jesień", value: "autumn" },
];

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

export default function ArticlesIndexScreen() {
  const router = useRouter();
  const [activeContext, setActiveContext] = useState<string | null>(null);
  const [activeSeason, setActiveSeason] = useState<string | null>(null);
  const [activeMonth, setActiveMonth] = useState<number | null>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
    isFetching,
  } = useGetArticles({
    context: activeContext ?? undefined,
    season: activeSeason ?? undefined,
    month: activeMonth ?? undefined,
  });

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages],
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.center}>
        <EmptyState
          title="Nie udało się pobrać artykułów"
          subtitle="Sprawdź połączenie i spróbuj ponownie."
          actionLabel="Odśwież"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <EmptyState
          title="Brak artykułów"
          subtitle="Nowe poradniki pojawią się wkrótce."
          actionLabel="Odśwież"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  const renderItem = ({ item }: { item: ArticleListItem }) => {
    const tags = getArticleTags(item);

    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/education/[slug]",
            params: { slug: item.slug },
          })
        }
      >
        {item.coverImageUrl ? (
          <Image
            source={{ uri: item.coverImageUrl }}
            contentFit="cover"
            style={styles.cover}
          />
        ) : null}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.excerpt ? (
            <Text style={styles.cardExcerpt} numberOfLines={3}>
              {item.excerpt}
            </Text>
          ) : null}
          {tags.length > 0 ? (
            <View style={styles.chips}>
              {tags.map((tag) => (
                <View key={`${item.id}-${tag}`} style={styles.chip}>
                  <Text style={styles.chipText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlashList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={220}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Filtruj po kontekście</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContent}
            >
              {CONTEXT_FILTERS.map((filter) => {
                const isActive = filter.value === activeContext;
                return (
                  <Pressable
                    key={filter.label}
                    style={[
                      styles.filterChip,
                      isActive && styles.filterChipActive,
                    ]}
                    onPress={() => setActiveContext(filter.value)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              style={styles.expandButton}
              onPress={() => setShowMoreFilters((prev) => !prev)}
            >
              <Text style={styles.expandButtonText}>
                {showMoreFilters
                  ? "Ukryj więcej filtrów"
                  : "Pokaż więcej filtrów"}
              </Text>
            </Pressable>

            {showMoreFilters ? (
              <View style={styles.moreFilters}>
                <Text style={styles.filterSubtitle}>Sezon</Text>
                <View style={styles.filterRowWrap}>
                  {SEASON_FILTERS.map((filter) => {
                    const isActive = filter.value === activeSeason;
                    return (
                      <Pressable
                        key={filter.label}
                        style={[
                          styles.filterChip,
                          isActive && styles.filterChipActive,
                        ]}
                        onPress={() => setActiveSeason(filter.value)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            isActive && styles.filterChipTextActive,
                          ]}
                        >
                          {filter.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.filterSubtitle}>Miesiąc</Text>
                <View style={styles.filterRowWrap}>
                  <Pressable
                    style={[
                      styles.filterChip,
                      activeMonth === null && styles.filterChipActive,
                    ]}
                    onPress={() => setActiveMonth(null)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        activeMonth === null && styles.filterChipTextActive,
                      ]}
                    >
                      Wszystkie miesiące
                    </Text>
                  </Pressable>
                  {MONTH_LABELS.map((label, index) => {
                    const value = index + 1;
                    const isActive = activeMonth === value;
                    return (
                      <Pressable
                        key={label}
                        style={[
                          styles.filterChip,
                          isActive && styles.filterChipActive,
                        ]}
                        onPress={() => setActiveMonth(value)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            isActive && styles.filterChipTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
        }
        onEndReached={() => fetchNextPage()}
        onEndReachedThreshold={0.6}
        refreshing={isFetching && !isFetchingNextPage}
        onRefresh={() => refetch()}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  filterSection: {
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  filterSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  filterContent: {
    gap: 8,
  },
  filterRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterChipActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  filterChipText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  expandButton: {
    alignSelf: "flex-start",
  },
  expandButtonText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "600",
  },
  moreFilters: {
    gap: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    overflow: "hidden",
    marginBottom: 16,
  },
  cover: {
    width: "100%",
    height: 160,
    backgroundColor: "#f3f4f6",
  },
  cardBody: {
    padding: 14,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  cardExcerpt: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 18,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
  },
  chipText: {
    fontSize: 11,
    color: "#374151",
  },
  footer: {
    paddingVertical: 12,
  },
});
