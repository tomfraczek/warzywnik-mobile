export type PestListParams = {
  page?: number;
  q?: string;
  limit?: number;
};

export const pestKeys = {
  all: ["pests"] as const,
  list: (params: PestListParams = {}) => ["pests", "list", params] as const,
  detail: (id: string) => ["pests", "detail", id] as const,
};
