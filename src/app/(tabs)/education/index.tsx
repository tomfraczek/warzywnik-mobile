import { ArticleListItem } from "@/src/api/queries/articles/types";
import { useGetArticle } from "@/src/api/queries/articles/useGetArticle";
import { useGetArticles } from "@/src/api/queries/articles/useGetArticles";
import {
  FavoriteItem,
  FavoriteTargetType,
} from "@/src/api/queries/favorites/types";
import { useGetFavoritesGrouped } from "@/src/api/queries/favorites/useGetFavoritesGrouped";
import { getFavoriteDetailParam } from "@/src/api/queries/favorites/utils";
import { VegetableListItem } from "@/src/api/queries/vegetables/types";
import { useGetVegetable } from "@/src/api/queries/vegetables/useGetVegetable";
import { useGetVegetables } from "@/src/api/queries/vegetables/useGetVegetables";
import { Screen } from "@/src/components/Screen";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon, MD3Theme, Text, useTheme } from "react-native-paper";

type CategoryTile = {
  title: string;
  subtitle: string;
  route:
    | "/(tabs)/education/articles"
    | "/(tabs)/education/diseases"
    | "/(tabs)/education/fertilizers"
    | "/(tabs)/education/pests"
    | "/(tabs)/education/soils"
    | "/(tabs)/education/vegetables";
  icon: string;
  tint: string;
  iconBackground: string;
};

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

type CategoryCardProps = {
  item: CategoryTile;
  onPress: () => void;
};

type VegetableCardProps = {
  item: VegetableListItem;
  onPress: () => void;
};

type ArticleCardProps = {
  item: ArticleListItem;
  onPress: () => void;
  onPressIn?: () => void;
};

// ─── favorites config ────────────────────────────────────────────────────────

const FAVORITE_TYPE_CONFIG: Record<
  FavoriteTargetType,
  { label: string; icon: string; route: string }
> = {
  ARTICLE: {
    label: "Artykuł",
    icon: "text-box-search-outline",
    route: "/(tabs)/education/articles",
  },
  VEGETABLE: {
    label: "Warzywo",
    icon: "sprout-outline",
    route: "/(tabs)/education/vegetables",
  },
  SOIL: {
    label: "Gleba",
    icon: "layers-outline",
    route: "/(tabs)/education/soils",
  },
  DISEASE: {
    label: "Choroba",
    icon: "bacteria-outline",
    route: "/(tabs)/education/diseases",
  },
  PEST: {
    label: "Szkodnik",
    icon: "bug-outline",
    route: "/(tabs)/education/pests",
  },
  FERTILIZER: {
    label: "Nawóz",
    icon: "flask-outline",
    route: "/(tabs)/education/fertilizers",
  },
};

const FAVORITE_TYPE_ROUTE_DETAIL: Record<FavoriteTargetType, string> = {
  ARTICLE: "/(tabs)/education/articles",
  VEGETABLE: "/(tabs)/education/vegetables",
  SOIL: "/(tabs)/education/soils",
  DISEASE: "/(tabs)/education/diseases",
  PEST: "/(tabs)/education/pests",
  FERTILIZER: "/(tabs)/education/fertilizers",
};
void FAVORITE_TYPE_ROUTE_DETAIL;

const FAVORITE_TYPE_BG: Record<FavoriteTargetType, string> = {
  ARTICLE: "#EFF4F1",
  VEGETABLE: "#EAF7EF",
  SOIL: "#F7F0E4",
  DISEASE: "#FBECEF",
  PEST: "#EEF5EF",
  FERTILIZER: "#EBF4FD",
};

const FAVORITE_TYPE_TINT: Record<FavoriteTargetType, string> = {
  ARTICLE: "#4E7163",
  VEGETABLE: "#3E7C59",
  SOIL: "#6C6341",
  DISEASE: "#B05B63",
  PEST: "#57745E",
  FERTILIZER: "#4B79A7",
};

const formatSlug = (slug: string) =>
  slug.replace(/-/g, " ").replace(/(^|\s)\p{L}/gu, (m) => m.toUpperCase());

// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_TILES: CategoryTile[] = [
  {
    title: "Warzywa",
    subtitle: "Odmiany, wymagania, uprawa",
    route: "/(tabs)/education/vegetables",
    icon: "sprout-outline",
    tint: "#3E7C59",
    iconBackground: "#EAF7EF",
  },
  {
    title: "Gleby",
    subtitle: "Typy gleb i właściwości",
    route: "/(tabs)/education/soils",
    icon: "shovel",
    tint: "#6C6341",
    iconBackground: "#F7F0E4",
  },
  {
    title: "Choroby",
    subtitle: "Objawy i ochrona",
    route: "/(tabs)/education/diseases",
    icon: "heart-pulse",
    tint: "#B05B63",
    iconBackground: "#FBECEF",
  },
  {
    title: "Szkodniki",
    subtitle: "Rozpoznawanie i profilaktyka",
    route: "/(tabs)/education/pests",
    icon: "bug-outline",
    tint: "#57745E",
    iconBackground: "#EEF5EF",
  },
  {
    title: "Nawozy",
    subtitle: "Rodzaje i zastosowanie",
    route: "/(tabs)/education/fertilizers",
    icon: "flask-outline",
    tint: "#4B79A7",
    iconBackground: "#EBF4FD",
  },
  {
    title: "Artykuły",
    subtitle: "Poradniki i wskazówki",
    route: "/(tabs)/education/articles",
    icon: "text-box-search-outline",
    tint: "#4E7163",
    iconBackground: "#EFF4F1",
  },
];

const CONTEXT_LABELS: Record<string, string> = {
  BALCONY: "Balkon",
  BED: "Grządka",
  GREENHOUSE: "Szklarnia",
};

const SEASON_LABELS: Record<string, string> = {
  SPRING: "Wiosna",
  SUMMER: "Lato",
  AUTUMN: "Jesień",
  WINTER: "Zima",
};

const getVegetableEmoji = (name: string) => {
  const normalized = name.toLowerCase();

  if (normalized.includes("pomidor")) return "🍅";
  if (normalized.includes("marchew")) return "🥕";
  if (normalized.includes("ogórek")) return "🥒";
  if (normalized.includes("sałat")) return "🥬";
  if (normalized.includes("cebula")) return "🧅";
  if (normalized.includes("ziemniak")) return "🥔";
  if (normalized.includes("papryk")) return "🫑";
  if (normalized.includes("dyni") || normalized.includes("cukini")) return "🎃";

  return "🌱";
};

const getArticleEyebrow = (item: ArticleListItem) => {
  const context = item.contexts[0];
  const season = item.seasons[0];

  if (context && CONTEXT_LABELS[context]) {
    return CONTEXT_LABELS[context];
  }

  if (season && SEASON_LABELS[season]) {
    return SEASON_LABELS[season];
  }

  return "Biblioteka";
};

const getArticleReadTime = (item: ArticleListItem) => {
  if (item.readTimeMinutes) return `${item.readTimeMinutes} min czytania`;
  const wordCount = `${item.title} ${item.excerpt}`.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(wordCount / 200));
  return `${minutes} min czytania`;
};

const prefetchArticleCover = (uri?: string | null) => {
  if (!uri) return;
  void Image.prefetch(uri, "memory-disk").catch(() => undefined);
};

function SectionHeader({
  title,
  actionLabel,
  onActionPress,
}: SectionHeaderProps) {
  return (
    <View style={sharedStyles.sectionHeader}>
      <Text style={sharedStyles.sectionTitle}>{title}</Text>
      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <Text style={sharedStyles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function CategoryCard({ item, onPress }: CategoryCardProps) {
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <View style={sharedStyles.categoryCard}>
        <View
          style={[
            sharedStyles.categoryIconWrap,
            { backgroundColor: item.iconBackground },
          ]}
        >
          <Icon source={item.icon} size={26} color={item.tint} />
        </View>
        <Text style={sharedStyles.categoryTitle}>{item.title}</Text>
        <Text style={sharedStyles.categorySubtitle}>{item.subtitle}</Text>
      </View>
    </Pressable>
  );
}

function VegetableCard({ item, onPress }: VegetableCardProps) {
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <View style={sharedStyles.vegetableCard}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={sharedStyles.vegetableImage}
            contentFit="cover"
          />
        ) : (
          <Text style={sharedStyles.vegetableEmoji}>
            {getVegetableEmoji(item.name)}
          </Text>
        )}
        <Text style={sharedStyles.vegetableTitle} numberOfLines={2}>
          {item.name}
        </Text>
      </View>
    </Pressable>
  );
}

