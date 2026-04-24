import {
  CreatePlantingDto,
  Planting,
  PlantingStartMethod,
  UpdatePlantingDto,
} from "@/src/api/queries/plantings/types";

export type PlantingFormValues = {
  vegetableId: string | null;
  vegetableName: string | null;
  startMethod: PlantingStartMethod;
  sowedAt: string;
  notes: string;
};

export const createEmptyPlantingFormValues = (): PlantingFormValues => ({
  vegetableId: null,
  vegetableName: null,
  startMethod: "DIRECT_SOW",
  sowedAt: "",
  notes: "",
});

export const plantingToFormValues = (
  planting: Planting,
): PlantingFormValues => ({
  vegetableId: planting.vegetableId,
  vegetableName: planting.vegetable?.name ?? planting.vegetableName ?? "",
  startMethod: planting.startMethod ?? "DIRECT_SOW",
  sowedAt: planting.sowedAt ?? planting.plannedStartDate ?? "",
  notes: planting.notes ?? "",
});

export const validatePlantingForm = (values: PlantingFormValues) => {
  if (!values.vegetableId) return "Wybierz warzywo.";

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
  const derivedStartDate = sowedAt ?? new Date().toISOString();

  return {
    bedId,
    vegetableId: values.vegetableId as string,
    startMethod: values.startMethod,
    sowedAt,
    transplantedAt: values.startMethod === "DIRECT_SOW" ? null : undefined,
    plannedStartDate: derivedStartDate,
    status: "NEW",
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
    if (payload.sowedAt) {
      payload.plannedStartDate = payload.sowedAt;
    }
  }

  if (initial.notes !== current.notes) {
    payload.notes = normalizeNullableString(current.notes);
  }

  if (current.startMethod === "DIRECT_SOW") {
    payload.transplantedAt = null;
  }

  return payload;
};
