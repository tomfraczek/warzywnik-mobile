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
  status: "PLANNED",
  notes: "",
});

export const plantingToFormValues = (
  planting: Planting,
): PlantingFormValues => ({
  vegetableId: planting.vegetableId,
  vegetableName: planting.vegetable?.name ?? planting.vegetableName ?? "",
  startMethod: planting.startMethod ?? "DIRECT_SOW",
  sowedAt: planting.sowedAt ?? planting.plannedStartDate ?? "",
  status: planting.status === "ACTIVE" ? "ACTIVE" : "PLANNED",
  notes: planting.notes ?? "",
});

export const validatePlantingForm = (values: PlantingFormValues) => {
  if (!values.vegetableId) return "Wybierz warzywo.";
  if (!values.sowedAt.trim()) {
    return "Podaj datę siewu.";
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
  const derivedStartDate = sowedAt ?? "";

  return {
    bedId,
    vegetableId: values.vegetableId as string,
    startMethod: values.startMethod,
    sowedAt,
    plannedStartDate: derivedStartDate,
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

  if (current.startMethod === "DIRECT_SOW") {
    payload.sowedAt = normalizeNullableString(current.sowedAt);
  }

  if (initial.status !== current.status) {
    payload.status = current.status;
  }

  if (initial.notes !== current.notes) {
    payload.notes = normalizeNullableString(current.notes);
  }

  const normalizedSowedAt = normalizeNullableString(current.sowedAt);
  const derivedStartDate = normalizedSowedAt ?? "";

  const initialSowedAt = normalizeNullableString(initial.sowedAt);
  const initialDerivedStartDate = initialSowedAt ?? "";

  if (derivedStartDate !== initialDerivedStartDate) {
    payload.plannedStartDate = derivedStartDate;
  }

  return payload;
};
