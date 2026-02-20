import { getResponseError } from "@/src/api/axios";
import { Bed } from "@/src/api/queries/beds/types";
import { useDeleteBed } from "@/src/api/queries/beds/useDeleteBed";
import { useGetBed } from "@/src/api/queries/beds/useGetBed";
import { Planting } from "@/src/api/queries/plantings/types";
import { useGetPlantings } from "@/src/api/queries/plantings/useGetPlantings";
import { useGetVegetable } from "@/src/api/queries/vegetables/useGetVegetable";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Button,
  IconButton,
  MD3Theme,
  Modal,
  Portal,
  useTheme,
} from "react-native-paper";

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
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
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
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
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
  const [actionsVisible, setActionsVisible] = useState(false);
  const activePlantings = useMemo(
    () => plantings.filter((planting) => planting.status !== "CANCELLED"),
    [plantings],
  );
  const cancelledPlantings = useMemo(
    () => plantings.filter((planting) => planting.status === "CANCELLED"),
    [plantings],
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
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{bed.name}</Text>
            {bed.locationLabel ? (
              <Text style={styles.subtitle}>{bed.locationLabel}</Text>
            ) : null}
          </View>
          <IconButton icon="cog" onPress={() => setActionsVisible(true)} />
        </View>
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

        {isPlantingsLoading && activePlantings.length === 0 ? (
          <ActivityIndicator style={styles.inlineLoader} />
        ) : null}

        {plantingsError && activePlantings.length === 0 ? (
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

        {!isPlantingsLoading &&
        activePlantings.length === 0 &&
        !plantingsError ? (
          <Text style={styles.valueText}>Brak upraw w tej grządce.</Text>
        ) : null}

        {activePlantings.map((planting: Planting) => (
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historia</Text>
        {cancelledPlantings.length === 0 ? (
          <Text style={styles.valueText}>Brak zakończonych upraw.</Text>
        ) : (
          cancelledPlantings.map((planting: Planting) => (
            <PlantingRow
              key={planting.id}
              planting={planting}
              onPress={() =>
                router.push(`/(tabs)/beds/${bed.id}/plantings/${planting.id}`)
              }
            />
          ))
        )}
      </View>

      <Portal>
        <Modal
          visible={actionsVisible}
          onDismiss={() => setActionsVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Akcje</Text>
          <View style={styles.modalActionsColumn}>
            <Button
              mode="contained"
              onPress={() => {
                setActionsVisible(false);
                router.push(`/(tabs)/beds/${bed.id}/edit`);
              }}
            >
              Edytuj
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                setActionsVisible(false);
                handleDelete();
              }}
              textColor={theme.colors.error}
              style={styles.deleteButton}
            >
              Usuń
            </Button>
            <Button mode="text" onPress={() => setActionsVisible(false)}>
              Zamknij
            </Button>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: 16,
      paddingBottom: 32,
      backgroundColor: theme.colors.background,
    },
    header: {
      marginBottom: 16,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerText: {
      flex: 1,
      paddingRight: 8,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.colors.onBackground,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    section: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 12,
      padding: 12,
      marginBottom: 14,
      backgroundColor: theme.colors.surface,
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
      color: theme.colors.onSurface,
    },
    linkButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    linkButtonText: {
      color: theme.colors.primary,
      fontWeight: "600",
    },
    valueText: {
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    inlineLoader: {
      marginVertical: 8,
    },
    inlineErrorBox: {
      marginTop: 8,
    },
    plantingRow: {
      borderTopWidth: 1,
      borderColor: theme.colors.outline,
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
      color: theme.colors.onSurface,
    },
    plantingMeta: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    plantingStatus: {
      fontSize: 11,
      color: theme.colors.primary,
    },
    metrics: {
      marginTop: 8,
    },
    metricRow: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    deleteButton: {
      borderWidth: 1,
      borderColor: theme.colors.error,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: theme.colors.background,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: "center",
    },
    secondaryButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    secondaryButtonText: {
      color: theme.colors.onSurface,
      fontWeight: "600",
    },
    modal: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      borderRadius: 16,
      padding: 16,
      gap: 12,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    modalActionsColumn: {
      gap: 10,
    },
  });
