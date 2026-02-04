export type BedListParams = {
  q?: string;
  isActive?: boolean;
  limit?: number;
};

export const bedKeys = {
  all: ["beds"] as const,
  list: (params: BedListParams = {}) => ["beds", "list", params] as const,
  detail: (id: string) => ["beds", "detail", id] as const,
};
