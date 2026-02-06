export type DiseaseListParams = {
  q?: string;
  limit?: number;
};

export const diseaseKeys = {
  all: ["diseases"] as const,
  list: (params: DiseaseListParams = {}) =>
    ["diseases", "list", params] as const,
  detail: (id: string) => ["diseases", "detail", id] as const,
};
