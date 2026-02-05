import {
  CreatePlantingDto,
  Planting,
  PlantingStatus,
  UpdatePlantingDto,
} from "@/src/api/queries/plantings/types";

export type PlantingFormValues = {
  vegetableId: string | null;
  vegetableName: string | null;
  plannedStartDate: string;
  actualStartDate: string;
  status: PlantingStatus;
  notes: string;
};

export const plantingStatusOptions: PlantingStatus[] = [
  "PLANNED",
  "ACTIVE",
  "HARVESTING",
  "FINISHED",
  "CANCELLED",
];

export const createEmptyPlantingFormValues = (): PlantingFormValues => ({
  vegetableId: null,
  vegetableName: null,
  plannedStartDate: "",
  actualStartDate: "",
  status: "PLANNED",
  notes: "",
});

export const plantingToFormValues = (
  planting: Planting,
): PlantingFormValues => ({
  vegetableId: planting.vegetableId,
  vegetableName: planting.vegetable?.name ?? planting.vegetableName ?? "",
  plannedStartDate: planting.plannedStartDate ?? "",
  actualStartDate: planting.actualStartDate ?? "",
  status: planting.status ?? "PLANNED",
  notes: planting.notes ?? "",
});

export const validatePlantingForm = (values: PlantingFormValues) => {
  if (!values.vegetableId) return "Wybierz warzywo.";
  if (!values.plannedStartDate.trim()) return "Podaj planowaną datę startu.";
  return null;
};

const normalizeNullableString = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export const buildCreatePlantingPayload = (
  bedId: string,
  values: PlantingFormValues,
): CreatePlantingDto => ({
  bedId,
  vegetableId: values.vegetableId as string,
  plannedStartDate: values.plannedStartDate.trim(),
  actualStartDate: normalizeNullableString(values.actualStartDate),
  status: values.status,
  notes: normalizeNullableString(values.notes),
});

export const buildUpdatePlantingPayload = (
  initial: PlantingFormValues,
  current: PlantingFormValues,
): UpdatePlantingDto => {
  const payload: UpdatePlantingDto = {};

  if (initial.vegetableId !== current.vegetableId && current.vegetableId) {
    payload.vegetableId = current.vegetableId;
  }

  if (initial.plannedStartDate !== current.plannedStartDate) {
    payload.plannedStartDate = current.plannedStartDate.trim();
  }

  if (initial.actualStartDate !== current.actualStartDate) {
    payload.actualStartDate = normalizeNullableString(current.actualStartDate);
  }

  if (initial.status !== current.status) {
    payload.status = current.status;
  }

  if (initial.notes !== current.notes) {
    payload.notes = normalizeNullableString(current.notes);
  }

  return payload;
};
