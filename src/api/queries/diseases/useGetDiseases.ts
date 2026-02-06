import { restClient } from "@/src/api/axios";
import { parsePaginatedResponse } from "@/src/api/queries/pagination";
import { useInfiniteQuery } from "@tanstack/react-query";
import { DiseaseListParams, diseaseKeys } from "./diseaseKeys";
import { DiseaseListItem } from "./types";

const getDiseases = async (params: DiseaseListParams, pageParam: number) => {
  const limit = params.limit ?? 20;
  const { data } = await restClient.get("/diseases", {
    params: {
      page: pageParam,
      limit,
      q: params.q?.trim() || undefined,
    },
  });
  return parsePaginatedResponse<DiseaseListItem>(data, pageParam, limit);
};

export const useGetDiseases = (params: DiseaseListParams = {}) => {
  return useInfiniteQuery({
    queryKey: diseaseKeys.list(params),
    queryFn: ({ pageParam = 1 }) => getDiseases(params, pageParam as number),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
};
