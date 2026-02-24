import {
  CreatePlantingDto,
  Planting,
  PlantingStartMethod,
  UpdatePlantingDto,
} from "@/src/api/queries/plantings/types";

export type AllowedPlantingStatus = "PLANNED" | "ACTIVE";

export type PlantingFormValues = {
  vegetableId: string | null;
  vegetableName: string | null;
  startMethod: PlantingStartMethod;
  sowedAt: string;
  transplantedAt: string;
  harvestWindowStart: string;
  harvestWindowEnd: string;
  status: AllowedPlantingStatus;
  notes: string;
};

export const plantingStatusOptions: {
  value: AllowedPlantingStatus;
  label: string;
}[] = [
  { value: "PLANNED", label: "Planowana" },
  { value: "ACTIVE", label: "Aktywna" },
];

export const createEmptyPlantingFormValues = (): PlantingFormValues => ({
  vegetableId: null,
  vegetableName: null,
  startMethod: "DIRECT_SOW",
  sowedAt: "",
  transplantedAt: "",
  harvestWindowStart: "",
  harvestWindowEnd: "",
  status: "PLANNED",
  notes: "",
});

export const plantingToFormValues = (
  planting: Planting,
): PlantingFormValues => ({
  vegetableId: planting.vegetableId,
  vegetableName: planting.vegetable?.name ?? planting.vegetableName ?? "",
  startMethod:
    planting.startMethod ??
    (planting.transplantedAt ? "TRANSPLANT" : "DIRECT_SOW"),
  sowedAt: planting.sowedAt ?? planting.plannedStartDate ?? "",
  transplantedAt: planting.transplantedAt ?? planting.actualStartDate ?? "",
  harvestWindowStart:
    planting.harvestWindowStart ?? planting.harvestStartDate ?? "",
  harvestWindowEnd: planting.harvestWindowEnd ?? planting.harvestEndDate ?? "",
  status: planting.status === "ACTIVE" ? "ACTIVE" : "PLANNED",
  notes: planting.notes ?? "",
});

export const validatePlantingForm = (values: PlantingFormValues) => {
  if (!values.vegetableId) return "Wybierz warzywo.";
  if (values.startMethod === "DIRECT_SOW" && !values.sowedAt.trim()) {
    return "Podaj datę siewu dla siewu bezpośredniego.";
  }

  if (values.startMethod === "TRANSPLANT" && !values.transplantedAt.trim()) {
    return "Podaj datę przesadzenia dla metody rozsada.";
  }

  if (
    values.harvestWindowStart.trim() &&
    values.harvestWindowEnd.trim() &&
    values.harvestWindowStart > values.harvestWindowEnd
  ) {
    return "Data początku okna zbioru nie może być późniejsza niż data końca.";
  }

  return null;
};

const normalizeNullableString = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export const buildCreatePlantingPayload = (
  bedId: string,
  values: PlantingFormValues,
): CreatePlantingDto => {
  const sowedAt = normalizeNullableString(values.sowedAt);
  const transplantedAt = normalizeNullableString(values.transplantedAt);
  const derivedStartDate =
    values.startMethod === "DIRECT_SOW"
      ? (sowedAt ?? transplantedAt ?? "")
      : (transplantedAt ?? sowedAt ?? "");

  return {
    bedId,
    vegetableId: values.vegetableId as string,
    startMethod: values.startMethod,
    sowedAt,
    transplantedAt,
    harvestWindowStart: normalizeNullableString(values.harvestWindowStart),
    harvestWindowEnd: normalizeNullableString(values.harvestWindowEnd),
    plannedStartDate: derivedStartDate,
    actualStartDate: transplantedAt,
    status: values.status,
    notes: normalizeNullableString(values.notes),
  };
};

export const buildUpdatePlantingPayload = (
  initial: PlantingFormValues,
  current: PlantingFormValues,
): UpdatePlantingDto => {
  const payload: UpdatePlantingDto = {};

  if (initial.vegetableId !== current.vegetableId && current.vegetableId) {
    payload.vegetableId = current.vegetableId;
  }

  if (initial.startMethod !== current.startMethod) {
    payload.startMethod = current.startMethod;
  }

  if (initial.sowedAt !== current.sowedAt) {
    payload.sowedAt = normalizeNullableString(current.sowedAt);
  }

  if (initial.transplantedAt !== current.transplantedAt) {
    payload.transplantedAt = normalizeNullableString(current.transplantedAt);
  }

  if (initial.harvestWindowStart !== current.harvestWindowStart) {
    payload.harvestWindowStart = normalizeNullableString(
      current.harvestWindowStart,
    );
  }

  if (initial.harvestWindowEnd !== current.harvestWindowEnd) {
    payload.harvestWindowEnd = normalizeNullableString(
      current.harvestWindowEnd,
    );
  }

  if (initial.status !== current.status) {
    payload.status = current.status;
  }

  if (initial.notes !== current.notes) {
    payload.notes = normalizeNullableString(current.notes);
  }

  const normalizedSowedAt = normalizeNullableString(current.sowedAt);
  const normalizedTransplantedAt = normalizeNullableString(
    current.transplantedAt,
  );
  const derivedStartDate =
    current.startMethod === "DIRECT_SOW"
      ? (normalizedSowedAt ?? normalizedTransplantedAt ?? "")
      : (normalizedTransplantedAt ?? normalizedSowedAt ?? "");

  const initialSowedAt = normalizeNullableString(initial.sowedAt);
  const initialTransplantedAt = normalizeNullableString(initial.transplantedAt);
  const initialDerivedStartDate =
    initial.startMethod === "DIRECT_SOW"
      ? (initialSowedAt ?? initialTransplantedAt ?? "")
      : (initialTransplantedAt ?? initialSowedAt ?? "");

  if (derivedStartDate !== initialDerivedStartDate) {
    payload.plannedStartDate = derivedStartDate;
  }

  if (normalizedTransplantedAt !== initialTransplantedAt) {
    payload.actualStartDate = normalizedTransplantedAt;
  }

  return payload;
};
