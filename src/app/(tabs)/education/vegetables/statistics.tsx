import { useGetPopularVegetables } from "@/src/api/queries/analytics/useGetPopularVegetables";
import { Screen } from "@/src/components/Screen";
import { spacing } from "@/src/theme/ui";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Icon,
  MD3Theme,
  SegmentedButtons,
  Text,
  useTheme,
} from "react-native-paper";

type PopularStatsFilter = "season" | "days30" | "ever";

const FILTER_BUTTONS: { value: PopularStatsFilter; label: string }[] = [
  { value: "season", label: "Ten sezon" },
  { value: "days30", label: "30 dni" },
  { value: "ever", label: "All time" },
];

const getCurrentSeasonWindowDays = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const diffMs = now.getTime() - startOfYear.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.min(365, Math.max(1, Math.floor(diffMs / dayMs) + 1));
};

const getSectionTitle = (filter: PopularStatsFilter) => {
  if (filter === "season") return "Popularne warzywa w tym sezonie";
  if (filter === "days30") return "Popularne warzywa z ostatnich 30 dni";
  return "Najpopularniejsze warzywa ever";
};

export default function PopularVegetablesStatisticsScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();
  const [filter, setFilter] = useState<PopularStatsFilter>("season");

  const seasonWindowDays = useMemo(() => getCurrentSeasonWindowDays(), []);

  const queryParams =
    filter === "days30"
      ? { limit: 10 as const, sort: "adds" as const, windowDays: 30 }
      : filter === "season"
        ? {
            limit: 10 as const,
            sort: "adds" as const,
            windowDays: seasonWindowDays,
          }
        : { limit: 10 as const, sort: "adds" as const };

  const popularQuery = useGetPopularVegetables(queryParams);

  const items = useMemo(
    () => (popularQuery.data?.items ?? []).filter((item) => item.vegetable),
    [popularQuery.data?.items],
  );

  return (
    <Screen safeAreaEdges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <SegmentedButtons
          value={filter}
          onValueChange={(value) => setFilter(value as PopularStatsFilter)}
          buttons={FILTER_BUTTONS}
          style={styles.filters}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.title}>{getSectionTitle(filter)}</Text>
          <Text style={styles.subtitle}>Top 10 warzyw</Text>
        </View>

        {popularQuery.isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              Brak danych dla wybranego filtra.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item, index) => {
              const vegetable = item.vegetable;
              if (!vegetable) return null;

              return (
                <Pressable
                  key={`${item.vegetableSlug}-${index}`}
                  onPress={() =>
                    router.push(`/(tabs)/education/vegetables/${vegetable.id}`)
                  }
                  style={styles.row}
                >
                  <View style={styles.rankWrap}>
                    {index < 3 ? (
                      <Icon
                        source={index === 0 ? "medal" : "medal-outline"}
                        size={18}
                        color={
                          index === 0
                            ? "#D9A200"
                            : index === 1
                              ? "#8F98A3"
                              : "#B4743E"
                        }
                      />
                    ) : null}
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>

                  {vegetable.imageUrl ? (
                    <Image
                      source={{ uri: vegetable.imageUrl }}
                      style={styles.thumb}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.thumbFallback}>
                      <Icon
                        source="sprout-outline"
                        size={18}
                        color={theme.colors.primary}
                      />
                    </View>
                  )}

                  <View style={styles.main}>
                    <Text style={styles.name}>{vegetable.name}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    filters: {
      marginBottom: spacing.sm,
    },
    sectionHeader: {
      gap: 4,
    },
    title: {
      fontSize: 20,
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
    },
    emptyWrap: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      padding: spacing.md,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    list: {
      gap: spacing.sm,
    },
    row: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    rankWrap: {
      width: 38,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
    },
    rankText: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    thumb: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceVariant,
    },
    thumbFallback: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: "center",
      justifyContent: "center",
    },
    main: {
      flex: 1,
      gap: 2,
    },
    name: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    meta: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
  });
