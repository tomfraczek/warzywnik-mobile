import { useGetArticle } from "@/src/api/queries/articles/useGetArticle";
import {
  FavoriteItem,
  FavoriteTargetType,
} from "@/src/api/queries/favorites/types";
import { useGetFavoritesGrouped } from "@/src/api/queries/favorites/useGetFavoritesGrouped";
import { getFavoriteDetailParam } from "@/src/api/queries/favorites/utils";
import { Screen } from "@/src/components/Screen";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon, MD3Theme, Text, useTheme } from "react-native-paper";

// ─── config ───────────────────────────────────────────────────────────────────

const TYPE_ORDER: FavoriteTargetType[] = [
  "VEGETABLE",
  "ARTICLE",
  "DISEASE",
  "PEST",
  "FERTILIZER",
  "SOIL",
];

const TYPE_CONFIG: Record<
  FavoriteTargetType,
  {
    label: string;
    labelPlural: string;
    icon: string;
    tint: string;
    bg: string;
    route: string;
  }
> = {
  VEGETABLE: {
    label: "Warzywo",
    labelPlural: "Warzywa",
    icon: "sprout-outline",
    tint: "#3E7C59",
    bg: "#EAF7EF",
    route: "/(tabs)/education/vegetables",
  },
  ARTICLE: {
    label: "Artykuł",
    labelPlural: "Artykuły",
    icon: "text-box-outline",
    tint: "#4E7163",
    bg: "#EFF4F1",
    route: "/(tabs)/education/articles",
  },
  DISEASE: {
    label: "Choroba",
    labelPlural: "Choroby",
    icon: "bacteria-outline",
    tint: "#B05B63",
    bg: "#FBECEF",
    route: "/(tabs)/education/diseases",
  },
  PEST: {
    label: "Szkodnik",
    labelPlural: "Szkodniki",
    icon: "bug-outline",
    tint: "#57745E",
    bg: "#EEF5EF",
    route: "/(tabs)/education/pests",
  },
  FERTILIZER: {
    label: "Nawóz",
    labelPlural: "Nawozy",
    icon: "flask-outline",
    tint: "#4B79A7",
    bg: "#EBF4FD",
    route: "/(tabs)/education/fertilizers",
  },
  SOIL: {
    label: "Gleba",
    labelPlural: "Gleby",
    icon: "layers-outline",
    tint: "#6C6341",
    bg: "#F7F0E4",
    route: "/(tabs)/education/soils",
  },
};

const formatSlug = (slug: string) =>
  slug.replace(/-/g, " ").replace(/(^|\s)\p{L}/gu, (m) => m.toUpperCase());

const prefetchArticleCover = (uri?: string | null) => {
  if (!uri) return;
  void Image.prefetch(uri, "memory-disk").catch(() => undefined);
};

// ─── components ───────────────────────────────────────────────────────────────

function FavoriteRowItem({
  item,
  onPress,
  isLast,
}: {
  item: FavoriteItem;
  onPress: () => void;
  isLast: boolean;
}) {
  const cfg = TYPE_CONFIG[item.targetType];
  const { data: article, isLoading: isArticleLoading } = useGetArticle(
    item.targetType === "ARTICLE" ? item.targetSlug : null,
  );

  const rawArticleImageUrl = article?.coverImageUrl ?? item.imageUrl ?? null;
  const articleImageUrl = rawArticleImageUrl ?? null;

  const rowTitle =
    item.targetType === "ARTICLE"
      ? (article?.title ?? item.name ?? formatSlug(item.targetSlug))
      : (item.name ?? formatSlug(item.targetSlug));

  const showArticleRowSkeleton =
    item.targetType === "ARTICLE" && isArticleLoading && !articleImageUrl;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        if (item.targetType === "ARTICLE") {
          prefetchArticleCover(articleImageUrl);
        }
      }}
      style={[s.row, isLast && s.rowLast]}
      hitSlop={4}
      android_ripple={{ color: "rgba(0,0,0,0.04)" }}
    >
      {showArticleRowSkeleton ? (
        <View style={s.rowThumbSkeleton} />
      ) : item.targetType === "ARTICLE" && articleImageUrl ? (
        <Image
          source={{ uri: articleImageUrl }}
          style={s.rowThumb}
          contentFit="cover"
          recyclingKey={item.targetSlug}
        />
      ) : (
        <View style={[s.rowIcon, { backgroundColor: cfg.bg }]}>
          <Icon source={cfg.icon} size={17} color={cfg.tint} />
        </View>
      )}
      {showArticleRowSkeleton ? (
        <View style={s.rowTitleSkeleton} />
      ) : (
        <Text style={s.rowSlug} numberOfLines={1}>
          {rowTitle}
        </Text>
      )}
      <Icon source="chevron-right" size={18} color="#B8C8BC" />
    </Pressable>
  );
}

