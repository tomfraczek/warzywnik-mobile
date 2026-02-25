import { Article, ArticleListItem } from "@/src/api/queries/articles/types";
import { useGetArticles } from "@/src/api/queries/articles/useGetArticles";
import { useGetBeds } from "@/src/api/queries/beds/useGetBeds";
import { useGetPlantings } from "@/src/api/queries/plantings/useGetPlantings";
import { TaskItem, WarningItem } from "@/src/api/queries/users/meTypes";
import { useGetMyTasks } from "@/src/api/queries/users/useGetMyTasks";
import { useGetMyWarnings } from "@/src/api/queries/users/useGetMyWarnings";
import { useGetMyWeather } from "@/src/api/queries/users/useGetMyWeather";
import { Screen } from "@/src/components/Screen";
import { useFocusEffect } from "@react-navigation/native";
import { isAxiosError } from "axios";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, MD3Theme, useTheme } from "react-native-paper";
import { HomeSearchBar } from "./_components/HomeSearchBar";

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

type ApiErrorPayload = {
  message?: string;
  code?: string;
  error?: string;
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
};

const isMissingLocationError = (error: unknown) => {
  if (!isAxiosError<ApiErrorPayload>(error)) {
    return false;
  }

  const message =
    `${error.response?.data?.message ?? ""} ${error.response?.data?.error ?? ""}`.toLowerCase();
  const code = (error.response?.data?.code ?? "").toLowerCase();

  return (
    code.includes("location") ||
    message.includes("location") ||
    message.includes("lokaliz")
  );
};

