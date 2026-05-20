import { ArticleListItem } from "@/src/api/queries/articles/types";
import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";

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

const getArticleEyebrow = (item: ArticleListItem) => {
  const context = item.contexts[0];
  const season = item.seasons[0];

  if (context && CONTEXT_LABELS[context]) return CONTEXT_LABELS[context];
  if (season && SEASON_LABELS[season]) return SEASON_LABELS[season];

  return "Biblioteka";
};

const getArticleReadTime = (item: ArticleListItem) => {
  if (item.readTimeMinutes) return `${item.readTimeMinutes} min czytania`;
  const words = `${item.title} ${item.excerpt}`.trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min czytania`;
};

type ArticlePreviewCardProps = {
  item: ArticleListItem;
  onPress: () => void;
  onPressIn?: () => void;
};

export function ArticlePreviewCard({
  item,
  onPress,
  onPressIn,
}: ArticlePreviewCardProps) {
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} hitSlop={6}>
      <View style={styles.articleCard}>
        {item.coverImageUrl ? (
          <Image
            source={{
              uri: item.coverImageUrl,
            }}
            style={styles.articleImage}
            contentFit="cover"
            recyclingKey={item.slug}
          />
        ) : (
          <View style={styles.articleImageFallback}>
            <Icon
              source="book-open-page-variant-outline"
              size={36}
              color="#5B7B6C"
            />
          </View>
        )}

        <View style={styles.articleBody}>
          <Text style={styles.articleEyebrow}>{getArticleEyebrow(item)}</Text>
          <Text style={styles.articleTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.articleExcerpt} numberOfLines={3}>
            {item.excerpt}
          </Text>
          <Text style={styles.articleMeta}>{getArticleReadTime(item)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
});
