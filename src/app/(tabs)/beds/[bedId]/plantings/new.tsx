import { getResponseError } from "@/src/api/axios";
import { useGetBed } from "@/src/api/queries/beds/useGetBed";
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
import { Screen } from "@/src/components/Screen";
import CustomHeader from "@/src/components/navigation/CustomHeader";
import { OFFLINE_MUTATION_MESSAGE } from "@/src/features/network/offline";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
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
  const { data: bed } = useGetBed(resolvedBedId ?? null);
  const [warningsVisible, setWarningsVisible] = useState(false);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const createPlanting = useCreatePlanting();
  const isOffline = useIsOffline();

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
    if (isOffline) {
      return;
    }
    const errorMessage = validatePlantingForm(values);
    if (errorMessage) {
      setValidationMessage(errorMessage);
      return;
    }
    if (!resolvedBedId) {
      return;
    }
    setValidationMessage(null);

    try {
      if (__DEV__) {
        console.log("[Planting][create][bed]", {
          id: bed?.id ?? null,
          soilId: bed?.soilId ?? bed?.soil?.id ?? null,
          depthCm: bed?.depthCm ?? null,
          soilTestingEnabled: bed?.soilTestingEnabled ?? null,
          measuredPh: bed?.measuredPh ?? null,
          measuredN: bed?.measuredN ?? null,
          measuredP: bed?.measuredP ?? null,
          measuredK: bed?.measuredK ?? null,
        });
      }
      const payload = buildCreatePlantingPayload(resolvedBedId, values);
      if (__DEV__) {
        console.log("[Planting payload][create]", payload);
      }
      const response = await createPlanting.mutateAsync(payload);
      if (__DEV__) {
        console.log("[Planting][create][response]", response);
      }
      const responseWarnings =
        response && typeof response === "object" && "warnings" in response
          ? ((response as { warnings?: Warning[] | null }).warnings ?? [])
          : [];
      if (__DEV__) {
        console.log("[Planting warnings][create]", {
          count: responseWarnings.length,
          codes: responseWarnings.map((warning) => warning.code),
        });
      }
      if (responseWarnings.length > 0) {
        setWarnings(responseWarnings);
        setWarningsVisible(true);
        return;
      }
      router.replace(`/(tabs)/beds/${resolvedBedId}/plan`);
    } catch (err) {
      if (__DEV__) {
        console.log("[Planting][create][error]", err);
      }
      Alert.alert("Błąd", String(getResponseError(err)));
    }
  };

  return (
    <Screen safeAreaEdges={["left", "right"]}>
      <CustomHeader title="Zaplanuj uprawę" showBack />
      <PlantingForm
        values={values}
        onChange={(patch) => {
          setValues((prev) => ({ ...prev, ...patch }));
          if (validationMessage && patch.vegetableId) {
            setValidationMessage(null);
          }
        }}
        onSubmit={handleSubmit}
        submitLabel="Dodaj do planu"
        isSubmitting={createPlanting.isPending}
        showSowedAt
        sowedAtHint="-OPCJONALNE- Po podaniu tej daty system wyliczy okno zbioru, ostrzeżenia i harmonogram od wskazanego dnia. Jeśli zostawisz puste, obliczenia zaczną się od dnia dzisiejszego."
        showHeaderIntro
        screenTitle="Zaplanuj uprawę"
        screenSubtitle="Dodaj warzywo do planu grządki."
        heroPillLabel="Planowanie"
        heroTitle="Zaplanuj uprawę w grządce"
        heroDescription="Zadania pielęgnacyjne pojawią się po rozpoczęciu uprawy."
        validationMessage={validationMessage}
        offlineMessage={isOffline ? OFFLINE_MUTATION_MESSAGE : null}
        blockingMessage={
          resolvedBedId
            ? null
            : "Nie udało się otworzyć kontekstu grządki. Wróć do listy grządek i spróbuj ponownie."
        }
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
        onIgnore={() => {
          setWarningsVisible(false);
          if (resolvedBedId) {
            router.replace(`/(tabs)/beds/${resolvedBedId}/plan`);
          } else {
            router.back();
          }
        }}
        onCancel={() => {
          setWarningsVisible(false);
        }}
      />
    </Screen>
  );
}
