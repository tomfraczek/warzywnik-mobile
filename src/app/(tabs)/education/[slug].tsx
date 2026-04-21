import { getResponseError } from "@/src/api/axios";
import { useGetArticle } from "@/src/api/queries/articles/useGetArticle";
import { Screen } from "@/src/components/Screen";
import { normalizeArticleHtmlWhitespace } from "@/src/utils/html";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Button, MD3Theme, useTheme } from "react-native-paper";
import RenderHTML from "react-native-render-html";

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

export default function ArticleDetailsScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const { width } = useWindowDimensions();
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const baseStyle = getBaseStyle(theme);
  const tagsStyles = getTagsStyles(theme);
  const {
    data: article,
    isLoading,
    error,
    refetch,
  } = useGetArticle(slug ?? null);

  const tags = useMemo(() => {
    if (!article) return [];
    return article.contexts?.map(formatContextLabel) ?? [];
  }, [article]);

  const normalizedContent = useMemo(() => {
    if (!article?.content) return "";
    return normalizeArticleHtmlWhitespace(article.content);
  }, [article?.content]);

  if (isLoading) {
    return (
      <Screen safeAreaEdges={["left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (error || !article) {
    return (
      <Screen safeAreaEdges={["left", "right"]}>
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

  const renderProps = {
    contentWidth: width - 40,
    source: { html: normalizedContent },
    tagsStyles,
    baseStyle,
    renderersProps: {
      a: {
        onPress: (_: any, href?: string) => {
          if (href) Linking.openURL(href);
        },
      },
      img: { enableExperimentalPercentWidth: true },
    },
    imagesMaxWidth: width - 40,
  } as const;

  return (
    <Screen safeAreaEdges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.container}>
        {article.coverImageUrl ? (
          <Image
            source={{
              uri: article.coverImageUrl,
            }}
            contentFit="cover"
            style={styles.image}
            recyclingKey={article.slug}
          />
        ) : null}
        <Text style={styles.title}>{article.title}</Text>
        {article.excerpt ? (
          <Text style={styles.excerpt}>{article.excerpt}</Text>
        ) : null}
        {tags.length > 0 ? (
          <View style={styles.chips}>
            {tags.map((tag) => (
              <View key={`${article.id}-${tag}`} style={styles.chip}>
                <Text style={styles.chipText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <RenderHTML {...(renderProps as any)} />
      </ScrollView>
    </Screen>
  );
}

const getBaseStyle = (theme: MD3Theme) => ({
  color: theme.colors.onSurfaceVariant,
  fontSize: 14,
  lineHeight: 22,
});

const getTagsStyles = (theme: MD3Theme) => ({
  h2: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: theme.colors.onSurface,
    marginTop: 18,
    marginBottom: 8,
  },
  h3: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: theme.colors.onSurface,
    marginTop: 14,
    marginBottom: 6,
  },
  p: {
    marginBottom: 10,
  },
  ul: {
    marginBottom: 10,
    paddingLeft: 18,
  },
  ol: {
    marginBottom: 10,
    paddingLeft: 18,
  },
  li: {
    marginBottom: 6,
  },
  img: {
    borderRadius: 12,
    marginVertical: 8,
  },
  a: {
    color: theme.colors.primary,
    textDecorationLine: "underline" as const,
  },
});

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: 20,
      paddingBottom: 40,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    image: {
      width: "100%",
      height: 200,
      borderRadius: 16,
      marginBottom: 16,
      backgroundColor: theme.colors.surfaceVariant,
    },
    title: {
      fontSize: 22,
      fontWeight: "600",
      color: theme.colors.onSurface,
      marginBottom: 6,
    },
    excerpt: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 12,
      lineHeight: 20,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 16,
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
    errorText: {
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: "center",
    },
  });