function ArticleCard({ item, onPress, onPressIn }: ArticleCardProps) {
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} hitSlop={6}>
      <View style={sharedStyles.articleCard}>
        {item.coverImageUrl ? (
          <Image
            source={{
              uri: item.coverImageUrl,
            }}
            style={sharedStyles.articleImage}
            contentFit="cover"
            recyclingKey={item.slug}
          />
        ) : (
          <View style={sharedStyles.articleImageFallback}>
            <Icon
              source="book-open-page-variant-outline"
              size={36}
              color="#5B7B6C"
            />
          </View>
        )}

        <View style={sharedStyles.articleBody}>
          <Text style={sharedStyles.articleEyebrow}>
            {getArticleEyebrow(item)}
          </Text>
          <Text style={sharedStyles.articleTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={sharedStyles.articleExcerpt} numberOfLines={3}>
            {item.excerpt}
          </Text>
          <Text style={sharedStyles.articleMeta}>
            {getArticleReadTime(item)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function EmptySectionState({ message }: { message: string }) {
  return (
    <View style={sharedStyles.emptyCard}>
      <Text style={sharedStyles.emptyText}>{message}</Text>
    </View>
  );
}

function TwoColumnGrid({ children }: { children: React.ReactElement[] }) {
  const left = children.filter((_, i) => i % 2 === 0);
  const right = children.filter((_, i) => i % 2 === 1);
  return (
    <View style={sharedStyles.twoColWrap}>
      <View style={sharedStyles.twoColColumn}>{left}</View>
      <View style={sharedStyles.twoColColumn}>{right}</View>
    </View>
  );
}

function FavoriteTileSkeleton({ typeLabel }: { typeLabel: string }) {
  return (
    <View style={sharedStyles.favTile}>
      <View style={sharedStyles.favTileImageSkeleton} />
      <View style={sharedStyles.favTileLabelSkeleton} />
      <View style={sharedStyles.favTileTypeSkeleton} />
      <Text style={sharedStyles.favTileType}>{typeLabel}</Text>
    </View>
  );
}

function FavoriteVegetableTile({
  item,
  onPress,
}: {
  item: FavoriteItem;
  onPress: (detailParam: string | null) => void;
}) {
  const detailParam = getFavoriteDetailParam(item);
  const { data: vegetable, isLoading: isVegetableLoading } =
    useGetVegetable(detailParam);
  const imageUrl = item.imageUrl ?? vegetable?.imageUrl;
  const name = item.name ?? vegetable?.name ?? formatSlug(item.targetSlug);

  if (isVegetableLoading && !imageUrl && !item.name) {
    return <FavoriteTileSkeleton typeLabel="Warzywo" />;
  }

  return (
    <Pressable
      onPress={() => onPress(detailParam)}
      onPressIn={() => prefetchArticleCover(imageUrl)}
      hitSlop={4}
    >
      <View style={sharedStyles.favTile}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={sharedStyles.favTileImage}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              sharedStyles.favTileIconWrap,
              { backgroundColor: FAVORITE_TYPE_BG.VEGETABLE },
            ]}
          >
            <Icon
              source="sprout-outline"
              size={28}
              color={FAVORITE_TYPE_TINT.VEGETABLE}
            />
          </View>
        )}
        <Text style={sharedStyles.favTileLabel} numberOfLines={2}>
          {name}
        </Text>
        <Text style={sharedStyles.favTileType}>Warzywo</Text>
      </View>
    </Pressable>
  );
}

function FavoriteArticleTile({
  item,
  onPress,
}: {
  item: FavoriteItem;
  onPress: () => void;
}) {
  const { data: article, isLoading: isArticleLoading } = useGetArticle(
    item.targetSlug,
  );
  const rawImageUrl = article?.coverImageUrl ?? item.imageUrl;
  const imageUrl = rawImageUrl ?? null;
  const name = item.name ?? article?.title ?? formatSlug(item.targetSlug);

  if (isArticleLoading && !imageUrl && !item.name) {
    return <FavoriteTileSkeleton typeLabel="Artykuł" />;
  }

  return (
    <Pressable onPress={onPress} hitSlop={4}>
      <View style={sharedStyles.favTile}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={sharedStyles.favTileImage}
            contentFit="cover"
            recyclingKey={item.targetSlug}
          />
        ) : (
          <View
            style={[
              sharedStyles.favTileIconWrap,
              { backgroundColor: FAVORITE_TYPE_BG.ARTICLE },
            ]}
          >
            <Icon
              source="text-box-search-outline"
              size={28}
              color={FAVORITE_TYPE_TINT.ARTICLE}
            />
          </View>
        )}
        <Text style={sharedStyles.favTileLabel} numberOfLines={2}>
          {name}
        </Text>
        <Text style={sharedStyles.favTileType}>Artykuł</Text>
      </View>
    </Pressable>
  );
}

