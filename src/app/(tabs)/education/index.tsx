import { useGetArticle } from "@/src/api/queries/articles/useGetArticle";
import {
  FavoriteItem,
  FavoriteTargetType,
} from "@/src/api/queries/favorites/types";
import { useGetFavoritesGrouped } from "@/src/api/queries/favorites/useGetFavoritesGrouped";
import { getFavoriteDetailParam } from "@/src/api/queries/favorites/utils";
import { useGetVegetable } from "@/src/api/queries/vegetables/useGetVegetable";
import { PrimaryScreenHeading } from "@/src/components/navigation/PrimaryScreenHeading";
import { Screen } from "@/src/components/Screen";
import { CoachMarkOverlay } from "@/src/components/tutorial/CoachMarkOverlay";
import { useTutorial } from "@/src/hooks/useTutorial";
import { useIsFocused } from "@react-navigation/native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  tintDark: string;
  iconBackground: string;
  iconBackgroundDark: string;
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

const FAVORITE_TYPE_BG_DARK: Record<FavoriteTargetType, string> = {
  ARTICLE: "#1C2620",
  VEGETABLE: "#1A2E1F",
  SOIL: "#2A2318",
  DISEASE: "#2E1A1C",
  PEST: "#1A2A1C",
  FERTILIZER: "#1A2535",
};

const FAVORITE_TYPE_TINT: Record<FavoriteTargetType, string> = {
  ARTICLE: "#4E7163",
  VEGETABLE: "#3E7C59",
  SOIL: "#6C6341",
  DISEASE: "#B05B63",
  PEST: "#57745E",
  FERTILIZER: "#4B79A7",
};

const FAVORITE_TYPE_TINT_DARK: Record<FavoriteTargetType, string> = {
  ARTICLE: "#7AB88A",
  VEGETABLE: "#7AB88A",
  SOIL: "#C4A96B",
  DISEASE: "#D66C7A",
  PEST: "#7AB88A",
  FERTILIZER: "#7AAFD6",
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
    tintDark: "#7AB88A",
    iconBackground: "#EAF7EF",
    iconBackgroundDark: "#1A2E1F",
  },
  {
    title: "Gleby",
    subtitle: "Typy gleb i właściwości",
    route: "/(tabs)/education/soils",
    icon: "shovel",
    tint: "#6C6341",
    tintDark: "#C4A96B",
    iconBackground: "#F7F0E4",
    iconBackgroundDark: "#2A2318",
  },
  {
    title: "Choroby",
    subtitle: "Objawy i ochrona",
    route: "/(tabs)/education/diseases",
    icon: "heart-pulse",
    tint: "#B05B63",
    tintDark: "#D66C7A",
    iconBackground: "#FBECEF",
    iconBackgroundDark: "#2E1A1C",
  },
  {
    title: "Szkodniki",
    subtitle: "Rozpoznawanie i profilaktyka",
    route: "/(tabs)/education/pests",
    icon: "bug-outline",
    tint: "#57745E",
    tintDark: "#7AB88A",
    iconBackground: "#EEF5EF",
    iconBackgroundDark: "#1A2A1C",
  },
  {
    title: "Nawozy",
    subtitle: "Rodzaje i zastosowanie",
    route: "/(tabs)/education/fertilizers",
    icon: "flask-outline",
    tint: "#4B79A7",
    tintDark: "#7AAFD6",
    iconBackground: "#EBF4FD",
    iconBackgroundDark: "#1A2535",
  },
  {
    title: "Artykuły",
    subtitle: "Poradniki i wskazówki",
    route: "/(tabs)/education/articles",
    icon: "text-box-search-outline",
    tint: "#4E7163",
    tintDark: "#7AB88A",
    iconBackground: "#EFF4F1",
    iconBackgroundDark: "#1C2620",
  },
];

const prefetchArticleCover = (uri?: string | null) => {
  if (!uri) return;
  void Image.prefetch(uri, "memory-disk").catch(() => undefined);
};

function SectionHeader({
  title,
  actionLabel,
  onActionPress,
}: SectionHeaderProps) {
  const theme = useTheme<MD3Theme>();
  const sharedStyles = makeSharedStyles(theme.dark);
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
  const theme = useTheme<MD3Theme>();
  const sharedStyles = makeSharedStyles(theme.dark);
  const iconBg = theme.dark ? item.iconBackgroundDark : item.iconBackground;
  const iconTint = theme.dark ? item.tintDark : item.tint;
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <View style={sharedStyles.categoryCard}>
        <View style={[sharedStyles.categoryIconWrap, { backgroundColor: iconBg }]}>
          <Icon source={item.icon} size={26} color={iconTint} />
        </View>
        <Text style={sharedStyles.categoryTitle}>{item.title}</Text>
        <Text style={sharedStyles.categorySubtitle}>{item.subtitle}</Text>
      </View>
    </Pressable>
  );
}

