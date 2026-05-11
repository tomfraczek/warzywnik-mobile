import { ArticleListItem } from "@/src/api/queries/articles/types";
import { useGetArticles } from "@/src/api/queries/articles/useGetArticles";
import { WarningItem } from "@/src/api/queries/users/meTypes";
import { useGetMyTasks } from "@/src/api/queries/users/useGetMyTasks";
import { useGetMyWarnings } from "@/src/api/queries/users/useGetMyWarnings";
import { useGetMyWeather } from "@/src/api/queries/users/useGetMyWeather";
import { VegetableListItem } from "@/src/api/queries/vegetables/types";
import { useGetVegetables } from "@/src/api/queries/vegetables/useGetVegetables";
import { Screen } from "@/src/components/Screen";
import { Card } from "@/src/components/ui/Card";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { WarningCard } from "@/src/components/ui/WarningCard";
import { useSettings } from "@/src/context/SettingsProvider";
import {
  getTaskContextLabel,
  getTasksForToday,
  getTasksForTomorrow,
  isWeatherWarningTask,
  resolveTaskTargetType,
} from "@/src/features/tasks/model";
import {
  getOperationalWarningsToday,
  getOperationalWarningsTomorrow,
  getRadarWarnings,
  resolveWarningPresentation,
} from "@/src/features/warnings/model";
import { getSeverityTone, radius, spacing } from "@/src/theme/ui";
import {
  formatTemperature,
  getWeatherIconName,
  resolveWeatherLabel,
} from "@/src/utils/weather";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { isAxiosError } from "axios";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Icon,
  MD3Theme,
  Text,
  useTheme,
} from "react-native-paper";

const isWeatherMissingLocationError = (error: unknown) => {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 404 || status === 422;
};

const isWeatherUnavailableError = (error: unknown) => {
  if (!isAxiosError(error)) return false;
  return error.response?.status === 503;
};

// ─── shared library-preview helpers ──────────────────────────────────────────

const CONTEXT_LABELS: Record<string, string> = {
  BALCONY: "Balkon",
  BED: "Grządka",
  GREENHOUSE: "Szklarnia",
};
const SEASON_LABELS_HOME: Record<string, string> = {
  SPRING: "Wiosna",
  SUMMER: "Lato",
  AUTUMN: "Jesień",
  WINTER: "Zima",
};

const getVegetableEmoji = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("pomidor")) return "🍅";
  if (n.includes("marchew")) return "🥕";
  if (n.includes("ogórek")) return "🥒";
  if (n.includes("sałat")) return "🥬";
  if (n.includes("cebula")) return "🧅";
  if (n.includes("ziemniak")) return "🥔";
  if (n.includes("papryk")) return "🫑";
  if (n.includes("dyni") || n.includes("cukini")) return "🎃";
  return "🌱";
};

const getArticleEyebrow = (item: ArticleListItem) => {
  const context = item.contexts[0];
  const season = item.seasons[0];
  if (context && CONTEXT_LABELS[context]) return CONTEXT_LABELS[context];
  if (season && SEASON_LABELS_HOME[season]) return SEASON_LABELS_HOME[season];
  return "Biblioteka";
};

