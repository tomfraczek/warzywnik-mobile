import { restClient } from "@/src/api/axios";
import { parsePaginatedResponse } from "@/src/api/queries/pagination";
import { useInfiniteQuery } from "@tanstack/react-query";
import { soilKeys, SoilListParams } from "./soilKeys";
import { Soil } from "./types";

const getSoils = async (params: SoilListParams, pageParam: number) => {
  const limit = params.limit ?? 20;
  const { data } = await restClient.get("/soils", {
    params: {
      page: pageParam,
      limit,
      q: params.q?.trim() || undefined,
    },
  });
  return parsePaginatedResponse<Soil>(data, pageParam, limit);
};

export const useGetSoils = (params: SoilListParams = {}) => {
  return useInfiniteQuery({
    queryKey: soilKeys.list(params),
    queryFn: ({ pageParam = 1 }) => getSoils(params, pageParam as number),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
};
