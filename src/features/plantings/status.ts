import { PlantingStatus } from "@/src/api/queries/plantings/types";

export const PLANTING_STATUS_LABELS: Record<PlantingStatus, string> = {
  NEW: "Planowana",
  SEEDLING_PREPARED: "Rozsada przygotowana",
  SEEDLING_READY_FOR_TRANSPLANT: "Rozsada gotowa do przesadzenia",
  IN_GROUND: "W gruncie",
  READY_FOR_FINAL_HARVEST: "Gotowa do zbioru",
  HARVESTED: "Zebrana",
  CLEARED: "Uprzątnięta",
  FAILED: "Nieudana",
  CANCELLED: "Anulowana",
};

type StatusTone = {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

const STATUS_TONES_LIGHT: Record<PlantingStatus, StatusTone> = {
  NEW: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
    textColor: "#5F6670",
  },
  SEEDLING_PREPARED: {
    backgroundColor: "#EAF8F1",
    borderColor: "#D6EEE1",
    textColor: "#3B7B5F",
  },
  SEEDLING_READY_FOR_TRANSPLANT: {
    backgroundColor: "#EEF7EE",
    borderColor: "#DDECDD",
    textColor: "#53745E",
  },
  IN_GROUND: {
    backgroundColor: "#E7F4EA",
    borderColor: "#D1E9D8",
    textColor: "#2F6840",
  },
  READY_FOR_FINAL_HARVEST: {
    backgroundColor: "#FCF4E7",
    borderColor: "#F1E2C8",
    textColor: "#8C6B2D",
  },
  HARVESTED: {
    backgroundColor: "#EDF2F6",
    borderColor: "#DEE5EC",
    textColor: "#5E6C78",
  },
  CLEARED: {
    backgroundColor: "#EFF1F3",
    borderColor: "#E1E4E8",
    textColor: "#656B72",
  },
  FAILED: {
    backgroundColor: "#FBECEE",
    borderColor: "#F3D9DE",
    textColor: "#9B5A66",
  },
  CANCELLED: {
    backgroundColor: "#F6EFF3",
    borderColor: "#E9DDE4",
    textColor: "#7E6673",
  },
};

const STATUS_TONES_DARK: Record<PlantingStatus, StatusTone> = {
  NEW: {
    backgroundColor: "#2A2D31",
    borderColor: "#3A3E44",
    textColor: "#B7BCC3",
  },
  SEEDLING_PREPARED: {
    backgroundColor: "#1F2C25",
    borderColor: "#2D4136",
    textColor: "#9CCAB2",
  },
  SEEDLING_READY_FOR_TRANSPLANT: {
    backgroundColor: "#232D26",
    borderColor: "#334035",
    textColor: "#A8BFAF",
  },
  IN_GROUND: {
    backgroundColor: "#1D2C22",
    borderColor: "#2A4232",
    textColor: "#8FC2A0",
  },
  READY_FOR_FINAL_HARVEST: {
    backgroundColor: "#2D271D",
    borderColor: "#423723",
    textColor: "#D9BE88",
  },
  HARVESTED: {
    backgroundColor: "#232B32",
    borderColor: "#313C46",
    textColor: "#AAB8C4",
  },
  CLEARED: {
    backgroundColor: "#25282C",
    borderColor: "#353940",
    textColor: "#A8ADB4",
  },
  FAILED: {
    backgroundColor: "#322529",
    borderColor: "#4A363C",
    textColor: "#D4A0AD",
  },
  CANCELLED: {
    backgroundColor: "#2E252A",
    borderColor: "#44353D",
    textColor: "#C4A8B7",
  },
};

export const getPlantingStatusLabel = (status: PlantingStatus): string =>
  PLANTING_STATUS_LABELS[status] ?? status;

export const getPlantingStatusTone = (
  status: PlantingStatus,
  dark: boolean,
): StatusTone =>
  dark
    ? (STATUS_TONES_DARK[status] ?? STATUS_TONES_DARK.NEW)
    : (STATUS_TONES_LIGHT[status] ?? STATUS_TONES_LIGHT.NEW);

export const isPlantingActiveLifecycleStatus = (
  status: PlantingStatus,
): boolean =>
  [
    "SEEDLING_PREPARED",
    "SEEDLING_READY_FOR_TRANSPLANT",
    "IN_GROUND",
    "READY_FOR_FINAL_HARVEST",
  ].includes(status);

export const isPlantingPlannedStatus = (status: PlantingStatus): boolean =>
  status === "NEW";

export const isPlantingHarvestCompleted = (status: PlantingStatus): boolean =>
  status === "HARVESTED" || status === "CLEARED";
