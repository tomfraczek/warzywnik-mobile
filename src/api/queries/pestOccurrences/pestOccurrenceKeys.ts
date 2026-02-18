import { PestOccurrenceListParams } from "./types";

export const pestOccurrenceKeys = {
  all: ["pestOccurrences"] as const,
  lists: () => [...pestOccurrenceKeys.all, "list"] as const,
  list: (params: PestOccurrenceListParams) =>
    [...pestOccurrenceKeys.lists(), params] as const,
  details: () => [...pestOccurrenceKeys.all, "detail"] as const,
  detail: (id: string) => [...pestOccurrenceKeys.details(), id] as const,
};
