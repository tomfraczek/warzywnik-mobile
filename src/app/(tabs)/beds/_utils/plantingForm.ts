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
  sowedAt:
    planting.sowedAt ??
    planting.transplantedAt ??
    planting.plannedStartDate ??
    "",
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

const usesTransplantedAt = (startMethod: PlantingStartMethod) =>
  startMethod === "TRANSPLANT" || startMethod === "PURCHASED_SEEDLING";

export const buildCreatePlantingPayload = (
  bedId: string,
  values: PlantingFormValues,
): CreatePlantingDto => {
  const startDate = normalizeNullableString(values.sowedAt);

  return {
    bedId,
    vegetableId: values.vegetableId as string,
    startMethod: values.startMethod,
    status: "NEW",
    notes: normalizeNullableString(values.notes),
    ...(startDate
      ? {
          sowedAt: startDate,
          ...(usesTransplantedAt(values.startMethod)
            ? { transplantedAt: startDate }
            : {}),
          plannedStartDate: startDate,
          date: startDate,
        }
      : {}),
  };
};

export const buildUpdatePlantingPayload = (
  initial: PlantingFormValues,
  current: PlantingFormValues,
): UpdatePlantingDto => {
  const payload: UpdatePlantingDto = {};
  const currentStartDate = normalizeNullableString(current.sowedAt);
  const initialStartDate = normalizeNullableString(initial.sowedAt);

  if (initial.vegetableId !== current.vegetableId && current.vegetableId) {
    payload.vegetableId = current.vegetableId;
  }

  if (initial.startMethod !== current.startMethod) {
    payload.startMethod = current.startMethod;
  }

  if (initial.sowedAt !== current.sowedAt) {
    payload.sowedAt = currentStartDate;
    if (payload.sowedAt) {
      payload.plannedStartDate = payload.sowedAt;
    }
  }

  if (initial.notes !== current.notes) {
    payload.notes = normalizeNullableString(current.notes);
  }

  const initialTransplantedAt = usesTransplantedAt(initial.startMethod)
    ? initialStartDate
    : null;
  const currentTransplantedAt = usesTransplantedAt(current.startMethod)
    ? currentStartDate
    : null;

  if (initialTransplantedAt !== currentTransplantedAt) {
    payload.transplantedAt = currentTransplantedAt;
  }

  return payload;
};
