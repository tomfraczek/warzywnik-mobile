import { ArticleListItem } from "@/src/api/queries/articles/types";
import { useGetArticles } from "@/src/api/queries/articles/useGetArticles";
import { useGetNotificationsSummary } from "@/src/api/queries/notifications/useGetNotificationsSummary";
import { WeatherStatusLevel } from "@/src/api/queries/users/meTypes";
import { useGetMyWeather } from "@/src/api/queries/users/useGetMyWeather";
import { VegetableListItem } from "@/src/api/queries/vegetables/types";
import { useGetVegetables } from "@/src/api/queries/vegetables/useGetVegetables";
import { Screen } from "@/src/components/Screen";
import { Card } from "@/src/components/ui/Card";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { useSettings } from "@/src/context/SettingsProvider";
import { radius, spacing } from "@/src/theme/ui";
import {
  formatTemperature,
  getWeatherIconName,
  resolveWeatherLabel,
} from "@/src/utils/weather";
import {
  formatWeatherStatusTimeWindow,
  normalizeWeatherStatus,
} from "@/src/utils/weatherStatus";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { isAxiosError } from "axios";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
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

const getWeatherStatusLevelLabel = (level: WeatherStatusLevel) => {
  switch (level) {
    case "critical":
      return "Pilny alert";
    case "warning":
      return "Ostrzeżenie";
    case "watch":
      return "Obserwuj";
    case "ok":
    default:
      return "Spokojnie";
  }
};

const getWeatherStatusIcon = (level: WeatherStatusLevel) => {
  switch (level) {
    case "critical":
      return "alert-octagram" as const;
    case "warning":
      return "alert" as const;
    case "watch":
      return "eye-outline" as const;
    case "ok":
    default:
      return "check-circle-outline" as const;
  }
};

const getWeatherStatusCardToneStyles = (
  styles: ReturnType<typeof makeStyles>,
  level: WeatherStatusLevel,
) => {
  switch (level) {
    case "critical":
      return {
        card: styles.weatherStatusCard_critical,
        pill: styles.weatherStatusPill_critical,
        text: styles.weatherStatusText_critical,
      };
    case "warning":
      return {
        card: styles.weatherStatusCard_warning,
        pill: styles.weatherStatusPill_warning,
        text: styles.weatherStatusText_warning,
      };
    case "watch":
      return {
        card: styles.weatherStatusCard_watch,
        pill: styles.weatherStatusPill_watch,
        text: styles.weatherStatusText_watch,
      };
    case "ok":
    default:
      return {
        card: styles.weatherStatusCard_ok,
        pill: styles.weatherStatusPill_ok,
        text: styles.weatherStatusText_ok,
      };
  }
};

