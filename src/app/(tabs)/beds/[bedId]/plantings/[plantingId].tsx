import { getResponseError } from "@/src/api/axios";
import { Planting } from "@/src/api/queries/plantings/types";
import { useDeletePlanting } from "@/src/api/queries/plantings/useDeletePlanting";
import { useGetPlanting } from "@/src/api/queries/plantings/useGetPlanting";
import { useGetVegetable } from "@/src/api/queries/vegetables/useGetVegetable";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const formatDate = (value?: string | null) => {
  if (!value) return "Brak";
  return value.split("T")[0];
};

export default function PlantingDetailsScreen() {
  const { bedId, plantingId } = useLocalSearchParams<{
    bedId?: string | string[];
    plantingId?: string | string[];
  }>();
  const resolvedBedId = Array.isArray(bedId) ? bedId[0] : bedId;
  const resolvedPlantingId = Array.isArray(plantingId)
    ? plantingId[0]
    : plantingId;
  const router = useRouter();
  const { data, isLoading, error, refetch } = useGetPlanting(
    resolvedPlantingId ?? null,
  );
  const deletePlanting = useDeletePlanting(resolvedBedId);

  const planting = data as Planting | undefined;
  const {
    data: vegetable,
    isLoading: isVegetableLoading,
    error: vegetableError,
  } = useGetVegetable(planting?.vegetableId ?? null);

  const handleDelete = () => {
    Alert.alert("Usunąć uprawę?", "Tej operacji nie można cofnąć.", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: async () => {
          try {
            if (!resolvedPlantingId) return;
            await deletePlanting.mutateAsync(resolvedPlantingId);
            if (resolvedBedId) {
              router.replace(`/(tabs)/beds/${resolvedBedId}`);
            } else {
              router.back();
            }
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

  if (error || !planting) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{String(getResponseError(error))}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => refetch()}>
          <Text style={styles.secondaryButtonText}>Spróbuj ponownie</Text>
        </Pressable>
      </View>
    );
  }

  const vegetableName = isVegetableLoading
    ? "Ładowanie..."
    : (vegetable?.name ?? (vegetableError ? "Brak danych" : "Brak danych"));

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Warzywo</Text>
        <Text style={styles.valueText}>{vegetableName}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={styles.valueText}>{planting.status}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daty</Text>
        <Text style={styles.valueText}>
          Planowana: {formatDate(planting.plannedStartDate)}
        </Text>
        <Text style={styles.valueText}>
          Rzeczywista: {formatDate(planting.actualStartDate)}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notatki</Text>
        <Text style={styles.valueText}>
          {planting.notes ? planting.notes : "Brak"}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.push(
              `/(tabs)/beds/${resolvedBedId}/plantings/${planting.id}/edit`,
            )
          }
        >
          <Text style={styles.primaryButtonText}>Edytuj</Text>
        </Pressable>
        <Pressable
          style={[
            styles.deleteButton,
            deletePlanting.isPending && styles.disabled,
          ]}
          onPress={handleDelete}
          disabled={deletePlanting.isPending}
        >
          <Text style={styles.deleteButtonText}>Usuń</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  section: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  valueText: {
    fontSize: 14,
    color: "#111827",
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
  disabled: {
    opacity: 0.6,
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
