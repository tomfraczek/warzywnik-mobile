export type PlantingListParams = {
  bedId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
};

export const plantingKeys = {
  all: ["plantings"] as const,
  list: (params: PlantingListParams = {}) =>
    ["plantings", "list", params] as const,
  detail: (id: string) => ["plantings", "detail", id] as const,
  availableStatuses: (id: string) =>
    ["plantings", "availableStatuses", id] as const,
  timeline: (id: string) => ["plantings", "timeline", id] as const,
  seasonComparison: (id: string) =>
    ["plantings", "seasonComparison", id] as const,
};