export default function EducationScreen() {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const [query, setQuery] = useState("");
  void setQuery;
  const needle = query.trim().toLowerCase();

  const { data: favoritesData, isLoading: isFavoritesLoading } =
    useGetFavoritesGrouped();

  const favoritesPreview = useMemo((): FavoriteItem[] => {
    if (!favoritesData) return [];
    return Object.values(favoritesData)
      .flat()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 4);
  }, [favoritesData]);

  const hasFavorites =
    !isFavoritesLoading &&
    Object.values(favoritesData ?? {}).some((arr) => arr.length > 0);

  const {
    data: vegetablesData,
    isLoading: isVegetablesLoading,
    error: vegetablesError,
  } = useGetVegetables({ limit: 4 });

  const {
    data: articlesData,
    isLoading: isArticlesLoading,
    error: articlesError,
  } = useGetArticles({ limit: 3 });

  const filteredSections = useMemo(() => {
    if (!needle) return CATEGORY_TILES;

    return CATEGORY_TILES.filter(
      (section) =>
        section.title.toLowerCase().includes(needle) ||
        section.subtitle.toLowerCase().includes(needle),
    );
  }, [needle]);

  const popularVegetables = useMemo(() => {
    const items = vegetablesData?.pages.flatMap((page) => page.items) ?? [];
    const featured = items.slice(0, 4);

    if (!needle) return featured;

    return featured.filter((item) => {
      const description = item.description ?? "";
      return (
        item.name.toLowerCase().includes(needle) ||
        description.toLowerCase().includes(needle)
      );
    });
  }, [needle, vegetablesData?.pages]);

  const recommendedArticles = useMemo(() => {
    const items = articlesData?.pages.flatMap((page) => page.items) ?? [];
    const featured = items.slice(0, 3);

    if (!needle) return featured;

    return featured.filter(
      (item) =>
        item.title.toLowerCase().includes(needle) ||
        item.excerpt.toLowerCase().includes(needle),
    );
  }, [articlesData?.pages, needle]);

  return (
    <Screen safeAreaEdges={["top", "left", "right"]} style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.screenHeading}>Biblioteka</Text>
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Kategorie</Text>
          {filteredSections.length > 0 ? (
            <TwoColumnGrid>
              {filteredSections.map((section) => (
                <CategoryCard
                  key={section.title}
                  item={section}
                  onPress={() => router.push(section.route)}
                />
              ))}
            </TwoColumnGrid>
          ) : (
            <EmptySectionState message="Brak kategorii pasujących do wyszukiwania." />
          )}
        </View>

        {/* ── Ulubione ── */}
        {(hasFavorites || isFavoritesLoading) && (
          <View style={styles.section}>
            <SectionHeader
              title="Ulubione"
              actionLabel="Zobacz wszystkie"
              onActionPress={() =>
                router.push("/(tabs)/education/favorites" as any)
              }
            />
            {isFavoritesLoading ? (
              <TwoColumnGrid>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <FavoriteTileSkeleton
                    key={`fav-skel-${idx}`}
                    typeLabel={idx % 2 === 0 ? "Artykuł" : "Warzywo"}
                  />
                ))}
              </TwoColumnGrid>
            ) : (
              <TwoColumnGrid>
                {favoritesPreview.map((item) => {
                  const cfg = FAVORITE_TYPE_CONFIG[item.targetType];
                  if (item.targetType === "VEGETABLE") {
                    return (
                      <FavoriteVegetableTile
                        key={item.id}
                        item={item}
                        onPress={(detailParam) =>
                          detailParam
                            ? router.push(`${cfg.route}/${detailParam}` as any)
                            : router.push(cfg.route as any)
                        }
                      />
                    );
                  }
                  if (item.targetType === "ARTICLE") {
                    return (
                      <FavoriteArticleTile
                        key={item.id}
                        item={item}
                        onPress={() =>
                          router.push({
                            pathname: "/(tabs)/education/articles/[id]",
                            params: { id: item.targetSlug },
                          })
                        }
                      />
                    );
                  }
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        const detailParam = getFavoriteDetailParam(item);
                        if (detailParam) {
                          router.push(`${cfg.route}/${detailParam}` as any);
                          return;
                        }
                        router.push(cfg.route as any);
                      }}
                      hitSlop={4}
                    >
                      <View style={sharedStyles.favTile}>
                        <View
                          style={[
                            sharedStyles.favTileIconWrap,
                            {
                              backgroundColor:
                                FAVORITE_TYPE_BG[item.targetType],
                            },
                          ]}
                        >
                          <Icon
                            source={cfg.icon}
                            size={28}
                            color={FAVORITE_TYPE_TINT[item.targetType]}
                          />
                        </View>
                        <Text
                          style={sharedStyles.favTileLabel}
                          numberOfLines={2}
                        >
                          {item.name ?? formatSlug(item.targetSlug)}
                        </Text>
                        <Text style={sharedStyles.favTileType}>
                          {cfg.label}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </TwoColumnGrid>
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const sharedStyles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#1D2420",
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize: 15,
    fontWeight: "500",
    color: "#5E8A70",
  },
  gridItem: {
    flexBasis: "47%",
    flexGrow: 1,
    maxWidth: "50%",
  },
  twoColWrap: {
    flexDirection: "row",
    gap: 16,
  },
  twoColColumn: {
    flex: 1,
    gap: 16,
  },
  categoryCard: {
    minHeight: 156,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8ECE7",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  categoryIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D2420",
    marginBottom: 8,
  },
  categorySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#738078",
  },
  vegetableCard: {
    minHeight: 138,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8ECE7",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  vegetableImage: {
    width: 54,
    height: 54,
    borderRadius: 16,
    marginBottom: 14,
    backgroundColor: "#F0F3EF",
  },
  vegetableEmoji: {
    fontSize: 46,
    marginBottom: 14,
  },
  vegetableTitle: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 22,
    textAlign: "center",
    color: "#1D2420",
  },
  articleCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8ECE7",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  articleImage: {
    width: "100%",
    height: 224,
    backgroundColor: "#EEF2EE",
  },
  articleImageFallback: {
    width: "100%",
    height: 224,
    backgroundColor: "#EEF4F0",
    alignItems: "center",
    justifyContent: "center",
  },
  articleBody: {
    padding: 20,
  },
  articleEyebrow: {
    fontSize: 14,
    fontWeight: "500",
    color: "#5E8A70",
    marginBottom: 10,
  },
  articleTitle: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 27,
    color: "#1D2420",
    marginBottom: 10,
  },
  articleExcerpt: {
    fontSize: 15,
    lineHeight: 23,
    color: "#6E7972",
    marginBottom: 14,
  },
  articleMeta: {
    fontSize: 14,
    fontWeight: "500",
    color: "#97A29B",
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8ECE7",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#7D8882",
  },
  favTile: {
    minHeight: 138,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8ECE7",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
    overflow: "hidden",
  },
  favTileImage: {
    width: 54,
    height: 54,
    borderRadius: 16,
    marginBottom: 14,
    backgroundColor: "#F0F3EF",
  },
  favTileImageSkeleton: {
    width: 54,
    height: 54,
    borderRadius: 16,
    marginBottom: 14,
    backgroundColor: "#E8EEEA",
  },
  favTileEmoji: {
    fontSize: 46,
    marginBottom: 14,
  },
  favTileIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  favTileLabel: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
    textAlign: "center",
    color: "#1D2420",
  },
  favTileLabelSkeleton: {
    width: "78%",
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E8EEEA",
  },
  favTileType: {
    fontSize: 12,
    color: "#97A29B",
    marginTop: 4,
    textAlign: "center",
  },
  favTileTypeSkeleton: {
    width: "44%",
    height: 10,
    borderRadius: 5,
    marginTop: 8,
    backgroundColor: "#EDF2EE",
  },
});

