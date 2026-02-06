export type SoilListParams = {
  q?: string;
  limit?: number;
};

export const soilKeys = {
  all: ["soils"] as const,
  list: (params: SoilListParams = {}) => ["soils", "list", params] as const,
  detail: (id: string) => ["soils", "detail", id] as const,
};
