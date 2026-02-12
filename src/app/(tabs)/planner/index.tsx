import { getResponseError } from "@/src/api/axios";
import { useGetBeds } from "@/src/api/queries/beds/useGetBeds";
import { Planting, PlantingStatus } from "@/src/api/queries/plantings/types";
import { useGetPlantings } from "@/src/api/queries/plantings/useGetPlantings";
import { useGetVegetable } from "@/src/api/queries/vegetables/useGetVegetable";
import { Screen } from "@/src/components/Screen";
import { useRouter } from "expo-router";
import { memo, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, MD3Theme, useTheme } from "react-native-paper";

const statusOptions: PlantingStatus[] = [
  "PLANNED",
  "ACTIVE",
  "HARVESTING",
  "FINISHED",
  "CANCELLED",
];

const timeframeOptions = ["THIS_MONTH", "NEXT_30_DAYS"] as const;
type TimeframeOption = (typeof timeframeOptions)[number];

const viewModeOptions = ["ALL", "HARVEST"] as const;
type ViewModeOption = (typeof viewModeOptions)[number];

type PlannerEventType = "START" | "HARVEST";

type PlannerEvent = {
  id: string;
  plantingId: string;
  bedId?: string | null;
  vegetableId?: string | null;
  vegetableName: string;
  bedName: string;
  type: PlannerEventType;
  status: PlantingStatus;
  dateKey: string;
  dateStart: string;
  dateEnd?: string | null;
  hasWarnings: boolean;
};

type StatusStyles = Record<
  PlantingStatus,
  { bar: { backgroundColor: string }; text: { color: string } }
>;

type PlannerFilters = {
  bedId: string | null;
  statuses: PlantingStatus[];
};

type MapOptions = {
  timeframe: TimeframeOption;
  filters: PlannerFilters;
  viewMode: ViewModeOption;
};

const toDateKey = (value?: string | null) => {
  if (!value) return "";
  const [date] = value.split("T");
  return date ?? "";
};

