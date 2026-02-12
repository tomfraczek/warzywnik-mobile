import { getResponseError } from "@/src/api/axios";
import { ArticleListItem } from "@/src/api/queries/articles/types";
import { useGetArticles } from "@/src/api/queries/articles/useGetArticles";
import { Screen } from "@/src/components/Screen";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, MD3Theme, useTheme } from "react-native-paper";
import { EmptyState } from "../_components/EmptyState";

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
  { label: "Wszystkie", value: null },
  { label: "Wiosna", value: "spring" },
  { label: "Lato", value: "summer" },
  { label: "Jesień", value: "autumn" },
  { label: "Zima", value: "winter" },
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

const formatContextLabel = (value: string) => {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/(^|\s)\p{L}/gu, (match) => match.toUpperCase());
};

const formatSeasonLabel = (value: string) => {
  const normalized = value.toLowerCase();
  if (normalized === "spring") return "Wiosna";
  if (normalized === "summer") return "Lato";
  if (normalized === "autumn" || normalized === "fall") return "Jesień";
  if (normalized === "winter") return "Zima";
  return value;
};

const getArticleTags = (item: ArticleListItem) => {
  const contextTags = item.contexts?.map(formatContextLabel) ?? [];
  const seasonTags = item.seasons?.map(formatSeasonLabel) ?? [];
  const monthTags = (item.months ?? [])
    .map((month) => MONTH_LABELS[month - 1])
    .filter(Boolean);

  return [...contextTags, ...seasonTags, ...monthTags];
};

export default function ArticlesIndexScreen() {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const [activeContext, setActiveContext] = useState<string | null>(null);
  const [activeSeason, setActiveSeason] = useState<string | null>(null);
  const [activeMonth, setActiveMonth] = useState<number | null>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const queryParams = useMemo(
    () => ({
      context: activeContext ?? undefined,
      season: activeSeason ?? undefined,
      month: activeMonth ?? undefined,
      limit: 20,
    }),
    [activeContext, activeSeason, activeMonth],
  );

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useGetArticles(queryParams);

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages],
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderItem = ({ item }: { item: ArticleListItem }) => {
    const tags = getArticleTags(item);

    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/education/articles/[id]",
            params: { id: item.id },
          })
        }
      >
        {item.coverImageUrl ? (
          <Image
            source={{ uri: item.coverImageUrl }}
            style={styles.cover}
            contentFit="cover"
          />
        ) : (
          <View style={styles.cover} />
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardExcerpt} numberOfLines={3}>
            {item.excerpt}
          </Text>
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

  if (isLoading && items.length === 0) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (error && items.length === 0) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {String(getResponseError(error))}
          </Text>
          <Button mode="outlined" onPress={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <FlashList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={220}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Filtry</Text>
              <View style={styles.filterContent}>
                <Text style={styles.filterSubtitle}>Kontekst</Text>
                <View style={styles.filterRowWrap}>
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
                </View>
              </View>
              <View style={styles.filterContent}>
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
              </View>
              <View style={styles.filterContent}>
                <View style={styles.filterRowWrap}>
                  <Text style={styles.filterSubtitle}>Miesiąc</Text>
                  <Pressable
                    style={styles.expandButton}
                    onPress={() => setShowMoreFilters((prev) => !prev)}
                  >
                    <Text style={styles.expandButtonText}>
                      {showMoreFilters ? "Zwiń" : "Pokaż więcej"}
                    </Text>
                  </Pressable>
                </View>
                <View style={styles.filterRowWrap}>
                  {(showMoreFilters
                    ? MONTH_LABELS
                    : MONTH_LABELS.slice(0, 6)
                  ).map((label, index) => {
                    const monthValue = index + 1;
                    const isActive = activeMonth === monthValue;
                    return (
                      <Pressable
                        key={label}
                        style={[
                          styles.filterChip,
                          isActive && styles.filterChipActive,
                        ]}
                        onPress={() =>
                          setActiveMonth(isActive ? null : monthValue)
                        }
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
            </View>
          }
          onEndReached={handleLoadMore}
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
          ListEmptyComponent={
            <EmptyState
              title="Brak artykułów"
              subtitle="Zmień filtry lub spróbuj ponownie później."
            />
          }
        />
      </View>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
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
    },
    errorText: {
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: "center",
    },
    filterSection: {
      paddingTop: 16,
      paddingBottom: 8,
      gap: 12,
    },
    filterTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    filterSubtitle: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.onSurfaceVariant,
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
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderColor: "transparent",
    },
    filterChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterChipText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontWeight: "500",
    },
    filterChipTextActive: {
      color: theme.colors.onPrimary,
    },
    expandButton: {
      alignSelf: "flex-start",
    },
    expandButtonText: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: "600",
    },
    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      overflow: "hidden",
      marginBottom: 16,
    },
    cover: {
      width: "100%",
      height: 160,
      backgroundColor: theme.colors.surfaceVariant,
    },
    cardBody: {
      padding: 14,
      gap: 8,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    cardExcerpt: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
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
      backgroundColor: theme.colors.surfaceVariant,
    },
    chipText: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    footer: {
      paddingVertical: 12,
    },
  });
