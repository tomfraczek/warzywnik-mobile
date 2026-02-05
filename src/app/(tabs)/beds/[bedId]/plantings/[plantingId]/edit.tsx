import { getResponseError } from "@/src/api/axios";
import { Warning } from "@/src/api/queries/plantings/types";
import { useGetPlanting } from "@/src/api/queries/plantings/useGetPlanting";
import { useUpdatePlanting } from "@/src/api/queries/plantings/useUpdatePlanting";
import { PlantingForm } from "@/src/app/(tabs)/beds/_components/PlantingForm";
import { WarningsModal } from "@/src/app/(tabs)/beds/_components/WarningsModal";
import { consumeSelectedVegetable } from "@/src/app/(tabs)/beds/_state/vegetableSelectionStore";
import {
  PlantingFormValues,
  buildUpdatePlantingPayload,
  createEmptyPlantingFormValues,
  plantingToFormValues,
  validatePlantingForm,
} from "@/src/app/(tabs)/beds/_utils/plantingForm";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function PlantingEditScreen() {
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
  const updatePlanting = useUpdatePlanting(
    resolvedPlantingId ?? "",
    resolvedBedId,
  );
  const [values, setValues] = useState<PlantingFormValues>(
    createEmptyPlantingFormValues(),
  );
  const [warningsVisible, setWarningsVisible] = useState(false);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const initialValuesRef = useRef<PlantingFormValues | null>(null);

  useEffect(() => {
    if (!data || initialValuesRef.current) return;
    const mapped = plantingToFormValues(data);
    initialValuesRef.current = mapped;
    setValues(mapped);
  }, [data]);

  useFocusEffect(
    useCallback(() => {
      const vegetable = consumeSelectedVegetable();
      if (vegetable) {
        setValues((prev) => ({
          ...prev,
          vegetableId: vegetable.id,
          vegetableName: vegetable.name,
        }));
      }
    }, []),
  );

  const handleSubmit = async () => {
    if (!initialValuesRef.current || !resolvedPlantingId) return;
    const errorMessage = validatePlantingForm(values);
    if (errorMessage) {
      Alert.alert("Błąd", errorMessage);
      return;
    }
    const payload = buildUpdatePlantingPayload(
      initialValuesRef.current,
      values,
    );
    if (Object.keys(payload).length === 0) {
      Alert.alert("Brak zmian", "Nie wprowadzono żadnych zmian do zapisu.");
      return;
    }

    try {
      const response = await updatePlanting.mutateAsync(payload);
      const responseWarnings =
        response && typeof response === "object" && "warnings" in response
          ? ((response as { warnings?: Warning[] | null }).warnings ?? [])
          : [];
      if (responseWarnings.length > 0) {
        setWarnings(responseWarnings);
        setWarningsVisible(true);
        return;
      }
      if (resolvedBedId && resolvedPlantingId) {
        router.replace(
          `/(tabs)/beds/${resolvedBedId}/plantings/${resolvedPlantingId}`,
        );
      } else {
        router.back();
      }
    } catch (err) {
      Alert.alert("Błąd", String(getResponseError(err)));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error && !data) {
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
    <>
      <PlantingForm
        values={values}
        onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
        onSubmit={handleSubmit}
        submitLabel="Zapisz zmiany"
        isSubmitting={updatePlanting.isPending}
        onPickVegetable={() => router.push("/(tabs)/beds/vegetables")}
        onClearVegetable={() =>
          setValues((prev) => ({
            ...prev,
            vegetableId: null,
            vegetableName: null,
          }))
        }
        showActualStartDate
      />
      <WarningsModal
        visible={warningsVisible}
        warnings={warnings}
        onClose={() => {
          setWarningsVisible(false);
          if (resolvedBedId && resolvedPlantingId) {
            router.replace(
              `/(tabs)/beds/${resolvedBedId}/plantings/${resolvedPlantingId}`,
            );
          } else {
            router.back();
          }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 24,
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
