export type PaginatedResult<T> = {
  items: T[];
  nextPage?: number;
  meta?: Record<string, unknown>;
};

export const parsePaginatedResponse = <T>(
  data: any,
  page: number,
  limit: number,
): PaginatedResult<T> => {
  const items = Array.isArray(data)
    ? data
    : (data?.items ?? data?.data ?? data?.results ?? []);
  const meta = data?.meta ?? data?.pagination ?? data?.pageMeta ?? {};
  const currentPage =
    meta?.page ?? meta?.currentPage ?? data?.page ?? data?.currentPage ?? page;
  const totalPages =
    meta?.totalPages ??
    meta?.pageCount ??
    meta?.total_pages ??
    data?.totalPages ??
    data?.pageCount;
  const hasNextFromMeta =
    meta?.hasNextPage ?? meta?.hasNext ?? meta?.nextPage != null;
  const hasNext =
    typeof hasNextFromMeta === "boolean"
      ? hasNextFromMeta
      : totalPages
        ? currentPage < totalPages
        : items.length === limit;
  return {
    items,
    meta,
    nextPage: hasNext ? currentPage + 1 : undefined,
  };
};
