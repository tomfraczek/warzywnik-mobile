import { restClient } from "@/src/api/axios";
import { parsePaginatedResponse } from "@/src/api/queries/pagination";
import { useInfiniteQuery } from "@tanstack/react-query";
import { PestListParams, pestKeys } from "./pestKeys";
import { PestListItem } from "./types";

const getPests = async (params: PestListParams, pageParam: number) => {
  const limit = params.limit ?? 20;
  const { data } = await restClient.get("/pests", {
    params: {
      page: pageParam,
      limit,
      q: params.q?.trim() || undefined,
    },
  });
  return parsePaginatedResponse<PestListItem>(data, pageParam, limit);
};

export const useGetPests = (params: PestListParams = {}) => {
  return useInfiniteQuery({
    queryKey: pestKeys.list(params),
    queryFn: ({ pageParam = 1 }) => getPests(params, pageParam as number),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
};
