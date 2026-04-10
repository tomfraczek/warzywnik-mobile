import { ArticleListItem } from "@/src/api/queries/articles/types";
import { useGetArticles } from "@/src/api/queries/articles/useGetArticles";
import { WarningItem } from "@/src/api/queries/users/meTypes";
import { useGetMyTasks } from "@/src/api/queries/users/useGetMyTasks";
import { useGetMyWarnings } from "@/src/api/queries/users/useGetMyWarnings";
import { useGetMyWeather } from "@/src/api/queries/users/useGetMyWeather";
import { Card } from "@/src/components/ui/Card";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { WarningCard } from "@/src/components/ui/WarningCard";
import { useSettings } from "@/src/context/SettingsProvider";
import {
  getTasksForToday,
  getTasksForTomorrow,
  isWeatherWarningTask,
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
  MD3Theme,
  Text,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const isWeatherMissingLocationError = (error: unknown) => {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 404 || status === 422;
};

const isWeatherUnavailableError = (error: unknown) => {
  if (!isAxiosError(error)) return false;
  return error.response?.status === 503;
};

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
  const { data: tasksData, isLoading: tasksLoading } = useGetMyTasks("pending");
  const { data: warningsData, isLoading: warningsLoading } = useGetMyWarnings();
  const { data: articlesData, isLoading: articlesLoading } = useGetArticles({
    limit: 5,
  });

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
    articlesData?.pages.flatMap((page) => page.items).slice(0, 2) ?? [];

  const isLoading =
    weatherLoading && tasksLoading && warningsLoading && articlesLoading;

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

  return (
    <SafeAreaView>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
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
              <Card
                title="Pogoda teraz"
                subtitle={
                  weatherData?.location.label ??
                  location?.label ??
                  "Brak ustawionej lokalizacji"
                }
              >
                {isWeatherError ? (
                  <View style={styles.weatherErrorWrap}>
                    <Text style={styles.placeholder}>
                      {isWeatherMissingLocationError(weatherError)
                        ? "Ustaw lokalizację, aby pobrać pogodę."
                        : isWeatherUnavailableError(weatherError)
                          ? "Pogoda chwilowo niedostępna."
                          : "Nie udało się pobrać pogody (błąd serwera)."}
                    </Text>
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
              title="Zadania pogodowe"
              subtitle="Zaplanowane na dziś i jutro"
              rightSlot={
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/planner/tasks" as any,
                      params: { source: "WEATHER_WARNING" },
                    })
                  }
                >
                  <Text style={styles.cardCta}>Wszystkie →</Text>
                </Pressable>
              }
            >
              <View style={styles.stack}>
                {tasksLoading ? (
                  <ActivityIndicator size="small" />
                ) : weatherTasksToday.length === 0 &&
                  weatherTasksTomorrow.length === 0 ? (
                  <Text style={styles.placeholder}>
                    Brak zadań pogodowych na najbliższe dni.
                  </Text>
                ) : (
                  <>
                    {weatherTasksToday.slice(0, 2).map((task) => (
                      <Pressable
                        key={task.id}
                        style={styles.taskRow}
                        onPress={handleTaskPress}
                      >
                        <View style={styles.taskDayDot} />
                        <View style={styles.taskContent}>
                          <Text style={styles.taskTitle}>{task.title}</Text>
                          <Text style={styles.taskMeta}>
                            Dziś
                            {task.bedId || task.plantingId
                              ? " • " +
                                (task.meta?.locationLabel ?? task.bedId ?? "")
                              : ""}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                    {weatherTasksTomorrow.slice(0, 2).map((task) => (
                      <Pressable
                        key={task.id}
                        style={styles.taskRow}
                        onPress={handleTaskPress}
                      >
                        <View
                          style={[styles.taskDayDot, styles.taskDayDotTomorrow]}
                        />
                        <View style={styles.taskContent}>
                          <Text style={styles.taskTitle}>{task.title}</Text>
                          <Text style={styles.taskMeta}>
                            Jutro
                            {task.bedId || task.plantingId
                              ? " • " +
                                (task.meta?.locationLabel ?? task.bedId ?? "")
                              : ""}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </>
                )}
              </View>
            </Card>

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

            <Card title="Porada dnia" subtitle="Szybka inspiracja">
              {tips.length === 0 ? (
                <Text style={styles.placeholder}>Brak nowych porad.</Text>
              ) : (
                tips.map((article) => (
                  <Pressable
                    key={article.id}
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/education/articles/[id]",
                        params: { id: article.id },
                      })
                    }
                    style={styles.adviceCard}
                  >
                    <View style={styles.adviceText}>
                      <Text style={styles.adviceTitle}>{article.title}</Text>
                      <Text style={styles.adviceBody} numberOfLines={3}>
                        {article.excerpt}
                      </Text>
                      <Text style={styles.adviceCta}>Czytaj więcej</Text>
                    </View>
                    {article.coverImageUrl ? (
                      <Image
                        source={{ uri: article.coverImageUrl }}
                        style={styles.adviceImage}
                        contentFit="cover"
                      />
                    ) : null}
                  </Pressable>
                ))
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
    actions: {
      gap: spacing.sm,
      paddingBottom: spacing.lg,
    },
  });