/*
import { ArticleListItem } from "@/src/api/queries/articles/types";
import { useGetArticles } from "@/src/api/queries/articles/useGetArticles";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Screen } from "@/src/components/Screen";
import {
  ActivityIndicator,
  const renderItem = ({ item }: { item: ArticleListItem }) => {
    const tags = getArticleTags(item);

    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          router.push({
              pathname: "/(tabs)/education/articles/[id]",
              params: { id: item.id },
          })
        }
      >
        {item.coverImageUrl ? (
          <Image
            source={{ uri: item.coverImageUrl }}
            style={styles.cover}
            contentFit="cover"
          />
        ) : (
          <View style={styles.cover} />
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardExcerpt} numberOfLines={3}>
            {item.excerpt}
          </Text>
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
    <Screen>
      <View style={styles.container}>
        <FlashList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={220}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Filtry</Text>
              <View style={styles.filterContent}>
                <Text style={styles.filterSubtitle}>Kontekst</Text>
                <View style={styles.filterRowWrap}>
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
                </View>
              </View>
              <View style={styles.filterContent}>
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
              </View>
              <View style={styles.filterContent}>
                <View style={styles.filterRowWrap}>
                  <Text style={styles.filterSubtitle}>Miesiąc</Text>
                  <Pressable
                    style={styles.expandButton}
                    onPress={() => setShowMoreFilters((prev) => !prev)}
                  >
                    <Text style={styles.expandButtonText}>
                      {showMoreFilters ? "Zwiń" : "Pokaż więcej"}
                    </Text>
                  </Pressable>
                </View>
                <View style={styles.filterRowWrap}>
                  {(showMoreFilters
                    ? MONTH_LABELS
                    : MONTH_LABELS.slice(0, 6)
                  ).map((label, index) => {
                    const monthValue = index + 1;
                    const isActive = activeMonth === monthValue;
                    return (
                      <Pressable
                        key={label}
                        style={[
                          styles.filterChip,
                          isActive && styles.filterChipActive,
                        ]}
                        onPress={() =>
                          setActiveMonth(isActive ? null : monthValue)
                        }
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
    </Screen>
  );
                }

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
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
    },
    filterSection: {
      paddingTop: 16,
      paddingBottom: 8,
      gap: 12,
    },
    filterTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    filterSubtitle: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.onSurfaceVariant,
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
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderColor: "transparent",
    },
    filterChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterChipText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontWeight: "500",
    },
    filterChipTextActive: {
      color: theme.colors.onPrimary,
    },
    expandButton: {
      alignSelf: "flex-start",
    },
    expandButtonText: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: "600",
    },
    moreFilters: {
      gap: 10,
    },
    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      overflow: "hidden",
      marginBottom: 16,
    },
    cover: {
      width: "100%",
      height: 160,
      backgroundColor: theme.colors.surfaceVariant,
    },
    cardBody: {
      padding: 14,
      gap: 8,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    cardExcerpt: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
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
      backgroundColor: theme.colors.surfaceVariant,
    },
    chipText: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    footer: {
      paddingVertical: 12,
    },
  });
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
          </Screen>
        );
                    </Text>
                  </Pressable>
      const makeStyles = (theme: MD3Theme) =>
        StyleSheet.create({
          container: {
            flex: 1,
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
          },
          filterSection: {
            paddingTop: 16,
            paddingBottom: 8,
            gap: 12,
          },
          filterTitle: {
            fontSize: 14,
            fontWeight: "600",
            color: theme.colors.onSurface,
          },
          filterSubtitle: {
            fontSize: 12,
            fontWeight: "600",
            color: theme.colors.onSurfaceVariant,
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
            backgroundColor: theme.colors.surfaceVariant,
            borderWidth: 1,
            borderColor: "transparent",
          },
          filterChipActive: {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
          },
          filterChipText: {
            fontSize: 12,
            color: theme.colors.onSurfaceVariant,
            fontWeight: "500",
          },
          filterChipTextActive: {
            color: theme.colors.onPrimary,
          },
          expandButton: {
            alignSelf: "flex-start",
          },
          expandButtonText: {
            fontSize: 12,
            color: theme.colors.primary,
            fontWeight: "600",
          },
          moreFilters: {
            gap: 10,
          },
          card: {
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.colors.outline,
            backgroundColor: theme.colors.surface,
            overflow: "hidden",
            marginBottom: 16,
          },
          cover: {
            width: "100%",
            height: 160,
            backgroundColor: theme.colors.surfaceVariant,
          },
          cardBody: {
            padding: 14,
            gap: 8,
          },
          cardTitle: {
            fontSize: 16,
            fontWeight: "600",
            color: theme.colors.onSurface,
          },
          cardExcerpt: {
            fontSize: 13,
            color: theme.colors.onSurfaceVariant,
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
            backgroundColor: theme.colors.surfaceVariant,
          },
          chipText: {
            fontSize: 11,
            color: theme.colors.onSurfaceVariant,
          },
          footer: {
            paddingVertical: 12,
          },
        });
      */
