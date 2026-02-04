import { restClient } from "@/src/api/axios";
import { parsePaginatedResponse } from "@/src/api/queries/pagination";
import { useInfiniteQuery } from "@tanstack/react-query";
import { bedKeys, BedListParams } from "./bedKeys";
import { Bed } from "./types";

const getBeds = async (params: BedListParams, pageParam: number) => {
  const limit = params.limit ?? 20;
  const { data } = await restClient.get("/beds", {
    params: {
      page: pageParam,
      limit,
      q: params.q?.trim() || undefined,
      isActive: params.isActive,
    },
  });
  return parsePaginatedResponse<Bed>(data, pageParam, limit);
};

export const useGetBeds = (params: BedListParams = {}) => {
  return useInfiniteQuery({
    queryKey: bedKeys.list(params),
    queryFn: ({ pageParam = 1 }) => getBeds(params, pageParam as number),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
};
