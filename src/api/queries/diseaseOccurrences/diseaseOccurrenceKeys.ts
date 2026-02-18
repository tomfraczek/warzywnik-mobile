import { DiseaseOccurrenceListParams } from "./types";

export const diseaseOccurrenceKeys = {
  all: ["diseaseOccurrences"] as const,
  lists: () => [...diseaseOccurrenceKeys.all, "list"] as const,
  list: (params: DiseaseOccurrenceListParams) =>
    [...diseaseOccurrenceKeys.lists(), params] as const,
  details: () => [...diseaseOccurrenceKeys.all, "detail"] as const,
  detail: (id: string) => [...diseaseOccurrenceKeys.details(), id] as const,
};
