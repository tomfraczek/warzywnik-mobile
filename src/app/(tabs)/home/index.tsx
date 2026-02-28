import { ArticleListItem } from "@/src/api/queries/articles/types";
import { useGetArticles } from "@/src/api/queries/articles/useGetArticles";
import { Bed } from "@/src/api/queries/beds/types";
import { useGetBeds } from "@/src/api/queries/beds/useGetBeds";
import { Planting } from "@/src/api/queries/plantings/types";
import { useGetPlantings } from "@/src/api/queries/plantings/useGetPlantings";
import { TaskItem as MeTaskItem } from "@/src/api/queries/users/meTypes";
import { useGetMyTasks } from "@/src/api/queries/users/useGetMyTasks";
import { useGetMyWarnings } from "@/src/api/queries/users/useGetMyWarnings";
import { useGetMyWeather } from "@/src/api/queries/users/useGetMyWeather";
import { Screen } from "@/src/components/Screen";
import { Card } from "@/src/components/ui/Card";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { TaskItem } from "@/src/components/ui/TaskItem";
import { WarningCard } from "@/src/components/ui/WarningCard";
import { useSettings } from "@/src/context/SettingsProvider";
import {
  isTaskPending,
  resolveTaskPresentation,
  sortTasksByDueAt,
} from "@/src/features/tasks/model";
import {
  asNonEmptyString,
  findMatchingWeatherTask,
  resolveWarningPresentation,
} from "@/src/features/warnings/model";
import { radius, spacing } from "@/src/theme/ui";
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
  const { data: tasksData, isLoading: tasksLoading } = useGetMyTasks();
  const { data: warningsData, isLoading: warningsLoading } = useGetMyWarnings();
  const bedsQuery = useGetBeds({ limit: 100 });
  const plantingsQuery = useGetPlantings({ limit: 100 });
  const { data: articlesData, isLoading: articlesLoading } = useGetArticles({
    limit: 5,
  });

  const bedsById = useMemo(() => {
    const map = new Map<string, string>();
    const beds = bedsQuery.data?.pages.flatMap((page) => page.items) ?? [];
    beds.forEach((bed: Bed) => {
      if (!bed?.id) return;
      const name = asNonEmptyString(bed.name);
      if (!name) return;
      map.set(bed.id, name);
    });
    return map;
  }, [bedsQuery.data?.pages]);

  const plantingsById = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        bedId: string | null;
        bedName: string | null;
        vegetableName: string | null;
      }
    >();

    const plantings =
      plantingsQuery.data?.pages.flatMap((page) => page.items) ?? [];

    plantings.forEach((planting: Planting) => {
      if (!planting?.id) return;

      const bedId = asNonEmptyString(planting.bedId);
      const bedName =
        asNonEmptyString(planting.bedName) ??
        (bedId ? (bedsById.get(bedId) ?? null) : null);
      const vegetableName =
        asNonEmptyString(planting.vegetableName) ??
        asNonEmptyString(planting.name) ??
        asNonEmptyString(planting.vegetable?.name);

      map.set(planting.id, {
        id: planting.id,
        bedId,
        bedName,
        vegetableName,
      });
    });

    return map;
  }, [bedsById, plantingsQuery.data?.pages]);

  const tasks = useMemo(() => tasksData?.items ?? [], [tasksData?.items]);
  const warnings = useMemo(
    () => warningsData?.items ?? [],
    [warningsData?.items],
  );
  const nearestPendingTasks = useMemo(() => {
    return sortTasksByDueAt(tasks.filter(isTaskPending)).slice(0, 3);
  }, [tasks]);
  const tips: ArticleListItem[] =
    articlesData?.pages.flatMap((page) => page.items).slice(0, 2) ?? [];
  const isLoading =
    weatherLoading && tasksLoading && warningsLoading && articlesLoading;
  const warningCards = useMemo(
    () =>
      warnings.map((warning) => ({
        warning,
        presentation: resolveWarningPresentation(
          warning,
          bedsById,
          plantingsById,
        ),
      })),
    [warnings, bedsById, plantingsById],
  );

  const handleTaskPress = (task: MeTaskItem) => {
    const presentation = resolveTaskPresentation(task, {
      bedsById,
      plantingsById,
    });

    if (presentation.targetType === "planting" && presentation.plantingId) {
      router.push(`/plantings/${presentation.plantingId}`);
      return;
    }

    if (presentation.targetType === "bed" && presentation.bedId) {
      router.push(`/(tabs)/beds/${presentation.bedId}`);
      return;
    }

    router.push({
      pathname: "/(tabs)/planner/tasks",
      params: {
        source: "WEATHER_WARNING",
        scope: "USER",
        scopeHint: "Zadanie dotyczy wszystkich grządek",
      },
    });
  };

  const handleWarningPress = (warning: (typeof warningCards)[number]) => {
    const matchedTask = findMatchingWeatherTask(
      warning.warning,
      bedsById,
      tasks,
    );

    if (matchedTask) {
      handleTaskPress(matchedTask);
      return;
    }

    router.push({
      pathname: "/(tabs)/home/alert-details",
      params: {
        title: warning.presentation.title,
        message: warning.presentation.message,
        hint: warning.presentation.hint ?? "",
        scope: warning.presentation.scope,
        bedId: warning.presentation.bedId ?? "",
        bedName: warning.presentation.bedName ?? "",
        plantingId: warning.presentation.plantingId ?? "",
        vegetableName: warning.presentation.vegetableName ?? "",
      },
    });
  };

  return (
    <Screen style={styles.screenContent}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>
              Cześć{profile.name ? `, ${profile.name}` : ""}!
            </Text>
            <Text style={styles.subtitle}>Twój ogród na dziś</Text>
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
              title="Najbliższe zadania"
              subtitle="Rzeczy do zrobienia teraz"
            >
              <View style={styles.stack}>
                {nearestPendingTasks.length === 0 ? (
                  <Text style={styles.placeholder}>Brak zadań na teraz.</Text>
                ) : (
                  nearestPendingTasks.map((task) => {
                    const presentation = resolveTaskPresentation(task, {
                      bedsById,
                      plantingsById,
                    });

                    return (
                      <TaskItem
                        key={task.id}
                        title={task.title}
                        status={task.status}
                        bed={presentation.locationLabel}
                        crop={presentation.cropLabel}
                        onPress={() => handleTaskPress(task)}
                      />
                    );
                  })
                )}
              </View>
            </Card>

            <Card title="Alerty" subtitle="Co wymaga uwagi">
              <View style={styles.stack}>
                {warnings.length === 0 ? (
                  <Text style={styles.placeholder}>
                    Brak aktywnych alertów.
                  </Text>
                ) : (
                  warningCards.slice(0, 2).map((item) => {
                    return (
                      <WarningCard
                        key={`${item.warning.code}-${item.warning.title}`}
                        title={item.presentation.title}
                        message={item.presentation.message}
                        severity={item.warning.severity}
                        scopeLabel={item.presentation.scopeLabel}
                        contextLabel={item.presentation.contextLabel}
                        onPress={() => handleWarningPress(item)}
                      />
                    );
                  })
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

            <View style={styles.actions}>
              <Button
                mode="contained"
                onPress={() => router.push("/(tabs)/beds")}
              >
                Moje grządki
              </Button>
              <Button
                mode="outlined"
                onPress={() => router.push("/(tabs)/planner")}
              >
                Przejdź do kalendarza
              </Button>
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
