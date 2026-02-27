import { restClient } from "@/src/api/axios";
import { parsePaginatedResponse } from "@/src/api/queries/pagination";
import { useInfiniteQuery } from "@tanstack/react-query";
import { PlantingListParams, plantingKeys } from "./plantingKeys";
import { Planting } from "./types";

const getPlantings = async (params: PlantingListParams, pageParam: number) => {
  const requestedLimit = params.limit ?? 20;
  const limit = Math.min(Math.max(requestedLimit, 1), 100);
  const { data } = await restClient.get("/plantings", {
    params: {
      page: pageParam,
      limit,
      bedId: params.bedId,
      status: params.status,
      fromDate: params.fromDate,
      toDate: params.toDate,
    },
  });
  return parsePaginatedResponse<Planting>(data, pageParam, limit);
};

export const useGetPlantings = (
  params: PlantingListParams = {},
  options?: { enabled?: boolean },
) => {
  return useInfiniteQuery({
    queryKey: plantingKeys.list(params),
    queryFn: ({ pageParam = 1 }) => getPlantings(params, pageParam as number),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: options?.enabled ?? true,
  });
};
