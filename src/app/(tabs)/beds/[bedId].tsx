import { getResponseError } from "@/src/api/axios";
import { Bed } from "@/src/api/queries/beds/types";
import { useDeleteBed } from "@/src/api/queries/beds/useDeleteBed";
import { useGetBed } from "@/src/api/queries/beds/useGetBed";
import { Planting } from "@/src/api/queries/plantings/types";
import { useGetPlantings } from "@/src/api/queries/plantings/useGetPlantings";
import { useGetVegetable } from "@/src/api/queries/vegetables/useGetVegetable";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const getSoilLabel = (bed: Bed) =>
  bed.soil?.name ?? (bed as any)?.soilName ?? "Brak wybranej gleby";

const formatDate = (value?: string | null) => {
  if (!value) return "Brak";
  return value.split("T")[0];
};

type PlantingRowProps = {
  planting: Planting;
  onPress: () => void;
};

const PlantingRow = memo(function PlantingRow({
  planting,
  onPress,
}: PlantingRowProps) {
  const {
    data: vegetable,
    isLoading: isVegetableLoading,
    error: vegetableError,
  } = useGetVegetable(planting.vegetableId ?? null);

  const vegetableName = isVegetableLoading
    ? "Ładowanie..."
    : (vegetable?.name ?? (vegetableError ? "Brak nazwy" : "Brak nazwy"));

  return (
    <Pressable style={styles.plantingRow} onPress={onPress}>
      <View style={styles.plantingMain}>
        <Text style={styles.plantingTitle}>{vegetableName}</Text>
        <Text style={styles.plantingMeta}>
          Start: {formatDate(planting.plannedStartDate)}
        </Text>
      </View>
      <Text style={styles.plantingStatus}>{planting.status}</Text>
    </Pressable>
  );
});

export default function BedDetailsScreen() {
  const { bedId } = useLocalSearchParams<{ bedId?: string | string[] }>();
  const resolvedBedId = Array.isArray(bedId) ? bedId[0] : bedId;
  const router = useRouter();
  const { data, isLoading, error, refetch } = useGetBed(resolvedBedId ?? null);
  const deleteBed = useDeleteBed();
  const {
    data: plantingPages,
    isLoading: isPlantingsLoading,
    error: plantingsError,
    refetch: refetchPlantings,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetPlantings(
    { bedId: resolvedBedId ?? undefined, limit: 10 },
    { enabled: Boolean(resolvedBedId) },
  );

  const bed = data as Bed | undefined;
  const plantings = useMemo(
    () => plantingPages?.pages.flatMap((page) => page.items) ?? [],
    [plantingPages?.pages],
  );

  const dimensions = useMemo(() => {
    if (!bed) return null;
    const parts = [
      bed.lengthCm != null ? `${bed.lengthCm} cm` : null,
      bed.widthCm != null ? `${bed.widthCm} cm` : null,
      bed.depthCm != null ? `${bed.depthCm} cm` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" × ") : "Brak danych";
  }, [bed]);

  const handleDelete = () => {
    Alert.alert("Usunąć grządkę?", "Tej operacji nie można cofnąć.", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: async () => {
          try {
            if (!resolvedBedId) return;
            await deleteBed.mutateAsync(resolvedBedId);
            router.replace("/(tabs)/beds");
          } catch (err) {
            Alert.alert("Błąd", String(getResponseError(err)));
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !bed) {
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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{bed.name}</Text>
        {bed.locationLabel ? (
          <Text style={styles.subtitle}>{bed.locationLabel}</Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gleba</Text>
        <Text style={styles.valueText}>{getSoilLabel(bed)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wymiary</Text>
        <Text style={styles.valueText}>{dimensions}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badanie gleby</Text>
        <Text style={styles.valueText}>
          {bed.soilTestingEnabled ? "Włączone" : "Wyłączone"}
        </Text>
        {bed.soilTestingEnabled ? (
          <View style={styles.metrics}>
            {bed.measuredN != null ? (
              <Text style={styles.metricRow}>N: {bed.measuredN}</Text>
            ) : null}
            {bed.measuredP != null ? (
              <Text style={styles.metricRow}>P: {bed.measuredP}</Text>
            ) : null}
            {bed.measuredK != null ? (
              <Text style={styles.metricRow}>K: {bed.measuredK}</Text>
            ) : null}
            {bed.measuredPh != null ? (
              <Text style={styles.metricRow}>pH: {bed.measuredPh}</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Uprawy</Text>
          <Pressable
            style={styles.linkButton}
            onPress={() => router.push(`/(tabs)/beds/${bed.id}/plantings/new`)}
          >
            <Text style={styles.linkButtonText}>+ Dodaj uprawę</Text>
          </Pressable>
        </View>

        {isPlantingsLoading && plantings.length === 0 ? (
          <ActivityIndicator style={styles.inlineLoader} />
        ) : null}

        {plantingsError && plantings.length === 0 ? (
          <View style={styles.inlineErrorBox}>
            <Text style={styles.errorText}>
              {String(getResponseError(plantingsError))}
            </Text>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => refetchPlantings()}
            >
              <Text style={styles.secondaryButtonText}>Spróbuj ponownie</Text>
            </Pressable>
          </View>
        ) : null}

        {!isPlantingsLoading && plantings.length === 0 && !plantingsError ? (
          <Text style={styles.valueText}>Brak upraw w tej grządce.</Text>
        ) : null}

        {plantings.map((planting: Planting) => (
          <PlantingRow
            key={planting.id}
            planting={planting}
            onPress={() =>
              router.push(`/(tabs)/beds/${bed.id}/plantings/${planting.id}`)
            }
          />
        ))}

        {hasNextPage ? (
          <Pressable
            style={styles.secondaryButton}
            onPress={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.secondaryButtonText}>Wczytaj więcej</Text>
            )}
          </Pressable>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push(`/(tabs)/beds/${bed.id}/edit`)}
        >
          <Text style={styles.primaryButtonText}>Edytuj</Text>
        </Pressable>
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Usuń</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: "#fff",
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  section: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  linkButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  linkButtonText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  valueText: {
    fontSize: 14,
    color: "#111827",
  },
  inlineLoader: {
    marginVertical: 8,
  },
  inlineErrorBox: {
    marginTop: 8,
  },
  plantingRow: {
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  plantingMain: {
    flex: 1,
    paddingRight: 12,
  },
  plantingTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  plantingMeta: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  plantingStatus: {
    fontSize: 11,
    color: "#2563eb",
  },
  metrics: {
    marginTop: 8,
  },
  metricRow: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 4,
  },
  actions: {
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#ef4444",
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  errorText: {
    fontSize: 14,
    color: "#dc2626",
    marginBottom: 12,
    textAlign: "center",
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  secondaryButtonText: {
    color: "#111827",
    fontWeight: "600",
  },
});
