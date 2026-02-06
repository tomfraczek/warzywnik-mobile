export type FertilizerListParams = {
  q?: string;
  limit?: number;
  category?: string;
};

export const fertilizerKeys = {
  all: ["fertilizers"] as const,
  list: (params: FertilizerListParams = {}) =>
    ["fertilizers", "list", params] as const,
  detail: (id: string) => ["fertilizers", "detail", id] as const,
};