function EmptySectionState({ message }: { message: string }) {
  const theme = useTheme<MD3Theme>();
  const sharedStyles = makeSharedStyles(theme.dark);
  return (
    <View style={sharedStyles.emptyCard}>
      <Text style={sharedStyles.emptyText}>{message}</Text>
    </View>
  );
}

function TwoColumnGrid({ children }: { children: React.ReactElement[] }) {
  const theme = useTheme<MD3Theme>();
  const sharedStyles = makeSharedStyles(theme.dark);
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
  const theme = useTheme<MD3Theme>();
  const sharedStyles = makeSharedStyles(theme.dark);
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
  const theme = useTheme<MD3Theme>();
  const sharedStyles = makeSharedStyles(theme.dark);
  const favBg = theme.dark ? FAVORITE_TYPE_BG_DARK.VEGETABLE : FAVORITE_TYPE_BG.VEGETABLE;
  const favTint = theme.dark ? FAVORITE_TYPE_TINT_DARK.VEGETABLE : FAVORITE_TYPE_TINT.VEGETABLE;
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
          <View style={[sharedStyles.favTileIconWrap, { backgroundColor: favBg }]}>
            <Icon source="sprout-outline" size={28} color={favTint} />
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
  const theme = useTheme<MD3Theme>();
  const sharedStyles = makeSharedStyles(theme.dark);
  const favBg = theme.dark ? FAVORITE_TYPE_BG_DARK.ARTICLE : FAVORITE_TYPE_BG.ARTICLE;
  const favTint = theme.dark ? FAVORITE_TYPE_TINT_DARK.ARTICLE : FAVORITE_TYPE_TINT.ARTICLE;
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
          <View style={[sharedStyles.favTileIconWrap, { backgroundColor: favBg }]}>
            <Icon source="text-box-search-outline" size={28} color={favTint} />
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
  const sharedStyles = makeSharedStyles(theme.dark);
  const [query, setQuery] = useState("");
  void setQuery;
  const needle = query.trim().toLowerCase();

  const { data: favoritesData, isLoading: isFavoritesLoading } =
    useGetFavoritesGrouped();

  const tutorial = useTutorial("articles");
  const params = useLocalSearchParams<{ showTutorial?: string }>();
  const isForced = params.showTutorial === "1";
  const forcedShownRef = useRef(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const categoriesRef = useRef<View | null>(null);
  const favoritesRef = useRef<View | null>(null);
  const favoritesSectionY = useRef(0);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isForced) forcedShownRef.current = false;
  }, [isForced]);

  useEffect(() => {
    if (!isFocused) return;
    if (tutorial.shouldShow) {
      setShowTutorial(true);
    } else if (isForced && !forcedShownRef.current) {
      forcedShownRef.current = true;
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      setShowTutorial(true);
    }
  }, [isFocused, tutorial.shouldShow, isForced]);

  const handleTutorialDismiss = useCallback((skipped: boolean) => {
    setShowTutorial(false);
    if (!isForced) {
      if (skipped) tutorial.disable();
      else tutorial.complete();
    }
  }, [tutorial, isForced]);

  const handleBeforeStepMeasure = useCallback(
    (stepIndex: number): Promise<void> =>
      new Promise((resolve) => {
        if (stepIndex === 1) {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, favoritesSectionY.current - 80),
            animated: true,
          });
          setTimeout(resolve, 500);
        } else {
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
          setTimeout(resolve, 300);
        }
      }),
    [],
  );

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

  const filteredSections = useMemo(() => {
    if (!needle) return CATEGORY_TILES;

    return CATEGORY_TILES.filter(
      (section) =>
        section.title.toLowerCase().includes(needle) ||
        section.subtitle.toLowerCase().includes(needle),
    );
  }, [needle]);

  return (
    <Screen safeAreaEdges={["top", "left", "right"]} style={styles.screen}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <PrimaryScreenHeading
          title="Biblioteka"
          subtitle="Kategorie, ulubione i poradniki dla Twojego ogrodu."
        />
        <View ref={categoriesRef} collapsable={false} style={styles.section}>
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
        <View
          collapsable={false}
          style={styles.section}
          onLayout={(e) => { favoritesSectionY.current = e.nativeEvent.layout.y; }}
        >
          <View ref={favoritesRef} collapsable={false}>
          <SectionHeader
            title="Ulubione"
            actionLabel={hasFavorites ? "Zobacz wszystkie" : undefined}
            onActionPress={
              hasFavorites
                ? () => router.push("/(tabs)/education/favorites" as any)
                : undefined
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
          ) : hasFavorites ? (
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
                            backgroundColor: theme.dark
                              ? FAVORITE_TYPE_BG_DARK[item.targetType]
                              : FAVORITE_TYPE_BG[item.targetType],
                          },
                        ]}
                      >
                        <Icon
                          source={cfg.icon}
                          size={28}
                          color={theme.dark
                            ? FAVORITE_TYPE_TINT_DARK[item.targetType]
                            : FAVORITE_TYPE_TINT[item.targetType]}
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
          ) : (
            <EmptySectionState message="Tu pojawią się pozycje, które dodasz do ulubionych — warzywa, artykuły, choroby i więcej." />
          )}
          </View>
        </View>
      </ScrollView>

      <CoachMarkOverlay
        visible={showTutorial}
        onDismiss={handleTutorialDismiss}
        beforeStepMeasure={handleBeforeStepMeasure}
        showCheckbox={!isForced}
        steps={[
          {
            ref: categoriesRef,
            title: "Kategorie wiedzy",
            description:
              "Przeglądaj bazy wiedzy o warzywach, glebach, chorobach, szkodnikach, nawozach i artykułach ogrodniczych.",
            placement: "bottom",
          },
          {
            ref: favoritesRef,
            title: "Ulubione",
            description:
              "Zapisuj warzywa, artykuły i inne pozycje do ulubionych — znajdziesz je tu szybko przy kolejnej wizycie.",
            placement: "top",
          },
        ]}
      />
    </Screen>
  );
}