const makeStyles = (theme: MD3Theme) => {
  const palette = {
    background: theme.dark ? "#141816" : "#F7F8F5",
    surface: theme.dark ? "#1D221F" : "#F0F3EE",
    border: theme.dark ? "#2B332F" : "#E7ECE6",
    heading: theme.dark ? "#F2F5F1" : "#1D2420",
    accent: theme.dark ? "#8DB89A" : "#5E8A70",
    searchPlaceholder: theme.dark ? "#98A49C" : "#8A948D",
    searchIcon: theme.dark ? "#9AA59E" : "#7F8B84",
  };

  return {
    ...StyleSheet.create({
      screen: {
        backgroundColor: palette.background,
      },
      contentContainer: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 32,
      },
      searchBar: {
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.surface,
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
        color: palette.heading,
      },
      section: {
        marginTop: 32,
      },
      screenHeading: {
        fontSize: 26,
        fontWeight: "700",
        color: palette.heading,
        marginBottom: 16,
        letterSpacing: -0.2,
      },
      sectionHeading: {
        fontSize: 20,
        fontWeight: "700",
        color: palette.heading,
        marginBottom: 16,
        letterSpacing: -0.2,
      },
      grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
      },
      articleList: {
        gap: 16,
      },
      loadingWrap: {
        minHeight: 88,
        alignItems: "center",
        justifyContent: "center",
      },
    }),
    palette,
  };
};
