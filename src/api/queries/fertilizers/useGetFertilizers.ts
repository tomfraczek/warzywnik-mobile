import { restClient } from "@/src/api/axios";
import { parsePaginatedResponse } from "@/src/api/queries/pagination";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FertilizerListParams, fertilizerKeys } from "./fertilizerKeys";
import { FertilizerListItem } from "./types";

const getFertilizers = async (
  params: FertilizerListParams,
  pageParam: number,
) => {
  const limit = params.limit ?? 20;
  const { data } = await restClient.get("/fertilizers", {
    params: {
      page: pageParam,
      limit,
      q: params.q?.trim() || undefined,
      category: params.category,
    },
  });
  return parsePaginatedResponse<FertilizerListItem>(data, pageParam, limit);
};

export const useGetFertilizers = (params: FertilizerListParams = {}) => {
  return useInfiniteQuery({
    queryKey: fertilizerKeys.list(params),
    queryFn: ({ pageParam = 1 }) => getFertilizers(params, pageParam as number),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
};