function makeSharedStyles(dark: boolean) {
  const palette = {
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "rgba(255, 255, 255, 0.12)" : "#E8ECE7",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#738078",
    meta: dark ? "#7A8880" : "#97A29B",
    accent: dark ? "#7AB88A" : "#5E8A70",
    emptyText: dark ? "#9AA59E" : "#7D8882",
    imageBg: dark ? "#252D29" : "#F0F3EF",
    skeletonBg: dark ? "#252D29" : "#E8EEEA",
    skeletonBgLight: dark ? "#1E2522" : "#EDF2EE",
  };
  return StyleSheet.create({
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
      color: palette.heading,
      letterSpacing: -0.2,
    },
    sectionAction: {
      fontSize: 15,
      fontWeight: "500",
      color: palette.accent,
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
      borderColor: palette.cardBorder,
      backgroundColor: palette.cardBg,
      padding: 20,
      alignItems: "center",
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
      color: palette.heading,
      marginBottom: 8,
      textAlign: "center",
    },
    categorySubtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: palette.secondary,
      textAlign: "center",
    },
    vegetableCard: {
      minHeight: 138,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      backgroundColor: palette.cardBg,
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
      backgroundColor: palette.imageBg,
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
      color: palette.heading,
    },
    articleCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      backgroundColor: palette.cardBg,
      overflow: "hidden",
    },
    articleImage: {
      width: "100%",
      height: 224,
      backgroundColor: palette.imageBg,
    },
    articleImageFallback: {
      width: "100%",
      height: 224,
      backgroundColor: palette.imageBg,
      alignItems: "center",
      justifyContent: "center",
    },
    articleBody: {
      padding: 20,
    },
    articleEyebrow: {
      fontSize: 14,
      fontWeight: "500",
      color: palette.accent,
      marginBottom: 10,
    },
    articleTitle: {
      fontSize: 20,
      fontWeight: "700",
      lineHeight: 27,
      color: palette.heading,
      marginBottom: 10,
    },
    articleExcerpt: {
      fontSize: 15,
      lineHeight: 23,
      color: palette.secondary,
      marginBottom: 14,
    },
    articleMeta: {
      fontSize: 14,
      fontWeight: "500",
      color: palette.meta,
    },
    emptyCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      backgroundColor: palette.cardBg,
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    emptyText: {
      fontSize: 15,
      lineHeight: 22,
      color: palette.emptyText,
    },
    favTile: {
      minHeight: 138,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      backgroundColor: palette.cardBg,
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
      backgroundColor: palette.imageBg,
    },
    favTileImageSkeleton: {
      width: 54,
      height: 54,
      borderRadius: 16,
      marginBottom: 14,
      backgroundColor: palette.skeletonBg,
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
      color: palette.heading,
    },
    favTileLabelSkeleton: {
      width: "78%",
      height: 14,
      borderRadius: 7,
      backgroundColor: palette.skeletonBg,
    },
    favTileType: {
      fontSize: 12,
      color: palette.meta,
      marginTop: 4,
      textAlign: "center",
    },
    favTileTypeSkeleton: {
      width: "44%",
      height: 10,
      borderRadius: 5,
      marginTop: 8,
      backgroundColor: palette.skeletonBgLight,
    },
  });
}

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
