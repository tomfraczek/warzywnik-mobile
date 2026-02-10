export type ArticleListParams = {
  month?: number;
  season?: string;
  context?: string;
  limit?: number;
};

export const articleKeys = {
  all: ["articles"] as const,
  list: (params: ArticleListParams = {}) =>
    ["articles", "list", params] as const,
  detail: (slug: string) => ["articles", "detail", slug] as const,
};
