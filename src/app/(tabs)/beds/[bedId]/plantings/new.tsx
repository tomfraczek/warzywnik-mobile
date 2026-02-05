import { getResponseError } from "@/src/api/axios";
import { Warning } from "@/src/api/queries/plantings/types";
import { useCreatePlanting } from "@/src/api/queries/plantings/useCreatePlanting";
import { PlantingForm } from "@/src/app/(tabs)/beds/_components/PlantingForm";
import { WarningsModal } from "@/src/app/(tabs)/beds/_components/WarningsModal";
import { consumeSelectedVegetable } from "@/src/app/(tabs)/beds/_state/vegetableSelectionStore";
import {
  PlantingFormValues,
  buildCreatePlantingPayload,
  createEmptyPlantingFormValues,
  validatePlantingForm,
} from "@/src/app/(tabs)/beds/_utils/plantingForm";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

export default function PlantingCreateScreen() {
  const { bedId } = useLocalSearchParams<{ bedId?: string | string[] }>();
  const resolvedBedId = Array.isArray(bedId) ? bedId[0] : bedId;
  const router = useRouter();
  const [values, setValues] = useState<PlantingFormValues>(
    createEmptyPlantingFormValues(),
  );
  const [warningsVisible, setWarningsVisible] = useState(false);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const createPlanting = useCreatePlanting();

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
    const errorMessage = validatePlantingForm(values);
    if (errorMessage) {
      Alert.alert("Błąd", errorMessage);
      return;
    }
    if (!resolvedBedId) {
      Alert.alert("Błąd", "Brak identyfikatora grządki.");
      return;
    }

    try {
      const payload = buildCreatePlantingPayload(resolvedBedId, values);
      const response = await createPlanting.mutateAsync(payload);
      const responseWarnings =
        response && typeof response === "object" && "warnings" in response
          ? ((response as { warnings?: Warning[] | null }).warnings ?? [])
          : [];
      if (responseWarnings.length > 0) {
        setWarnings(responseWarnings);
        setWarningsVisible(true);
        return;
      }
      router.replace(`/(tabs)/beds/${resolvedBedId}`);
    } catch (err) {
      Alert.alert("Błąd", String(getResponseError(err)));
    }
  };

  return (
    <>
      <PlantingForm
        values={values}
        onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
        onSubmit={handleSubmit}
        submitLabel="Dodaj uprawę"
        isSubmitting={createPlanting.isPending}
        onPickVegetable={() => router.push("/(tabs)/beds/vegetables")}
        onClearVegetable={() =>
          setValues((prev) => ({
            ...prev,
            vegetableId: null,
            vegetableName: null,
          }))
        }
      />
      <WarningsModal
        visible={warningsVisible}
        warnings={warnings}
        onClose={() => {
          setWarningsVisible(false);
          if (resolvedBedId) {
            router.replace(`/(tabs)/beds/${resolvedBedId}`);
          } else {
            router.back();
          }
        }}
      />
    </>
  );
}