const getArticleReadTime = (item: ArticleListItem) => {
  if (item.readTimeMinutes) return `${item.readTimeMinutes} min czytania`;
  const words = `${item.title} ${item.excerpt}`.trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min czytania`;
};

function HomeSectionHeader({
  title,
  actionLabel,
  onActionPress,
}: {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}) {
  return (
    <View style={libStyles.sectionHeader}>
      <Text style={libStyles.sectionTitle}>{title}</Text>
      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <Text style={libStyles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function TwoColumnGrid({ children }: { children: React.ReactElement[] }) {
  const left = children.filter((_, i) => i % 2 === 0);
  const right = children.filter((_, i) => i % 2 === 1);
  return (
    <View style={libStyles.twoColWrap}>
      <View style={libStyles.twoColColumn}>{left}</View>
      <View style={libStyles.twoColColumn}>{right}</View>
    </View>
  );
}

function HomeVegetableCard({
  item,
  onPress,
}: {
  item: VegetableListItem;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <View style={libStyles.vegetableCard}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={libStyles.vegetableImage}
            contentFit="cover"
          />
        ) : (
          <Text style={libStyles.vegetableEmoji}>
            {getVegetableEmoji(item.name)}
          </Text>
        )}
        <Text style={libStyles.vegetableTitle} numberOfLines={2}>
          {item.name}
        </Text>
      </View>
    </Pressable>
  );
}

function HomeArticleCard({
  item,
  onPress,
  onPressIn,
}: {
  item: ArticleListItem;
  onPress: () => void;
  onPressIn?: () => void;
}) {
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} hitSlop={6}>
      <View style={libStyles.articleCard}>
        {item.coverImageUrl ? (
          <Image
            source={{
              uri: item.coverImageUrl,
            }}
            style={libStyles.articleImage}
            contentFit="cover"
            recyclingKey={item.slug}
          />
        ) : (
          <View style={libStyles.articleImageFallback}>
            <Icon
              source="book-open-page-variant-outline"
              size={36}
              color="#5B7B6C"
            />
          </View>
        )}
        <View style={libStyles.articleBody}>
          <Text style={libStyles.articleEyebrow}>
            {getArticleEyebrow(item)}
          </Text>
          <Text style={libStyles.articleTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={libStyles.articleExcerpt} numberOfLines={3}>
            {item.excerpt}
          </Text>
          <Text style={libStyles.articleMeta}>{getArticleReadTime(item)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const prefetchArticleCover = (uri?: string | null) => {
  if (!uri) return;
  void Image.prefetch(uri, "memory-disk").catch(() => undefined);
};

// ─────────────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const { profile, location } = useSettings();

  const {
    data: weatherData,
    isLoading: weatherLoading,
    isError: isWeatherError,
    error: weatherError,
  } = useGetMyWeather();
  const localLocationLabel = location?.label ?? null;
  const serverLocationLabel = weatherData?.location.label ?? null;
  const weatherSubtitle =
    serverLocationLabel ?? localLocationLabel ?? "Brak ustawionej lokalizacji";
  const { data: tasksData, isLoading: tasksLoading } = useGetMyTasks("pending");
  const { data: warningsData, isLoading: warningsLoading } = useGetMyWarnings();
  const { data: articlesData, isLoading: articlesLoading } = useGetArticles({
    limit: 3,
  });
  const { data: vegetablesData, isLoading: vegetablesLoading } =
    useGetVegetables({ limit: 4 });

  const warnings = useMemo(
    () => warningsData?.items ?? [],
    [warningsData?.items],
  );

  const allPendingTasks = useMemo(
    () => tasksData?.items ?? [],
    [tasksData?.items],
  );

  // Weather-task grouping – based on dueAt local date
  const weatherTasksToday = useMemo(
    () => getTasksForToday(allPendingTasks.filter(isWeatherWarningTask)),
    [allPendingTasks],
  );
  const weatherTasksTomorrow = useMemo(
    () => getTasksForTomorrow(allPendingTasks.filter(isWeatherWarningTask)),
    [allPendingTasks],
  );

  // Warning grouping – based on localDate + code
  const operationalToday = useMemo(
    () => getOperationalWarningsToday(warnings),
    [warnings],
  );
  const operationalTomorrow = useMemo(
    () => getOperationalWarningsTomorrow(warnings),
    [warnings],
  );
  const radarWarnings = useMemo(() => getRadarWarnings(warnings), [warnings]);

  const hasAnyWarnings =
    operationalToday.length > 0 ||
    operationalTomorrow.length > 0 ||
    radarWarnings.length > 0;

  /**
   * Home-screen preview: today first, then tomorrow, then 1-2 radar.
   * Priority: show today if available, otherwise tomorrow, otherwise radar.
   */
  const previewGroups = useMemo(() => {
    const groups: { label: string; items: WarningItem[] }[] = [];
    const todaySlice = operationalToday.slice(0, 2);
    const tomorrowSlice = operationalTomorrow.slice(
      0,
      Math.max(0, 3 - todaySlice.length),
    );
    const radarSlice = radarWarnings.slice(
      0,
      Math.max(0, 2 - tomorrowSlice.length),
    );

    if (todaySlice.length) groups.push({ label: "Dziś", items: todaySlice });
    if (tomorrowSlice.length)
      groups.push({ label: "Jutro", items: tomorrowSlice });
    if (radarSlice.length) groups.push({ label: "Radar", items: radarSlice });

    return groups;
  }, [operationalToday, operationalTomorrow, radarWarnings]);

  const tips: ArticleListItem[] =
    articlesData?.pages.flatMap((page) => page.items).slice(0, 3) ?? [];

  const popularVegetables =
    vegetablesData?.pages.flatMap((page) => page.items).slice(0, 4) ?? [];

  const isLoading =
    weatherLoading &&
    tasksLoading &&
    warningsLoading &&
    articlesLoading &&
    vegetablesLoading;

  const handleWarningPress = (warning: WarningItem) => {
    const presentation = resolveWarningPresentation(warning);

    if (presentation.scope === "PLANTING" && presentation.plantingId) {
      router.push(`/plantings/${presentation.plantingId}`);
      return;
    }
    if (presentation.scope === "BED" && presentation.bedId) {
      router.push(`/(tabs)/beds/${presentation.bedId}`);
      return;
    }
    if (presentation.scope === "USER") {
      router.push("/(tabs)/home/warnings");
      return;
    }
    router.push({
      pathname: "/(tabs)/home/alert-details",
      params: {
        title: presentation.title,
        message: presentation.message,
        hint: presentation.hint ?? "",
        scope: presentation.scope,
        bedId: presentation.bedId ?? "",
        bedName: presentation.bedName ?? "",
        plantingId: presentation.plantingId ?? "",
        vegetableName: presentation.vegetableName ?? "",
        code: warning.code ?? "",
        horizon: presentation.horizon ?? "",
        dayPart: presentation.dayPart ?? "",
      },
    });
  };

  const handleTaskPress = () => {
    router.push({
      pathname: "/(tabs)/planner/tasks" as any,
      params: { source: "WEATHER_WARNING" },
    });
  };

  const getWeatherTaskContext = (task: (typeof weatherTasksToday)[number]) => {
    const targetType = resolveTaskTargetType(task);
    if (targetType !== "bed" && targetType !== "planting") return null;
    return getTaskContextLabel(task);
  };

  return (
    <Screen safeAreaEdges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View style={styles.topBar}>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>
              Cześć{profile.name ? `, ${profile.name}` : ""}!
            </Text>
          </View>
          <StatusBadge
            label={
              weatherData?.stale ? "Pogoda: nieaktualna" : "Pogoda: aktualna"
            }
            tone={weatherData?.stale ? "warning" : "success"}
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator />
          </View>
        ) : (
          <>
            <Pressable onPress={() => router.push("/(tabs)/home/weather")}>
              <Card title="Pogoda teraz" subtitle={weatherSubtitle}>
                {isWeatherError ? (
                  <View style={styles.weatherErrorWrap}>
                    <Text style={styles.placeholder}>
                      {isWeatherMissingLocationError(weatherError)
                        ? "Ustaw lokalizację, aby pobrać pogodę."
                        : isWeatherUnavailableError(weatherError)
                          ? "Pogoda chwilowo niedostępna."
                          : "Nie udało się pobrać pogody (błąd serwera)."}
                    </Text>
                    {isWeatherMissingLocationError(weatherError) &&
                    localLocationLabel ? (
                      <Text style={styles.weatherMeta}>
                        Lokalnie: {localLocationLabel}. Serwer nie ma jeszcze
                        tej lokalizacji.
                      </Text>
                    ) : null}
                    <View style={styles.weatherErrorActions}>
                      {isWeatherMissingLocationError(weatherError) ? (
                        <Button
                          compact
                          mode="text"
                          onPress={() => router.push("/(tabs)/home/settings")}
                        >
                          Ustaw lokalizację
                        </Button>
                      ) : null}
                      <Button
                        compact
                        mode="text"
                        onPress={() => router.push("/(tabs)/home/weather")}
                      >
                        Szczegóły
                      </Button>
                    </View>
                  </View>
                ) : (
                  <View style={styles.weatherRow}>
                    <View style={styles.weatherMainData}>
                      <Text style={styles.weatherTemp}>
                        {weatherData?.current?.temp != null
                          ? `${formatTemperature(weatherData.current.temp)}°`
                          : "--°"}
                      </Text>
                      <Text style={styles.weatherTypeText}>
                        {resolveWeatherLabel(
                          weatherData?.current?.weatherLabel,
                          weatherData?.current?.weatherType,
                          {
                            precip: weatherData?.current?.precip,
                            rain: weatherData?.current?.rain,
                            snow: weatherData?.current?.snow,
                            isDay: weatherData?.current?.isDay,
                          },
                        )}
                      </Text>
                      <Text style={styles.weatherMeta}>
                        Min {formatTemperature(weatherData?.today?.tempMin)}° •
                        Max {formatTemperature(weatherData?.today?.tempMax)}°
                      </Text>
                      <Text style={styles.weatherMeta}>
                        Wiatr {weatherData?.current?.windSpeed ?? "--"} km/h •
                        Opad {weatherData?.current?.precip ?? "--"} mm
                      </Text>
                    </View>

                    <View style={styles.weatherIconWrap}>
                      <MaterialCommunityIcons
                        name={getWeatherIconName(
                          weatherData?.current?.weatherType,
                          {
                            precip: weatherData?.current?.precip,
                            rain: weatherData?.current?.rain,
                            snow: weatherData?.current?.snow,
                            isDay: weatherData?.current?.isDay,
                          },
                        )}
                        size={26}
                        color={theme.colors.primary}
                      />
                    </View>
                  </View>
                )}
              </Card>
            </Pressable>

            <Card
              title="Alerty pogodowe"
              subtitle="Aktywne alerty dla Twojego ogrodu"
              rightSlot={
                hasAnyWarnings ? (
                  <Pressable
                    onPress={() => router.push("/(tabs)/home/warnings")}
                  >
                    <Text style={styles.cardCta}>Wszystkie →</Text>
                  </Pressable>
                ) : undefined
              }
            >
              <View style={styles.stack}>
                {warningsLoading ? (
                  <ActivityIndicator size="small" />
                ) : !hasAnyWarnings ? (
                  <Text style={styles.placeholder}>
                    Brak aktywnych alertów pogodowych.
                  </Text>
                ) : (
                  previewGroups.map((group) =>
                    group.items.map((warning) => {
                      const presentation = resolveWarningPresentation(warning);
                      const tone = getSeverityTone(warning.severity);
                      return (
                        <WarningCard
                          key={warning.dedupeKey}
                          title={presentation.title}
                          message={presentation.message}
                          severity={warning.severity}
                          scopeLabel={`${group.label} · ${presentation.scopeLabel}`}
                          contextLabel={presentation.contextLabel}
                          ctaLabel={
                            presentation.isActionable
                              ? "Przejdź do działania"
                              : "Zobacz prognozę"
                          }
                          onPress={() => handleWarningPress(warning)}
                        />
                      );
                    }),
                  )
                )}
              </View>
            </Card>

            {/* ── Popularne warzywa ── */}
            <View style={styles.libSection}>
              <HomeSectionHeader
                title="Popularne warzywa"
                actionLabel="Zobacz wszystkie"
                onActionPress={() =>
                  router.push("/(tabs)/education/vegetables")
                }
              />
              {vegetablesLoading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="small" />
                </View>
              ) : popularVegetables.length > 0 ? (
                <TwoColumnGrid>
                  {popularVegetables.map((item) => (
                    <HomeVegetableCard
                      key={item.id}
                      item={item}
                      onPress={() =>
                        router.push(`/(tabs)/education/vegetables/${item.id}`)
                      }
                    />
                  ))}
                </TwoColumnGrid>
              ) : null}
            </View>

            {/* ── Polecane artykuły ── */}
            <View style={styles.libSection}>
              <HomeSectionHeader
                title="Polecane artykuły"
                actionLabel="Zobacz wszystkie"
                onActionPress={() => router.push("/(tabs)/education/articles")}
              />
              {articlesLoading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="small" />
                </View>
              ) : tips.length > 0 ? (
                <View style={styles.articleList}>
                  {tips.map((article) => (
                    <HomeArticleCard
                      key={article.id}
                      item={article}
                      onPressIn={() =>
                        prefetchArticleCover(article.coverImageUrl)
                      }
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/education/articles/[id]",
                          params: { id: article.id, fromHome: "1" },
                        })
                      }
                    />
                  ))}
                </View>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    screenContent: {
      flex: 1,
    },
    container: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    topBar: {
      gap: spacing.sm,
    },
    titleWrap: {
      gap: spacing.xs,
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      color: theme.colors.onBackground,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    loadingWrap: {
      paddingVertical: spacing.xl,
      alignItems: "center",
      justifyContent: "center",
    },
    weatherRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing.sm,
    },
    weatherMainData: {
      flex: 1,
    },
    weatherTemp: {
      fontSize: 34,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    weatherTypeText: {
      marginTop: 2,
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    weatherMeta: {
      marginTop: spacing.xs,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    weatherErrorWrap: {
      gap: spacing.xs,
    },
    weatherErrorActions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    weatherIconWrap: {
      width: 56,
      height: 56,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primaryContainer,
    },
    stack: {
      gap: spacing.sm,
    },
    placeholder: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    cardCta: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    taskRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    taskDayDot: {
      width: 8,
      height: 8,
      borderRadius: radius.pill,
      backgroundColor: theme.colors.primary,
      marginTop: 5,
    },
    taskDayDotTomorrow: {
      backgroundColor: theme.colors.secondary,
    },
    taskContent: {
      flex: 1,
      gap: 2,
    },
    taskTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    taskMeta: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    adviceCard: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "stretch",
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: radius.md,
      padding: spacing.sm,
    },
    adviceText: {
      flex: 1,
      gap: spacing.xs,
    },
    adviceTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    adviceBody: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    adviceCta: {
      marginTop: spacing.sm,
      fontSize: 12,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    adviceImage: {
      width: 84,
      borderRadius: radius.sm,
      backgroundColor: theme.colors.surfaceVariant,
    },
    libSection: {
      gap: 0,
    },
    articleList: {
      gap: spacing.md,
    },
    actions: {
      gap: spacing.sm,
      paddingBottom: spacing.lg,
    },
  });

// ─── library preview styles (same as education/index.tsx) ────────────────────
const libStyles = StyleSheet.create({
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
  twoColWrap: {
    flexDirection: "row",
    gap: 16,
  },
  twoColColumn: {
    flex: 1,
    gap: 16,
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
});