const toDateOnly = (value?: string | null) => {
  const dateKey = toDateKey(value);
  if (!dateKey) return null;
  const date = new Date(`${dateKey}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getTimeframeRange = (timeframe: TimeframeOption) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (timeframe === "THIS_MONTH") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { start, end };
  }

  const start = today;
  const end = new Date(today);
  end.setDate(end.getDate() + 29);
  return { start, end };
};

const isDateInRange = (date: Date, start: Date, end: Date) =>
  date >= start && date <= end;

const isRangeOverlapping = (
  rangeStart: Date,
  rangeEnd: Date,
  start: Date,
  end: Date,
) => rangeStart <= end && rangeEnd >= start;

const getBedLabel = (bedName?: string | null) =>
  bedName && bedName.trim().length > 0 ? bedName : "Nieznana grządka";

const truncateLabel = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;

const mapPlantingsToPlannerEvents = (
  plantings: Planting[],
  options: MapOptions,
  bedNameById: Map<string, string>,
) => {
  const { start, end } = getTimeframeRange(options.timeframe);
  const items: PlannerEvent[] = [];

  plantings.forEach((planting) => {
    if (
      options.filters.bedId &&
      options.filters.bedId !== "ALL" &&
      planting.bedId !== options.filters.bedId
    ) {
      return;
    }

    if (!options.filters.statuses.includes(planting.status)) {
      return;
    }

    const hasWarnings = Boolean(planting.warnings?.length);
    const bedName = getBedLabel(
      planting.bedId ? bedNameById.get(planting.bedId) : null,
    );

    if (options.viewMode === "ALL") {
      const startDateValue =
        planting.actualStartDate ?? planting.plannedStartDate;
      const startDateKey = toDateKey(startDateValue);
      const startDate = toDateOnly(startDateValue);

      if (startDate && startDateKey && isDateInRange(startDate, start, end)) {
        items.push({
          id: `${planting.id}-start`,
          plantingId: planting.id,
          bedId: planting.bedId,
          vegetableId: planting.vegetableId,
          vegetableName: "",
          bedName,
          type: "START",
          status: planting.status,
          dateKey: startDateKey,
          dateStart: startDateKey,
          dateEnd: null,
          hasWarnings,
        });
      }
    }

    if (planting.harvestStartDate && planting.harvestEndDate) {
      const harvestStartKey = toDateKey(planting.harvestStartDate);
      const harvestEndKey = toDateKey(planting.harvestEndDate);
      const harvestStartDate = toDateOnly(planting.harvestStartDate);
      const harvestEndDate = toDateOnly(planting.harvestEndDate);

      if (
        harvestStartKey &&
        harvestEndKey &&
        harvestStartDate &&
        harvestEndDate &&
        isRangeOverlapping(harvestStartDate, harvestEndDate, start, end)
      ) {
        items.push({
          id: `${planting.id}-harvest`,
          plantingId: planting.id,
          bedId: planting.bedId,
          vegetableId: planting.vegetableId,
          vegetableName: "",
          bedName,
          type: "HARVEST",
          status: planting.status,
          dateKey: harvestStartKey,
          dateStart: harvestStartKey,
          dateEnd: harvestEndKey,
          hasWarnings,
        });
      }
    }
  });

  return items.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
};

type PlannerEventRowProps = {
  item: PlannerEvent;
  onPress: (event: PlannerEvent) => void;
  styles: ReturnType<typeof makeStyles>;
  statusStyles: StatusStyles;
};

const PlannerEventRow = memo(function PlannerEventRow({
  item,
  onPress,
  styles,
  statusStyles,
}: PlannerEventRowProps) {
  const {
    data: vegetable,
    isLoading: isVegetableLoading,
    error: vegetableError,
  } = useGetVegetable(item.vegetableId ?? null);

  const vegetableLabel = isVegetableLoading
    ? "Ładowanie..."
    : (vegetable?.name ?? (vegetableError ? "Brak nazwy" : "Brak nazwy"));

  const typeLabel = item.type === "START" ? "Start" : "Zbiory";
  const bedLabel = truncateLabel(item.bedName, 24);
  const dateLabel =
    item.type === "HARVEST" && item.dateEnd
      ? `${item.dateStart} → ${item.dateEnd}`
      : item.dateStart;

  const statusStyle = statusStyles[item.status];
  const titleStyle =
    item.status === "CANCELLED"
      ? [styles.eventTitle, styles.eventTitleCancelled]
      : styles.eventTitle;

  return (
    <Pressable style={styles.eventRow} onPress={() => onPress(item)}>
      <View style={[styles.statusBar, statusStyle.bar]} />
      <View style={styles.eventMain}>
        <Text style={titleStyle}>{vegetableLabel}</Text>
        <Text style={styles.eventSubtitle}>{bedLabel}</Text>
      </View>
      <View style={styles.eventMeta}>
        <Text style={styles.eventType}>{typeLabel}</Text>
        <Text style={[styles.eventStatus, statusStyle.text]}>
          {item.status}
        </Text>
        <Text style={styles.eventDate}>{dateLabel}</Text>
        {item.hasWarnings ? <Text style={styles.warningIcon}>⚠️</Text> : null}
      </View>
    </Pressable>
  );
});

export default function PlannerScreen() {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const statusStyles = getStatusStyles(theme);
  const [activeStatuses, setActiveStatuses] =
    useState<PlantingStatus[]>(statusOptions);
  const [activeBedId, setActiveBedId] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("THIS_MONTH");
  const [viewMode, setViewMode] = useState<ViewModeOption>("ALL");

  const {
    data: plantingPages,
    isLoading,
    error,
    refetch,
  } = useGetPlantings({ limit: 50 });

  const { data: bedPages } = useGetBeds({ limit: 50 });

  const plantings = useMemo(
    () => plantingPages?.pages.flatMap((page) => page.items) ?? [],
    [plantingPages?.pages],
  );

  const beds = useMemo(
    () => bedPages?.pages.flatMap((page) => page.items) ?? [],
    [bedPages?.pages],
  );

  const bedNameById = useMemo(() => {
    return new Map(beds.map((bed) => [bed.id, bed.name]));
  }, [beds]);

  const events = useMemo(() => {
    return mapPlantingsToPlannerEvents(
      plantings,
      {
        timeframe,
        viewMode,
        filters: {
          bedId: activeBedId ?? "ALL",
          statuses: activeStatuses,
        },
      },
      bedNameById,
    );
  }, [
    plantings,
    timeframe,
    viewMode,
    activeBedId,
    activeStatuses,
    bedNameById,
  ]);

  const sections = useMemo(() => {
    const grouped = new Map<string, PlannerEvent[]>();

    const toWeekKey = (value: string) => {
      const date = toDateOnly(value);
      if (!date) return value;
      const day = date.getDay() || 7;
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - (day - 1));
      const key = startOfWeek.toISOString().split("T")[0];
      return `Tydzień ${key}`;
    };

    const toMonthKey = (value: string) => value.slice(0, 7);

    events.forEach((event) => {
      const baseKey =
        viewMode === "HARVEST"
          ? timeframe === "NEXT_30_DAYS"
            ? toWeekKey(event.dateKey)
            : toMonthKey(event.dateKey)
          : event.dateKey;

      const current = grouped.get(baseKey);
      if (current) {
        current.push(event);
      } else {
        grouped.set(baseKey, [event]);
      }
    });

    return Array.from(grouped.entries()).map(([title, data]) => ({
      title,
      data,
    }));
  }, [events, timeframe, viewMode]);

  const toggleStatus = (status: PlantingStatus) => {
    setActiveStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((item) => item !== status)
        : [...prev, status],
    );
  };

  const hasActiveFilters =
    (activeBedId && activeBedId !== "ALL") ||
    activeStatuses.length !== statusOptions.length;

  const resetFilters = () => {
    setActiveBedId(null);
    setActiveStatuses(statusOptions);
  };

  const handleOpenPlanting = (event: PlannerEvent) => {
    if (!event.bedId) return;
    router.push(`/(tabs)/beds/${event.bedId}/plantings/${event.plantingId}`);
  };

  if (isLoading && plantings.length === 0) {
    return (
      <Screen safeAreaEdges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (error && plantings.length === 0) {
    return (
      <Screen safeAreaEdges={["top", "left", "right"]}>
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

  return (
    <Screen safeAreaEdges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.filtersSection}>
          <View style={styles.segmentedRow}>
            {viewModeOptions.map((mode) => {
              const isActive = viewMode === mode;
              return (
                <Pressable
                  key={mode}
                  style={[
                    styles.segmentedChip,
                    isActive && styles.segmentedActive,
                  ]}
                  onPress={() => setViewMode(mode)}
                >
                  <Text
                    style={[
                      styles.segmentedText,
                      isActive && styles.segmentedTextActive,
                    ]}
                  >
                    {mode === "ALL" ? "Wszystko" : "Zbiory"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.segmentedRow}>
            {timeframeOptions.map((option) => {
              const isActive = timeframe === option;
              return (
                <Pressable
                  key={option}
                  style={[
                    styles.segmentedChip,
                    isActive && styles.segmentedActive,
                  ]}
                  onPress={() => setTimeframe(option)}
                >
                  <Text
                    style={[
                      styles.segmentedText,
                      isActive && styles.segmentedTextActive,
                    ]}
                  >
                    {option === "THIS_MONTH"
                      ? "Ten miesiąc"
                      : "Nadchodzące 30 dni"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.filtersTitle}>Grządka</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <Pressable
              style={[
                styles.filterChip,
                !activeBedId && styles.filterChipActive,
              ]}
              onPress={() => setActiveBedId(null)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  !activeBedId && styles.filterChipTextActive,
                ]}
              >
                Wszystkie
              </Text>
            </Pressable>
            {beds.map((bed) => {
              const isActive = activeBedId === bed.id;
              return (
                <Pressable
                  key={bed.id}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                  onPress={() => setActiveBedId(bed.id)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {truncateLabel(bed.name, 18)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.filtersTitle}>Status upraw</Text>
          <View style={styles.filterRow}>
            {statusOptions.map((status) => {
              const isActive = activeStatuses.includes(status);
              return (
                <Pressable
                  key={status}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                  onPress={() => toggleStatus(status)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {status}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {hasActiveFilters ? (
            <Pressable style={styles.clearFiltersButton} onPress={resetFilters}>
              <Text style={styles.clearFiltersText}>Wyczyść filtry</Text>
            </Pressable>
          ) : null}
        </View>

        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Brak zaplanowanych prac</Text>
            {hasActiveFilters ? (
              <Pressable
                style={styles.clearFiltersButton}
                onPress={resetFilters}
              >
                <Text style={styles.clearFiltersText}>Wyczyść filtry</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PlannerEventRow
                item={item}
                onPress={handleOpenPlanting}
                styles={styles}
                statusStyles={statusStyles}
              />
            )}
            renderSectionHeader={({ section }) => (
              <Text style={styles.sectionHeader}>{section.title}</Text>
            )}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
          />
        )}
      </View>
    </Screen>
  );
}

const getStatusStyles = (theme: MD3Theme): StatusStyles => ({
  PLANNED: {
    bar: { backgroundColor: theme.colors.outline },
    text: { color: theme.colors.onSurfaceVariant },
  },
  ACTIVE: {
    bar: { backgroundColor: theme.colors.primary },
    text: { color: theme.colors.primary },
  },
  HARVESTING: {
    bar: { backgroundColor: theme.colors.tertiary },
    text: { color: theme.colors.tertiary },
  },
  FINISHED: {
    bar: { backgroundColor: theme.colors.secondary },
    text: { color: theme.colors.secondary },
  },
  CANCELLED: {
    bar: { backgroundColor: theme.colors.error },
    text: { color: theme.colors.error },
  },
});

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    errorText: {
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: "center",
    },
    filtersSection: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    segmentedRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    segmentedChip: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    segmentedActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    segmentedText: {
      fontSize: 12,
      color: theme.colors.onSurface,
    },
    segmentedTextActive: {
      color: theme.colors.onPrimary,
    },
    filtersTitle: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 8,
      color: theme.colors.onSurface,
    },
    filterRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      paddingBottom: 8,
    },
    filterChip: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    filterChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterChipText: {
      fontSize: 12,
      color: theme.colors.onSurface,
    },
    filterChipTextActive: {
      color: theme.colors.onPrimary,
    },
    listContent: {
      padding: 16,
      paddingBottom: 24,
    },
    sectionHeader: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurfaceVariant,
      marginBottom: 8,
      marginTop: 8,
    },
    eventRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 12,
      marginBottom: 10,
      overflow: "hidden",
      backgroundColor: theme.colors.surface,
    },
    statusBar: {
      width: 4,
      alignSelf: "stretch",
      borderRadius: 2,
      marginRight: 10,
    },
    eventMain: {
      flex: 1,
      marginRight: 12,
    },
    eventTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    eventTitleCancelled: {
      color: theme.colors.onSurfaceVariant,
      textDecorationLine: "line-through",
    },
    eventSubtitle: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    eventMeta: {
      alignItems: "flex-end",
    },
    eventType: {
      fontSize: 12,
      color: theme.colors.onSurface,
    },
    eventStatus: {
      fontSize: 11,
      marginTop: 2,
      fontWeight: "600",
    },
    eventDate: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    warningIcon: {
      marginTop: 4,
      fontSize: 14,
      color: theme.colors.error,
    },
    emptyState: {
      padding: 24,
      alignItems: "center",
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 12,
      textAlign: "center",
    },
    clearFiltersButton: {
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    clearFiltersText: {
      fontSize: 12,
      color: theme.colors.onSurface,
      fontWeight: "600",
    },
  });
