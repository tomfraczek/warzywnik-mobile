export type VegetableListParams = {
  q?: string;
  limit?: number;
};

export const vegetableKeys = {
  all: ["vegetables"] as const,
  list: (params: VegetableListParams = {}) =>
    ["vegetables", "list", params] as const,
  detail: (id: string) => ["vegetables", "detail", id] as const,
};
