import { getResponseError } from "@/src/api/axios";
import { useGetArticle } from "@/src/api/queries/articles/useGetArticle";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
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

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !article) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{String(getResponseError(error))}</Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Spróbuj ponownie</Text>
        </Pressable>
      </View>
    );
  }

  const renderProps = {
    contentWidth: width - 40,
    source: { html: article.content },
    tagsStyles,
    baseStyle,
    renderersProps: {
      a: {
        onPress: (_: any, href?: string) => {
          if (href) Linking.openURL(href);
        },
      },
    },
    enableExperimentalPercentWidth: true,
    imagesMaxWidth: width - 40,
  } as const;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {article.coverImageUrl ? (
        <Image
          source={{ uri: article.coverImageUrl }}
          contentFit="cover"
          style={styles.image}
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
  );
}

const baseStyle = {
  color: "#374151",
  fontSize: 14,
  lineHeight: 22,
};

const tagsStyles = {
  h2: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "#111827",
    marginTop: 18,
    marginBottom: 8,
  },
  h3: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#111827",
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
    color: "#2563eb",
    textDecorationLine: "underline" as const,
  },
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "#f3f4f6",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  excerpt: {
    fontSize: 14,
    color: "#6b7280",
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
    backgroundColor: "#f3f4f6",
  },
  chipText: {
    fontSize: 11,
    color: "#374151",
  },
  errorText: {
    color: "#ef4444",
    marginBottom: 12,
    textAlign: "center",
  },
  retryButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
