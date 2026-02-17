import { PlantingDiseaseListParams } from "./types";

export const plantingDiseaseKeys = {
  all: ["plantingDiseases"] as const,
  lists: () => [...plantingDiseaseKeys.all, "list"] as const,
  list: (params: PlantingDiseaseListParams) =>
    [...plantingDiseaseKeys.lists(), params] as const,
};
