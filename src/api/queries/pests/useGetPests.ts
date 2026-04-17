import { restClient } from "@/src/api/axios";
import { useInfiniteQuery } from "@tanstack/react-query";
import { PestListParams, pestKeys } from "./pestKeys";
import { Pest } from "./types";

type PestsPage = {
  items: Pest[];
  page: number;
  limit: number;
  total: number;
  nextPage: number | undefined;
};

const getPests = async (
  params: PestListParams,
  pageParam: number,
): Promise<PestsPage> => {
  const limit = params.limit ?? 20;
  const { data } = await restClient.get("/pests", {
    params: {
      page: pageParam,
      limit,
      q: params.q?.trim() || undefined,
    },
  });
  const items: Pest[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const nextPage = pageParam * limit < total ? pageParam + 1 : undefined;
  return { items, page: pageParam, limit, total, nextPage };
};

export const useGetPests = (params: PestListParams = {}) => {
  return useInfiniteQuery({
    queryKey: pestKeys.list(params),
    queryFn: ({ pageParam = 1 }) => getPests(params, pageParam as number),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
};