const getNotificationsDotColor = (
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL" | null,
) => {
  if (priority === "CRITICAL") return "#D32F2F";
  if (priority === "HIGH") return "#E07A00";
  return "#2E7D32";
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
  const weatherStatus = normalizeWeatherStatus(weatherData?.status, "weather");
  const gardenRiskStatus = normalizeWeatherStatus(
    weatherData?.gardenRiskStatus,
    "garden",
  );
  const weatherStatusTimeWindow = weatherStatus
    ? formatWeatherStatusTimeWindow(weatherStatus)
    : null;
  const gardenRiskStatusTimeWindow = gardenRiskStatus
    ? formatWeatherStatusTimeWindow(gardenRiskStatus)
    : null;
  const { data: articlesData, isLoading: articlesLoading } = useGetArticles({
    limit: 3,
  });
  const { data: vegetablesData, isLoading: vegetablesLoading } =
    useGetVegetables({ limit: 4 });
  const notificationsSummaryQuery = useGetNotificationsSummary();
  const notificationsSummary = notificationsSummaryQuery.data;
  const hasUnreadNotifications = notificationsSummary?.hasUnread === true;
  const notificationDotColor = getNotificationsDotColor(
    notificationsSummary?.highestUnreadPriority ?? null,
  );

  const tips: ArticleListItem[] =
    articlesData?.pages.flatMap((page) => page.items).slice(0, 3) ?? [];

  const popularVegetables =
    vegetablesData?.pages.flatMap((page) => page.items).slice(0, 4) ?? [];

  const isLoading = weatherLoading && articlesLoading && vegetablesLoading;

  return (
    <Screen safeAreaEdges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View style={styles.topBar}>
          <View style={styles.topBarRow}>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>
                Cześć{profile.name ? `, ${profile.name}` : ""}!
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/notifications")}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Powiadomienia"
              style={styles.notificationsBellButton}
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={22}
                color={theme.colors.onSurface}
              />
              {hasUnreadNotifications ? (
                <View
                  style={[
                    styles.notificationsDot,
                    { backgroundColor: notificationDotColor },
                  ]}
                />
              ) : null}
            </Pressable>
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

            {!isWeatherError && weatherStatus
              ? (() => {
                  const toneStyles = getWeatherStatusCardToneStyles(
                    styles,
                    weatherStatus.level,
                  );

                  return (
                    <View style={[styles.weatherStatusCard, toneStyles.card]}>
                      <Text style={styles.weatherStatusSectionTitle}>
                        Status pogody
                      </Text>
                      <View style={styles.weatherStatusHeader}>
                        <View
                          style={[styles.weatherStatusPill, toneStyles.pill]}
                        >
                          <Text style={styles.weatherStatusPillText}>
                            {getWeatherStatusLevelLabel(weatherStatus.level)}
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name={getWeatherStatusIcon(weatherStatus.level)}
                          size={20}
                          color={toneStyles.text.color}
                        />
                      </View>

                      <Text
                        style={[styles.weatherStatusTitle, toneStyles.text]}
                      >
                        {weatherStatus.title}
                      </Text>
                      <Text
                        style={[styles.weatherStatusSubtitle, toneStyles.text]}
                      >
                        {weatherStatus.subtitle}
                      </Text>

                      {weatherStatusTimeWindow ? (
                        <Text
                          style={[styles.weatherStatusMeta, toneStyles.text]}
                        >
                          {weatherStatusTimeWindow}
                        </Text>
                      ) : null}
                      <Pressable
                        onPress={() => router.push("/(tabs)/home/weather")}
                        hitSlop={8}
                      >
                        <Text style={styles.weatherStatusLink}>
                          Zobacz pełną pogodę
                        </Text>
                      </Pressable>
                    </View>
                  );
                })()
              : null}

            {!isWeatherError && gardenRiskStatus
              ? (() => {
                  const toneStyles = getWeatherStatusCardToneStyles(
                    styles,
                    gardenRiskStatus.level,
                  );

                  return (
                    <View
                      style={[
                        styles.gardenRiskCard,
                        styles.weatherStatusCard,
                        toneStyles.card,
                      ]}
                    >
                      <Text style={styles.weatherStatusSectionTitle}>
                        Ryzyko dla ogrodu
                      </Text>
                      <View style={styles.weatherStatusHeader}>
                        <View
                          style={[styles.weatherStatusPill, toneStyles.pill]}
                        >
                          <Text style={styles.weatherStatusPillText}>
                            {getWeatherStatusLevelLabel(gardenRiskStatus.level)}
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name={getWeatherStatusIcon(gardenRiskStatus.level)}
                          size={18}
                          color={toneStyles.text.color}
                        />
                      </View>

                      <Text style={[styles.gardenRiskTitle, toneStyles.text]}>
                        {gardenRiskStatus.title}
                      </Text>
                      <Text
                        style={[styles.weatherStatusSubtitle, toneStyles.text]}
                      >
                        {gardenRiskStatus.subtitle}
                      </Text>

                      {gardenRiskStatusTimeWindow ? (
                        <Text
                          style={[styles.weatherStatusMeta, toneStyles.text]}
                        >
                          {gardenRiskStatusTimeWindow}
                        </Text>
                      ) : null}

                      <Pressable
                        onPress={() => router.push("/(tabs)/home/warnings")}
                        hitSlop={8}
                      >
                        <Text style={styles.weatherStatusLink}>
                          Zobacz wszystkie alerty
                        </Text>
                      </Pressable>
                    </View>
                  );
                })()
              : null}

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
    topBarRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    titleWrap: {
      flex: 1,
      gap: spacing.xs,
    },
    notificationsBellButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      position: "relative",
    },
    notificationsDot: {
      position: "absolute",
      top: 7,
      right: 8,
      width: 9,
      height: 9,
      borderRadius: 5,
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
    weatherStatusCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: 6,
    },
    gardenRiskCard: {
      paddingVertical: spacing.sm,
      gap: 4,
    },
    weatherStatusSectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.35,
      color: theme.colors.onSurfaceVariant,
    },
    weatherStatusCard_ok: {
      backgroundColor: "#E9F7EF",
      borderColor: "#BEE6CD",
    },
    weatherStatusCard_watch: {
      backgroundColor: "#FFF7E8",
      borderColor: "#F3DEB5",
    },
    weatherStatusCard_warning: {
      backgroundColor: "#FFF0E8",
      borderColor: "#F5D0BD",
    },
    weatherStatusCard_critical: {
      backgroundColor: "#FDEBEC",
      borderColor: "#F3B8BD",
    },
    weatherStatusHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    weatherStatusPill: {
      borderRadius: radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      alignSelf: "flex-start",
    },
    weatherStatusPill_ok: {
      backgroundColor: "#D4F0DF",
      borderColor: "#A9DABD",
    },
    weatherStatusPill_watch: {
      backgroundColor: "#FBEACA",
      borderColor: "#EDD4A0",
    },
    weatherStatusPill_warning: {
      backgroundColor: "#FADCCB",
      borderColor: "#EFC2A8",
    },
    weatherStatusPill_critical: {
      backgroundColor: "#F7D2D5",
      borderColor: "#EAA9AF",
    },
    weatherStatusPillText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#27332D",
    },
    weatherStatusTitle: {
      fontSize: 16,
      fontWeight: "700",
    },
    gardenRiskTitle: {
      fontSize: 15,
      fontWeight: "700",
    },
    weatherStatusSubtitle: {
      fontSize: 14,
      lineHeight: 20,
    },
    weatherStatusMeta: {
      fontSize: 12,
      lineHeight: 17,
    },
    weatherStatusLink: {
      marginTop: spacing.xs,
      fontSize: 13,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    weatherStatusText_ok: {
      color: "#204431",
    },
    weatherStatusText_watch: {
      color: "#62460A",
    },
    weatherStatusText_warning: {
      color: "#683118",
    },
    weatherStatusText_critical: {
      color: "#6C2028",
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
    warningInfoModal: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: spacing.md,
      gap: spacing.sm,
    },
    warningInfoTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    warningInfoText: {
      fontSize: 14,
      lineHeight: 21,
      color: theme.colors.onSurface,
    },
    warningInfoHint: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.colors.onSurfaceVariant,
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
