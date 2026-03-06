import { useGetMyWarnings } from "@/src/api/queries/users/useGetMyWarnings";
import { WarningItem } from "@/src/api/queries/users/meTypes";
import { Screen } from "@/src/components/Screen";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { getSeverityTone, radius, spacing, statusColors } from "@/src/theme/ui";
import {
  getOperationalWarningsToday,
  getOperationalWarningsTomorrow,
  getRadarWarnings,
  resolveWarningPresentation,
} from "@/src/features/warnings/model";
import { formatDayPart, formatLocalDate } from "@/src/utils/date";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, MD3Theme, Text, useTheme } from "react-native-paper";

// ---------------------------------------------------------------------------
// Warning card component
// ---------------------------------------------------------------------------

type FullWarningCardProps = {
  warning: WarningItem;
  onPress?: () => void;
};

function FullWarningCard({ warning, onPress }: FullWarningCardProps) {
  const theme = useTheme<MD3Theme>();
  const presentation = useMemo(
    () => resolveWarningPresentation(warning),
    [warning],
  );
  const tone = getSeverityTone(warning.severity);
  const tones = statusColors(theme);
  const accentColor = tones[tone].text;
  const styles = makeCardStyles(theme, accentColor);

  const dayPartLabel = formatDayPart(presentation.dayPart);
  const dateLabel = formatLocalDate(presentation.localDate);
  const isRadar = presentation.horizon === "RADAR";

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.accent} />
      <View style={styles.body}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{presentation.title}</Text>
            <View style={styles.badgeRow}>
              <StatusBadge
                label={presentation.scopeLabel}
                tone={isRadar ? "info" : tone}
              />
              {isRadar ? (
                <StatusBadge
                  label={
                    /48h/i.test(warning.code)
                      ? "48 h"
                      : /7.days/i.test(warning.code)
                        ? "7 dni"
                        : "Radar"
                  }
                  tone="neutral"
                />
              ) : null}
            </View>
          </View>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={18}
            color={accentColor}
          />
        </View>

        {/* Context */}
        <Text style={styles.context}>{presentation.contextLabel}</Text>

        {/* Date / day-part row */}
        {dateLabel || dayPartLabel ? (
          <View style={styles.metaRow}>
            {dateLabel ? (
              <Text style={styles.meta}>
                <Text style={styles.metaLabel}>Data: </Text>
                {dateLabel}
              </Text>
            ) : null}
            {dayPartLabel ? (
              <Text style={styles.meta}>
                <Text style={styles.metaLabel}>Pora: </Text>
                {dayPartLabel}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Message */}
        <Text style={styles.message}>{presentation.message}</Text>

        {/* Hint */}
        {presentation.hint ? (
          <Text style={styles.hint}>{presentation.hint}</Text>
        ) : null}

        {/* Scope details */}
        {warning.bedName ? (
          <Text style={styles.meta}>
            <Text style={styles.metaLabel}>Grządka: </Text>
            {warning.bedName}
          </Text>
        ) : null}
        {warning.vegetableName ? (
          <Text style={styles.meta}>
            <Text style={styles.metaLabel}>Uprawa: </Text>
            {warning.vegetableName}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  const theme = useTheme<MD3Theme>();
  const styles = makeSectionStyles(theme);
  return (
    <View style={styles.header}>
      <View style={styles.dot} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.count}>({count})</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function WarningsScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();

  const { data, isLoading, isError, refetch, isRefetching } =
    useGetMyWarnings();
  const warnings = useMemo(() => data?.items ?? [], [data?.items]);

  const todayWarnings = useMemo(
    () => getOperationalWarningsToday(warnings),
    [warnings],
  );
  const tomorrowWarnings = useMemo(
    () => getOperationalWarningsTomorrow(warnings),
    [warnings],
  );
  const radarWarnings = useMemo(
    () => getRadarWarnings(warnings),
    [warnings],
  );

  const hasAny =
    todayWarnings.length > 0 ||
    tomorrowWarnings.length > 0 ||
    radarWarnings.length > 0;

  const navigateToWarning = (warning: WarningItem) => {
    const presentation = resolveWarningPresentation(warning);
    if (
      presentation.scope === "PLANTING" &&
      presentation.plantingId
    ) {
      router.push(`/plantings/${presentation.plantingId}`);
      return;
    }
    if (presentation.scope === "BED" && presentation.bedId) {
      router.push(`/(tabs)/beds/${presentation.bedId}`);
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

  if (isLoading) {
    return (
      <Screen safeAreaEdges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen safeAreaEdges={["top", "left", "right"]}>
        <View style={styles.center}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={40}
            color={theme.colors.error}
          />
          <Text style={styles.errorText}>
            Nie udało się pobrać alertów pogodowych.
          </Text>
          <Button mode="outlined" onPress={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeAreaEdges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Alerty pogodowe</Text>
          <Text style={styles.pageSubtitle}>
            Aktywne alerty dla Twojego ogrodu
          </Text>
        </View>

        {!hasAny ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={48}
              color={theme.colors.primary}
            />
            <Text style={styles.emptyTitle}>Brak aktywnych alertów</Text>
            <Text style={styles.emptySubtitle}>
              Warunki pogodowe są obecnie korzystne. Sprawdź ponownie jutro.
            </Text>
          </View>
        ) : (
          <>
            {/* TODAY */}
            {todayWarnings.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader label="Dziś" count={todayWarnings.length} />
                <View style={styles.list}>
                  {todayWarnings.map((w) => (
                    <FullWarningCard
                      key={w.dedupeKey}
                      warning={w}
                      onPress={() => navigateToWarning(w)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {/* TOMORROW */}
            {tomorrowWarnings.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader
                  label="Jutro"
                  count={tomorrowWarnings.length}
                />
                <View style={styles.list}>
                  {tomorrowWarnings.map((w) => (
                    <FullWarningCard
                      key={w.dedupeKey}
                      warning={w}
                      onPress={() => navigateToWarning(w)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {/* RADAR */}
            {radarWarnings.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader
                  label="Radar / najbliższe dni"
                  count={radarWarnings.length}
                />
                <View style={styles.list}>
                  {radarWarnings.map((w) => (
                    <FullWarningCard
                      key={w.dedupeKey}
                      warning={w}
                      onPress={() => navigateToWarning(w)}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      padding: spacing.lg,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: "center",
      fontSize: 14,
    },
    pageHeader: {
      gap: spacing.xs,
    },
    pageTitle: {
      fontSize: 26,
      fontWeight: "700",
      color: theme.colors.onBackground,
    },
    pageSubtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    emptyWrap: {
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.xl,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    emptySubtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      paddingHorizontal: spacing.lg,
    },
    section: {
      gap: spacing.sm,
    },
    list: {
      gap: spacing.sm,
    },
  });

const makeSectionStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: radius.pill,
      backgroundColor: theme.colors.primary,
    },
    label: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    count: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
  });

const makeCardStyles = (theme: MD3Theme, accentColor: string) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      overflow: "hidden",
    },
    accent: {
      width: 4,
      backgroundColor: accentColor,
    },
    body: {
      flex: 1,
      padding: spacing.md,
      gap: spacing.xs,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing.sm,
    },
    headerLeft: {
      flex: 1,
      gap: spacing.xs,
    },
    badgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    title: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    context: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.onSurfaceVariant,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    meta: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    metaLabel: {
      fontWeight: "700",
    },
    message: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    hint: {
      fontSize: 12,
      fontStyle: "italic",
      color: theme.colors.onSurfaceVariant,
    },
  });
