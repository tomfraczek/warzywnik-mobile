import { getResponseError } from "@/src/api/axios";
import { useCreateBed } from "@/src/api/queries/beds/useCreateBed";
import { BedForm } from "@/src/app/(tabs)/beds/_components/BedForm";
import { consumeSelectedSoil } from "@/src/app/(tabs)/beds/_state/soilSelectionStore";

import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import {
  BedFormValues,
  buildCreateBedPayload,
  createEmptyBedFormValues,
  validateBedForm,
} from "./_utils/bedForm";

export default function BedCreateScreen() {
  const router = useRouter();
  const [values, setValues] = useState<BedFormValues>(
    createEmptyBedFormValues(),
  );
  const createBed = useCreateBed();

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
    const error = validateBedForm(values);
    if (error) {
      Alert.alert("Błąd", error);
      return;
    }

    try {
      const payload = buildCreateBedPayload(values);
      await createBed.mutateAsync(payload);
      router.replace("/(tabs)/beds");
    } catch (err) {
      Alert.alert("Błąd", String(getResponseError(err)));
    }
  };

  return (
    <BedForm
      values={values}
      onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
      onSubmit={handleSubmit}
      submitLabel="Utwórz grządkę"
      isSubmitting={createBed.isPending}
      onPickSoil={() => router.push("/(tabs)/beds/soils")}
      onClearSoil={() =>
        setValues((prev) => ({ ...prev, soilId: null, soilName: null }))
      }
    />
  );
}