function FavoriteSectionSkeleton({
  palette,
  title,
}: {
  palette: ReturnType<typeof buildPalette>;
  title: string;
}) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <View style={s.sectionIconSkeleton} />
        <Text style={[s.sectionTitle, { color: palette.heading }]}>
          {title}
        </Text>
      </View>
      <View
        style={[
          s.card,
          { backgroundColor: palette.cardBg, borderColor: palette.border },
        ]}
      >
        {Array.from({ length: 3 }).map((_, idx) => (
          <View
            key={`row-skel-${title}-${idx}`}
            style={[s.row, idx === 2 && s.rowLast]}
          >
            <View style={s.rowThumbSkeleton} />
            <View style={s.rowTitleSkeleton} />
            <View style={s.rowChevronSkeleton} />
          </View>
        ))}
      </View>
    </View>
  );
}

function FavoriteSection({
  type,
  items,
  palette,
  onItemPress,
}: {
  type: FavoriteTargetType;
  items: FavoriteItem[];
  palette: ReturnType<typeof buildPalette>;
  onItemPress: (item: FavoriteItem) => void;
}) {
  const cfg = TYPE_CONFIG[type];
  if (items.length === 0) return null;
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <View style={[s.sectionIconWrap, { backgroundColor: cfg.bg }]}>
          <Icon source={cfg.icon} size={18} color={cfg.tint} />
        </View>
        <Text style={[s.sectionTitle, { color: palette.heading }]}>
          {cfg.labelPlural}
        </Text>
        <Text style={[s.sectionCount, { color: palette.meta }]}>
          {items.length}
        </Text>
      </View>
      <View
        style={[
          s.card,
          { backgroundColor: palette.cardBg, borderColor: palette.border },
        ]}
      >
        {items.map((item, idx) => (
          <FavoriteRowItem
            key={item.id}
            item={item}
            isLast={idx === items.length - 1}
            onPress={() => onItemPress(item)}
          />
        ))}
      </View>
    </View>
  );
}

// ─── palette ─────────────────────────────────────────────────────────────────

function buildPalette(dark: boolean) {
  return {
    background: dark ? "#141816" : "#F7F8F5",
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    border: dark ? "#252D29" : "#E8ECE7",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
    meta: dark ? "#5E6A62" : "#97A29B",
    accent: dark ? "#7AB88A" : "#4A7C59",
    empty: dark ? "#4A5E52" : "#B8CCB4",
    emptyBg: dark ? "#1A1F1C" : "#FFFFFF",
  };
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function FavoritesScreen() {
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);
  const router = useRouter();

  const { data, isLoading } = useGetFavoritesGrouped();

  const totalCount = Object.values(data ?? {}).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );

  const handleItemPress = (item: FavoriteItem) => {
    const cfg = TYPE_CONFIG[item.targetType];
    const detailParam = getFavoriteDetailParam(item);
    if (detailParam) {
      router.push(`${cfg.route}/${detailParam}` as any);
      return;
    }
    router.push(cfg.route as any);
  };

  return (
    <Screen
      style={{ backgroundColor: palette.background }}
      safeAreaEdges={["left", "right"]}
    >
      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { backgroundColor: palette.background },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <>
            <FavoriteSectionSkeleton palette={palette} title="Warzywa" />
            <FavoriteSectionSkeleton palette={palette} title="Artykuły" />
          </>
        ) : totalCount === 0 ? (
          <View style={s.emptyWrap}>
            <View
              style={[
                s.emptyIconWrap,
                {
                  backgroundColor: palette.emptyBg,
                  borderColor: palette.border,
                },
              ]}
            >
              <Icon source="heart-outline" size={44} color={palette.empty} />
            </View>
            <Text style={[s.emptyTitle, { color: palette.heading }]}>
              Brak ulubionych
            </Text>
            <Text style={[s.emptyBody, { color: palette.secondary }]}>
              Dodaj warzywa, artykuły, gleby, choroby, szkodniki lub nawozy do
              ulubionych — pojawią się tutaj.
            </Text>
          </View>
        ) : (
          TYPE_ORDER.map((type) => {
            const items = data?.[type] ?? [];
            return (
              <FavoriteSection
                key={type}
                type={type}
                items={items}
                palette={palette}
                onItemPress={handleItemPress}
              />
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 24,
  },
  centered: {
    paddingTop: 60,
    alignItems: "center",
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: "500",
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F0",
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowThumb: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF4F1",
  },
  rowThumbSkeleton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E8EEEA",
  },
  rowSlug: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1D2420",
  },
  rowTitleSkeleton: {
    flex: 1,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E8EEEA",
  },
  rowChevronSkeleton: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#EEF3EF",
  },
  sectionIconSkeleton: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#E8EEEA",
  },
  emptyWrap: {
    paddingTop: 60,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 16,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },
});
