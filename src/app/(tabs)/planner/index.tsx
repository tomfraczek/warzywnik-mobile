import { getResponseError } from "@/src/api/axios";
import { Planting, PlantingStatus } from "@/src/api/queries/plantings/types";
import { useGetPlantings } from "@/src/api/queries/plantings/useGetPlantings";
import { useRouter } from "expo-router";
import { memo, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";

const statusOptions: PlantingStatus[] = ["PLANNED", "ACTIVE", "HARVESTING"];

type PlannerEventType = "START" | "HARVEST";

type PlannerEvent = {
  id: string;
  plantingId: string;
  bedId?: string | null;
  vegetableName: string;
  bedName: string;
  type: PlannerEventType;
  dateKey: string;
  hasWarnings: boolean;
};

const toDateKey = (value?: string | null) => {
  if (!value) return "";
  const [date] = value.split("T");
  return date ?? "";
};

const getVegetableLabel = (planting: Planting) =>
  planting.vegetableName ??
  planting.name ??
  planting.vegetable?.name ??
  "Brak nazwy";

const getBedLabel = (planting: Planting) =>
  planting.bedName ?? "Nieznana grządka";

type PlannerEventRowProps = {
  item: PlannerEvent;
  onPress: (event: PlannerEvent) => void;
};

const PlannerEventRow = memo(function PlannerEventRow({
  item,
  onPress,
}: PlannerEventRowProps) {
  const typeLabel = item.type === "START" ? "Planowany start" : "Zbiory";

  return (
    <Pressable style={styles.eventRow} onPress={() => onPress(item)}>
      <View style={styles.eventMain}>
        <Text style={styles.eventTitle}>{item.vegetableName}</Text>
        <Text style={styles.eventSubtitle}>{item.bedName}</Text>
      </View>
      <View style={styles.eventMeta}>
        <Text style={styles.eventType}>{typeLabel}</Text>
        {item.hasWarnings ? <Text style={styles.warningIcon}>⚠️</Text> : null}
      </View>
    </Pressable>
  );
});

export default function PlannerScreen() {
  const router = useRouter();
  const [activeStatuses, setActiveStatuses] =
    useState<PlantingStatus[]>(statusOptions);

  const {
    data: plantingPages,
    isLoading,
    error,
    refetch,
  } = useGetPlantings({ limit: 50 });

  const plantings = useMemo(
    () => plantingPages?.pages.flatMap((page) => page.items) ?? [],
    [plantingPages?.pages],
  );

  const filteredPlantings = useMemo(
    () =>
      plantings.filter((planting) => activeStatuses.includes(planting.status)),
    [plantings, activeStatuses],
  );

  const events = useMemo(() => {
    const items: PlannerEvent[] = [];

    filteredPlantings.forEach((planting) => {
      const hasWarnings = Boolean(planting.warnings?.length);
      const vegetableName = getVegetableLabel(planting);
      const bedName = getBedLabel(planting);

      const plannedDate = toDateKey(planting.plannedStartDate);
      if (plannedDate) {
        items.push({
          id: `${planting.id}-planned`,
          plantingId: planting.id,
          bedId: planting.bedId,
          vegetableName,
          bedName,
          type: "START",
          dateKey: plannedDate,
          hasWarnings,
        });
      }

      if (planting.harvestStartDate) {
        const harvestDate = toDateKey(planting.harvestStartDate);
        if (harvestDate) {
          items.push({
            id: `${planting.id}-harvest`,
            plantingId: planting.id,
            bedId: planting.bedId,
            vegetableName,
            bedName,
            type: "HARVEST",
            dateKey: harvestDate,
            hasWarnings,
          });
        }
      }
    });

    return items.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }, [filteredPlantings]);

  const sections = useMemo(() => {
    const grouped = new Map<string, PlannerEvent[]>();

    events.forEach((event) => {
      const current = grouped.get(event.dateKey);
      if (current) {
        current.push(event);
      } else {
        grouped.set(event.dateKey, [event]);
      }
    });

    return Array.from(grouped.entries()).map(([title, data]) => ({
      title,
      data,
    }));
  }, [events]);

  const toggleStatus = (status: PlantingStatus) => {
    setActiveStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((item) => item !== status)
        : [...prev, status],
    );
  };

  const handleOpenPlanting = (event: PlannerEvent) => {
    if (!event.bedId) return;
    router.push(`/(tabs)/beds/${event.bedId}/plantings/${event.plantingId}`);
  };

  if (isLoading && plantings.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error && plantings.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{String(getResponseError(error))}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => refetch()}>
          <Text style={styles.secondaryButtonText}>Spróbuj ponownie</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filtersSection}>
        <Text style={styles.filtersTitle}>Status upraw</Text>
        <View style={styles.filterRow}>
          {statusOptions.map((status) => {
            const isActive = activeStatuses.includes(status);
            return (
              <Pressable
                key={status}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
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
      </View>

      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Brak zaplanowanych prac</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PlannerEventRow item={item} onPress={handleOpenPlanting} />
          )}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  errorText: {
    color: "#ef4444",
    marginBottom: 12,
    textAlign: "center",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#111827",
    fontWeight: "600",
  },
  filtersSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#111827",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  filterChipText: {
    fontSize: 12,
    color: "#111827",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
    marginTop: 8,
  },
  eventRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    marginBottom: 10,
  },
  eventMain: {
    flex: 1,
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  eventSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  eventMeta: {
    alignItems: "flex-end",
  },
  eventType: {
    fontSize: 12,
    color: "#111827",
  },
  warningIcon: {
    marginTop: 4,
    fontSize: 14,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    color: "#6b7280",
  },
});
