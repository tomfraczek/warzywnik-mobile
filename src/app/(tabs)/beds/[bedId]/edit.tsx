import { getResponseError } from "@/src/api/axios";
import { useGetBed } from "@/src/api/queries/beds/useGetBed";
import { useUpdateBed } from "@/src/api/queries/beds/useUpdateBed";
import { OFFLINE_MUTATION_MESSAGE } from "@/src/features/network/offline";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { BedForm } from "@/src/app/(tabs)/beds/_components/BedForm";
import { consumeSelectedSoil } from "@/src/app/(tabs)/beds/_state/soilSelectionStore";
import {
  BedFormValues,
  bedToFormValues,
  buildUpdateBedPayload,
  createEmptyBedFormValues,
  validateBedForm,
} from "@/src/app/(tabs)/beds/_utils/bedForm";
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

export default function BedEditScreen() {
  const { bedId } = useLocalSearchParams<{ bedId?: string | string[] }>();
  const resolvedBedId = Array.isArray(bedId) ? bedId[0] : bedId;
  const router = useRouter();
  const { data, isLoading, error, refetch } = useGetBed(resolvedBedId ?? null);
  const updateBed = useUpdateBed(resolvedBedId ?? "");
  const isOffline = useIsOffline();
  const [values, setValues] = useState<BedFormValues>(
    createEmptyBedFormValues(),
  );
  const initialValuesRef = useRef<BedFormValues | null>(null);

  useEffect(() => {
    if (!data || initialValuesRef.current) return;
    const mapped = bedToFormValues(data);
    initialValuesRef.current = mapped;
    setValues(mapped);
  }, [data]);

  useFocusEffect(
    useCallback(() => {
      const soil = consumeSelectedSoil();
      if (soil) {
        setValues((prev) => ({
          ...prev,
          soilId: soil.id,
          soilName: soil.name,
        }));
      }
    }, []),
  );

  const handleSubmit = async () => {
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }
    if (!initialValuesRef.current || !resolvedBedId) return;
    const errorMessage = validateBedForm(values);
    if (errorMessage) {
      Alert.alert("Błąd", errorMessage);
      return;
    }
    const payload = buildUpdateBedPayload(initialValuesRef.current, values);
    if (Object.keys(payload).length === 0) {
      Alert.alert("Brak zmian", "Nie wprowadzono żadnych zmian do zapisu.");
      return;
    }
    try {
      if (__DEV__) {
        console.log("[Bed payload][update]", payload);
      }
      const response = await updateBed.mutateAsync(payload);
      if (__DEV__) {
        console.log("[Bed saved][update]", {
          id: response?.id ?? null,
          soilId: response?.soilId ?? response?.soil?.id ?? null,
          depthCm: response?.depthCm ?? null,
          soilTestingEnabled: response?.soilTestingEnabled ?? null,
          measuredPh: response?.measuredPh ?? null,
          measuredN: response?.measuredN ?? null,
          measuredP: response?.measuredP ?? null,
          measuredK: response?.measuredK ?? null,
        });
      }
      router.replace(`/(tabs)/beds/${resolvedBedId}`);
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
    <BedForm
      values={values}
      onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
      onSubmit={handleSubmit}
      submitLabel="Zapisz zmiany"
      isSubmitting={updateBed.isPending}
      onPickSoil={() => router.push("/(tabs)/beds/soils")}
      onClearSoil={() =>
        setValues((prev) => ({ ...prev, soilId: null, soilName: null }))
      }
    />
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