const sortTasksByDueAt = (tasks: TaskItem[]) => {
  return [...tasks].sort((a, b) => {
    if (!a.dueAt && !b.dueAt) return 0;
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;

    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
};

const warningKey = (item: WarningItem, index: number) =>
  `${item.code}-${item.severity}-${index}`;

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const [now, setNow] = useState(() => new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

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
  const weatherQuery = useGetMyWeather();
  const warningsQuery = useGetMyWarnings();
  const tasksQuery = useGetMyTasks();

  const refetchMeData = useCallback(async () => {
    await Promise.all([
      weatherQuery.refetch(),
      warningsQuery.refetch(),
      tasksQuery.refetch(),
    ]);
  }, [tasksQuery, warningsQuery, weatherQuery]);

  useFocusEffect(
    useCallback(() => {
      void refetchMeData();
    }, [refetchMeData]),
  );

  useEffect(() => {
    let previousAppState = AppState.currentState;

    const subscription = AppState.addEventListener("change", (nextState) => {
      const cameFromBackground =
        previousAppState === "background" || previousAppState === "inactive";
      if (cameFromBackground && nextState === "active") {
        void refetchMeData();
      }
      previousAppState = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [refetchMeData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetchMeData();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchMeData]);

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
  const sortedTasks = useMemo(
    () => sortTasksByDueAt(tasksQuery.data?.items ?? []),
    [tasksQuery.data?.items],
  );
  const showMissingLocationInWeather = isMissingLocationError(
    weatherQuery.error,
  );

  return (
    <Screen safeAreaEdges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.topSection}>
          <HomeSearchBar />
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Warzywnik</Text>
            <Text style={styles.subtitle}>
              Dziś: {now.toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pogoda</Text>
          {weatherQuery.isLoading ? (
            <View style={styles.infoCard}>
              <ActivityIndicator />
            </View>
          ) : weatherQuery.isError ? (
            <View style={styles.emptyCard}>
              {showMissingLocationInWeather ? (
                <>
                  <Text style={styles.emptyTitle}>
                    Ustaw lokalizację, aby pobrać pogodę.
                  </Text>
                  <Button
                    mode="text"
                    onPress={() => router.push("/(tabs)/home/settings")}
                    style={styles.inlineAction}
                  >
                    Ustaw lokalizację
                  </Button>
                </>
              ) : (
                <>
                  <Text style={styles.emptyTitle}>
                    Nie udało się pobrać pogody.
                  </Text>
                  <Button
                    mode="text"
                    onPress={() => weatherQuery.refetch()}
                    style={styles.inlineAction}
                  >
                    Spróbuj ponownie
                  </Button>
                </>
              )}
            </View>
          ) : weatherQuery.data ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                {weatherQuery.data.location.label}
              </Text>
              <Text style={styles.weatherMain}>
                {weatherQuery.data.today.tempMin}° /{" "}
                {weatherQuery.data.today.tempMax}°
              </Text>
              <Text style={styles.infoText}>
                Opady: {weatherQuery.data.today.precipSum} mm • Wiatr max:{" "}
                {weatherQuery.data.today.windMax} km/h
              </Text>
              <Text style={styles.infoMeta}>
                Zaktualizowano: {formatDateTime(weatherQuery.data.fetchedAt)}
              </Text>
              {weatherQuery.data.stale ? (
                <Text style={styles.warningText}>
                  Używam ostatnich danych (nie udało się odświeżyć).
                </Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Brak danych pogodowych.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ostrzeżenia</Text>
          {warningsQuery.isLoading ? (
            <View style={styles.infoCard}>
              <ActivityIndicator />
            </View>
          ) : warningsQuery.isError ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                Nie udało się pobrać ostrzeżeń.
              </Text>
              <Button
                mode="text"
                onPress={() => warningsQuery.refetch()}
                style={styles.inlineAction}
              >
                Spróbuj ponownie
              </Button>
            </View>
          ) : warningsQuery.data ? (
            <View style={styles.infoCard}>
              {warningsQuery.data.weatherBasis === "NONE" ? (
                <Text style={styles.infoText}>
                  Ustaw lokalizację, aby otrzymywać ostrzeżenia pogodowe.
                </Text>
              ) : null}
              {warningsQuery.data.items.length === 0 ? (
                <Text style={styles.infoText}>Brak aktywnych ostrzeżeń.</Text>
              ) : (
                warningsQuery.data.items.map((item, index) => (
                  <View key={warningKey(item, index)} style={styles.listItem}>
                    <Text style={styles.listItemTitle}>{item.title}</Text>
                    <Text style={styles.listItemMeta}>
                      {item.severity} • {item.code}
                    </Text>
                    <Text style={styles.listItemBody}>{item.message}</Text>
                  </View>
                ))
              )}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                Brak danych o ostrzeżeniach.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zadania</Text>
          {tasksQuery.isLoading ? (
            <View style={styles.infoCard}>
              <ActivityIndicator />
            </View>
          ) : tasksQuery.isError ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nie udało się pobrać zadań.</Text>
              <Button
                mode="text"
                onPress={() => tasksQuery.refetch()}
                style={styles.inlineAction}
              >
                Spróbuj ponownie
              </Button>
            </View>
          ) : tasksQuery.data ? (
            <View style={styles.infoCard}>
              {sortedTasks.length === 0 ? (
                <Text style={styles.infoText}>Brak zadań na teraz.</Text>
              ) : (
                sortedTasks.map((task) => (
                  <View key={task.id} style={styles.listItem}>
                    <Text style={styles.listItemTitle}>{task.title}</Text>
                    <Text style={styles.listItemMeta}>
                      Status: {task.status}
                    </Text>
                    {task.dueAt ? (
                      <Text style={styles.listItemBody}>
                        Termin: {formatDateTime(task.dueAt)}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
              <Text style={styles.infoMeta}>
                Obliczono: {formatDateTime(tasksQuery.data.computedAt)}
              </Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Brak danych o zadaniach.</Text>
            </View>
          )}
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
                  <Button
                    mode="text"
                    onPress={() => router.push("/(tabs)/education")}
                    style={styles.inlineAction}
                  >
                    Przejdź do edukacji
                  </Button>
                </View>
              ) : (
                tips.map((article) => (
                  <Pressable
                    key={article.id}
                    style={styles.tipCard}
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/education/articles/[id]",
                        params: { id: article.id, fromHome: "1" },
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
                <Button
                  mode="contained"
                  onPress={() => router.push("/(tabs)/beds/new")}
                  style={styles.shortcutButton}
                >
                  + Dodaj grządkę
                </Button>
                <Button
                  mode="contained"
                  onPress={() => router.push("/(tabs)/beds")}
                  style={styles.shortcutButton}
                >
                  + Dodaj uprawę
                </Button>
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
                  <Button
                    mode="text"
                    onPress={() => router.push("/(tabs)/beds/new")}
                    style={styles.inlineAction}
                  >
                    Utwórz grządkę
                  </Button>
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    content: {
      padding: 20,
      paddingBottom: 32,
    },
    topSection: {
      gap: 16,
      marginBottom: 8,
    },
    titleBlock: {
      gap: 4,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.colors.onBackground,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    section: {
      marginTop: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 12,
      color: theme.colors.onBackground,
    },
    loading: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 40,
    },
    infoCard: {
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      gap: 8,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    infoMeta: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    weatherMain: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    warningText: {
      color: theme.colors.error,
      fontSize: 13,
      fontWeight: "600",
    },
    listItem: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    listItemTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    listItemMeta: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    listItemBody: {
      fontSize: 13,
      color: theme.colors.onSurface,
      marginTop: 4,
    },
    tipCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
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
      color: theme.colors.onSurface,
    },
    tipExcerpt: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    tipImage: {
      width: 72,
      height: 72,
      borderRadius: 10,
      backgroundColor: theme.colors.surfaceVariant,
    },
    shortcuts: {
      gap: 12,
    },
    shortcutButton: {
      borderRadius: 12,
    },
    statsGrid: {
      gap: 12,
    },
    statCard: {
      padding: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    statLabel: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    statValue: {
      fontSize: 20,
      fontWeight: "700",
      marginTop: 4,
      color: theme.colors.onSurface,
    },
    emptyCard: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
    },
    emptyTitle: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 8,
      color: theme.colors.onSurface,
    },
    inlineAction: {
      alignSelf: "flex-start",
    },
  });
