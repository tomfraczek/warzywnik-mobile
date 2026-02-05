import { restClient } from "@/src/api/axios";
import { parsePaginatedResponse } from "@/src/api/queries/pagination";
import { useInfiniteQuery } from "@tanstack/react-query";
import { VegetableListItem } from "./types";
import { VegetableListParams, vegetableKeys } from "./vegetableKeys";

const getVegetables = async (
  params: VegetableListParams,
  pageParam: number,
) => {
  const limit = params.limit ?? 20;
  const { data } = await restClient.get("/vegetables", {
    params: {
      page: pageParam,
      limit,
      q: params.q?.trim() || undefined,
    },
  });
  return parsePaginatedResponse<VegetableListItem>(data, pageParam, limit);
};

export const useGetVegetables = (params: VegetableListParams = {}) => {
  return useInfiniteQuery({
    queryKey: vegetableKeys.list(params),
    queryFn: ({ pageParam = 1 }) => getVegetables(params, pageParam as number),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
};
