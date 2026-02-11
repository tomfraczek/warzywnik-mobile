import { Article, ArticleListItem } from "@/src/api/queries/articles/types";
import { useGetArticles } from "@/src/api/queries/articles/useGetArticles";
import { useGetBeds } from "@/src/api/queries/beds/useGetBeds";
import { useGetPlantings } from "@/src/api/queries/plantings/useGetPlantings";
import { clientPersister, queryClient } from "@/src/api/queryClient";
import { useClerk } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { IconButton, Menu } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const ADVICE_LIMIT = 3;
const CANDIDATE_LIMIT = 10;
const PAGE_LIMIT = 50;

type ArticleListItemWithRelations = ArticleListItem &
  Partial<Pick<Article, "relatedVegetableIds" | "relatedSoilIds">>;

const pad2 = (value: number) => String(value).padStart(2, "0");

const getLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
};

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
};

const mulberry32 = (seed: number) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let result = Math.imul(t ^ (t >>> 15), t | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

const seededShuffle = <T,>(items: T[], seed: string) => {
  const random = mulberry32(hashString(seed));
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getSlotOfDay = (date: Date) => Math.floor(date.getHours() / 6);

const getNextSlotDelay = (date: Date) => {
  const slot = getSlotOfDay(date);
  const nextSlotHour = (slot + 1) * 6;
  const nextDate = new Date(date);
  if (nextSlotHour >= 24) {
    nextDate.setDate(date.getDate() + 1);
    nextDate.setHours(0, 0, 0, 0);
  } else {
    nextDate.setHours(nextSlotHour, 0, 0, 0);
  }
  return Math.max(1000, nextDate.getTime() - date.getTime());
};

const getPreferredContexts = (hasPlanned: boolean, hasActive: boolean) => {
  const preferred = new Set<string>();
  if (hasPlanned) {
    preferred.add("sowing");
  }
  if (hasActive) {
    preferred.add("problem_solving");
    preferred.add("harvest");
  }
  return [...preferred];
};

const scoreArticle = (
  article: ArticleListItemWithRelations,
  params: {
    currentMonth: number;
    preferredContexts: string[];
    vegetableIds: Set<string>;
    soilIds: Set<string>;
  },
) => {
  let score = 0;
  if (article.months?.includes(params.currentMonth)) {
    score += 3;
  }
  if (
    params.preferredContexts.length > 0 &&
    article.contexts?.some((context) =>
      params.preferredContexts.includes(context.toLowerCase()),
    )
  ) {
    score += 2;
  }
  if (article.relatedVegetableIds?.some((id) => params.vegetableIds.has(id))) {
    score += 2;
  }
  if (article.relatedSoilIds?.some((id) => params.soilIds.has(id))) {
    score += 1;
  }
  return score;
};

export default function HomeScreen() {
  const router = useRouter();
  const { signOut } = useClerk();
  const [menuVisible, setMenuVisible] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timeout = setTimeout(() => setNow(new Date()), getNextSlotDelay(now));
    return () => clearTimeout(timeout);
  }, [now]);

  const currentMonth = now.getMonth() + 1;
  const slotOfDay = getSlotOfDay(now);
  const seed = `${getLocalDateKey(now)}-${slotOfDay}`;

  const bedsQuery = useGetBeds({ limit: 100, isActive: true });
  const plantingsActiveQuery = useGetPlantings({
    limit: 100,
    status: "ACTIVE",
  });
  const plantingsPlannedQuery = useGetPlantings({
    limit: 100,
    status: "PLANNED",
  });

  const articlesMonthQuery = useGetArticles({
    limit: PAGE_LIMIT,
    month: currentMonth,
  });
  const articlesFallbackQuery = useGetArticles({ limit: PAGE_LIMIT });

  const beds = useMemo(
    () => bedsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [bedsQuery.data?.pages],
  );

  const plantingsActive = useMemo(
    () => plantingsActiveQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [plantingsActiveQuery.data?.pages],
  );

  const plantingsPlanned = useMemo(
    () => plantingsPlannedQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [plantingsPlannedQuery.data?.pages],
  );

  const monthArticles = useMemo(
    () => articlesMonthQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [articlesMonthQuery.data?.pages],
  );

  const fallbackArticles = useMemo(
    () => articlesFallbackQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [articlesFallbackQuery.data?.pages],
  );

  const tips = useMemo(() => {
    const vegetableIds = new Set(
      [...plantingsActive, ...plantingsPlanned]
        .map((planting) => planting.vegetableId)
        .filter(Boolean),
    );
    const soilIds = new Set(
      beds
        .map((bed) => bed.soilId)
        .filter((soilId): soilId is string => !!soilId),
    );

    const preferredContexts = getPreferredContexts(
      plantingsPlanned.length > 0,
      plantingsActive.length > 0,
    );

    const scored = monthArticles
      .map((article) => ({
        article: article as ArticleListItemWithRelations,
        score: scoreArticle(article as ArticleListItemWithRelations, {
          currentMonth,
          preferredContexts,
          vegetableIds,
          soilIds,
        }),
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.article.priority ?? 0) - (a.article.priority ?? 0);
      })
      .slice(0, CANDIDATE_LIMIT)
      .map((entry) => entry.article);

    const seeded = seededShuffle(scored, seed).slice(0, ADVICE_LIMIT);
    if (seeded.length >= ADVICE_LIMIT) {
      return seeded;
    }

    const used = new Set(seeded.map((article) => article.id));
    const missing = ADVICE_LIMIT - seeded.length;
    const fallback = fallbackArticles
      .filter((article) => !used.has(article.id))
      .slice(0, missing);

    return [...seeded, ...fallback];
  }, [
    beds,
    currentMonth,
    fallbackArticles,
    monthArticles,
    plantingsActive,
    plantingsPlanned,
    seed,
  ]);

  const isLoading =
    bedsQuery.isLoading ||
    plantingsActiveQuery.isLoading ||
    plantingsPlannedQuery.isLoading ||
    articlesMonthQuery.isLoading ||
    articlesFallbackQuery.isLoading;

  const handleSignOut = async () => {
    try {
      setMenuVisible(false);
      await signOut();
      queryClient.clear();
      await clientPersister.removeClient();
      router.replace("/");
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Warzywnik</Text>
            <Text style={styles.subtitle}>
              Dziś: {now.toLocaleDateString()}
            </Text>
          </View>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="account-circle"
                size={28}
                onPress={() => setMenuVisible(true)}
                accessibilityLabel="Menu użytkownika"
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                router.push("/(tabs)/home/settings");
              }}
              title="Ustawienia"
            />
            <Menu.Item onPress={handleSignOut} title="Wyloguj" />
          </Menu>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator />
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Porady na dziś</Text>
              {tips.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>Brak porad na dziś</Text>
                  <Pressable
                    onPress={() => router.push("/(tabs)/education")}
                    style={styles.inlineAction}
                  >
                    <Text style={styles.inlineActionText}>
                      Przejdź do edukacji
                    </Text>
                  </Pressable>
                </View>
              ) : (
                tips.map((article) => (
                  <Pressable
                    key={article.id}
                    style={styles.tipCard}
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/education/[slug]",
                        params: { slug: article.slug },
                      })
                    }
                  >
                    <View style={styles.tipText}>
                      <Text style={styles.tipTitle}>{article.title}</Text>
                      <Text style={styles.tipExcerpt} numberOfLines={3}>
                        {article.excerpt}
                      </Text>
                    </View>
                    {article.coverImageUrl ? (
                      <Image
                        source={{ uri: article.coverImageUrl }}
                        style={styles.tipImage}
                        contentFit="cover"
                      />
                    ) : null}
                  </Pressable>
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Skróty</Text>
              <View style={styles.shortcuts}>
                <Pressable
                  style={styles.shortcutButton}
                  onPress={() => router.push("/(tabs)/beds/new")}
                >
                  <Text style={styles.shortcutText}>+ Dodaj grządkę</Text>
                </Pressable>
                <Pressable
                  style={styles.shortcutButton}
                  onPress={() => router.push("/(tabs)/beds")}
                >
                  <Text style={styles.shortcutText}>+ Dodaj uprawę</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Twoje teraz</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Aktywne grządki</Text>
                  <Text style={styles.statValue}>{beds.length}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Uprawy aktywne</Text>
                  <Text style={styles.statValue}>{plantingsActive.length}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Uprawy planowane</Text>
                  <Text style={styles.statValue}>
                    {plantingsPlanned.length}
                  </Text>
                </View>
              </View>
            </View>

            {beds.length === 0 ? (
              <View style={styles.section}>
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>Dodaj pierwszą grządkę</Text>
                  <Pressable
                    onPress={() => router.push("/(tabs)/beds/new")}
                    style={styles.inlineAction}
                  >
                    <Text style={styles.inlineActionText}>Utwórz grządkę</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
    gap: 12,
  },
  tipText: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  tipExcerpt: {
    fontSize: 13,
    color: "#6b7280",
  },
  tipImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  shortcuts: {
    gap: 12,
  },
  shortcutButton: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  shortcutText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  emptyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  inlineAction: {
    alignSelf: "flex-start",
  },
  inlineActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16a34a",
  },
});
