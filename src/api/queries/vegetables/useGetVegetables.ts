import { restClient } from "@/src/api/axios";
import { useInfiniteQuery } from "@tanstack/react-query";
import { VegetableListItem } from "./types";
import { VegetableListParams, vegetableKeys } from "./vegetableKeys";

const getVegetables = async (
  params: VegetableListParams,
  pageParam: number,
) => {
  const limit = params.limit ?? 20;
  const { data } = await restClient.get<{
    items: VegetableListItem[];
    page: number;
    limit: number;
    total: number;
  }>("/vegetables", {
    params: {
      page: pageParam,
      limit,
      q: params.q?.trim() || undefined,
    },
  });

  const items: VegetableListItem[] = data?.items ?? [];
  const page: number = data?.page ?? pageParam;
  const total: number = data?.total ?? 0;
  const nextPage = page * limit < total ? page + 1 : undefined;

  return { items, page, limit, total, nextPage };
};

export const useGetVegetables = (params: VegetableListParams = {}) => {
  return useInfiniteQuery({
    queryKey: vegetableKeys.list(params),
    queryFn: ({ pageParam = 1 }) => getVegetables(params, pageParam as number),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
};
