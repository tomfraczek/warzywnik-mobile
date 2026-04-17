import { getResponseError } from "@/src/api/axios";
import { ArticleListItem } from "@/src/api/queries/articles/types";
import { useGetArticles } from "@/src/api/queries/articles/useGetArticles";
import { Screen } from "@/src/components/Screen";
import { radius, spacing } from "@/src/theme/ui";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  MD3Theme,
  Text,
  useTheme,
} from "react-native-paper";

type ChipOption = { label: string; value: string | null };

const CONTEXT_FILTERS: ChipOption[] = [
  { label: "Wszystkie", value: null },
  { label: "Balkon", value: "BALCONY" },
  { label: "Grządka", value: "BED" },
  { label: "Szklarnia", value: "GREENHOUSE" },
];

const SEASON_FILTERS: ChipOption[] = [
  { label: "Wszystkie", value: null },
  { label: "Wiosna", value: "SPRING" },
  { label: "Lato", value: "SUMMER" },
  { label: "Jesień", value: "AUTUMN" },
  { label: "Zima", value: "WINTER" },
];

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

const getArticleTags = (item: ArticleListItem) => {
  const tags: string[] = [];

  if (item.seasons.length > 0) {
    tags.push(...item.seasons.slice(0, 2));
  }

  if (item.months.length > 0) {
    tags.push(
      ...item.months.slice(0, 2).map((month) => MONTH_LABELS[month - 1]),
    );
  }

  return tags;
};

export default function ArticlesScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();

  const [activeContext, setActiveContext] = useState<string | null>(null);
  const [activeSeason, setActiveSeason] = useState<string | null>(null);
  const [activeMonth, setActiveMonth] = useState<number | null>(null);

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error,
  } = useGetArticles({
    limit: 20,
    context: activeContext ?? undefined,
    season: activeSeason ?? undefined,
    month: activeMonth ?? undefined,
  });

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages],
  );

  const renderFilters = () => (
    <View style={styles.filtersCard}>
      <Text style={styles.filterTitle}>Filtry</Text>

      <View style={styles.filterBlock}>
        <Text style={styles.filterSubtitle}>Kontekst</Text>
        <View style={styles.filterRowWrap}>
          {CONTEXT_FILTERS.map((filter) => {
            const isActive = filter.value === activeContext;
            return (
              <Pressable
                key={filter.label}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
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

      <View style={styles.filterBlock}>
        <Text style={styles.filterSubtitle}>Sezon</Text>
        <View style={styles.filterRowWrap}>
          {SEASON_FILTERS.map((filter) => {
            const isActive = filter.value === activeSeason;
            return (
              <Pressable
                key={filter.label}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
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

      <View style={styles.filterBlock}>
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
              Wszystkie
            </Text>
          </Pressable>

          {MONTH_LABELS.map((label, index) => {
            const month = index + 1;
            const isActive = activeMonth === month;

            return (
              <Pressable
                key={label}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveMonth(isActive ? null : month)}
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
  );

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
            <View style={styles.tagsRow}>
              {tags.map((tag) => (
                <View key={`${item.id}-${tag}`} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <Screen safeAreaEdges={["left", "right"]}>
      <FlashList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={240}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderFilters}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.25}
        refreshing={isFetching && !isFetchingNextPage}
        onRefresh={() => refetch()}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerWrap}>
              <ActivityIndicator />
            </View>
          ) : (
            <View style={styles.centerWrap}>
              <Text style={styles.emptyText}>
                {error
                  ? String(getResponseError(error))
                  : "Brak artykułów dla wybranych filtrów."}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    listContent: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
    },
    centerWrap: {
      paddingVertical: spacing.xl,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
    },
    filtersCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      padding: spacing.md,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    filterTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    filterSubtitle: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.onSurfaceVariant,
    },
    filterBlock: {
      gap: spacing.xs,
    },
    filterRowWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    filterChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
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
      fontWeight: "500",
      color: theme.colors.onSurfaceVariant,
    },
    filterChipTextActive: {
      color: theme.colors.onPrimary,
    },
    card: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      overflow: "hidden",
      marginBottom: spacing.md,
    },
    cover: {
      width: "100%",
      height: 160,
      backgroundColor: theme.colors.surfaceVariant,
    },
    cardBody: {
      padding: spacing.md,
      gap: spacing.xs,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    cardExcerpt: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.onSurfaceVariant,
    },
    tagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    tagChip: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: theme.colors.surfaceVariant,
    },
    tagText: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    footerLoader: {
      paddingVertical: spacing.md,
    },
  });
